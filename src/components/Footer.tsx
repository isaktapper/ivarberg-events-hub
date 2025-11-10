import { useState } from "react";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
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
    <footer className="mt-16" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid rgba(8, 7, 92, 0.1)' }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#08075C' }}>
              ivarberg.nu
            </h3>
            <p className="text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
              Din kompletta guide till Varbergs puls. Missa aldrig ett evenemang igen!
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#08075C' }}>Snabblänkar</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Alla evenemang</a></li>
              <li><a href="/evenemang-varberg" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Evenemang Varberg</a></li>
              <li><a href="/att-gora-i-varberg" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Att göra i Varberg</a></li>
              <li><a href="/varberg-kalender" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Varberg Kalender</a></li>
              <li><a href="/tips" target="_blank" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Tipsa oss</a></li>
              <li><a href="/om-oss" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Om oss</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#08075C' }}>Kategorier</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/?category=Scen" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Scen & Teater</a></li>
              <li><a href="/?category=Sport" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Sport</a></li>
              <li><a href="/?category=Mat & Dryck" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Mat & Dryck</a></li>
              <li><a href="/?category=Barn & Familj" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Barn & Familj</a></li>
              <li><a href="/?category=Nattliv" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Nattliv</a></li>
              <li><a href="/?category=Utställningar" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Utställningar</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#08075C' }}>Kontakt</h4>
            <ul className="space-y-2 text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: '#4A90E2' }} />
                <span>info@ivarberg.nu</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" style={{ color: '#4A90E2' }} />
                <span>0340-123 45</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: '#4A90E2' }} />
                <span>Fästningsgatan 5, 432 44 Varberg</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4" style={{ color: '#08075C' }}>Följ oss</h4>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full transition-colors"
                style={{ color: '#08075C' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4A90E2'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#08075C'; }}
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full transition-colors"
                style={{ color: '#08075C' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4A90E2'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#08075C'; }}
              >
                <Instagram className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full transition-colors"
                style={{ color: '#08075C' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4A90E2'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#08075C'; }}
              >
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-4">
              <Button 
                className="rounded-full"
                onClick={() => setIsDialogOpen(true)}
                style={{
                  backgroundColor: '#4A90E2',
                  color: '#FFFFFF',
                  border: 'none'
                }}
              >
                Nyhetsbrev
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 text-center text-sm" style={{ borderTop: '1px solid rgba(8, 7, 92, 0.1)', color: '#08075C', opacity: 0.7 }}>
          <p>&copy; 2024 ivarberg.nu - Alla rättigheter förbehållna</p>
        </div>
      </div>

      {/* Newsletter Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#08075C' }}>Prenumerera på nyhetsbrev</DialogTitle>
            <DialogDescription style={{ color: '#08075C', opacity: 0.7 }}>
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
                <Label htmlFor="newsletter-name" style={{ color: '#08075C' }}>
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
                <Label htmlFor="newsletter-email" style={{ color: '#08075C' }}>
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
                  backgroundColor: '#4A90E2',
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