import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  ScanFace,
  History,
  Settings,
  LayoutDashboard,
} from "lucide-react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/players", label: "Players", icon: Users },
  { href: "/attendance/scan", label: "Scan", icon: ScanFace },
  { href: "/attendance/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

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

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-neutral-950/95 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}