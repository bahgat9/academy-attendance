"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type SheetAutoRefreshProps = {
  intervalMs?: number;
};

export function SheetAutoRefresh({
  intervalMs = 5000,
}: SheetAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}