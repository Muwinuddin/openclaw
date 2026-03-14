import { afterEach, describe, expect, it } from "vitest";
import { getHandshakeTimeoutMs } from "./server-constants.js";

describe("getHandshakeTimeoutMs", () => {
  afterEach(() => {
    delete process.env.OPENCLAW_HANDSHAKE_TIMEOUT_MS;
  });

  it("uses gateway.handshakeTimeoutMs when configured", () => {
    const timeout = getHandshakeTimeoutMs({ gateway: { handshakeTimeoutMs: 15_000 } });
    expect(timeout).toBe(15_000);
  });

  it("uses OPENCLAW_HANDSHAKE_TIMEOUT_MS when config does not set it", () => {
    process.env.OPENCLAW_HANDSHAKE_TIMEOUT_MS = "12_000";
    const timeout = getHandshakeTimeoutMs();
    expect(timeout).toBe(20_000);

    process.env.OPENCLAW_HANDSHAKE_TIMEOUT_MS = "12000";
    const overrideTimeout = getHandshakeTimeoutMs();
    expect(overrideTimeout).toBe(12_000);
  });

  it("falls back to default for non-positive configured values", () => {
    const timeout = getHandshakeTimeoutMs({ gateway: { handshakeTimeoutMs: 0 } });
    expect(timeout).toBe(20_000);
  });
});
