"use client";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface EditableGridProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  rows: T[];
  onEdit?: (row: T) => void;
}

export default function EditableGrid<T extends Record<string, unknown>>({
  columns,
  rows,
  onEdit,
}: EditableGridProps<T>) {
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-zinc-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-2 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
              onClick={() => onEdit?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render
                    ? col.render(row)
                    : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-3 text-zinc-500 text-center">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
