"use client";

import { PageShell } from "@/app/components/page-shell";
import {
  NavButton,
  NavLink,
  SiteHeader,
} from "@/app/components/site-header";
import { PRESET_LABEL_KO, type AnalysisPreset } from "@/lib/axe-presets";
import {
  clearScanHistory,
  countBySeverity,
  loadScanHistory,
  removeScanHistoryEntry,
  SCAN_HISTORY_MAX,
  type ScanHistoryEntry,
} from "@/lib/scan-history";
import type { Issue } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const LAST_SCAN_KEY = "frontendQaChecker:lastScan";

function openResult(entry: ScanHistoryEntry) {
  if (entry.scanId) {
    window.location.href = `/result?scanId=${encodeURIComponent(entry.scanId)}`;
    return;
  }
  sessionStorage.setItem(
    LAST_SCAN_KEY,
    JSON.stringify({
      url: entry.url,
      issues: entry.issues,
      cached: false,
      preset: entry.preset,
    })
  );
  window.location.href = "/result";
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setEntries(loadScanHistory());
  }, []);

  useEffect(() => {
    setEntries(loadScanHistory());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <PageShell wide>
        <p className="text-sm text-slate-600">불러오는 중…</p>
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <SiteHeader
        title="스캔 히스토리"
        description={`이 브라우저에만 저장됩니다. 최대 ${SCAN_HISTORY_MAX}건입니다.`}
        actions={
          <>
            <NavLink href="/">홈</NavLink>
            {entries.length > 0 ? (
              <NavButton
                variant="danger"
                onClick={() => {
                  clearScanHistory();
                  refresh();
                }}
              >
                전체 삭제
              </NavButton>
            ) : null}
          </>
        }
      />

      {entries.length === 0 ? (
        <div className="mt-10 surface-card p-10 text-center">
          <p className="text-sm text-slate-600">
            아직 기록이 없습니다.
            <br />
            홈에서 URL을 분석하면 여기에 쌓입니다.
          </p>
          <Link
            href="/"
            className="btn-primary mt-6 inline-flex min-w-[10rem] justify-center"
          >
            분석하러 가기
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {entries.map((entry) => {
            const c = countBySeverity(entry.issues as Issue[]);
            return (
              <li key={entry.id} className="surface-card p-5 transition hover:shadow-card-hover">
                <p className="break-all font-medium leading-snug text-slate-900">
                  {entry.url}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <time dateTime={entry.scannedAt}>
                    {new Date(entry.scannedAt).toLocaleString("ko-KR")}
                  </time>
                  <span aria-hidden>·</span>
                  <span>
                    {PRESET_LABEL_KO[entry.preset as AnalysisPreset] ??
                      entry.preset}
                  </span>
                  {entry.scanId ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-200/80">
                        저장됨
                      </span>
                    </>
                  ) : null}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="badge-sev-high inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                    높음 {c.high}
                  </span>
                  <span className="badge-sev-medium inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                    중간 {c.medium}
                  </span>
                  <span className="badge-sev-low inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                    낮음 {c.low}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">
                    총 {entry.issues.length}건
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openResult(entry)}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    결과 보기
                  </button>
                  <Link
                    href={`/?url=${encodeURIComponent(entry.url)}&preset=${entry.preset}`}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    다시 분석
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      removeScanHistoryEntry(entry.id);
                      refresh();
                    }}
                    className="rounded-full px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
