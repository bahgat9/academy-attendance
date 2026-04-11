"use client";

type SheetExportButtonProps = {
  selectedDate: string;
};

export function SheetExportButton({
  selectedDate,
}: SheetExportButtonProps) {
  function handleExport() {
    const url = `/api/attendance/sheet-export?date=${encodeURIComponent(
      selectedDate
    )}`;

    window.open(url, "_blank");
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center font-medium text-emerald-300"
    >
      Export Excel Sheet
    </button>
  );
}