import { getChannelPlugin } from "../../channels/plugins/index.js";
import type { ChannelId, ChannelSetupInput } from "../../channels/plugins/types.js";
import type { OpenClawConfig } from "../../config/config.js";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../../routing/session-key.js";

type ChatChannel = ChannelId;

export function applyAccountName(params: {
  cfg: OpenClawConfig;
  channel: ChatChannel;
  accountId: string;
  name?: string;
}): OpenClawConfig {
  const accountId = normalizeAccountId(params.accountId);
  const plugin = getChannelPlugin(params.channel);
  const apply = plugin?.setup?.applyAccountName;
  return apply ? apply({ cfg: params.cfg, accountId, name: params.name }) : params.cfg;
}

export function applyChannelAccountConfig(params: {
  cfg: OpenClawConfig;
  channel: ChatChannel;
  accountId: string;
  input: ChannelSetupInput;
}): OpenClawConfig {
  const accountId = normalizeAccountId(params.accountId);
  const plugin = getChannelPlugin(params.channel);
  const apply = plugin?.setup?.applyAccountConfig;
  if (!apply) {
    return params.cfg;
  }
  return apply({ cfg: params.cfg, accountId, input: params.input });
}

export function applyChannelOAuthProfile(params: {
  cfg: OpenClawConfig;
  channel: ChatChannel;
  accountId: string;
  oauthProfile?: string;
}): OpenClawConfig {
  const oauthProfile = params.oauthProfile?.trim();
  if (!oauthProfile) {
    return params.cfg;
  }

  const accountId = normalizeAccountId(params.accountId);
  const channels = {
    ...params.cfg.channels,
  } as Record<string, unknown>;
  const existingChannel = (channels[params.channel] ?? {}) as {
    oauthProfile?: string;
    accounts?: Record<string, { oauthProfile?: string }>;
  };

  if (accountId === DEFAULT_ACCOUNT_ID) {
    channels[params.channel] = {
      ...existingChannel,
      oauthProfile,
    };
  } else {
    channels[params.channel] = {
      ...existingChannel,
      accounts: {
        ...existingChannel.accounts,
        [accountId]: {
          ...existingChannel.accounts?.[accountId],
          oauthProfile,
        },
      },
    };
  }

  return {
    ...params.cfg,
    channels: channels as OpenClawConfig["channels"],
  };
}
