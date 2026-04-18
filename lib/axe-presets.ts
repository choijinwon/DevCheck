/** 기본: 빠른 점검. 확장: 색 대비·랜드마크 등 WCAG 보조 규칙 추가. */
export type AnalysisPreset = "default" | "extended";

const BASE_RULES = [
  "image-alt",
  "input-image-alt",
  "label",
  "select-name",
  "button-name",
  "heading-order",
  "page-has-heading-one",
  "link-name",
  "document-title",
  "html-has-lang",
] as const;

/** 확장 전용(기본 규칙에 추가). */
const EXTENDED_EXTRA_RULES = [
  "color-contrast",
  "frame-title",
  "landmark-one-main",
  "meta-viewport",
  "region",
] as const;

export function rulesForPreset(preset: AnalysisPreset): string[] {
  if (preset === "extended") {
    return [...BASE_RULES, ...EXTENDED_EXTRA_RULES];
  }
  return [...BASE_RULES];
}

export function normalizePreset(raw: unknown): AnalysisPreset {
  if (raw === "extended") return "extended";
  return "default";
}

export function buildCacheKey(
  canonicalUrl: string,
  preset: AnalysisPreset
): string {
  return `${canonicalUrl}\u0001${preset}`;
}

export const PRESET_LABEL_KO: Record<AnalysisPreset, string> = {
  default: "기본 (빠른 점검)",
  extended: "확장 (색 대비·랜드마크 등)",
};
