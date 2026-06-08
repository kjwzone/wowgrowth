import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminTabItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export const AdminTabBar = <T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: readonly AdminTabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
}) => (
  <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low p-1.5">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
            isActive
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:bg-white hover:text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
          {tab.label}
          {tab.count !== undefined ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                isActive ? "bg-white/20 text-on-primary" : "bg-surface-container text-primary",
              )}
            >
              {tab.count}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);
