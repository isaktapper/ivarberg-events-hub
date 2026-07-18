import { useState } from "react";
import { Mail, MapPin, Instagram } from "lucide-react";
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

  return (
    <footer className="mt-16 bg-navy text-sand">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-sand">
              ivarberg.nu
            </h3>
            <p className="text-sm text-sand/70">
              Din kompletta guide till Varbergs puls. Missa aldrig ett evenemang igen!
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sand">Snabblänkar</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-sand/70 hover:text-seaglass transition-colors">Alla evenemang</a></li>
              <li><a href="/evenemang-varberg" className="text-sand/70 hover:text-seaglass transition-colors">Evenemang Varberg</a></li>
              <li><a href="/att-gora-i-varberg" className="text-sand/70 hover:text-seaglass transition-colors">Att göra i Varberg</a></li>
              <li><a href="/varberg-kalender" className="text-sand/70 hover:text-seaglass transition-colors">Varberg Kalender</a></li>
              <li><a href="/tips" target="_blank" className="text-sand/70 hover:text-seaglass transition-colors">Tipsa oss</a></li>
              <li><a href="/om-oss" className="text-sand/70 hover:text-seaglass transition-colors">Om oss</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sand">Kategorier</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/?category=Scen" className="text-sand/70 hover:text-seaglass transition-colors">Scen & Teater</a></li>
              <li><a href="/?category=Sport" className="text-sand/70 hover:text-seaglass transition-colors">Sport</a></li>
              <li><a href={`/?category=${encodeURIComponent('Mat & Dryck')}`} className="text-sand/70 hover:text-seaglass transition-colors">Mat & Dryck</a></li>
              <li><a href={`/?category=${encodeURIComponent('Barn & Familj')}`} className="text-sand/70 hover:text-seaglass transition-colors">Barn & Familj</a></li>
              <li><a href="/?category=Nattliv" className="text-sand/70 hover:text-seaglass transition-colors">Nattliv</a></li>
              <li><a href="/?category=Utställningar" className="text-sand/70 hover:text-seaglass transition-colors">Utställningar</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sand">Kontakt</h4>
            <ul className="space-y-2 text-sm text-sand/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sea-mist" />
                <span>info@ivarberg.nu</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sea-mist" />
                <span>Fästningsgatan 5, 432 44 Varberg</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sand">Följ oss</h4>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-sand hover:bg-sand/10 hover:text-seaglass transition-colors"
                asChild
              >
                <a href="https://instagram.com/ivarberg.nu" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
            </div>
            <div className="mt-4">
              <Button
                className="rounded-full bg-seaglass text-navy font-semibold hover:bg-seaglass/85"
                onClick={() => setIsDialogOpen(true)}
              >
                Nyhetsbrev
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 text-center text-sm border-t border-sand/15 text-sand/70">
          <p>&copy; {new Date().getFullYear()} ivarberg.nu - Alla rättigheter förbehållna</p>
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