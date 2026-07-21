"use client";

import { useState, useMemo } from "react";

interface ContentRow {
  id: string;
  title: string | null;
  planned_at: string | null;
  status: string;
  kind: string;
}

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) {
    const d = new Date(year, month, 1 - startDay + i);
    days.push(d);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

export default function CalendarView({
  rows,
  onRowClick,
}: {
  rows: ContentRow[];
  onRowClick: (id: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, ContentRow[]> = {};
    for (const row of rows) {
      if (!row.planned_at) continue;
      const dateKey = row.planned_at.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(row);
    }
    return map;
  }, [rows]);

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <button
          onClick={() => {
            if (month === 0) {
              setMonth(11);
              setYear(year - 1);
            } else {
              setMonth(month - 1);
            }
          }}
          className="text-zinc-400 hover:text-white text-sm"
        >
          Prev
        </button>
        <span className="text-sm font-medium">
          {monthName} {year}
        </span>
        <button
          onClick={() => {
            if (month === 11) {
              setMonth(0);
              setYear(year + 1);
            } else {
              setMonth(month + 1);
            }
          }}
          className="text-zinc-400 hover:text-white text-sm"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7">
        {dayNames.map((d) => (
          <div
            key={d}
            className="text-xs text-zinc-500 text-center py-2 border-b border-zinc-800"
          >
            {d}
          </div>
        ))}

        {days.map((day, idx) => {
          const dateKey = day.toISOString().slice(0, 10);
          const items = itemsByDate[dateKey] ?? [];
          const isCurrentMonth = day.getMonth() === month;
          const isToday = dateKey === today.toISOString().slice(0, 10);

          return (
            <div
              key={idx}
              className={`min-h-[80px] border-b border-r border-zinc-800 p-1 ${
                isCurrentMonth ? "" : "opacity-30"
              } ${isToday ? "bg-blue-950/20" : ""}`}
            >
              <p
                className={`text-xs mb-1 ${
                  isToday ? "text-blue-400 font-bold" : "text-zinc-500"
                }`}
              >
                {day.getDate()}
              </p>
              {items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onRowClick(item.id)}
                  className={`text-xs px-1 py-0.5 rounded mb-0.5 cursor-pointer truncate ${
                    item.status === "published"
                      ? "bg-emerald-900/50 text-emerald-300"
                      : item.status === "approved"
                      ? "bg-green-900/50 text-green-300"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {item.title || item.kind}
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-zinc-600">
                  +{items.length - 3} more
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
