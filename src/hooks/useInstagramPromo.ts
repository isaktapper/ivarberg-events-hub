import { useCallback, useState } from "react";
import { useFeatureFlagVariantKey, usePostHog } from "posthog-js/react";

export type InstagramPromoPlacement = "home_feed";

const STORAGE_KEY = "instagramPromoDismissed";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dagar

const FLAG_KEY = "instagram-promo";

function readPopupSuppressed(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const data = JSON.parse(stored);
    if (data?.dismissedAt && Date.now() - data.dismissedAt < DISMISS_TTL_MS) {
      return true;
    }
    localStorage.removeItem(STORAGE_KEY);
    return false;
  } catch {
    return false;
  }
}

function persistPopupDismissal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
  } catch {
    // localStorage otillgänglig (t.ex. private mode) – popupen återkommer nästa besök
  }
}

/**
 * A/B-test av Instagram-promo (PostHog Experiment "instagram-promo").
 * Varianter: "control" (ingen promo), "inline" (kort i flödet, alltid synligt)
 * och "popup" (dialog efter engagemang, döljs 30 dagar när den stängs).
 * Tills flaggorna laddat – eller om PostHog är blockerad – visas ingen promo,
 * precis som för kontrollgruppen.
 */
export function useInstagramPromo() {
  const posthog = usePostHog();
  const variant = useFeatureFlagVariantKey(FLAG_KEY);
  const [popupSuppressed, setPopupSuppressed] = useState(readPopupSuppressed);

  const trackShown = useCallback(
    (placement: InstagramPromoPlacement) => {
      posthog?.capture("instagram_promo_shown", { variant, placement });
    },
    [posthog, variant]
  );

  const trackClicked = useCallback(
    (placement: InstagramPromoPlacement) => {
      posthog?.capture("instagram_promo_clicked", { variant, placement });
      if (variant === "popup") {
        persistPopupDismissal();
        setPopupSuppressed(true);
      }
    },
    [posthog, variant]
  );

  const trackDismissed = useCallback(
    (placement: InstagramPromoPlacement) => {
      posthog?.capture("instagram_promo_dismissed", { variant, placement });
      persistPopupDismissal();
      setPopupSuppressed(true);
    },
    [posthog, variant]
  );

  return {
    showInline: variant === "inline",
    showPopup: variant === "popup" && !popupSuppressed,
    trackShown,
    trackClicked,
    trackDismissed,
  };
}
