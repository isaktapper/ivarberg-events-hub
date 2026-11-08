"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscribeToNewsletter } from "@/services/eventService";
import {
  FOOTER_ADDRESS,
  FOOTER_BOTTOM_LINKS,
  FOOTER_GROUPS,
  FOOTER_TAGLINE,
  INU_LABEL,
  INU_LIME,
  INU_PATH,
  INU_URL,
} from "../../legacy-api/_lib/footer";

export function Footer() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await subscribeToNewsletter(email, name);

    if (result.success) {
      setSuccess(true);
      setEmail("");
      setName("");
      // Stäng dialog efter 2 sekunder
      setTimeout(() => {
        setIsDialogOpen(false);
        setSuccess(false);
      }, 2000);
    } else {
      setError(result.error || "Ett fel uppstod");
    }

    setIsSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset form när dialog stängs
      setEmail("");
      setName("");
      setError(null);
      setSuccess(false);
    }
  };

  // Serverrenderade sidor länkar hit med ?nyhetsbrev=1 – öppna dialogen direkt
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("nyhetsbrev") !== "1") return;
    setIsDialogOpen(true);
    params.delete("nyhetsbrev");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, []);

  const linkClass = "inline-block py-1.5 text-sand/75 hover:text-seaglass transition-colors";

  return (
    <footer className="mt-16 bg-navy text-sand">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-7 lg:px-6 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,3fr)] lg:gap-14">
          <div>
            <p className="text-xl font-bold text-white tracking-tight mb-1.5">ivarberg.nu</p>
            <p className="text-[15px] text-sand/75">{FOOTER_TAGLINE}</p>
            <p className="mt-3 text-sm text-sand/75">{FOOTER_ADDRESS}</p>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="mt-5 whitespace-nowrap rounded-full bg-seaglass px-5 py-3 text-[15px] font-semibold text-navy transition-colors hover:bg-seaglass/85"
            >
              Få nyhetsbrevet
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {FOOTER_GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-2 text-sm font-semibold text-white">{group.title}</h2>
                <ul className="text-sm">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-sand/15 pt-5 text-sm text-sand/75">
          <ul className="flex flex-wrap items-center gap-x-5">
            <li>&copy; {new Date().getFullYear()} ivarberg.nu</li>
            {FOOTER_BOTTOM_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={linkClass}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={INU_URL}
            rel="noopener"
            aria-label={INU_LABEL}
            className="inline-flex items-center gap-1.5 py-1.5 font-medium text-white hover:text-seaglass transition-colors"
          >
            En del av
            <svg viewBox="0 7 147 85" width="26" height="15" aria-hidden="true" focusable="false" className="block">
              <path d={INU_PATH} fill="none" stroke="currentColor" strokeWidth="13" />
              <rect x="0" y="9" width="13" height="13" fill={INU_LIME} />
            </svg>
          </a>
        </div>
      </div>

      {/* Newsletter Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#10214B' }}>Prenumerera på nyhetsbrev</DialogTitle>
            <DialogDescription style={{ color: '#10214B', opacity: 0.7 }}>
              Få de senaste evenemangen och nyheterna från Varberg direkt till din inkorg.
            </DialogDescription>
          </DialogHeader>
          
          {success ? (
            <div className="py-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                <p className="text-sm font-medium text-green-800">
                  Tack! Du är nu prenumererad på vårt nyhetsbrev.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newsletter-name" style={{ color: '#10214B' }}>
                  Ditt namn *
                </Label>
                <Input
                  id="newsletter-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ditt namn"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsletter-email" style={{ color: '#10214B' }}>
                  Din e-postadress *
                </Label>
                <Input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                style={{
                  backgroundColor: '#0F5AA6',
                  color: '#FFFFFF',
                  border: 'none'
                }}
              >
                {isSubmitting ? 'Registrerar...' : 'Prenumerera'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </footer>
  );
}