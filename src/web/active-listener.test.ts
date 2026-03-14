import { describe, expect, it } from "vitest";
import type { ActiveWebListener } from "./active-listener.js";
import {
  clearActiveWebListener,
  getActiveWebListener,
  resolveWebAccountId,
  setActiveWebListener,
} from "./active-listener.js";

function createListener(id: string): ActiveWebListener {
  return {
    sendMessage: async () => ({ messageId: `msg-${id}` }),
    sendPoll: async () => ({ messageId: `poll-${id}` }),
    sendReaction: async () => {},
    sendComposingTo: async () => {},
  };
}

describe("clearActiveWebListener", () => {
  it("only clears when the current listener instance matches", () => {
    const original = createListener("original");
    const replacement = createListener("replacement");

    setActiveWebListener("work", original);
    setActiveWebListener("work", replacement);

    expect(clearActiveWebListener("work", original)).toBe(false);
    expect(getActiveWebListener("work")).toBe(replacement);

    expect(clearActiveWebListener("work", replacement)).toBe(true);
    expect(getActiveWebListener("work")).toBeNull();
  });

  it("handles default account ids consistently", () => {
    const listener = createListener("default");
    setActiveWebListener(listener);

    expect(getActiveWebListener(resolveWebAccountId(undefined))).toBe(listener);
    expect(clearActiveWebListener(undefined, listener)).toBe(true);
    expect(getActiveWebListener("default")).toBeNull();
  });
});
