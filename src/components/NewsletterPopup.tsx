"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="w-[calc(100%-2rem)] max-w-[26rem] gap-0 rounded-2xl border-0 bg-[#DCE9F7] p-5 text-ink sm:rounded-2xl sm:p-6">
        <span className="text-[13px] font-semibold leading-4 text-[#0F4C81]">Torsdagsbrevet</span>
        <DialogTitle className="mt-1 pr-6 text-xl font-bold leading-7 tracking-normal">
          {`Helgen i ${site.cityName}, varje torsdag`}
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-[15px] leading-6 text-ink-soft">
          Ett mejl i veckan med tre saker vi inte skulle missa i helgen. Inget annat.
        </DialogDescription>
        <div className="mt-4">
          <NewsletterForm
            source={`popup_${page}`}
            inputId="popup-epost"
            onSubscribed={() => {
              subscribedRef.current = true;
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
