import type { ReactNode } from "react";
import Image from "next/image";
import { BottomNav } from "@/components/layout/bottom-nav";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/90 px-4 py-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image
                src="/tut.png"
                alt="Academy logo"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white/90">
                Academy Attendance
              </p>
              <p className="truncate text-xs text-white/50">
                Football Academy
              </p>
            </div>
          </div>

          {subtitle ? <p className="text-xs text-white/50">{subtitle}</p> : null}
          <h1 className="text-2xl font-semibold">{title}</h1>
        </header>

        <section className="flex-1 px-4 py-5 pb-24">{children}</section>

        <BottomNav />
      </div>
    </main>
  );
}
