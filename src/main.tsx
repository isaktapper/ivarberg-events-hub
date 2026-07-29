import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2025-05-24",
} as const;

// Exponera posthog i konsolen (window.posthog) för debug och flag-overrides –
// npm-paketet gör inte detta automatiskt, till skillnad från script-snippeten.
declare global {
  interface Window {
    posthog: typeof posthog;
  }
}
window.posthog = posthog;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <App />
    </PostHogProvider>
  </StrictMode>
);
