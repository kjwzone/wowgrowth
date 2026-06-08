import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const AdminPanel = ({
  title,
  description,
  children,
  action,
  variant = "default",
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  variant?: "default" | "warn";
  className?: string;
}) => (
  <section
    className={cn(
      "rounded-xl border bg-white p-6 shadow-sm",
      variant === "warn"
        ? "border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white"
        : "border-outline-variant/30",
      className,
    )}
  >
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-primary">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);
