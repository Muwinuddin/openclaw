import { describe, expect, it } from "vitest";
import { rawDataToString } from "./ws.js";

describe("rawDataToString", () => {
  it("decodes Uint8Array payloads", () => {
    const text = '{"type":"event","event":"connect.challenge"}';
    const bytes = new TextEncoder().encode(text);

    expect(rawDataToString(bytes)).toBe(text);
  });

  it("decodes DataView payloads", () => {
    const text = "hello";
    const bytes = new TextEncoder().encode(text);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    expect(rawDataToString(view)).toBe(text);
  });
});
