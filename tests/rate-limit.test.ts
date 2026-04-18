import {
  checkRateLimit,
  clientKeyFromRequest,
  resetRateLimitBuckets,
} from "@/lib/rate-limit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("clientKeyFromRequest", () => {
  it("uses first x-forwarded-for", () => {
    const r = new Request("http://x", {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    expect(clientKeyFromRequest(r)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip", () => {
    const r = new Request("http://x", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(clientKeyFromRequest(r)).toBe("9.9.9.9");
  });

  it("returns unknown without headers", () => {
    expect(clientKeyFromRequest(new Request("http://x"))).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");
    vi.stubEnv("RATE_LIMIT_MAX", "3");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimitBuckets();
  });

  it("allows up to max requests per window", () => {
    expect(checkRateLimit("a").ok).toBe(true);
    expect(checkRateLimit("a").ok).toBe(true);
    expect(checkRateLimit("a").ok).toBe(true);
    const fourth = checkRateLimit("a");
    expect(fourth.ok).toBe(false);
    if (!fourth.ok) {
      expect(fourth.retryAfterSec).toBeGreaterThanOrEqual(1);
    }
  });

  it("tracks keys independently", () => {
    expect(checkRateLimit("u1").ok).toBe(true);
    expect(checkRateLimit("u2").ok).toBe(true);
  });
});
