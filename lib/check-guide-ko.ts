/**
 * 사용자용: 이 도구가 확인하는 접근성 규칙(axe 규칙 id 기준) 설명.
 */

export const SCAN_CHECKLIST_KO = [
  {
    id: "image-alt",
    title: "일반 이미지의 대체 텍스트",
    detail:
      "의미 있는 이미지에 `alt`가 없으면 스크린 리더 사용자가 내용을 알 수 없습니다. 장식용이면 `alt=\"\"`로 비워 둘 수 있습니다.",
  },
  {
    id: "input-image-alt",
    title: "이미지형 입력(`input type=\"image\"`)의 대체 텍스트",
    detail:
      "제출 버튼처럼 쓰는 이미지 입력에 이름(대체 텍스트)이 필요합니다.",
  },
  {
    id: "label",
    title: "폼 입력과 레이블 연결",
    detail:
      "`input`, `select`, `textarea` 등에 `<label>`로 이름을 붙이거나 `aria-label` 등으로 접근 가능한 이름이 있어야 합니다.",
  },
  {
    id: "select-name",
    title: "선택 상자(`select`)의 이름",
    detail:
      "무엇을 고르는 필드인지 레이블이나 접근 가능한 이름으로 드러나야 합니다.",
  },
  {
    id: "button-name",
    title: "버튼의 이름",
    detail:
      "`button`이나 역할이 버튼인 요소에 화면에 보이는 글자나 `aria-label` 등으로 용도가 드러나야 합니다.",
  },
  {
    id: "heading-order",
    title: "제목 단계(`h1`–`h6`) 순서",
    detail:
      "제목 레벨을 건너뛰거나 뒤섞이면 문서 구조를 따라가기 어렵습니다. 예: `h2` 다음에 바로 `h4`만 있는 경우.",
  },
  {
    id: "page-has-heading-one",
    title: "페이지에 주제를 나타내는 `h1`",
    detail:
      "페이지마다 대표 제목에 해당하는 `h1`이 있으면 전체 맥락을 파악하기 쉽습니다.",
  },
  {
    id: "link-name",
    title: "링크에 읽을 수 있는 이름",
    detail:
      "텍스트·이미지 `alt`·`aria-label` 등으로 링크가 어디로 가는지 알 수 있어야 합니다. ‘여기 클릭’만 있는 링크는 피합니다.",
  },
  {
    id: "document-title",
    title: "브라우저 탭 제목(`<title>`)",
    detail:
      "페이지마다 `<title>`이 있으면 탭·북마크·스크린 리더에서 구분하기 쉽습니다.",
  },
  {
    id: "html-has-lang",
    title: "문서 언어(`<html lang=\"…\">`)",
    detail:
      "`<html lang=\"ko\">`처럼 주 언어를 지정하면 음성·번역·폰트 선택에 도움이 됩니다.",
  },
  {
    id: "color-contrast",
    title: "글자와 배경 색 대비 (확장 프리셋)",
    detail:
      "텍스트가 배경과 충분히 대비되어 읽기 쉬운지 검사합니다. 시간이 조금 더 걸릴 수 있습니다.",
  },
  {
    id: "frame-title",
    title: "iframe 제목 (확장 프리셋)",
    detail:
      "`<iframe title=\"…\">` 등으로 프레임 용도를 알려 주면 스크린 리더 사용자가 구분하기 쉽습니다.",
  },
  {
    id: "landmark-one-main",
    title: "본문 랜드마크 `main` (확장 프리셋)",
    detail:
      "페이지에 `<main>`(또는 role=main)이 한 번 있는지 확인합니다.",
  },
  {
    id: "meta-viewport",
    title: "모바일 뷰포트 메타 (확장 프리셋)",
    detail:
      "`meta name=viewport`가 줌을 막지 않도록 하는 등 모바일 접근성과 관련됩니다.",
  },
  {
    id: "region",
    title: "랜드마크 영역 (확장 프리셋)",
    detail:
      "`header`, `nav`, `main`, `footer` 등 의미 있는 영역으로 페이지를 나누었는지 봅니다.",
  },
] as const;

/** 심각도(axe 영향도 매핑) 사용자 설명 */
export const SEVERITY_HELP_KO: Record<"high" | "medium" | "low", string> = {
  high: "가장 먼저 고치는 것이 좋습니다. 많은 사용자의 이해·조작에 큰 영향을 줄 수 있습니다.",
  medium: "여유가 있을 때 개선하면 좋습니다. 특정 상황에서 불편을 줄 수 있습니다.",
  low: "가이드에 더 가깝게 맞출 때 참고하면 됩니다. 영향은 상대적으로 작은 편입니다.",
};

export const SEVERITY_LABEL_KO: Record<"high" | "medium" | "low", string> = {
  high: "높음",
  medium: "중간",
  low: "낮음",
};
