"use client";

import { useActionState } from "react";
import type { PlayerFormState } from "@/app/players/actions";

type PlayerFormProps = {
  action: (
    prevState: PlayerFormState,
    formData: FormData
  ) => Promise<PlayerFormState>;
  defaultValues?: {
    fullName?: string;
    ageGroup?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    notes?: string;
    isActive?: boolean;
  };
  submitLabel: string;
};

const initialState: PlayerFormState = {};

export function PlayerForm({
  action,
  defaultValues,
  submitLabel,
}: PlayerFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm text-white/70">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={defaultValues?.fullName ?? ""}
          required
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="ageGroup" className="text-sm text-white/70">
          Age group
        </label>
        <input
          id="ageGroup"
          name="ageGroup"
          defaultValue={defaultValues?.ageGroup ?? ""}
          placeholder="U6, U8, U10..."
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guardianPhone" className="text-sm text-white/70">
          Guardian phone
        </label>
        <input
          id="guardianPhone"
          name="guardianPhone"
          defaultValue={defaultValues?.guardianPhone ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guardianEmail" className="text-sm text-white/70">
          Guardian email
        </label>
        <input
          id="guardianEmail"
          name="guardianEmail"
          type="email"
          defaultValue={defaultValues?.guardianEmail ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm text-white/70">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={defaultValues?.isActive ?? true}
          className="h-4 w-4"
        />
        <span className="text-sm text-white/80">Player is active</span>
      </label>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}