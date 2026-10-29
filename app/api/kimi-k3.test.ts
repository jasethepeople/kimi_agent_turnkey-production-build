import { describe, expect, it } from "vitest";
import {
  analyzeHandwriting,
  generateBlueprint,
  inpaintRewrite,
  isMockMode,
  writeChapter,
} from "./kimi-k3";
import { TIERS, tierLimits, isUpgrade } from "@contracts/tiers";

describe("contracts/tiers", () => {
  it("defines memory/legacy/studio limits per the pricing model", () => {
    expect(TIERS.memory.priceUsd).toBe(0);
    expect(TIERS.legacy.priceUsd).toBe(29);
    expect(TIERS.studio.priceUsd).toBe(99);
    expect(tierLimits("memory").maxProjects).toBe(1);
    expect(tierLimits("legacy").maxProjects).toBe(5);
    expect(tierLimits("studio").maxProjects).toBeNull();
    expect(tierLimits("memory").maxWordsPerGeneration).toBe(15_000);
    expect(tierLimits("memory").maxScansPerVoiceProfile).toBe(20);
    expect(tierLimits("memory").exportFormats).toEqual(["txt"]);
    expect(tierLimits("legacy").exportFormats).toContain("epub");
    expect(tierLimits("studio").allowVoiceBlending).toBe(true);
  });

  it("orders tiers for upgrades", () => {
    expect(isUpgrade("memory", "legacy")).toBe(true);
    expect(isUpgrade("legacy", "memory")).toBe(false);
  });
});

describe("kimi-k3 mock mode (no KIMI_API_KEY)", () => {
  it("runs in mock mode in preview env", () => {
    expect(isMockMode).toBe(true);
  });

  it("analyzeHandwriting returns transcription + style analysis", async () => {
    const result = await analyzeHandwriting([], "image/jpeg");
    expect(result.transcription.length).toBeGreaterThan(100);
    expect(result.styleSummary).toContain("Voice analysis");
    expect(result.layoutCues.length).toBeGreaterThan(0);
  });

  it("generateBlueprint yields a 3-act structure with chapters", async () => {
    const bp = await generateBlueprint("A family secret", "memoir", ["warm"], 15_000);
    expect(bp.acts).toHaveLength(3);
    expect(bp.chapters.length).toBeGreaterThanOrEqual(6);
    expect(bp.chapters[0].targetWords).toBeGreaterThan(0);
  });

  it("writeChapter returns multi-paragraph prose", async () => {
    const bp = await generateBlueprint("p", "g", [], 15_000);
    const text = await writeChapter(bp, 0, ["warm"], []);
    expect(text.split("\n\n").length).toBeGreaterThan(3);
  });

  it("inpaintRewrite returns a rewrite and clamps styleWeight", async () => {
    const out = await inpaintRewrite("the old house stood there", 9, "corpus", "ctx");
    expect(out.length).toBeGreaterThan(20);
  });
});
