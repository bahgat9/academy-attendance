import Link from "next/link";
import { Users, ScanFace, History, Settings } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/layout/logout-button";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ClipboardList } from "lucide-react";

function getStartAndEndOfToday() {
    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

const actions = [
    {
        href: "/players",
        title: "Manage Players",
        description: "Add, edit, and review registered players.",
        icon: Users,
    },
    {
        href: "/attendance/scan",
        title: "Start Scan",
        description: "Open the camera and begin attendance scanning.",
        icon: ScanFace,
    },
    {
        href: "/attendance/sheet",
        title: "Daily Sheet",
        description: "See the clean present/absent list for today.",
        icon: ClipboardList,
    },
    {
        href: "/attendance/history",
        title: "Attendance History",
        description: "Review records, filters, and exports.",
        icon: History,
    },
    {
        href: "/settings",
        title: "Settings",
        description: "Control thresholds, intro, and scan behavior.",
        icon: Settings,
    },
];

function formatStatusLabel(status: string) {
    switch (status) {
        case "recognized_auto":
            return "Present";
        case "recognized_confirm":
            return "Needs Confirm";
        case "duplicate_blocked":
            return "Duplicate Blocked";
        case "manual":
            return "Manual";
        case "unknown":
            return "Unknown";
        default:
            return status;
    }
}

function getStatusBadgeClass(status: string) {
    switch (status) {
        case "recognized_auto":
            return "bg-emerald-500/15 text-emerald-300";
        case "recognized_confirm":
            return "bg-yellow-500/15 text-yellow-200";
        case "duplicate_blocked":
            return "bg-orange-500/15 text-orange-200";
        case "manual":
            return "bg-blue-500/15 text-blue-200";
        case "unknown":
            return "bg-red-500/15 text-red-200";
        default:
            return "bg-white/10 text-white/70";
    }
}

const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
});

export default async function DashboardPage() {
    const user = await requireUser();
    const supabase = await createClient();

    const { start, end } = getStartAndEndOfToday();

    const [
        playersCountResult,
        todayPresentResult,
        manualTodayResult,
        duplicateTodayResult,
        unknownTodayResult,
        recentActivityResult,
    ] = await Promise.all([
        supabase
            .from("players")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id),

        supabase
            .from("attendance_records")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .eq("recognition_status", "recognized_auto")
            .gte("scan_time", start)
            .lte("scan_time", end),

        supabase
            .from("attendance_records")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .eq("recognition_status", "manual")
            .gte("scan_time", start)
            .lte("scan_time", end),

        supabase
            .from("attendance_records")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .eq("recognition_status", "duplicate_blocked")
            .gte("scan_time", start)
            .lte("scan_time", end),

        supabase
            .from("attendance_records")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .eq("recognition_status", "unknown")
            .gte("scan_time", start)
            .lte("scan_time", end),

        supabase
            .from("attendance_records")
            .select("*")
            .eq("owner_id", user.id)
            .order("scan_time", { ascending: false })
            .limit(10),
    ]);

    const stats = [
        {
            label: "Today Present",
            value: todayPresentResult.count ?? 0,
        },
        {
            label: "Total Players",
            value: playersCountResult.count ?? 0,
        },
        {
            label: "Manual Today",
            value: manualTodayResult.count ?? 0,
        },
        {
            label: "Duplicate Blocks",
            value: duplicateTodayResult.count ?? 0,
        },
        {
            label: "Unknown Today",
            value: unknownTodayResult.count ?? 0,
        },
    ];

    return (
        <AppShell title="Dashboard" subtitle={todayLabel}>
            <div className="space-y-6">
                <div className="flex justify-end">
                    <LogoutButton />
                </div>

                <section className="grid grid-cols-2 gap-4">
                    {stats.map((item) => (
                        <div
                            key={item.label}
                            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                        >
                            <p className="text-sm text-white/50">{item.label}</p>
                            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-medium">Quick Actions</h2>

                    <div className="grid gap-3">
                        {actions.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <h3 className="font-medium">{item.title}</h3>
                                            <p className="mt-1 text-sm text-white/55">{item.description}</p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-medium">Recent Activity</h2>

                        <Link
                            href="/attendance/history"
                            className="text-sm text-white/70 underline"
                        >
                            View all
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                        {recentActivityResult.error ? (
                            <div className="p-4">
                                <p className="text-sm text-red-300">
                                    {recentActivityResult.error.message}
                                </p>
                            </div>
                        ) : recentActivityResult.data &&
                            recentActivityResult.data.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {recentActivityResult.data.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-start justify-between gap-3 p-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{record.player_name}</p>
                                            <p className="mt-1 text-sm text-white/50">
                                                {new Date(record.scan_time).toLocaleString()}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-3 py-1 text-xs ${getStatusBadgeClass(
                                                record.recognition_status
                                            )}`}
                                        >
                                            {formatStatusLabel(record.recognition_status)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4">
                                <p className="text-sm text-white/55">
                                    No attendance activity yet. Start scanning players to populate the dashboard.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}