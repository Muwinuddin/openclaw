import { describe, expect, it } from "vitest";
import { resolveSkillsPromptForRun } from "./skills.js";
import type { SkillEntry } from "./skills/types.js";

describe("resolveSkillsPromptForRun", () => {
  it("prefers snapshot prompt when available", () => {
    const prompt = resolveSkillsPromptForRun({
      skillsSnapshot: { prompt: "SNAPSHOT", skills: [] },
      workspaceDir: "/tmp/openclaw",
    });
    expect(prompt).toBe("SNAPSHOT");
  });

  it("rebuilds prompt from entries when snapshot prompt is disabled", () => {
    const entry: SkillEntry = {
      skill: {
        name: "demo-skill",
        description: "Demo",
        filePath: "/sandbox/skills/demo-skill/SKILL.md",
        baseDir: "/sandbox/skills/demo-skill",
        source: "openclaw-workspace",
        disableModelInvocation: false,
      },
      frontmatter: {},
    };
    const prompt = resolveSkillsPromptForRun({
      skillsSnapshot: {
        prompt: "HOST-PATH-SNAPSHOT",
        skills: [{ name: "demo-skill" }],
      },
      entries: [entry],
      workspaceDir: "/tmp/openclaw",
      useSnapshotPrompt: false,
    });
    expect(prompt).toContain("<available_skills>");
    expect(prompt).toContain("/sandbox/skills/demo-skill/SKILL.md");
    expect(prompt).not.toContain("HOST-PATH-SNAPSHOT");
  });
  it("builds prompt from entries when snapshot is missing", () => {
    const entry: SkillEntry = {
      skill: {
        name: "demo-skill",
        description: "Demo",
        filePath: "/app/skills/demo-skill/SKILL.md",
        baseDir: "/app/skills/demo-skill",
        source: "openclaw-bundled",
        disableModelInvocation: false,
      },
      frontmatter: {},
    };
    const prompt = resolveSkillsPromptForRun({
      entries: [entry],
      workspaceDir: "/tmp/openclaw",
    });
    expect(prompt).toContain("<available_skills>");
    expect(prompt).toContain("/app/skills/demo-skill/SKILL.md");
  });
});
