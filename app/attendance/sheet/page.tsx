import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SheetAutoRefresh } from "@/components/attendance/sheet-auto-refresh";
import { SheetDateControls } from "@/components/attendance/sheet-date-controls";
import { SheetExportButton } from "@/components/attendance/sheet-export-button";

type PageProps = {
    searchParams: Promise<{
        date?: string;
    }>;
};

function getDateRange(selectedDate?: string) {
    const base = selectedDate
        ? new Date(`${selectedDate}T12:00:00`)
        : new Date();

    const start = new Date(base);
    start.setHours(0, 0, 0, 0);

    const end = new Date(base);
    end.setHours(23, 59, 59, 999);

    return {
        start: start.toISOString(),
        end: end.toISOString(),
        label: base.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }),
        inputValue: `${base.getFullYear()}-${`${base.getMonth() + 1}`.padStart(
            2,
            "0"
        )}-${`${base.getDate()}`.padStart(2, "0")}`,
    };
}

function formatTime(dateString: string | null) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}

function isToday(dateInput: string) {
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(
        2,
        "0"
    )}-${`${today.getDate()}`.padStart(2, "0")}`;

    return dateInput === todayFormatted;
}

export default async function AttendanceSheetPage({ searchParams }: PageProps) {
    const user = await requireUser();
    const supabase = await createClient();
    const params = await searchParams;

    const { start, end, label, inputValue } = getDateRange(params.date);
    const shouldAutoRefresh = isToday(inputValue);

    const [playersResult, attendanceResult] = await Promise.all([
        supabase
            .from("players")
            .select("id, full_name, age_group, is_active")
            .eq("owner_id", user.id)
            .eq("is_active", true)
            .order("full_name", { ascending: true }),

        supabase
            .from("attendance_records")
            .select("id, player_id, player_name, recognition_status, scan_time")
            .eq("owner_id", user.id)
            .in("recognition_status", ["recognized_auto", "manual"])
            .gte("scan_time", start)
            .lte("scan_time", end)
            .order("scan_time", { ascending: true }),
    ]);

    const players = playersResult.data ?? [];
    const attendanceRows = attendanceResult.data ?? [];

    const firstCleanAttendanceByPlayer = new Map<
        string,
        {
            scan_time: string;
            recognition_status: string;
        }
    >();

    for (const row of attendanceRows) {
        if (!row.player_id) continue;

        if (!firstCleanAttendanceByPlayer.has(row.player_id)) {
            firstCleanAttendanceByPlayer.set(row.player_id, {
                scan_time: row.scan_time,
                recognition_status: row.recognition_status,
            });
        }
    }

    const sheetRows = players.map((player, index) => {
        const attendance = firstCleanAttendanceByPlayer.get(player.id);

        return {
            no: index + 1,
            id: player.id,
            fullName: player.full_name,
            ageGroup: player.age_group,
            present: Boolean(attendance),
            time: attendance ? formatTime(attendance.scan_time) : "-",
            method:
                attendance?.recognition_status === "manual"
                    ? "Manual"
                    : attendance?.recognition_status === "recognized_auto"
                        ? "Face Scan"
                        : "-",
        };
    });

    const presentCount = sheetRows.filter((row) => row.present).length;
    const absentCount = sheetRows.length - presentCount;
    const { data: settings } = await supabase
        .from("app_settings")
        .select("sheet_refresh_interval_ms")
        .eq("owner_id", user.id)
        .maybeSingle();

    const sheetRefreshIntervalMs = settings?.sheet_refresh_interval_ms ?? 5000;

    return (
        <AppShell title="Daily Attendance Sheet" subtitle={label}>
            {shouldAutoRefresh ? (
                <SheetAutoRefresh intervalMs={sheetRefreshIntervalMs} />
            ) : null}

            <div className="space-y-4">
                <SheetDateControls />
                <SheetExportButton selectedDate={inputValue} />
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm text-white/50">Present</p>
                        <p className="mt-2 text-3xl font-semibold">{presentCount}</p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm text-white/50">Absent</p>
                        <p className="mt-2 text-3xl font-semibold">{absentCount}</p>
                    </div>
                </div>

                <div
                    className={`rounded-3xl p-4 text-sm ${shouldAutoRefresh
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                        : "border border-white/10 bg-white/[0.03] text-white/70"
                        }`}
                >
                    {shouldAutoRefresh ? (
                        <>
                            <p className="font-medium">Live sheet updates enabled</p>
                            <p className="mt-1 text-emerald-100/80">
                                Today’s sheet refreshes automatically and ignores duplicates.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-medium">Viewing saved attendance date</p>
                            <p className="mt-1 text-white/60">
                                Auto-refresh is off because this is not today’s sheet.
                            </p>
                        </>
                    )}
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-white/10 bg-white/[0.04] text-white/60">
                                <tr>
                                    <th className="px-4 py-3 font-medium">No</th>
                                    <th className="px-4 py-3 font-medium">Player</th>
                                    <th className="px-4 py-3 font-medium">Age Group</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Time</th>
                                    <th className="px-4 py-3 font-medium">Method</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sheetRows.length > 0 ? (
                                    sheetRows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-white/5 last:border-b-0"
                                        >
                                            <td className="px-4 py-4 font-medium text-white/70">
                                                {row.no}
                                            </td>

                                            <td className="px-4 py-4 font-medium">{row.fullName}</td>

                                            <td className="px-4 py-4 text-white/60">
                                                {row.ageGroup || "-"}
                                            </td>

                                            <td className="px-4 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs ${row.present
                                                        ? "bg-emerald-500/15 text-emerald-300"
                                                        : "bg-white/10 text-white/60"
                                                        }`}
                                                >
                                                    {row.present ? "Present" : "Absent"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-white/70">{row.time}</td>

                                            <td className="px-4 py-4 text-white/60">{row.method}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-white/50">
                                            No active players found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Link
                    href="/attendance/history"
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center font-medium text-white"
                >
                    Open Attendance History
                </Link>
            </div>
        </AppShell>
    );
}