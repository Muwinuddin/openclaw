import { describe, expect, it, vi } from "vitest";

const handlerMock = vi.fn();

vi.mock("./server-methods.js", () => ({
  coreGatewayHandlers: {
    "cron.status": (...args: unknown[]) => handlerMock(...args),
  },
}));

import {
  invokeGatewayMethodInProcess,
  registerInProcessToolGatewayContext,
} from "./in-process-tool-bridge.js";

describe("in-process tool bridge", () => {
  it("returns null when no gateway context is registered", async () => {
    const result = await invokeGatewayMethodInProcess("cron.status", {});
    expect(result).toBeNull();
  });

  it("routes calls through core gateway handlers", async () => {
    handlerMock.mockImplementationOnce(({ respond }) => {
      respond(true, { ok: true, status: "running" });
    });

    const unregister = registerInProcessToolGatewayContext({} as never);
    try {
      const result = await invokeGatewayMethodInProcess("cron.status", { id: "job-1" });
      expect(result).toEqual({ ok: true, status: "running" });
    } finally {
      unregister();
    }

    const handlerCall = handlerMock.mock.calls[0]?.[0] as {
      params?: Record<string, unknown>;
      client?: unknown;
    };
    expect(handlerCall?.params).toEqual({ id: "job-1" });
    expect(handlerCall?.client).toBeNull();
  });

  it("rejects when handler responds with an error", async () => {
    handlerMock.mockImplementationOnce(({ respond }) => {
      respond(false, undefined, { message: "boom", code: -32603 });
    });

    const unregister = registerInProcessToolGatewayContext({} as never);
    try {
      await expect(invokeGatewayMethodInProcess("cron.status", {})).rejects.toThrow("boom");
    } finally {
      unregister();
    }
  });
});
