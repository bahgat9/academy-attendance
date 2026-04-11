"use client";

import { useRouter, useSearchParams } from "next/navigation";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SheetDateControls() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedDate =
    searchParams.get("date") ?? formatDateInput(new Date());

  function pushDate(date: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }

    router.push(`/attendance/sheet?${params.toString()}`);
  }

  function goPreviousDay() {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() - 1);
    pushDate(formatDateInput(date));
  }

  function goNextDay() {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + 1);
    pushDate(formatDateInput(date));
  }

  function goToday() {
    pushDate(formatDateInput(new Date()));
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-white/50">Select attendance date</p>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => pushDate(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
      />

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={goPreviousDay}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={goToday}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
        >
          Today
        </button>

        <button
          type="button"
          onClick={goNextDay}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
        >
          Next
        </button>
      </div>
    </div>
  );
}