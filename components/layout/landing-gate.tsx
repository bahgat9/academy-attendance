"use client";

import { useRouter } from "next/navigation";
import { IntroSplash } from "@/components/layout/intro-splash";

export function LandingGate() {
  const router = useRouter();

  function handleFinish() {
    router.replace("/login");
  }

  return <IntroSplash onFinish={handleFinish} />;
}