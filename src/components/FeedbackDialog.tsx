"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type Verdict = "gillar" | "gillar_inte";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Körs när svaret har sparats */
  onSent?: () => void;
}

const FIELD =
  "w-full rounded-xl border border-[#D5D9E1] bg-white px-3.5 text-base text-ink placeholder:text-[#7B8496] focus:border-sea focus:outline-none focus-visible:ring-2 focus-visible:ring-sea/30";

// "Tyck till": gillar / gillar inte, och frivilligt en kommentar och en e-postadress för svar.
export function FeedbackDialog({ open, onOpenChange, onSent }: FeedbackDialogProps) {
  const posthog = usePostHog();
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!verdict) {
      setError("Välj om du gillar det eller inte.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tyck-till", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict, comment, email, website, page: window.location.pathname }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        setSent(true);
        posthog?.capture("site_feedback_sent", { verdict, has_comment: !!comment.trim(), has_email: !!email.trim() });
        onSent?.();
      } else {
        setError(data.message || "Något gick fel. Försök igen om en stund.");
      }
    } catch {
      setError("Något gick fel. Försök igen om en stund.");
    }
    setIsSubmitting(false);
  };

  const choice = (value: Verdict, label: string, Icon: typeof ThumbsUp) => {
    const active = verdict === value;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => {
          setVerdict(value);
          setError(null);
        }}
        className={`flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-2 ${
          active ? "bg-ink text-white" : "bg-[#F4F5F7] text-ink hover:bg-[#ECEEF2]"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        {label}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-[26rem] gap-0 overflow-y-auto rounded-2xl border-0 bg-white p-5 text-ink sm:rounded-2xl sm:p-6">
        {sent ? (
          <div className="py-2">
            <DialogTitle className="text-xl font-bold leading-7 tracking-normal">Tack för att du svarade</DialogTitle>
            <DialogDescription className="mt-2 text-[15px] leading-6 text-ink-soft">
              {email.trim() ? "Vi läser allt och hör av oss till dig." : "Vi läser allt som kommer in."}
            </DialogDescription>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-5 h-12 w-full rounded-xl bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-navy"
            >
              Stäng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="pr-6">
              <DialogTitle className="text-xl font-bold leading-7 tracking-normal">Vad tycker du om nya ivarberg.nu?</DialogTitle>
              <DialogDescription className="sr-only">
                Välj om du gillar det eller inte. Kommentar och e-postadress är frivilligt.
              </DialogDescription>
            </div>

            <div role="group" aria-label="Ditt omdöme" className="flex gap-2">
              {choice("gillar", "Jag gillar det", ThumbsUp)}
              {choice("gillar_inte", "Gillar det inte", ThumbsDown)}
            </div>

            <div>
              <label htmlFor="tyck-till-kommentar" className="mb-1.5 block text-sm font-medium">
                Vill du säga något mer? <span className="font-normal text-ink-soft">Frivilligt</span>
              </label>
              <textarea
                id="tyck-till-kommentar"
                rows={3}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`${FIELD} resize-none py-2.5 leading-6`}
              />
            </div>

            <div>
              <label htmlFor="tyck-till-epost" className="mb-1.5 block text-sm font-medium">
                E-post om du vill ha svar <span className="font-normal text-ink-soft">Frivilligt</span>
              </label>
              <input
                id="tyck-till-epost"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.se"
                className={`${FIELD} h-12`}
              />
            </div>

            {/* Dolt fält som bara botar fyller i */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
            />

            {error && (
              <p role="alert" className="text-sm text-[#A63A1B]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-xl bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-navy disabled:opacity-60"
            >
              {isSubmitting ? "Skickar…" : "Skicka"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
