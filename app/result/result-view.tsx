"use client";

import { PageShell } from "@/app/components/page-shell";
import { NavLink, SiteHeader } from "@/app/components/site-header";
import { ScanChecklistKo } from "@/app/components/ScanChecklistKo";
import {
  SEVERITY_HELP_KO,
  SEVERITY_LABEL_KO,
} from "@/lib/check-guide-ko";
import { PRESET_LABEL_KO, type AnalysisPreset } from "@/lib/axe-presets";
import { countBySeverity } from "@/lib/scan-history";
import type { Issue, IssueSeverity } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "frontendQaChecker:lastScan";

const SEVERITY_ORDER: IssueSeverity[] = ["high", "medium", "low"];

const SEV_BORDER: Record<IssueSeverity, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-sky-500",
};

export function ResultView() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("scanId");

  const [url, setUrl] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);
  const [filterQuery, setFilterQuery] = useState("");
  const [showHigh, setShowHigh] = useState(true);
  const [showMedium, setShowMedium] = useState(true);
  const [showLow, setShowLow] = useState(true);
  const [preset, setPreset] = useState<AnalysisPreset | null>(null);

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
            throw new Error("응답 형식이 올바르지 않습니다.");
          }
          return data as { url: string; issues: Issue[] };
        })
        .then((data) => {
          if (!cancelled) {
            setUrl(data.url);
            setIssues(data.issues);
            setPreset(null);
            setCached(false);
            setError(null);
          }
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setError(
              e instanceof Error ? e.message : "결과를 불러오지 못했습니다."
            );
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
      setError("저장된 결과가 없습니다. 홈에서 URL을 분석해 주세요.");
      setIssues(null);
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        url?: string;
        issues?: Issue[];
        cached?: boolean;
        preset?: AnalysisPreset;
      };
      setUrl(parsed.url ?? null);
      setIssues(Array.isArray(parsed.issues) ? parsed.issues : []);
      setCached(!!parsed.cached);
      setPreset(
        parsed.preset === "extended" || parsed.preset === "default"
          ? parsed.preset
          : "default"
      );
      setError(null);
    } catch {
      setError("저장된 결과가 올바르지 않습니다. 다시 분석해 주세요.");
      setIssues(null);
    }
    setLoading(false);
  }, [scanId, retryNonce]);

  const filteredIssues = useMemo(() => {
    const list = issues ?? [];
    const q = filterQuery.trim().toLowerCase();
    return list.filter((issue) => {
      if (issue.severity === "high" && !showHigh) return false;
      if (issue.severity === "medium" && !showMedium) return false;
      if (issue.severity === "low" && !showLow) return false;
      if (!q) return true;
      return (
        issue.message.toLowerCase().includes(q) ||
        issue.selector.toLowerCase().includes(q)
      );
    });
  }, [issues, filterQuery, showHigh, showMedium, showLow]);

  const grouped = useMemo(() => {
    const map: Record<IssueSeverity, Issue[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const issue of filteredIssues) {
      map[issue.severity].push(issue);
    }
    return map;
  }, [filteredIssues]);

  const totalCounts = useMemo(() => countBySeverity(issues ?? []), [issues]);

  function downloadJson() {
    const payload = {
      url,
      preset: preset ?? undefined,
      exportedAt: new Date().toISOString(),
      issueCount: filteredIssues.length,
      issues: filteredIssues,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `frontend-qa-scan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading) {
    return (
      <PageShell wide>
        <p className="text-sm text-slate-600" aria-live="polite">
          결과를 불러오는 중…
        </p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell wide>
        <SiteHeader
          title="분석 결과"
          actions={
            <>
              <NavLink href="/history">히스토리</NavLink>
              <NavLink href="/">홈</NavLink>
            </>
          }
        />
        <div className="mt-8 space-y-4">
          <div
            className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
          {scanId ? (
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              className="text-sm font-medium text-violet-700 underline underline-offset-4 hover:text-violet-900"
            >
              다시 불러오기
            </button>
          ) : (
            <Link
              href="/"
              className="btn-primary inline-flex px-5 py-2.5 text-sm"
            >
              홈으로 돌아가기
            </Link>
          )}
        </div>
      </PageShell>
    );
  }

  const total = issues?.length ?? 0;

  return (
    <PageShell wide>
      <SiteHeader
        title="분석 결과"
        description={
          url ? (
            <span className="break-all font-normal text-slate-700">{url}</span>
          ) : (
            "분석한 페이지"
          )
        }
        actions={
          <>
            <NavLink href="/history">히스토리</NavLink>
            <NavLink href="/">새 분석</NavLink>
          </>
        }
      />

      <div className="mt-8 space-y-6">
        <div className="surface-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 text-sm">
              {cached ? (
                <p className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  캐시에서 불러온 결과
                </p>
              ) : null}
              {preset ? (
                <p className="text-slate-600">
                  검사 범위:{" "}
                  <span className="font-semibold text-slate-900">
                    {PRESET_LABEL_KO[preset]}
                  </span>
                </p>
              ) : scanId ? (
                <p className="text-slate-500">저장된 스캔 (프리셋 정보 없음)</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={downloadJson}
              className="btn-secondary shrink-0 px-4 py-2 text-sm"
            >
              JSON 내보내기
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-3 text-center">
              <p className="text-xs font-medium text-red-800">
                {SEVERITY_LABEL_KO.high}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-red-900">
                {totalCounts.high}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-3 text-center">
              <p className="text-xs font-medium text-amber-900">
                {SEVERITY_LABEL_KO.medium}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-950">
                {totalCounts.medium}
              </p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-3 text-center">
              <p className="text-xs font-medium text-sky-900">
                {SEVERITY_LABEL_KO.low}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-sky-950">
                {totalCounts.low}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              발견된 이슈{" "}
              <span className="font-normal text-slate-500">
                ({filteredIssues.length}
                {filteredIssues.length !== total ? ` / 전체 ${total}` : ""})
              </span>
            </h2>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">
                검색 (메시지·선택자)
              </span>
              <input
                type="search"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="예: alt, label, h1"
                className="input-primary"
              />
            </label>
            <fieldset className="flex flex-wrap gap-3 border-0 p-0">
              <legend className="sr-only">심각도 필터</legend>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={showHigh}
                  onChange={(e) => setShowHigh(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                {SEVERITY_LABEL_KO.high}
              </label>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={showMedium}
                  onChange={(e) => setShowMedium(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                {SEVERITY_LABEL_KO.medium}
              </label>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={showLow}
                  onChange={(e) => setShowLow(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                {SEVERITY_LABEL_KO.low}
              </label>
            </fieldset>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            심각도는 자동 검사 도구(axe)의 영향도를 기준으로 묶었습니다. 아래
            문구는 원인 요소를 찾는 데 도움이 됩니다.
          </p>
          {total === 0 ? (
            <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
              이번에 켜 둔 규칙에서는 문제가 없습니다. (다른 페이지·동적 화면은
              놓칠 수 있습니다.)
            </p>
          ) : filteredIssues.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              필터 조건에 맞는 이슈가 없습니다. 검색어나 심각도를 조정해 보세요.
            </p>
          ) : (
            <div className="mt-6 space-y-10">
              {SEVERITY_ORDER.map((sev) => {
                const list = grouped[sev];
                if (list.length === 0) return null;
                return (
                  <section key={sev} aria-labelledby={`sev-${sev}`}>
                    <h3
                      id={`sev-${sev}`}
                      className="text-sm font-semibold text-slate-900"
                    >
                      {SEVERITY_LABEL_KO[sev]} · {list.length}건
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {SEVERITY_HELP_KO[sev]}
                    </p>
                    <ul className="mt-4 space-y-3">
                      {list.map((issue, i) => (
                        <li
                          key={`${issue.selector}-${issue.message}-${i}`}
                          className={`surface-card border-l-4 ${SEV_BORDER[sev]} px-4 py-3.5`}
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {issue.message}
                          </p>
                          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-600">
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
      </div>

      <ScanChecklistKo />

      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-medium text-violet-700 underline underline-offset-4 hover:text-violet-900"
        >
          ← 다른 URL 분석하기
        </Link>
      </p>
    </PageShell>
  );
}
