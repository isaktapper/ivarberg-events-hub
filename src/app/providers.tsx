"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Eventen går via vår egen domän (rewrites i next.config.ts) så att adblockers
// inte stoppar dem. ui_host behövs för att länkar till PostHog-appen (toolbar
// m.m.) ska peka rätt när api_host inte är PostHogs egen.
const options = {
  api_host: "/r",
  ui_host: "https://eu.posthog.com",
  defaults: "2025-05-24",
} as const;

// Exponera posthog i konsolen (window.posthog) för debug och flag-overrides –
// npm-paketet gör inte detta automatiskt, till skillnad från script-snippeten.
declare global {
  interface Window {
    posthog: typeof posthog;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.posthog = posthog;
  }, []);

  return (
    <PostHogProvider apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY!} options={options}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {children}
      </TooltipProvider>
    </PostHogProvider>
  );
}
