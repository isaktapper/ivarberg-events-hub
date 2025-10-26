import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = 200; // Scroll distance för full transparens-effekt
      
      if (scrollTop > 50) {
        setScrolled(true);
        // Beräkna opacity baserat på scroll-position (0.7 som minimum för läsbarhet)
        const newOpacity = Math.max(0.7, 1 - (scrollTop - 50) / maxScroll);
        setOpacity(newOpacity);
      } else {
        setScrolled(false);
        setOpacity(1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur-md shadow-sm transition-all duration-300" 
      style={{ 
        backgroundColor: `rgba(255, 255, 255, ${opacity})`, 
        borderBottom: `1px solid rgba(8, 7, 92, ${opacity * 0.1})`,
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold hover:opacity-80 transition-opacity" style={{ color: '#08075C' }}>
              ivarberg.nu
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" reloadDocument>
                <Button
                  variant="ghost"
                  className="transition-colors"
                  style={{ color: '#08075C' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.backgroundColor = '#08075C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#08075C';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Alla evenemang
                </Button>
              </Link>
              <Link to="/om-oss">
                <Button
                  variant="ghost"
                  className="transition-colors"
                  style={{ color: '#08075C' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.backgroundColor = '#08075C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#08075C';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Om oss
                </Button>
              </Link>
              <Link to="/tips" target="_blank">
                <Button
                  variant="ghost"
                  className="transition-colors"
                  style={{ color: '#08075C' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.backgroundColor = '#08075C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#08075C';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Lägg till event
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}