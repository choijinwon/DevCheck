import { SCAN_CHECKLIST_KO } from "@/lib/check-guide-ko";

/**
 * 접근성 검사 항목을 한국어로 요약해 보여 줍니다.
 */
export function ScanChecklistKo() {
  return (
    <section
      className="mt-12 surface-card border-violet-100/80 p-5 sm:p-6 text-left"
      aria-labelledby="checklist-heading"
    >
      <h2
        id="checklist-heading"
        className="text-base font-semibold text-slate-900"
      >
        무엇을 검사하나요?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        아래 항목은{" "}
        <abbr title="접근성 자동 검사 도구">axe-core</abbr> 규칙 중 이
        서비스에서 집중해서 보는 부분입니다. 전체 웹 접근성을 모두 대신하지는
        않습니다.
      </p>
      <ul className="mt-5 space-y-4">
        {SCAN_CHECKLIST_KO.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {item.detail}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
