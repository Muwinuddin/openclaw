import { GatewayIntents, GatewayPlugin } from "@buape/carbon/gateway";
import type { APIGatewayBotInfo } from "discord-api-types/v10";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import WebSocket from "ws";
import type { DiscordAccountConfig } from "../../config/types.js";
import { danger } from "../../globals.js";
import type { RuntimeEnv } from "../../runtime.js";

export function resolveDiscordGatewayIntents(
  intentsConfig?: import("../../config/types.discord.js").DiscordIntentsConfig,
): number {
  let intents =
    GatewayIntents.Guilds |
    GatewayIntents.GuildMessages |
    GatewayIntents.MessageContent |
    GatewayIntents.DirectMessages |
    GatewayIntents.GuildMessageReactions |
    GatewayIntents.DirectMessageReactions |
    GatewayIntents.GuildVoiceStates;
  if (intentsConfig?.presence) {
    intents |= GatewayIntents.GuildPresences;
  }
  if (intentsConfig?.guildMembers) {
    intents |= GatewayIntents.GuildMembers;
  }
  return intents;
}

function formatGatewayRegisterClientError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("Unexpected token") ||
    message.includes("overflow") ||
    message.includes("upstream connect error")
  ) {
    return "Discord gateway bootstrap failed due to an upstream 503/overflow response. OpenClaw will keep retrying.";
  }
  return `Discord gateway bootstrap failed: ${message}`;
}

function createSafeRegisterClientMixin(
  Base: typeof GatewayPlugin,
  runtime: RuntimeEnv,
): typeof GatewayPlugin {
  return class SafeGatewayPlugin extends Base {
    override async registerClient(client: Parameters<GatewayPlugin["registerClient"]>[0]) {
      try {
        return await super.registerClient(client);
      } catch (error) {
        runtime.error?.(danger(`discord: ${formatGatewayRegisterClientError(error)}`));
      }
    }
  };
}

export function createDiscordGatewayPlugin(params: {
  discordConfig: DiscordAccountConfig;
  runtime: RuntimeEnv;
}): GatewayPlugin {
  const intents = resolveDiscordGatewayIntents(params.discordConfig?.intents);
  const proxy = params.discordConfig?.proxy?.trim();
  const options = {
    reconnect: { maxAttempts: 50 },
    intents,
    autoInteractions: true,
  };

  if (!proxy) {
    const SafeGatewayPlugin = createSafeRegisterClientMixin(GatewayPlugin, params.runtime);
    return new SafeGatewayPlugin(options);
  }

  try {
    const wsAgent = new HttpsProxyAgent<string>(proxy);
    const fetchAgent = new ProxyAgent(proxy);

    params.runtime.log?.("discord: gateway proxy enabled");

    class ProxyGatewayPlugin extends GatewayPlugin {
      constructor() {
        super(options);
      }

      override async registerClient(client: Parameters<GatewayPlugin["registerClient"]>[0]) {
        if (!this.gatewayInfo) {
          try {
            const response = await undiciFetch("https://discord.com/api/v10/gateway/bot", {
              headers: {
                Authorization: `Bot ${client.options.token}`,
              },
              dispatcher: fetchAgent,
            } as Record<string, unknown>);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }
            this.gatewayInfo = (await response.json()) as APIGatewayBotInfo;
          } catch (error) {
            params.runtime.error?.(danger(`discord: ${formatGatewayRegisterClientError(error)}`));
            return;
          }
        }

        try {
          return await super.registerClient(client);
        } catch (error) {
          params.runtime.error?.(danger(`discord: ${formatGatewayRegisterClientError(error)}`));
        }
      }

      override createWebSocket(url: string) {
        return new WebSocket(url, { agent: wsAgent });
      }
    }

    return new ProxyGatewayPlugin();
  } catch (err) {
    params.runtime.error?.(danger(`discord: invalid gateway proxy: ${String(err)}`));
    const SafeGatewayPlugin = createSafeRegisterClientMixin(GatewayPlugin, params.runtime);
    return new SafeGatewayPlugin(options);
  }
}
