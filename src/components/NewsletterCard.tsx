"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { subscribeToNewsletter } from "@/services/eventService";
import { useSite } from "@/config/SiteProvider";

interface NewsletterCardProps {
  /** "light" = ljusblå ruta i listan, "dark" = i den mörka sidfoten */
  variant?: "light" | "dark";
  /** Var rutan sitter, för statistiken */
  source: string;
  /** id på e-postfältet (måste vara unikt på sidan) */
  inputId?: string;
}

// Torsdagsbrevet: anmälan direkt på sidan med bara e-postadress.
export function NewsletterCard({ variant = "light", source, inputId = "torsdagsbrevet-epost" }: NewsletterCardProps) {
  const posthog = usePostHog();
  const site = useSite();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const dark = variant === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    const result = await subscribeToNewsletter(email, "", site.tenantId);
    if (result.success) {
      setSuccess(true);
      posthog?.capture("newsletter_subscribed", { source });
    } else {
      setError(result.error || "Något gick fel. Försök igen om en stund.");
    }
    setIsSubmitting(false);
  };

  const form = success ? (
    <p role="status" className={`text-[15px] font-semibold ${dark ? "text-white" : "text-ink"}`}>
      Klart. Första brevet kommer på torsdag klockan sju.
    </p>
  ) : (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Din e-postadress
        </label>
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@epost.se"
          disabled={isSubmitting}
          className="h-[46px] min-w-0 flex-1 rounded-xl border-0 bg-white px-3.5 text-base text-ink placeholder:text-[#7B8496] focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`h-[46px] shrink-0 rounded-xl px-[18px] text-[15px] font-semibold transition-colors disabled:opacity-60 ${
            dark ? "bg-seaglass text-navy hover:bg-seaglass/85" : "bg-ink text-white hover:bg-navy"
          }`}
        >
          {isSubmitting ? "Skickar…" : "Ja tack"}
        </button>
      </div>
      {error && (
        <p role="alert" className={`text-sm ${dark ? "text-[#FFB4A8]" : "text-[#A63A1B]"}`}>
          {error}
        </p>
      )}
    </form>
  );

  if (!site.features.newsletter) return null;

  if (dark) {
    return (
      <div id="nyhetsbrev" className="mt-6 flex max-w-sm scroll-mt-24 flex-col gap-3">
        <div>
          <p className="text-[15px] font-semibold text-white">Torsdagsbrevet</p>
          <p className="mt-0.5 text-sm text-sand/75">{`Helgen i ${site.cityName} i din inkorg, varje torsdag.`}</p>
        </div>
        {form}
      </div>
    );
  }

  return (
    <section
      aria-labelledby={`${inputId}-rubrik`}
      className="flex flex-col gap-3.5 rounded-2xl bg-[#DCE9F7] px-4 py-[18px] lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-6 lg:py-[22px]"
    >
      <div className="lg:max-w-[30rem]">
        <span className="text-[13px] font-semibold leading-4 text-[#0F4C81]">Torsdagsbrevet</span>
        <h3 id={`${inputId}-rubrik`} className="mt-1 text-lg font-bold leading-6 text-ink">
          {`Helgen i ${site.cityName}, varje torsdag`}
        </h3>
        <p className="mt-1 text-sm leading-[21px] text-ink-soft">
          Ett mejl i veckan med tre saker vi inte skulle missa i helgen.
        </p>
      </div>
      <div className="lg:w-[360px] lg:shrink-0">{form}</div>
    </section>
  );
}
