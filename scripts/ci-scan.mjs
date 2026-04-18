#!/usr/bin/env node
/**
 * CI/local: POST /api/analyze and exit with non-zero if thresholds fail.
 *
 * Usage:
 *   SCAN_URL=https://example.com node scripts/ci-scan.mjs
 *   node scripts/ci-scan.mjs https://example.com
 *
 * Env:
 *   SCAN_API_BASE   — default http://localhost:3000
 *   SCAN_PRESET     — default | extended (default: default)
 *   SCAN_FAIL_ON    — any | high | medium (default: high)
 *     any    — exit 2 if any issue
 *     high   — exit 2 if any high severity
 *     medium — exit 2 if any high or medium
 */

const base = (process.env.SCAN_API_BASE || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const url = process.argv[2] || process.env.SCAN_URL;
const preset =
  process.env.SCAN_PRESET === "extended" ? "extended" : "default";
const failOn = process.env.SCAN_FAIL_ON || "high";

if (!url || typeof url !== "string" || !url.trim()) {
  console.error(
    "Missing URL. Set SCAN_URL or pass as first argument.\nExample: SCAN_URL=https://example.com node scripts/ci-scan.mjs"
  );
  process.exit(1);
}

const res = await fetch(`${base}/api/analyze`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: url.trim(), preset }),
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Invalid JSON:", text.slice(0, 500));
  process.exit(1);
}

if (!res.ok) {
  console.error("HTTP", res.status, data?.error || data);
  process.exit(1);
}

const issues = Array.isArray(data.issues) ? data.issues : [];
const high = issues.filter((i) => i.severity === "high").length;
const medium = issues.filter((i) => i.severity === "medium").length;
const low = issues.filter((i) => i.severity === "low").length;

const summary = {
  url: url.trim(),
  preset: data.preset || preset,
  cached: data.cached,
  total: issues.length,
  high,
  medium,
  low,
};

console.log(JSON.stringify(summary, null, 2));

let fail = false;
if (failOn === "any" && issues.length > 0) fail = true;
else if (failOn === "high" && high > 0) fail = true;
else if (failOn === "medium" && (high > 0 || medium > 0)) fail = true;

if (fail) {
  console.error("Scan failed threshold: SCAN_FAIL_ON=" + failOn);
  process.exit(2);
}

process.exit(0);
