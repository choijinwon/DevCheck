import {
  buildCacheKey,
  normalizePreset,
  rulesForPreset,
} from "@/lib/axe-presets";
import { describe, expect, it } from "vitest";

describe("axe-presets", () => {
  it("normalizePreset", () => {
    expect(normalizePreset(undefined)).toBe("default");
    expect(normalizePreset("extended")).toBe("extended");
    expect(normalizePreset("default")).toBe("default");
    expect(normalizePreset("garbage")).toBe("default");
  });

  it("extended has more rules than default", () => {
    const d = rulesForPreset("default");
    const e = rulesForPreset("extended");
    expect(e.length).toBeGreaterThan(d.length);
    expect(e).toContain("color-contrast");
  });

  it("buildCacheKey differs by preset", () => {
    const u = "https://a.com";
    expect(buildCacheKey(u, "default")).not.toBe(
      buildCacheKey(u, "extended")
    );
  });
});
