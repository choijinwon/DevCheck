"use client";

import type { Issue } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STORAGE_KEY = "frontendQaChecker:lastScan";

type AnalyzeSuccess = {
  issues: Issue[];
  cached?: boolean;
  scanId?: string;
};

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as
        | AnalyzeSuccess
        | { error: { code: string; message: string } };

      if (!res.ok && "error" in data && data.error) {
        setError(data.error.message);
        return;
      }

      if (!("issues" in data) || !Array.isArray(data.issues)) {
        setError("Unexpected response from the server.");
        return;
      }

      const success = data as AnalyzeSuccess;

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
        })
      );
      router.push("/result");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Frontend QA Checker
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Enter a page URL to run a quick accessibility scan (images, labels,
        headings).
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        <label htmlFor="url" className="text-sm font-medium text-zinc-800">
          Website URL
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
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 disabled:bg-zinc-50"
        />
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>
    </main>
  );
}
