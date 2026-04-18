import { PageShell } from "@/app/components/page-shell";
import { Suspense } from "react";
import { ResultView } from "./result-view";

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <PageShell wide>
          <p className="text-sm text-slate-600">결과를 불러오는 중…</p>
        </PageShell>
      }
    >
      <ResultView />
    </Suspense>
  );
}
