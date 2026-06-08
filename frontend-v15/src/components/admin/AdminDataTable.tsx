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
    <div className="overflow-hidden rounded-lg border border-outline-variant/25">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container">
            <tr className="text-xs uppercase tracking-wide text-on-surface-variant">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-semibold ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 bg-white">
            {rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-surface-container-low/80">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3.5 align-top ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
