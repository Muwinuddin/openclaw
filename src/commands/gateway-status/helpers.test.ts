import { describe, expect, it } from "vitest";
import { resolveProbeBudgetMs } from "./helpers.js";

describe("resolveProbeBudgetMs", () => {
  it("uses the caller's budget for local loopback up to 4000ms", () => {
    expect(resolveProbeBudgetMs(3000, "localLoopback")).toBe(3000);
    expect(resolveProbeBudgetMs(5000, "localLoopback")).toBe(4000);
  });

  it("keeps existing caps for other target kinds", () => {
    expect(resolveProbeBudgetMs(3000, "sshTunnel")).toBe(2000);
    expect(resolveProbeBudgetMs(3000, "explicit")).toBe(1500);
  });
});
