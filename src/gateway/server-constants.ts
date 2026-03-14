// Keep server maxPayload aligned with gateway client maxPayload so high-res canvas snapshots
// don't get disconnected mid-invoke with "Max payload size exceeded".
import type { OpenClawConfig } from "../config/config.js";

export const MAX_PAYLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_BUFFERED_BYTES = 50 * 1024 * 1024; // per-connection send buffer limit (2x max payload)

const DEFAULT_MAX_CHAT_HISTORY_MESSAGES_BYTES = 6 * 1024 * 1024; // keep history responses comfortably under client WS limits
let maxChatHistoryMessagesBytes = DEFAULT_MAX_CHAT_HISTORY_MESSAGES_BYTES;

export const getMaxChatHistoryMessagesBytes = () => maxChatHistoryMessagesBytes;

export const __setMaxChatHistoryMessagesBytesForTest = (value?: number) => {
  if (!process.env.VITEST && process.env.NODE_ENV !== "test") {
    return;
  }
  if (value === undefined) {
    maxChatHistoryMessagesBytes = DEFAULT_MAX_CHAT_HISTORY_MESSAGES_BYTES;
    return;
  }
  if (Number.isFinite(value) && value > 0) {
    maxChatHistoryMessagesBytes = value;
  }
};

export const DEFAULT_HANDSHAKE_TIMEOUT_MS = 20_000;

function parseHandshakeTimeout(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return undefined;
}

export const getHandshakeTimeoutMs = (cfg?: OpenClawConfig) => {
  if (cfg?.gateway?.handshakeTimeoutMs && cfg.gateway.handshakeTimeoutMs > 0) {
    return cfg.gateway.handshakeTimeoutMs;
  }
  const envTimeout = parseHandshakeTimeout(process.env.OPENCLAW_HANDSHAKE_TIMEOUT_MS);
  if (envTimeout) {
    return envTimeout;
  }
  if (process.env.VITEST && process.env.OPENCLAW_TEST_HANDSHAKE_TIMEOUT_MS) {
    const testTimeout = parseHandshakeTimeout(process.env.OPENCLAW_TEST_HANDSHAKE_TIMEOUT_MS);
    if (testTimeout) {
      return testTimeout;
    }
  }
  return DEFAULT_HANDSHAKE_TIMEOUT_MS;
};
export const TICK_INTERVAL_MS = 30_000;
export const HEALTH_REFRESH_INTERVAL_MS = 60_000;
export const DEDUPE_TTL_MS = 5 * 60_000;
export const DEDUPE_MAX = 1000;
