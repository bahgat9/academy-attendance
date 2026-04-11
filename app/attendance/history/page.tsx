import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { HistoryFilters } from "@/components/attendance/history-filters";
import Link from "next/link";

type PageProps = {
    searchParams: Promise<{
        search?: string;
        date?: string;
    }>;
};

export default async function AttendanceHistoryPage({ searchParams }: PageProps) {
    const user = await requireUser();
    const supabase = await createClient();
    const params = await searchParams;

    let query = supabase
        .from("attendance_records")
        .select("*")
        .eq("owner_id", user.id)
        .order("scan_time", { ascending: false })
        .limit(100);

    if (params.search) {
        query = query.ilike("player_name", `%${params.search}%`);
    }

    if (params.date) {
        const start = new Date(`${params.date}T00:00:00`);
        const end = new Date(`${params.date}T23:59:59`);

        query = query
            .gte("scan_time", start.toISOString())
            .lte("scan_time", end.toISOString());
    }

    const { data: records, error } = await query;

    return (
        <AppShell title="Attendance History" subtitle="Review attendance records">
            <div className="space-y-4">
                <HistoryFilters />
                <Link
                    href="/attendance/sheet"
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center font-medium text-white"
                >
                    Open Daily Attendance Sheet
                </Link>

                {error ? (
                    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
                        <p className="text-sm text-red-300">{error.message}</p>
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-white/10 bg-white/[0.04] text-white/60">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Player</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Distance</th>
                                    <th className="px-4 py-3 font-medium">Time</th>
                                </tr>
                            </thead>

                            <tbody>
                                {records && records.length > 0 ? (
                                    records.map((record) => (
                                        <tr
                                            key={record.id}
                                            className="border-b border-white/5 last:border-b-0"
                                        >
                                            <td className="px-4 py-4 font-medium">{record.player_name}</td>
                                            <td className="px-4 py-4">
                                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                                                    {record.recognition_status === "recognized_auto"
                                                        ? "Present"
                                                        : record.recognition_status === "recognized_confirm"
                                                            ? "Needs Confirm"
                                                            : record.recognition_status === "duplicate_blocked"
                                                                ? "Duplicate Blocked"
                                                                : record.recognition_status === "manual"
                                                                    ? "Manual"
                                                                    : "Unknown"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-white/70">
                                                {typeof record.confidence === "number"
                                                    ? record.confidence.toFixed(4)
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-4 text-white/60">
                                                {new Date(record.scan_time).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-white/50">
                                            No attendance records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}