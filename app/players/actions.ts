"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { playerSchema } from "@/lib/validators/player";

export type PlayerFormState = {
  error?: string;
};

export async function createPlayerAction(
  _prevState: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const parsed = playerSchema.safeParse({
    fullName: formData.get("fullName"),
    ageGroup: formData.get("ageGroup"),
    guardianPhone: formData.get("guardianPhone"),
    guardianEmail: formData.get("guardianEmail"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid player data",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      owner_id: user.id,
      full_name: parsed.data.fullName,
      age_group: parsed.data.ageGroup || null,
      guardian_phone: parsed.data.guardianPhone || null,
      guardian_email: parsed.data.guardianEmail || null,
      notes: parsed.data.notes || null,
      is_active: parsed.data.isActive,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/players");
  redirect(`/players/${data.id}/enroll`);
}

export async function updatePlayerAction(
  playerId: string,
  _prevState: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const parsed = playerSchema.safeParse({
    fullName: formData.get("fullName"),
    ageGroup: formData.get("ageGroup"),
    guardianPhone: formData.get("guardianPhone"),
    guardianEmail: formData.get("guardianEmail"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid player data",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("players")
    .update({
      full_name: parsed.data.fullName,
      age_group: parsed.data.ageGroup || null,
      guardian_phone: parsed.data.guardianPhone || null,
      guardian_email: parsed.data.guardianEmail || null,
      notes: parsed.data.notes || null,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/players");
  revalidatePath(`/players/${playerId}/edit`);
  redirect("/players");
}

export async function deletePlayerAction(playerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/players");
  redirect("/players");
}