import { buildCacheKey } from "@/lib/axe-presets";
import {
  canonicalizeUrl,
  clearAnalysisCache,
  getCachedIssues,
  setCachedIssues,
} from "@/lib/analysis-cache";
import type { Issue } from "@/lib/types";
import { afterEach, describe, expect, it } from "vitest";

const sampleIssue: Issue = {
  type: "accessibility",
  severity: "low",
  message: "test",
  selector: "body",
};

describe("canonicalizeUrl", () => {
  it("lowercases hostname and strips hash", () => {
    expect(canonicalizeUrl("HTTPS://Example.COM/path#frag")).toBe(
      "https://example.com/path"
    );
  });

  it("adds https when protocol missing", () => {
    expect(canonicalizeUrl("example.com/foo")).toBe("https://example.com/foo");
  });

  it("removes trailing slash except root", () => {
    expect(canonicalizeUrl("https://a.com/about/")).toBe(
      "https://a.com/about"
    );
    expect(canonicalizeUrl("https://a.com/")).toBe("https://a.com/");
  });

  it("throws on empty string", () => {
    expect(() => canonicalizeUrl("   ")).toThrow();
  });
});

describe("analysis cache", () => {
  afterEach(() => {
    clearAnalysisCache();
  });

  it("returns undefined on miss", () => {
    expect(getCachedIssues("https://example.com")).toBeUndefined();
  });

  it("round-trips issues", () => {
    const url = "https://example.com/x";
    const key = buildCacheKey(url, "default");
    setCachedIssues(key, [sampleIssue]);
    expect(getCachedIssues(key)).toEqual([sampleIssue]);
  });

  it("separates presets", () => {
    const url = "https://example.com/y";
    setCachedIssues(buildCacheKey(url, "default"), []);
    setCachedIssues(buildCacheKey(url, "extended"), [sampleIssue]);
    expect(getCachedIssues(buildCacheKey(url, "default"))).toEqual([]);
    expect(getCachedIssues(buildCacheKey(url, "extended"))).toEqual([
      sampleIssue,
    ]);
  });
});
