"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { NewsletterForm } from "@/components/NewsletterCard";
import { useSite } from "@/config/SiteProvider";
import {
  markNewsletterPopupDismissed,
  markNewsletterPopupShown,
  newsletterPopupSuppressed,
  sessionStartedAt,
} from "@/lib/newsletterPrompt";

/** Minst så här länge på sajten innan popupen får visas */
const MIN_TIME_ON_SITE_MS = 20_000;
/** …och så här långt ner på sidan (andel av det som går att scrolla, max i px) */
const SCROLL_SHARE = 0.4;
const SCROLL_MAX_PX = 1200;

interface NewsletterPopupProps {
  /** Vilken sida popupen sitter på, för statistiken */
  page: "home" | "event";
}

// Popup för Torsdagsbrevet. Visas först när besökaren har varit på sajten en
// stund och scrollat en bit, aldrig för den som redan anmält sig, och inte
// igen på 30 dagar när den har stängts.
export function NewsletterPopup({ page }: NewsletterPopupProps) {
  const posthog = usePostHog();
  const site = useSite();
  const [open, setOpen] = useState(false);
  const subscribedRef = useRef(false);
  const enabled = site.features.newsletter;

  useEffect(() => {
    if (!enabled || newsletterPopupSuppressed()) return;
    const startedAt = sessionStartedAt();
    let done = false;

    const scrolledEnough = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // Korta sidor går knappt att scrolla – där räcker tiden
      if (scrollable < 300) return true;
      return window.scrollY >= Math.min(scrollable * SCROLL_SHARE, SCROLL_MAX_PX);
    };

    const formInView = () =>
      // Sidfoten räknas inte: på mobil ligger den så nära rutan att popupen annars aldrig skulle visas
      Array.from(document.querySelectorAll('[data-newsletter-form]:not([data-newsletter-form="footer"])')).some((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      });

    const check = () => {
      if (done) return;
      if (Date.now() - startedAt < MIN_TIME_ON_SITE_MS || !scrolledEnough()) return;
      // Inte ovanpå en annan dialog (t.ex. "Tyck till")
      if (document.querySelector('[role="dialog"]')) return;
      // Inte medan en anmälningsruta redan syns på skärmen – vänta tills den är förbi
      if (formInView()) return;
      if (newsletterPopupSuppressed()) return;
      done = true;
      markNewsletterPopupShown();
      setOpen(true);
      posthog?.capture("newsletter_popup_shown", { page });
      cleanup();
    };

    const timer = window.setInterval(check, 2000);
    window.addEventListener("scroll", check, { passive: true });
    const cleanup = () => {
      window.clearInterval(timer);
      window.removeEventListener("scroll", check);
    };
    return cleanup;
  }, [enabled, page, posthog]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && !subscribedRef.current) {
      markNewsletterPopupDismissed();
      posthog?.capture("newsletter_popup_dismissed", { page });
    }
  };

  if (!enabled) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60" />
        {/* Telefon: överst på skärmen i full bredd, så att tangentbordet aldrig
            täcker den. Större skärmar: centrerad. */}
        <DialogPrimitive.Content
          className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl bg-[#DCE9F7] p-5 text-ink shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-full sm:max-w-[28rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6 sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%] sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]"
        >
          <DialogClose
            aria-label="Stäng"
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
          >
            <X className="h-6 w-6" strokeWidth={2.25} />
          </DialogClose>
          <DialogTitle className="pr-10 text-xl font-bold leading-7 tracking-normal">
            {`Få helgens evenemang i ${site.cityName} på mejl`}
          </DialogTitle>
          <DialogDescription className="mt-2 text-[15px] leading-6 text-ink-soft">
            {`Varje torsdag klockan 07 skickar vi ett mejl med det som händer i ${site.cityName} i helgen. Gratis, och du kan avsluta när du vill.`}
          </DialogDescription>
          <div className="mt-4">
            <NewsletterForm
              source={`popup_${page}`}
              inputId="popup-epost"
              stacked
              buttonLabel="Prenumerera"
              onSubscribed={() => {
                subscribedRef.current = true;
              }}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
