import { describe, expect, it } from "vitest";
import { getHandshakeTimeoutMs } from "./server-constants.js";

describe("getHandshakeTimeoutMs", () => {
  it("uses gateway.handshakeTimeoutMs when configured", () => {
    const timeout = getHandshakeTimeoutMs({ gateway: { handshakeTimeoutMs: 15_000 } });
    expect(timeout).toBe(15_000);
  });

  it("falls back to default for non-positive configured values", () => {
    const timeout = getHandshakeTimeoutMs({ gateway: { handshakeTimeoutMs: 0 } });
    expect(timeout).toBe(10_000);
  });
});
