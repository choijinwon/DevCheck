import { AxePuppeteer } from "@axe-core/puppeteer";
import type * as Axe from "axe-core";
import type { HTTPRequest } from "puppeteer";
import puppeteer, { type Browser } from "puppeteer";
import {
  buildCacheKey,
  type AnalysisPreset,
  rulesForPreset,
} from "@/lib/axe-presets";
import {
  canonicalizeUrl,
  getCachedIssues,
  setCachedIssues,
} from "@/lib/analysis-cache";
import type { Issue } from "@/lib/types";

const TOTAL_BUDGET_MS = 10_000;

/** Optional wait after DOMContentLoaded for client-rendered SPAs (ms, max 2000). */
function postLoadDelayMs(): number {
  const raw = process.env.POST_LOAD_DELAY_MS;
  if (raw === undefined || raw === "") return 0;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(2000, n);
}

export type AnalyzerErrorCode =
  | "INVALID_URL"
  | "TIMEOUT"
  | "NAVIGATION_FAILED"
  | "ANALYSIS_FAILED"
  | "BROWSER_UNAVAILABLE";

export class AnalyzerError extends Error {
  readonly code: AnalyzerErrorCode;
  readonly cause?: unknown;

  constructor(code: AnalyzerErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "AnalyzerError";
    this.code = code;
    this.cause = cause;
  }
}

export function isAnalyzerError(e: unknown): e is AnalyzerError {
  return e instanceof AnalyzerError;
}

let browserPromise: Promise<Browser> | null = null;

/** Serialize analyzes so one shared browser is never used concurrently. */
let analyzeChain: Promise<unknown> = Promise.resolve();

function withAnalyzeLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = analyzeChain.then(fn, fn);
  analyzeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function launchOptions(): Parameters<typeof puppeteer.launch>[0] {
  const explicit = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  return {
    headless: true,
    ...(explicit ? { executablePath: explicit } : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  };
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch(launchOptions()).catch((e: unknown) => {
      browserPromise = null;
      const hint =
        "Install the bundled Chrome: npm run install-browser (or: npx puppeteer browsers install chrome). " +
        "Or set PUPPETEER_EXECUTABLE_PATH to your Chrome/Chromium binary.";
      throw new AnalyzerError(
        "BROWSER_UNAVAILABLE",
        `Could not start the browser for analysis. ${hint}`,
        e
      );
    });
  }
  return browserPromise;
}

function mapImpact(impact?: string | null): Issue["severity"] {
  switch (impact) {
    case "critical":
    case "serious":
      return "high";
    case "moderate":
      return "medium";
    default:
      return "low";
  }
}

function selectorFromTarget(target: Axe.UnlabelledFrameSelector): string {
  return target
    .map((segment) =>
      Array.isArray(segment) ? segment.join(" ") : String(segment)
    )
    .join(" ");
}

function mapViolationsToIssues(axeResults: Axe.AxeResults): Issue[] {
  const issues: Issue[] = [];
  for (const v of axeResults.violations) {
    for (const node of v.nodes) {
      const selector = selectorFromTarget(node.target);
      issues.push({
        type: "accessibility",
        severity: mapImpact(v.impact),
        message: v.help || v.description,
        selector,
      });
    }
  }
  return issues;
}

function wrapNavigationError(e: unknown): AnalyzerError {
  if (e instanceof AnalyzerError) return e;
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (
    lower.includes("timeout") ||
    lower.includes("navigation timeout") ||
    lower.includes("exceeded")
  ) {
    return new AnalyzerError(
      "TIMEOUT",
      "Analysis exceeded 10 seconds.",
      e
    );
  }
  return new AnalyzerError(
    "NAVIGATION_FAILED",
    "Could not load the page. It may be offline, blocked, or the URL may be invalid.",
    e
  );
}

async function runAnalysisLocked(
  canonical: string,
  rules: string[]
): Promise<{ issues: Issue[]; cached: boolean }> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setRequestInterception(true);
    page.on("request", (req: HTTPRequest) => {
      if (req.resourceType() === "font") {
        void req.abort();
      } else {
        void req.continue();
      }
    });

    const issues = await Promise.race([
      (async (): Promise<Issue[]> => {
        try {
          // axe-core's AxePuppeteer requires document.readyState === "complete"
          // (see assertFrameReady in @axe-core/puppeteer). "domcontentloaded" is too early.
          await page.goto(canonical, {
            waitUntil: "load",
            timeout: TOTAL_BUDGET_MS,
          });
        } catch (e: unknown) {
          throw wrapNavigationError(e);
        }

        const spaDelay = postLoadDelayMs();
        if (spaDelay > 0) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, spaDelay);
          });
        }

        let axeResults;
        try {
          axeResults = await new AxePuppeteer(page)
            .withRules(rules)
            .analyze();
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          const detail =
            msg.includes("Page/Frame is not ready") ||
            msg.includes("not ready")
              ? "페이지(또는 내부 프레임)가 아직 준비되지 않았습니다. 잠시 후 다시 시도하거나 POST_LOAD_DELAY_MS를 올려 보세요."
              : "페이지를 스캔하는 동안 접근성 분석에 실패했습니다.";
          throw new AnalyzerError("ANALYSIS_FAILED", detail, e);
        }

        return mapViolationsToIssues(axeResults);
      })(),
      new Promise<Issue[]>((_, reject) => {
        setTimeout(() => {
          reject(
            new AnalyzerError(
              "TIMEOUT",
              "Analysis exceeded 10 seconds."
            )
          );
        }, TOTAL_BUDGET_MS);
      }),
    ]);

    return { issues, cached: false };
  } catch (e: unknown) {
    if (e instanceof AnalyzerError) throw e;
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new AnalyzerError(
        "TIMEOUT",
        "Analysis exceeded 10 seconds.",
        e
      );
    }
    throw wrapNavigationError(e);
  } finally {
    await page.close().catch(() => undefined);
  }
}

export type AnalyzePageOptions = {
  preset?: AnalysisPreset;
};

/**
 * Loads a URL with Puppeteer, runs axe-core on focused rules, returns structured issues.
 * Reuses one browser per process; caches by canonical URL + preset with TTL.
 */
export async function analyzePage(
  url: string,
  options: AnalyzePageOptions = {}
): Promise<{
  issues: Issue[];
  cached: boolean;
  canonicalUrl: string;
  preset: AnalysisPreset;
}> {
  const preset = options.preset ?? "default";
  let canonical: string;
  try {
    canonical = canonicalizeUrl(url);
  } catch {
    throw new AnalyzerError(
      "INVALID_URL",
      "Enter a valid http or https URL."
    );
  }

  const cacheKey = buildCacheKey(canonical, preset);
  const rules = rulesForPreset(preset);

  const hit = getCachedIssues(cacheKey);
  if (hit !== undefined) {
    return {
      issues: hit,
      cached: true,
      canonicalUrl: canonical,
      preset,
    };
  }

  return withAnalyzeLock(async () => {
    const again = getCachedIssues(cacheKey);
    if (again !== undefined) {
      return {
        issues: again,
        cached: true,
        canonicalUrl: canonical,
        preset,
      };
    }
    try {
      const result = await runAnalysisLocked(canonical, rules);
      setCachedIssues(cacheKey, result.issues);
      return { ...result, canonicalUrl: canonical, preset };
    } catch (e: unknown) {
      if (e instanceof AnalyzerError) throw e;
      throw new AnalyzerError(
        "ANALYSIS_FAILED",
        "Accessibility analysis failed. Please try again.",
        e
      );
    }
  });
}

export type { AnalysisPreset } from "@/lib/axe-presets";
