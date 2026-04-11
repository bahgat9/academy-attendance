"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type IntroSplashProps = {
  onFinish: () => void;
};

type Scene = 0 | 1 | 2;

const particles = Array.from({ length: 24 }).map((_, index) => ({
  id: index,
  left: `${4 + ((index * 19) % 92)}%`,
  top: `${5 + ((index * 11) % 88)}%`,
  duration: 3.5 + (index % 5),
  delay: index * 0.07,
  size: 1 + (index % 3),
}));

export function IntroSplash({ onFinish }: IntroSplashProps) {
  const [scene, setScene] = useState<Scene>(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setScene(1), 2600);
    const t2 = window.setTimeout(() => setScene(2), 5400);
    const t3 = window.setTimeout(() => onFinish(), 8000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onFinish]);

  function handleSkip() {
    onFinish();
  }

  const progressWidth = useMemo(() => {
    if (scene === 0) return "33%";
    if (scene === 1) return "66%";
    return "100%";
  }, [scene]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <PremiumBackground />
      <ParticleField />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur hover:bg-white/10"
          >
            Skip
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            {scene === 0 ? <SceneAwaken key="scene-awaken" /> : null}
            {scene === 1 ? <SceneIdentity key="scene-identity" /> : null}
            {scene === 2 ? <SceneReady key="scene-ready" /> : null}
          </AnimatePresence>
        </div>

        <div className="space-y-3 pb-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{ width: progressWidth }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-white to-emerald-300"
            />
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.35em] text-white/30">
            Premium check-in sequence
          </p>
        </div>
      </div>
    </main>
  );
}

function PremiumBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563eb_0%,#0b1120_28%,#030712_62%,#000000_100%)]" />

      <motion.div
        animate={{
          opacity: [0.16, 0.3, 0.16],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-4 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl"
      />

      <motion.div
        animate={{
          opacity: [0.08, 0.18, 0.08],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl"
      />

      <div className="absolute inset-0 opacity-[0.06]">
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <motion.div
        animate={{ y: ["-15%", "110%"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-cyan-300/0 via-cyan-300/10 to-cyan-300/0 blur-xl"
      />
    </>
  );
}

function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0.12, 0.8, 0.12],
            y: [0, -20, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.7)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size * 2}px`,
            height: `${particle.size * 2}px`,
          }}
        />
      ))}
    </div>
  );
}

function SceneAwaken() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.08, y: -16 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="absolute h-44 w-44 rounded-full border border-cyan-300/12"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute h-56 w-56 rounded-full border border-white/8"
        />
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 rgba(34,211,238,0.04)",
              "0 0 55px rgba(34,211,238,0.24)",
              "0 0 0 rgba(34,211,238,0.04)",
            ],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="relative h-36 w-36 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5"
        >
          <Image
            src="/tut.png"
            alt="Academy logo"
            fill
            priority
            className="object-cover"
          />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="mt-8 text-sm uppercase tracking-[0.4em] text-white/50"
      >
        TUT Academy
      </motion.p>
    </motion.div>
  );
}

function SceneIdentity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.6 }}
      className="w-full text-center"
    >
      <motion.div
        initial={{ opacity: 0, scaleX: 0.7 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mx-auto mb-6 h-px w-28 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
      />

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.45 }}
        className="text-4xl font-bold tracking-tight"
      >
        Academy Attendance
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34, duration: 0.42 }}
        className="mt-5 text-sm uppercase tracking-[0.35em] text-cyan-200/70"
      >
        Face Recognition Active
      </motion.p>

      <div className="mx-auto mt-10 max-w-xs overflow-hidden rounded-full border border-white/10 bg-white/5 p-1">
        <motion.div
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-2 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
        />
      </div>
    </motion.div>
  );
}

function SceneReady() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{
          opacity: 1,
          scale: [1, 1.05, 1],
        }}
        transition={{
          opacity: { duration: 0.35 },
          scale: { duration: 1.9, repeat: Infinity, ease: "easeInOut" },
        }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10"
      >
        <div className="h-5 w-5 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.85)]" />
      </motion.div>

      <h2 className="mt-8 text-3xl font-bold">Ready</h2>

      <p className="mt-4 text-sm uppercase tracking-[0.32em] text-white/55">
        Secure Check-In
      </p>

      <div className="mx-auto mt-8 w-full max-w-xs">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.4, ease: "linear" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-white to-cyan-300"
          />
        </div>
      </div>
    </motion.div>
  );
}