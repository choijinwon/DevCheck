import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  /** 기본 max-w-2xl — 결과·히스토리는 더 넓게 */
  wide?: boolean;
  className?: string;
};

/**
 * 공통 배경·폭·패딩. 모든 페이지에서 동일한 “앱” 느낌을 맞춥니다.
 */
export function PageShell({ children, wide, className = "" }: PageShellProps) {
  return (
    <div className="min-h-screen bg-page-gradient text-slate-900 antialiased">
      <div
        className={`mx-auto px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 ${
          wide ? "max-w-3xl" : "max-w-2xl"
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
