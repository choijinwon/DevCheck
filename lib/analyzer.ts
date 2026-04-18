import { AxePuppeteer } from "@axe-core/puppeteer";
import type * as Axe from "axe-core";
import type { HTTPRequest } from "puppeteer";
import puppeteer, { type Browser } from "puppeteer";
import {
  canonicalizeUrl,
  getCachedIssues,
  setCachedIssues,
} from "@/lib/analysis-cache";
import type { Issue } from "@/lib/types";

/** Rules aligned with MVP: images, labels, headings. */
const FOCUS_RULES = [
  "image-alt",
  "input-image-alt",
  "label",
  "select-name",
  "button-name",
  "heading-order",
  "page-has-heading-one",
] as const;

const TOTAL_BUDGET_MS = 10_000;

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

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      })
      .catch((e: unknown) => {
        browserPromise = null;
        throw new AnalyzerError(
          "BROWSER_UNAVAILABLE",
          "Could not start the browser for analysis. Try again in a moment.",
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
  canonical: string
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
          await page.goto(canonical, {
            waitUntil: "domcontentloaded",
            timeout: TOTAL_BUDGET_MS,
          });
        } catch (e: unknown) {
          throw wrapNavigationError(e);
        }

        let axeResults;
        try {
          axeResults = await new AxePuppeteer(page)
            .withRules([...FOCUS_RULES])
            .analyze();
        } catch (e: unknown) {
          throw new AnalyzerError(
            "ANALYSIS_FAILED",
            "Accessibility analysis failed while scanning the page.",
            e
          );
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

    setCachedIssues(canonical, issues);
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

/**
 * Loads a URL with Puppeteer, runs axe-core on focused rules, returns structured issues.
 * Reuses one browser per process; caches by canonical URL with TTL.
 */
export async function analyzePage(
  url: string
): Promise<{ issues: Issue[]; cached: boolean; canonicalUrl: string }> {
  let canonical: string;
  try {
    canonical = canonicalizeUrl(url);
  } catch {
    throw new AnalyzerError(
      "INVALID_URL",
      "Enter a valid http or https URL."
    );
  }

  const hit = getCachedIssues(canonical);
  if (hit !== undefined) {
    return { issues: hit, cached: true, canonicalUrl: canonical };
  }

  return withAnalyzeLock(async () => {
    const again = getCachedIssues(canonical);
    if (again !== undefined) {
      return { issues: again, cached: true, canonicalUrl: canonical };
    }
    try {
      const result = await runAnalysisLocked(canonical);
      return { ...result, canonicalUrl: canonical };
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
