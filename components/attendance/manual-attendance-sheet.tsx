"use client";

import { useMemo, useState } from "react";

type PlayerItem = {
  id: string;
  full_name: string;
  age_group: string | null;
  is_active: boolean;
};

type ManualAttendanceSheetProps = {
  players: PlayerItem[];
  onClose: () => void;
  onMarked: (payload: {
    status: "manual" | "duplicate_blocked";
    player: {
      id: string;
      fullName: string;
    };
    message: string;
  }) => void;
};

export function ManualAttendanceSheet({
  players,
  onClose,
  onMarked,
}: ManualAttendanceSheetProps) {
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return players.filter((player) => {
      if (!player.is_active) return false;
      if (!q) return true;

      return (
        player.full_name.toLowerCase().includes(q) ||
        (player.age_group ?? "").toLowerCase().includes(q)
      );
    });
  }, [players, search]);

  async function markManual(playerId: string) {
    try {
      setLoadingId(playerId);
      setError(null);

      const response = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to mark attendance");
      }

      onMarked({
        status: result.status,
        player: result.player,
        message: result.message,
      });

      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to mark attendance");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
      <div className="mx-auto flex min-h-screen max-w-md items-end px-4 py-4">
        <div className="max-h-[85vh] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950 shadow-2xl">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white/50">Manual Attendance</p>
                <h2 className="text-xl font-semibold">Select Player</h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
              >
                Close
              </button>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player name or age group"
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{player.full_name}</p>
                        <p className="mt-1 text-sm text-white/50">
                          {player.age_group || "No age group"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => markManual(player.id)}
                        disabled={loadingId === player.id}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                      >
                        {loadingId === player.id ? "Marking..." : "Mark"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
                  No players found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}