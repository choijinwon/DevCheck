"use client";

import { PageShell } from "@/app/components/page-shell";
import { NavLink, SiteHeader } from "@/app/components/site-header";
import { ScanChecklistKo } from "@/app/components/ScanChecklistKo";
import { PRESET_LABEL_KO, type AnalysisPreset } from "@/lib/axe-presets";
import { prependScanHistory } from "@/lib/scan-history";
import type { Issue } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "frontendQaChecker:lastScan";

type AnalyzeSuccess = {
  issues: Issue[];
  cached?: boolean;
  scanId?: string;
  preset?: AnalysisPreset;
};

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [preset, setPreset] = useState<AnalysisPreset>("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const u = params.get("url");
    if (u) setUrl(u);
    const p = params.get("preset");
    if (p === "extended" || p === "default") setPreset(p);
  }, []);

  const runAnalyze = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, preset }),
      });
      const data = (await res.json()) as
        | AnalyzeSuccess
        | { error: { code: string; message: string } };

      if (!res.ok && "error" in data && data.error) {
        setError(data.error.message);
        return;
      }

      if (!("issues" in data) || !Array.isArray(data.issues)) {
        setError("서버 응답 형식이 올바르지 않습니다.");
        return;
      }

      const success = data as AnalyzeSuccess;

      prependScanHistory({
        url: url.trim(),
        preset: success.preset ?? preset,
        issues: success.issues,
        scanId: success.scanId,
      });

      if (success.scanId) {
        router.push(`/result?scanId=${encodeURIComponent(success.scanId)}`);
        return;
      }

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          url: url.trim(),
          issues: success.issues,
          cached: success.cached,
          preset: success.preset ?? preset,
        })
      );
      router.push("/result");
    } catch {
      setError("네트워크 오류입니다. 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [router, url, preset]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runAnalyze();
  }

  return (
    <PageShell>
      <SiteHeader
        title="Frontend QA Checker"
        description={
          <>
            페이지 주소를 넣으면 이미지·폼·제목 등{" "}
            <strong className="font-semibold text-slate-800">접근성</strong>{" "}
            관점에서 자동으로 훑어봅니다. (약 10초 이내)
          </>
        }
        actions={<NavLink href="/history">스캔 히스토리</NavLink>}
      />

      <div className="mt-10 surface-card p-6 sm:p-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label
              htmlFor="url"
              className="text-sm font-semibold text-slate-800"
            >
              분석할 웹사이트 URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="input-primary"
            />
          </div>

          <fieldset className="space-y-3 border-0 p-0">
            <legend className="text-sm font-semibold text-slate-800">
              검사 범위
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition ${
                  preset === "default"
                    ? "border-violet-400 bg-violet-50/70 shadow-sm ring-1 ring-violet-500/15"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${loading ? "pointer-events-none opacity-60" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="preset"
                    value="default"
                    checked={preset === "default"}
                    onChange={() => setPreset("default")}
                    disabled={loading}
                    className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm font-medium text-slate-900">
                    {PRESET_LABEL_KO.default}
                  </span>
                </span>
                <span className="pl-6 text-xs leading-relaxed text-slate-600">
                  빠른 점검에 적합합니다.
                </span>
              </label>
              <label
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition ${
                  preset === "extended"
                    ? "border-violet-400 bg-violet-50/70 shadow-sm ring-1 ring-violet-500/15"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${loading ? "pointer-events-none opacity-60" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="preset"
                    value="extended"
                    checked={preset === "extended"}
                    onChange={() => setPreset("extended")}
                    disabled={loading}
                    className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm font-medium text-slate-900">
                    {PRESET_LABEL_KO.extended}
                  </span>
                </span>
                <span className="pl-6 text-xs leading-relaxed text-slate-600">
                  색 대비·랜드마크 등 규칙 추가. 시간이 더 걸릴 수 있습니다.
                </span>
              </label>
            </div>
          </fieldset>

          {error ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3"
              role="alert"
            >
              <p className="text-sm text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => void runAnalyze()}
                disabled={loading || !url.trim()}
                className="mt-2 text-sm font-medium text-red-900 underline underline-offset-4 hover:text-red-950 disabled:opacity-50"
              >
                다시 시도
              </button>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary w-full sm:w-auto sm:self-start"
          >
            {loading ? "분석 중…" : "분석하기"}
          </button>
        </form>
      </div>

      <ScanChecklistKo />
    </PageShell>
  );
}
