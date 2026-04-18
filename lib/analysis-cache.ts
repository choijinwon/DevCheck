import type { Issue } from "@/lib/types";

/** How long cached results stay valid (10 minutes). */
const TTL_MS = 10 * 60 * 1000;

/** Avoid unbounded memory in long-running dev servers. */
const MAX_ENTRIES = 100;

/**
 * Normalized cache key: lowercase host, no hash, no trailing slash except root.
 * `https://Example.com/foo/` → `https://example.com/foo`
 */
export function canonicalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("empty");
  }
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const u = new URL(withProtocol);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("bad protocol");
  }
  u.hostname = u.hostname.toLowerCase();
  u.hash = "";
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }
  return u.href;
}

const cache = new Map<string, { issues: Issue[]; expiresAt: number }>();

/** 테스트에서 캐시를 비울 때만 사용합니다. */
export function clearAnalysisCache(): void {
  cache.clear();
}

export function getCachedIssues(canonicalUrl: string): Issue[] | undefined {
  const entry = cache.get(canonicalUrl);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(canonicalUrl);
    return undefined;
  }
  cache.delete(canonicalUrl);
  cache.set(canonicalUrl, entry);
  return entry.issues;
}

export function setCachedIssues(canonicalUrl: string, issues: Issue[]): void {
  while (cache.size >= MAX_ENTRIES) {
    const first = cache.keys().next().value as string | undefined;
    if (first === undefined) break;
    cache.delete(first);
  }
  cache.set(canonicalUrl, {
    issues,
    expiresAt: Date.now() + TTL_MS,
  });
}
