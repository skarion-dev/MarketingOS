"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type CellValue = string | number | null;
type CellType = "text" | "select" | "date" | "status";

interface Column<T> {
  key: string;
  label: string;
  type?: CellType;
  options?: readonly { value: string; label: string; color?: string }[];
  render?: (row: T) => React.ReactNode;
  editable?: boolean;
  width?: number;
}

interface EditableGridProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  rows: T[];
  onEdit?: (rowId: string, key: string, value: CellValue) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  sortable?: boolean;
}

function InlineEditor({
  value,
  type,
  options,
  onSave,
  onCancel,
}: {
  value: CellValue;
  type: CellType;
  options?: readonly { value: string; label: string; color?: string }[];
  onSave: (value: CellValue) => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSave(editValue);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  if (type === "select" && options) {
    return (
      <select
        ref={inputRef as React.Ref<HTMLSelectElement>}
        value={String(editValue)}
        onChange={(e) => onSave(e.target.value)}
        onBlur={onCancel}
        onKeyDown={handleKeyDown}
        className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm w-full"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (type === "date") {
    return (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="date"
        value={String(editValue)}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => onSave(editValue)}
        onKeyDown={handleKeyDown}
        className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm w-full"
      />
    );
  }

  return (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type="text"
      value={String(editValue)}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={() => onSave(editValue)}
      onKeyDown={handleKeyDown}
      className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm w-full"
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idea: "bg-zinc-700 text-zinc-300",
    draft: "bg-yellow-900 text-yellow-300",
    in_review: "bg-purple-900 text-purple-300",
    approved: "bg-green-900 text-green-300",
    scheduled: "bg-blue-900 text-blue-300",
    published: "bg-emerald-900 text-emerald-300",
    rejected: "bg-red-900 text-red-300",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        colors[status] ?? "bg-zinc-700 text-zinc-300"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function EditableGrid<T extends Record<string, unknown>>({
  columns,
  rows,
  onEdit,
  onRowClick,
  selectable,
  selected,
  onSelectionChange,
  sortable,
}: EditableGridProps<T>) {
  const [editingCell, setEditingCell] = useState<{
    rowIdx: number;
    colKey: string;
  } | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterText, setFilterText] = useState("");

  const toggleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selected);
    const allIds = rows.map((r) => String(r.id ?? ""));
    if (allIds.every((id) => newSelected.has(id))) {
      allIds.forEach((id) => newSelected.delete(id));
    } else {
      allIds.forEach((id) => newSelected.add(id));
    }
    onSelectionChange(newSelected);
  }, [rows, selected, onSelectionChange]);

  const toggleSelect = useCallback(
    (id: string) => {
      if (!onSelectionChange) return;
      const newSelected = new Set(selected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      onSelectionChange(newSelected);
    },
    [selected, onSelectionChange]
  );

  let displayRows = [...rows];

  if (filterText) {
    const lower = filterText.toLowerCase();
    displayRows = displayRows.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(lower);
      })
    );
  }

  if (sortKey) {
    displayRows.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const handleCellClick = (rowIdx: number, col: Column<T>) => {
    if (!col.editable) return;
    if (onRowClick) return;
    setEditingCell({ rowIdx, colKey: col.key });
  };

  const handleCellSave = (rowIdx: number, colKey: string, value: CellValue) => {
    setEditingCell(null);
    const row = displayRows[rowIdx];
    const rowId = String(row.id ?? "");
    onEdit?.(rowId, colKey, value);
  };

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-zinc-800 bg-zinc-900">
        <input
          type="text"
          placeholder="Filter..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm w-64 placeholder:text-zinc-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400 sticky top-0">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={
                      rows.length > 0 &&
                      rows.every((r) => selected?.has(String(r.id ?? "")))
                    }
                    className="rounded"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-2 font-medium ${
                    sortable ? "cursor-pointer hover:text-zinc-200 select-none" : ""
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => sortable && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortable && sortKey === col.key && (
                      <span className="text-xs">
                        {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => {
              const rowId = String(row.id ?? "");
              return (
                <tr
                  key={rowId}
                  className={`border-t border-zinc-800 ${
                    onRowClick
                      ? "hover:bg-zinc-800/50 cursor-pointer"
                      : "hover:bg-zinc-800/30"
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected?.has(rowId) ?? false}
                        onChange={() => toggleSelect(rowId)}
                        className="rounded"
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const isEditing =
                      editingCell?.rowIdx === rowIdx &&
                      editingCell?.colKey === col.key;

                    if (isEditing) {
                      return (
                        <td key={col.key} className="px-4 py-0">
                          <InlineEditor
                            value={String(row[col.key] ?? "")}
                            type={col.type ?? "text"}
                            options={col.options}
                            onSave={(v) => handleCellSave(rowIdx, col.key, v)}
                            onCancel={() => setEditingCell(null)}
                          />
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${
                          col.editable
                            ? "cursor-pointer hover:bg-zinc-700/50 rounded"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(rowIdx, col);
                        }}
                      >
                        {col.type === "status" ? (
                          <StatusBadge
                            status={String(row[col.key] ?? "")}
                          />
                        ) : col.render ? (
                          col.render(row)
                        ) : (
                          <span className="text-zinc-300">
                            {row[col.key] != null
                              ? String(row[col.key])
                              : "\u2014"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {displayRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-zinc-500 text-center"
                >
                  {filterText ? "No matching rows" : "No data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
