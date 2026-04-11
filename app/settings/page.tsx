import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { IntroResetCard } from "@/components/settings/intro-reset-card";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  const defaults = {
    duplicateWindowMinutes: settings?.duplicate_window_minutes ?? 60,
    recognizedThreshold: Number(settings?.recognized_threshold ?? 0.5),
    possibleThreshold: Number(settings?.possible_threshold ?? 0.58),
    scanCooldownMs: settings?.scan_cooldown_ms ?? 2200,
    sheetRefreshIntervalMs: settings?.sheet_refresh_interval_ms ?? 5000,
    soundEnabled: settings?.sound_enabled ?? true,
    vibrationEnabled: settings?.vibration_enabled ?? true,
  };

  return (
    <AppShell title="Settings" subtitle="Recognition and attendance rules">
      <div className="space-y-4">
        <SettingsForm defaultValues={defaults} />
        <IntroResetCard />
      </div>
    </AppShell>
  );
}