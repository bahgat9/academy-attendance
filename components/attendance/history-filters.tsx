"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function HistoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [date, setDate] = useState(searchParams.get("date") ?? "");

  function applyFilters() {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (date) {
      params.set("date", date);
    }

    router.push(`/attendance/history?${params.toString()}`);
  }

  function resetFilters() {
    setSearch("");
    setDate("");
    router.push("/attendance/history");
  }

  function exportCsv() {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (date) {
      params.set("date", date);
    }

    window.open(`/api/attendance/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="grid gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player name"
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-2xl bg-white px-4 py-3 font-medium text-black"
        >
          Apply
        </button>

        <button
          type="button"
          onClick={resetFilters}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={exportCsv}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 font-medium text-emerald-300"
        >
          Export
        </button>
      </div>
    </div>
  );
}