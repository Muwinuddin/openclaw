import { describe, expect, it } from "vitest";
import { buildWorkspaceSkillStatus } from "./skills-status.js";
import type { SkillEntry } from "./skills/types.js";

describe("buildWorkspaceSkillStatus", () => {
  it("does not surface install options for OS-scoped skills on unsupported platforms", () => {
    if (process.platform === "win32") {
      // Keep this simple; win32 platform naming is already explicitly handled elsewhere.
      return;
    }

    const mismatchedOs = process.platform === "darwin" ? "linux" : "darwin";

    const entry: SkillEntry = {
      skill: {
        name: "os-scoped",
        description: "test",
        source: "test",
        filePath: "/tmp/os-scoped",
        baseDir: "/tmp",
        disableModelInvocation: false,
      },
      frontmatter: {},
      metadata: {
        os: [mismatchedOs],
        requires: { bins: ["fakebin"] },
        install: [
          {
            id: "brew",
            kind: "brew",
            formula: "fake",
            bins: ["fakebin"],
            label: "Install fake (brew)",
          },
        ],
      },
    };

    const report = buildWorkspaceSkillStatus("/tmp/ws", { entries: [entry] });
    expect(report.skills).toHaveLength(1);
    expect(report.skills[0]?.install).toEqual([]);
  });

  it("keeps skills eligible when only install options are OS-filtered", () => {
    const unsupportedOs = process.platform === "win32" ? "darwin" : "win32";

    const entry: SkillEntry = {
      skill: {
        name: "install-os-filtered",
        description: "test",
        source: "test",
        filePath: "/tmp/install-os-filtered",
        baseDir: "/tmp",
        disableModelInvocation: false,
      },
      frontmatter: {},
      metadata: {
        requires: { bins: ["node"] },
        install: [
          {
            id: "brew",
            kind: "brew",
            os: [unsupportedOs],
            formula: "fake",
            bins: ["fakebin"],
            label: "Install fake (brew)",
          },
        ],
      },
    };

    const report = buildWorkspaceSkillStatus("/tmp/ws", { entries: [entry] });
    expect(report.skills).toHaveLength(1);
    expect(report.skills[0]?.eligible).toBe(true);
    expect(report.skills[0]?.install).toEqual([]);
  });
});
