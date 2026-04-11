"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, UserRoundX, UserCheck } from "lucide-react";

type ScanOverlayResult =
  | {
      status: "recognized_auto" | "recognized_confirm" | "duplicate_blocked" | "manual";
      matched: true;
      player: {
        id: string;
        fullName: string;
        ageGroup?: string | null;
      };
      distance?: number;
      message: string;
    }
  | {
      status: "unknown";
      matched: false;
      distance?: number;
      message: string;
    };

type ScanResultOverlayProps = {
  result: ScanOverlayResult | null;
};

function getResultMeta(result: ScanOverlayResult) {
  switch (result.status) {
    case "recognized_auto":
      return {
        title: "Attendance Confirmed",
        subtitle: result.player.fullName,
        caption: result.player.ageGroup || "Player recognized successfully",
        icon: CheckCircle2,
        cardClass:
          "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.18)]",
        iconWrapClass: "bg-emerald-400/20 text-emerald-200",
      };

    case "recognized_confirm":
      return {
        title: "Possible Match",
        subtitle: result.player.fullName,
        caption: "Please verify the player",
        icon: AlertTriangle,
        cardClass:
          "border-yellow-400/30 bg-yellow-500/15 text-yellow-50 shadow-[0_0_30px_rgba(234,179,8,0.16)]",
        iconWrapClass: "bg-yellow-400/20 text-yellow-100",
      };

    case "duplicate_blocked":
      return {
        title: "Already Marked",
        subtitle: result.player.fullName,
        caption: "Attendance was already recorded recently",
        icon: AlertTriangle,
        cardClass:
          "border-orange-400/30 bg-orange-500/15 text-orange-50 shadow-[0_0_30px_rgba(249,115,22,0.16)]",
        iconWrapClass: "bg-orange-400/20 text-orange-100",
      };

    case "manual":
      return {
        title: "Marked Manually",
        subtitle: result.player.fullName,
        caption: "Manual attendance recorded",
        icon: UserCheck,
        cardClass:
          "border-blue-400/30 bg-blue-500/15 text-blue-50 shadow-[0_0_30px_rgba(59,130,246,0.16)]",
        iconWrapClass: "bg-blue-400/20 text-blue-100",
      };

    case "unknown":
    default:
      return {
        title: "Unregistered Person",
        subtitle: "No Match Found",
        caption: "Use manual attendance if needed",
        icon: UserRoundX,
        cardClass:
          "border-red-400/30 bg-red-500/15 text-red-50 shadow-[0_0_30px_rgba(239,68,68,0.16)]",
        iconWrapClass: "bg-red-400/20 text-red-100",
      };
  }
}

export function ScanResultOverlay({ result }: ScanResultOverlayProps) {
  return (
    <AnimatePresence mode="wait">
      {result ? (
        <motion.div
          key={`${result.status}-${result.matched ? result.player.id : "unknown"}`}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="pointer-events-none fixed inset-x-4 top-24 z-40 mx-auto max-w-md"
        >
          <OverlayCard result={result} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function OverlayCard({ result }: { result: ScanOverlayResult }) {
  const meta = getResultMeta(result);
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ boxShadow: "0 0 0 rgba(0,0,0,0)" }}
      animate={{
        boxShadow:
          result.status === "recognized_auto"
            ? "0 0 40px rgba(16,185,129,0.22)"
            : result.status === "manual"
            ? "0 0 40px rgba(59,130,246,0.22)"
            : result.status === "duplicate_blocked"
            ? "0 0 40px rgba(249,115,22,0.18)"
            : result.status === "recognized_confirm"
            ? "0 0 40px rgba(234,179,8,0.18)"
            : "0 0 40px rgba(239,68,68,0.18)",
      }}
      transition={{ duration: 0.35 }}
      className={`overflow-hidden rounded-[2rem] border backdrop-blur-xl ${meta.cardClass}`}
    >
      <div className="relative p-5">
        <motion.div
          initial={{ opacity: 0.55, scale: 0.9 }}
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl"
        />

        <div className="flex items-start gap-4">
          <motion.div
            initial={{ rotate: -12, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.iconWrapClass}`}
          >
            <Icon className="h-6 w-6" />
          </motion.div>

          <div className="min-w-0 flex-1">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.22 }}
              className="text-sm font-medium uppercase tracking-wide text-white/70"
            >
              {meta.title}
            </motion.p>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.26 }}
              className="mt-1 truncate text-3xl font-bold"
            >
              {meta.subtitle}
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.24 }}
              className="mt-2 text-sm text-white/80"
            >
              {meta.caption}
            </motion.p>

            {typeof result.distance === "number" ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.24, duration: 0.2 }}
                className="mt-2 text-xs text-white/60"
              >
                Distance: {result.distance.toFixed(4)}
              </motion.p>
            ) : null}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2.2, ease: "linear" }}
        className="h-1 bg-white/50"
      />
    </motion.div>
  );
}