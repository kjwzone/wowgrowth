import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "/programs", label: "정부지원사업", icon: Landmark },
  { to: "/company-profile", label: "기업정보 입력", icon: Building2 },
  { to: "/matching-results", label: "AI 매칭 결과", icon: Sparkles },
  { to: "/business-plan", label: "사업계획서 자동작성", icon: FileText },
  { to: "/admin/review", label: "관리자 검수", icon: ShieldCheck },
];

export const Sidebar = () => (
  <aside className="hidden w-[var(--spacing-sidebar)] shrink-0 border-r border-outline-variant/30 bg-white lg:flex lg:flex-col">
    <div className="flex h-16 items-center gap-2 border-b border-outline-variant/30 px-5">
      <ClipboardList className="h-6 w-6 text-secondary" />
      <span className="text-lg font-bold text-primary">WOW Growth</span>
    </div>
    <nav className="flex-1 space-y-1 p-3">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
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
      ))}
    </nav>
    <div className="border-t border-outline-variant/30 p-4 text-xs text-on-surface-variant">
      MVP ver1.5 · 더미 데이터
    </div>
  </aside>
);
