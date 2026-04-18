import { Suspense } from "react";
import { ResultView } from "./result-view";

export default function ResultPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-16">
      <Suspense
        fallback={
          <p className="text-sm text-zinc-600">Loading results…</p>
        }
      >
        <ResultView />
      </Suspense>
    </main>
  );
}
