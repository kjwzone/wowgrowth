import { Bell, Menu, Search, UserCircle } from "lucide-react";

export const Topbar = ({ onMenuClick }: { onMenuClick?: () => void }) => (
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
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
        <UserCircle className="h-8 w-8 text-secondary" />
        <div className="hidden text-sm md:block">
          <p className="font-medium text-primary">김종우</p>
          <p className="text-xs text-on-surface-variant">와우그로스(주)</p>
        </div>
      </div>
    </div>
  </header>
);
