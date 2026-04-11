"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validators/settings";

export type SettingsFormState = {
  error?: string;
  success?: string;
};

export async function saveSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const parsed = settingsSchema.safeParse({
    duplicateWindowMinutes: formData.get("duplicateWindowMinutes"),
    recognizedThreshold: formData.get("recognizedThreshold"),
    possibleThreshold: formData.get("possibleThreshold"),
    scanCooldownMs: formData.get("scanCooldownMs"),
    sheetRefreshIntervalMs: formData.get("sheetRefreshIntervalMs"),
    soundEnabled: formData.get("soundEnabled") === "on",
    vibrationEnabled: formData.get("vibrationEnabled") === "on",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid settings data",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("app_settings").upsert(
    {
      owner_id: user.id,
      duplicate_window_minutes: parsed.data.duplicateWindowMinutes,
      recognized_threshold: parsed.data.recognizedThreshold,
      possible_threshold: parsed.data.possibleThreshold,
      scan_cooldown_ms: parsed.data.scanCooldownMs,
      sheet_refresh_interval_ms: parsed.data.sheetRefreshIntervalMs,
      sound_enabled: parsed.data.soundEnabled,
      vibration_enabled: parsed.data.vibrationEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/attendance/scan");
  revalidatePath("/attendance/sheet");

  return { success: "Settings saved successfully" };
}