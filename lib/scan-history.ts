import type { AnalysisPreset } from "@/lib/axe-presets";
import type { Issue, IssueSeverity } from "@/lib/types";

export const SCAN_HISTORY_KEY = "frontendQaChecker:history";

/** 브라우저당 최대 보관 개수 (localStorage 용량 고려). */
export const SCAN_HISTORY_MAX = 20;

export type ScanHistoryEntry = {
  id: string;
  url: string;
  preset: AnalysisPreset;
  scannedAt: string;
  issues: Issue[];
  /** Supabase 저장 시 결과 보기 링크용 */
  scanId?: string;
};

export function countBySeverity(issues: Issue[]): Record<IssueSeverity, number> {
  const n: Record<IssueSeverity, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const i of issues) {
    n[i.severity] += 1;
  }
  return n;
}

function safeParse(raw: string | null): ScanHistoryEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (row): row is ScanHistoryEntry =>
        typeof row === "object" &&
        row !== null &&
        "id" in row &&
        "url" in row &&
        "issues" in row
    );
  } catch {
    return [];
  }
}

export function loadScanHistory(): ScanHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(localStorage.getItem(SCAN_HISTORY_KEY));
  } catch {
    return [];
  }
}

export function saveScanHistory(entries: ScanHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function prependScanHistory(entry: Omit<ScanHistoryEntry, "id" | "scannedAt"> & {
  id?: string;
  scannedAt?: string;
}): ScanHistoryEntry[] {
  const full: ScanHistoryEntry = {
    id: entry.id ?? crypto.randomUUID(),
    scannedAt: entry.scannedAt ?? new Date().toISOString(),
    url: entry.url,
    preset: entry.preset,
    issues: entry.issues,
    scanId: entry.scanId,
  };
  const prev = loadScanHistory();
  const next = [full, ...prev.filter((e) => e.id !== full.id)].slice(
    0,
    SCAN_HISTORY_MAX
  );
  saveScanHistory(next);
  return next;
}

export function removeScanHistoryEntry(id: string): void {
  const next = loadScanHistory().filter((e) => e.id !== id);
  saveScanHistory(next);
}

export function clearScanHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SCAN_HISTORY_KEY);
}
