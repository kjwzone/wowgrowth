import { Bell, Menu, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/lib/use-session";

export const Topbar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const navigate = useNavigate();
  const { session, logout, isLoggedIn } = useSession();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-outline-variant/30 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container lg:hidden"
          onClick={onMenuClick}
          aria-label="메뉴"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            placeholder="공고·기업·문서 검색"
            className="w-64 rounded-lg border border-outline-variant/50 bg-surface-container-low py-2 pl-9 pr-3 text-sm focus:border-secondary focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
          aria-label="알림"
        >
          <Bell className="h-5 w-5" />
        </button>
        {isLoggedIn && session ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-on-surface-variant">로그인 중</span>
            <span className="text-on-surface-variant/50" aria-hidden>
              |
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="font-medium text-primary hover:text-secondary"
            >
              로그아웃
            </button>
            <span className="hidden text-xs text-on-surface-variant md:inline">
              ({session.name})
            </span>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface-container"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
};
