import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export const DataTable = <T extends { id: string }>({
  columns,
  rows,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
}) => (
  <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
    <table className="min-w-full divide-y divide-outline-variant/30 text-sm">
      <thead className="bg-surface-container-low">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={cn(
                "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant",
                col.className,
              )}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/20 bg-white">
        {rows.map((row) => (
          <tr
            key={row.id}
            className={cn(onRowClick && "cursor-pointer hover:bg-surface-container-low/80")}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((col) => (
              <td key={col.key} className={cn("px-4 py-3", col.className)}>
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
