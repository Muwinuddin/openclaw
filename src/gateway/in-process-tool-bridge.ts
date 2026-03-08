import { ErrorCodes, errorShape, type RequestFrame } from "./protocol/index.js";
import { coreGatewayHandlers } from "./server-methods.js";
import type { GatewayRequestContext } from "./server-methods/types.js";

let gatewayContextForTools: GatewayRequestContext | null = null;

export function registerInProcessToolGatewayContext(context: GatewayRequestContext): () => void {
  gatewayContextForTools = context;
  return () => {
    if (gatewayContextForTools === context) {
      gatewayContextForTools = null;
    }
  };
}

export async function invokeGatewayMethodInProcess<T = Record<string, unknown>>(
  method: string,
  params?: unknown,
): Promise<T | null> {
  if (!gatewayContextForTools) {
    return null;
  }
  const handler = coreGatewayHandlers[method];
  if (!handler) {
    return null;
  }

  return await new Promise<T>((resolve, reject) => {
    let settled = false;
    const respond = (
      ok: boolean,
      payload?: unknown,
      error?: { message?: string; code?: number },
    ) => {
      if (settled) {
        return;
      }
      settled = true;
      if (ok) {
        resolve((payload ?? {}) as T);
        return;
      }
      const message = error?.message?.trim() || `gateway method failed: ${method}`;
      reject(new Error(message));
    };

    const req: RequestFrame = {
      jsonrpc: "2.0",
      id: `in-process:${Date.now()}`,
      method,
      params,
    };

    Promise.resolve(
      handler({
        req,
        params: (params as Record<string, unknown> | undefined) ?? {},
        client: null,
        isWebchatConnect: () => false,
        respond,
        context: gatewayContextForTools,
      }),
    ).catch((err) => {
      if (settled) {
        return;
      }
      settled = true;
      const message = err instanceof Error ? err.message : String(err);
      const error = errorShape(ErrorCodes.INTERNAL, message);
      reject(new Error(error.message));
    });
  });
}
