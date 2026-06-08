import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Sparkles,
  ClipboardList,
  Landmark,
  FileBarChart,
  LayoutPanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "/programs", label: "정부지원사업", icon: Landmark },
  { to: "/company-profile", label: "기업정보 입력", icon: Building2 },
  { to: "/company-diagnosis", label: "기업진단보고서", icon: FileBarChart },
  { to: "/matching-results", label: "AI 매칭 결과", icon: Sparkles },
  { to: "/business-plan", label: "사업계획서 자동작성", icon: FileText },
];

const adminNavItems = [
  { to: "/admin/dashboard", label: "관리자 대시보드", icon: LayoutPanelLeft },
];

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
  <aside className="flex h-full w-[var(--spacing-sidebar)] shrink-0 flex-col border-r border-outline-variant/30 bg-white">
    <Link
      to="/"
      onClick={onNavigate}
      className="flex h-16 items-center gap-2 border-b border-outline-variant/30 px-5 transition hover:bg-surface-container"
      aria-label="WOW Growth 홈"
    >
      <ClipboardList className="h-6 w-6 text-secondary" />
      <span className="text-lg font-bold text-primary">WOW Growth</span>
    </Link>
    <nav className="flex-1 space-y-4 p-3">
      <ul className="space-y-1">
        {mainNavItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div>
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70">
          관리자
        </p>
        <ul className="space-y-1">
          {adminNavItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-primary",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
    <div className="border-t border-outline-variant/30 p-4 text-xs text-on-surface-variant">
      MVP ver1.5 · 더미 데이터
    </div>
  </aside>
);
