import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="mt-16" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #08075C', borderOpacity: 0.1 }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
              <li><a href="#" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Alla evenemang</a></li>
              <li><a href="/tips" target="_blank" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Tipsa oss om ett evenemang</a></li>
              <li><a href="/om-oss" className="transition-colors" style={{ color: '#08075C', opacity: 0.7 }} onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'} onMouseLeave={(e) => { e.currentTarget.style.color = '#08075C'; e.currentTarget.style.opacity = '0.7'; }}>Om oss</a></li>
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
                <span>Varberg, Sverige</span>
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
        
        <div className="mt-8 pt-8 text-center text-sm" style={{ borderTop: '1px solid #08075C', borderOpacity: 0.1, color: '#08075C', opacity: 0.7 }}>
          <p>&copy; 2024 ivarberg.nu - Alla rättigheter förbehållna</p>
        </div>
      </div>
    </footer>
  );
}