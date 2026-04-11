"use client";

import { useRouter } from "next/navigation";

export function IntroResetCard() {
  const router = useRouter();

  function showIntroNow() {
    router.push("/");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-lg font-medium">Intro Animation</h2>
      <p className="mt-2 text-sm text-white/55">
        Play the cinematic intro immediately.
      </p>

      <button
        type="button"
        onClick={showIntroNow}
        className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
      >
        Play Animation Now
      </button>
    </div>
  );
}