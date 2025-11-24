import { MessageCircle } from "lucide-react";
import { FeaturedEvents } from "@/components/FeaturedEvents";

interface HeroProps {
  onScrollToCategories: () => void;
}

export function Hero({ onScrollToCategories }: HeroProps) {

  return (
    <section className="relative overflow-hidden">
      {/* Background image with fade-out gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero_new.jpeg')",
        }}
      >
        {/* Solid overlay that fades to background color - Mörkare i toppen för läsbarhet */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[hsl(32,44%,96%)]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-32">
        <div className="text-center mb-8">
          {/* Tipsa oss badge */}
          <div className="mb-8 animate-fade-in inline-block">
            <a
              href="/tips"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 group backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(18 85% 65%)';
                e.currentTarget.style.color = 'hsl(18 85% 65%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.color = '#ffffff';
              }}
            >
              Tipsa oss om evenemang
              <MessageCircle className="h-3.5 w-3.5 ml-1 opacity-80 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
          
          {/* Rubrik med drop-shadow */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Vad händer i Varberg?
          </h1>

          {/* Ny underrubrik för bättre balans */}
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-12 font-medium drop-shadow-md leading-relaxed">
          Hitta evenemang som får hjärtat att slå lite snabbare.
          </p>
        </div>

        {/* Featured Events Section */}
        <div className="max-w-5xl mx-auto">
          <FeaturedEvents />
        </div>
        
        {/* Mer + knapp */}
        <div className="mt-8 text-center">
          <button
            onClick={onScrollToCategories}
            className="text-sm font-medium transition-colors"
            style={{
              color: '#FFFFFF',
              opacity: 0.8
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            Mer +
          </button>
        </div>
      </div>
      
      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-1 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto block" style={{ minHeight: '80px' }}>
          <path fill="hsl(32 44% 96%)" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
}