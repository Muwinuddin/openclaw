import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../../config/config.js";
import { DEFAULT_ACCOUNT_ID } from "../../routing/session-key.js";
import { applyChannelOAuthProfile } from "./add-mutators.js";

describe("applyChannelOAuthProfile", () => {
  it("sets channel-level oauthProfile for default account", () => {
    const cfg = { channels: { slack: {} } } as OpenClawConfig;

    const next = applyChannelOAuthProfile({
      cfg,
      channel: "slack",
      accountId: DEFAULT_ACCOUNT_ID,
      oauthProfile: "slack:client-a",
    });

    expect(next.channels?.slack).toMatchObject({ oauthProfile: "slack:client-a" });
  });

  it("sets account-level oauthProfile for non-default account", () => {
    const cfg = { channels: { slack: {} } } as OpenClawConfig;

    const next = applyChannelOAuthProfile({
      cfg,
      channel: "slack",
      accountId: "work",
      oauthProfile: "slack:work",
    });

    const slack = next.channels?.slack as { accounts?: Record<string, { oauthProfile?: string }> };
    expect(slack.accounts?.work?.oauthProfile).toBe("slack:work");
  });
});
