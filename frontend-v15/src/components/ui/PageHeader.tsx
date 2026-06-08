import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-primary">{title}</h1>
      {description ? (
        <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
      ) : null}
    </div>
    {action}
  </div>
);

export const SectionCard = ({
  title,
  description,
  children,
  className,
  action,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) => (
  <section
    className={cn(
      "rounded-xl border border-outline-variant/40 bg-white p-5 shadow-sm",
      className,
    )}
  >
    {title ? (
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
    ) : null}
    {children}
  </section>
);
