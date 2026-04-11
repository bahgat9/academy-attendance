import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function PlayersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell title="Players" subtitle="Manage academy players">
      <div className="space-y-4">
        <Link
          href="/players/new"
          className="block rounded-2xl bg-white px-4 py-3 text-center font-medium text-black"
        >
          Add Player
        </Link>

        <div className="space-y-3">
          {error ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-300">{error.message}</p>
            </div>
          ) : players && players.length > 0 ? (
            players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}/edit`}
                className="block rounded-3xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{player.full_name}</h2>
                    <p className="mt-1 text-sm text-white/45">
                      {player.age_group || "No age group"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      player.is_active
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {player.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/55">
                No players yet. Add your first player to begin attendance setup.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}