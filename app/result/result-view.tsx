"use client";

import type { Issue, IssueSeverity } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "frontendQaChecker:lastScan";

const SEVERITY_ORDER: IssueSeverity[] = ["high", "medium", "low"];

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function ResultView() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("scanId");

  const [url, setUrl] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scanId) {
      let cancelled = false;
      setLoading(true);
      fetch(`/api/scan/${encodeURIComponent(scanId)}`)
        .then(async (res) => {
          const data = (await res.json()) as
            | { url: string; issues: Issue[] }
            | { error: { message: string } };
          if (!res.ok && "error" in data) {
            throw new Error(data.error.message);
          }
          if (!("issues" in data)) {
            throw new Error("Unexpected response.");
          }
          return data as { url: string; issues: Issue[] };
        })
        .then((data) => {
          if (!cancelled) {
            setUrl(data.url);
            setIssues(data.issues);
            setCached(false);
            setError(null);
          }
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Could not load results.");
            setIssues(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setError("No results. Run an analysis from the home page.");
      setIssues(null);
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        url?: string;
        issues?: Issue[];
        cached?: boolean;
      };
      setUrl(parsed.url ?? null);
      setIssues(Array.isArray(parsed.issues) ? parsed.issues : []);
      setCached(!!parsed.cached);
      setError(null);
    } catch {
      setError("Stored results were invalid. Run a new analysis.");
      setIssues(null);
    }
    setLoading(false);
  }, [scanId]);

  const grouped = useMemo(() => {
    const map: Record<IssueSeverity, Issue[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const issue of issues ?? []) {
      map[issue.severity].push(issue);
    }
    return map;
  }, [issues]);

  if (loading) {
    return (
      <p className="text-sm text-zinc-600" aria-live="polite">
        Loading results…
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  const total = issues?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-zinc-200 pb-6">
        <p className="text-sm text-zinc-500">Analyzed URL</p>
        {url ? (
          <p className="break-all font-medium text-zinc-900">{url}</p>
        ) : (
          <p className="text-zinc-600">—</p>
        )}
        {cached ? (
          <p className="text-sm text-zinc-500">Loaded from cache</p>
        ) : null}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Issues ({total})
        </h2>
        {total === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            No issues found for the focused rules on this page.
          </p>
        ) : (
          <div className="mt-4 space-y-8">
            {SEVERITY_ORDER.map((sev) => {
              const list = grouped[sev];
              if (list.length === 0) return null;
              return (
                <section key={sev} aria-labelledby={`sev-${sev}`}>
                  <h3
                    id={`sev-${sev}`}
                    className="text-sm font-semibold uppercase tracking-wide text-zinc-700"
                  >
                    {SEVERITY_LABEL[sev]} ({list.length})
                  </h3>
                  <ul className="mt-3 space-y-4">
                    {list.map((issue, i) => (
                      <li
                        key={`${issue.selector}-${issue.message}-${i}`}
                        className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm"
                      >
                        <p className="font-medium text-zinc-900">
                          {issue.message}
                        </p>
                        <p className="mt-1 font-mono text-xs text-zinc-600">
                          {issue.selector}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/"
        className="inline-block text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
      >
        ← Analyze another URL
      </Link>
    </div>
  );
}
