import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AppRole } from "@/lib/types/database";

type NavItem = { href: string; label: string };

const userNav: NavItem[] = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/company/detail", label: "기업정보" },
  { href: "/reports/diagnosis", label: "기업진단" },
  { href: "/programs", label: "지원사업" },
  { href: "/matches", label: "추천사업" },
  { href: "/business-plans", label: "사업계획서" },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "관리자" },
  { href: "/admin/programs", label: "공고 관리" },
  { href: "/admin/reviews/programs", label: "AI 검수" },
  { href: "/admin/jobs", label: "작업 모니터링" },
];

export const AppShell = ({
  title,
  role,
  children,
}: {
  title: string;
  role?: AppRole;
  children: React.ReactNode;
}) => {
  const nav =
    role === "admin" || role === "reviewer"
      ? [...userNav, ...adminNav]
      : userNav;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-sm text-slate-500">WOW Growth</p>
          <h1 className="text-2xl font-semibold">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <nav className="flex flex-wrap gap-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
};
