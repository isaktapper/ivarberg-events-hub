"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const options = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
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
