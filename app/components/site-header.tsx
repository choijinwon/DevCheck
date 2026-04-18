import Link from "next/link";
import type { ReactNode } from "react";

type SiteHeaderProps = {
  title: string;
  description?: ReactNode;
  /** 우측 네비(히스토리·홈 등) */
  actions?: ReactNode;
};

export function SiteHeader({ title, description, actions }: SiteHeaderProps) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        <Link
          href="/"
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-md shadow-violet-500/25 ring-1 ring-white/20 transition hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          aria-label="홈으로"
        >
          <span className="text-sm font-bold tracking-tight text-white">
            QA
          </span>
        </Link>
        <div className="min-w-0 pt-0.5">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-xl text-pretty text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <nav
          className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end"
          aria-label="페이지 이동"
        >
          {actions}
        </nav>
      ) : null}
    </header>
  );
}

type NavLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "default" | "danger";
};

export function NavLink({ href, children, variant = "default" }: NavLinkProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const styles =
    variant === "danger"
      ? "text-red-700 hover:bg-red-50 focus-visible:outline-red-500"
      : "text-slate-700 hover:bg-slate-100/90 focus-visible:outline-violet-500";
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

export function NavButton({
  children,
  onClick,
  variant = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const styles =
    variant === "danger"
      ? "text-red-700 hover:bg-red-50 focus-visible:outline-red-500"
      : "text-slate-700 hover:bg-slate-100/90 focus-visible:outline-violet-500";
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
