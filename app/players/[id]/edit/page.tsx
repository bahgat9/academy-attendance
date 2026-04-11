import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlayerForm } from "@/components/players/player-form";
import { deletePlayerAction, updatePlayerAction } from "../../actions";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPlayerPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!player) {
    notFound();
  }

  const updateAction = updatePlayerAction.bind(null, player.id);
  const deleteAction = deletePlayerAction.bind(null, player.id);

  return (
    <AppShell title="Edit Player" subtitle={player.full_name}>
      <div className="space-y-4">
        <Link
          href={`/players/${player.id}/enroll`}
          className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center font-medium text-white"
        >
          Enroll Face
        </Link>

        <PlayerForm
          action={updateAction}
          submitLabel="Save Changes"
          defaultValues={{
            fullName: player.full_name,
            ageGroup: player.age_group ?? "",
            guardianPhone: player.guardian_phone ?? "",
            guardianEmail: player.guardian_email ?? "",
            notes: player.notes ?? "",
            isActive: player.is_active,
          }}
        />

        <form action={deleteAction}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-medium text-red-300"
          >
            Delete Player
          </button>
        </form>
      </div>
    </AppShell>
  );
}