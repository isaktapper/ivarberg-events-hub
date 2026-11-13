"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { FeedbackDialog } from "@/components/FeedbackDialog";

const STORAGE_KEY = "ivarberg_ny_look_stangd";
/** Sista dagen raden visas. Efter det är utseendet inte längre en nyhet. */
const SHOW_UNTIL = "2026-12-15";

// Körs innan sidan ritas, så att raden inte blinkar till för den som redan har stängt den
const HIDE_EARLY = `try{if(localStorage.getItem("${STORAGE_KEY}"))document.currentScript.previousElementSibling.style.display="none"}catch(e){}`;

// Smal rad allra överst som berättar att sajten har fått nytt utseende. Går att stänga.
export function NewLookBanner() {
  const posthog = usePostHog();
  const [closed, setClosed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) setClosed(true);
    } catch {
      // Utan localStorage visas raden varje gång, vilket är okej
    }
  }, []);

  const close = () => {
    setClosed(true);
    posthog?.capture("new_look_banner_closed");
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Se ovan
    }
  };

  const dialog = (
    <FeedbackDialog
      open={feedbackOpen}
      onOpenChange={(open) => {
        setFeedbackOpen(open);
        // Den som har svarat behöver inte se raden igen
        if (!open && feedbackSent) close();
      }}
      onSent={() => setFeedbackSent(true)}
    />
  );

  if (closed || new Date().toISOString().slice(0, 10) > SHOW_UNTIL) return null;


  return (
    <>
      <div
        role="region"
        aria-label="Nyhet om sajten"
        className="relative bg-[#DCE9F7] text-ink"
        suppressHydrationWarning
      >
        <p className="mx-auto max-w-[1280px] py-[7px] pl-4 pr-11 text-[13px] font-medium leading-5 sm:px-12 sm:text-center sm:text-sm">
          Vi har fått nytt utseende.{" "}
          <button
            type="button"
            onClick={() => {
              setFeedbackOpen(true);
              posthog?.capture("new_look_banner_feedback_clicked");
            }}
            className="font-semibold text-[#0F4C81] underline underline-offset-[3px] hover:text-ink"
          >
            Tyck till
          </button>
        </p>
        <button
          type="button"
          onClick={close}
          aria-label="Stäng"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <script dangerouslySetInnerHTML={{ __html: HIDE_EARLY }} />
      {dialog}
    </>
  );
}
