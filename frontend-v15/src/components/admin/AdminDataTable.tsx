import type { ReactNode } from "react";

export type AdminTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export const AdminDataTable = <T extends { id: string }>({
  columns,
  rows,
  emptyMessage,
}: {
  columns: AdminTableColumn<T>[];
  rows: readonly T[];
  emptyMessage: string;
}) => {
  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-variant">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-outline-variant/30 text-xs uppercase tracking-wide text-on-surface-variant">
            {columns.map((column) => (
              <th key={column.key} className={`px-3 py-2 font-semibold ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-outline-variant/15 last:border-0 hover:bg-surface-container/40"
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-3 py-3 align-top ${column.className ?? ""}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
