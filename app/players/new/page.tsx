import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { PlayerForm } from "@/components/players/player-form";
import { createPlayerAction } from "../actions";

export default async function NewPlayerPage() {
  await requireUser();

  return (
    <AppShell title="Add Player" subtitle="Create a new academy player">
      <PlayerForm action={createPlayerAction} submitLabel="Create Player" />
    </AppShell>
  );
}