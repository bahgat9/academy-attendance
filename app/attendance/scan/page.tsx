import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { LiveAttendanceScanner } from "@/components/camera/live-attendance-scanner";
import { createClient } from "@/lib/supabase/server";

export default async function ScanPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: players, error }, { data: settings }] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, age_group, is_active")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("full_name", { ascending: true }),

    supabase
      .from("app_settings")
      .select("scan_cooldown_ms, sound_enabled, vibration_enabled")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <AppShell title="Live Scan" subtitle="Camera attendance scanning">
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="font-medium">Live Attendance</h2>
          <div className="mt-3 space-y-2 text-sm text-white/60">
            <p>Use one face at a time.</p>
            <p>Wait for the attendance result before showing the next player.</p>
            <p>Use Manual for twins or difficult cases.</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">{error.message}</p>
          </div>
        ) : (
          <LiveAttendanceScanner
            players={players ?? []}
            scanCooldownMs={settings?.scan_cooldown_ms ?? 2200}
            soundEnabled={settings?.sound_enabled ?? true}
            vibrationEnabled={settings?.vibration_enabled ?? true}
          />
        )}
      </div>
    </AppShell>
  );
}