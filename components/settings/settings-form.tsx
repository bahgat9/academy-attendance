"use client";

import { useActionState } from "react";
import { saveSettingsAction, type SettingsFormState } from "@/app/settings/actions";

type SettingsFormProps = {
  defaultValues: {
    duplicateWindowMinutes: number;
    recognizedThreshold: number;
    possibleThreshold: number;
    scanCooldownMs: number;
    sheetRefreshIntervalMs: number;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
};

const initialState: SettingsFormState = {};

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSettingsAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="space-y-2">
        <label className="text-sm text-white/70">Duplicate block window (minutes)</label>
        <input
          name="duplicateWindowMinutes"
          type="number"
          min={1}
          max={360}
          defaultValue={defaultValues.duplicateWindowMinutes}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Recognized threshold</label>
          <input
            name="recognizedThreshold"
            type="number"
            step="0.0001"
            min={0.2}
            max={1}
            defaultValue={defaultValues.recognizedThreshold}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Possible threshold</label>
          <input
            name="possibleThreshold"
            type="number"
            step="0.0001"
            min={0.2}
            max={1}
            defaultValue={defaultValues.possibleThreshold}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-white/70">Scan cooldown (ms)</label>
        <input
          name="scanCooldownMs"
          type="number"
          min={500}
          max={10000}
          step={100}
          defaultValue={defaultValues.scanCooldownMs}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-white/70">Sheet auto-refresh interval (ms)</label>
        <input
          name="sheetRefreshIntervalMs"
          type="number"
          min={1000}
          max={60000}
          step={500}
          defaultValue={defaultValues.sheetRefreshIntervalMs}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <input
          type="checkbox"
          name="soundEnabled"
          defaultChecked={defaultValues.soundEnabled}
          className="h-4 w-4"
        />
        <span className="text-sm text-white/80">Enable sound feedback</span>
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <input
          type="checkbox"
          name="vibrationEnabled"
          defaultChecked={defaultValues.vibrationEnabled}
          className="h-4 w-4"
        />
        <span className="text-sm text-white/80">Enable vibration feedback</span>
      </label>

      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-emerald-300">{state.success}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}