import { Calendar, Clock, Snowflake, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCategory } from "@/types/event";

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'date' | 'category';
  value?: EventCategory;
  dateRange?: { start: Date; end: Date };
}

interface HeroProps {
  onFilterApply: (filter: QuickFilter) => void;
  onScrollToResults: () => void;
  onScrollToCategories: () => void;
}

export function Hero({ onFilterApply, onScrollToResults, onScrollToCategories }: HeroProps) {
  // Beräkna helgens datum (fredag, lördag, söndag)
  const getWeekendDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = söndag, 1 = måndag, ..., 6 = lördag
    
    let friday, sunday;
    
    if (currentDay >= 5 || currentDay === 0) {
      // Om det är fredag (5), lördag (6) eller söndag (0) - välj DENNA helg
      if (currentDay === 0) {
        // Om det är söndag, gå tillbaka till fredagen
        friday = new Date(today);
        friday.setDate(today.getDate() - 2); // Fredag var 2 dagar sedan
      } else if (currentDay === 6) {
        // Om det är lördag, gå tillbaka till fredagen
        friday = new Date(today);
        friday.setDate(today.getDate() - 1); // Fredag var 1 dag sedan
      } else {
        // Om det är fredag, använd idag
        friday = new Date(today);
      }
      
      // Söndag är alltid 2 dagar efter fredag
      sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
    } else {
      // Om det är måndag-torsdag (1-4) - välj NÄSTA helg
      const daysUntilFriday = 5 - currentDay;
      friday = new Date(today);
      friday.setDate(today.getDate() + daysUntilFriday);
      
      // Söndag är 2 dagar efter fredag
      sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
    }
    
    return { start: friday, end: sunday };
  };

  // Beräkna dagens datum (idag)
  const getTodayDates = () => {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return { start: todayStart, end: todayEnd };
  };

  // Beräkna denna veckas datum (måndag till söndag)
  const getThisWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = söndag, 1 = måndag, ..., 6 = lördag

    // Beräkna måndag denna vecka
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    // Söndag denna vecka
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  };

  const quickFilters: QuickFilter[] = [
    {
      id: 'today',
      label: 'Idag',
      icon: Clock,
      type: 'date',
      dateRange: getTodayDates()
    },
    {
      id: 'weekend',
      label: 'I helgen',
      icon: Calendar,
      type: 'date',
      dateRange: getWeekendDates()
    },
    {
      id: 'this-week',
      label: 'Denna vecka',
      icon: Calendar,
      type: 'date',
      dateRange: getThisWeekDates()
    },
    {
      id: 'christmas',
      label: 'Till jul',
      icon: Snowflake,
      type: 'category',
      value: 'Jul'
    }
  ];

  const handleFilterClick = (filter: QuickFilter) => {
    onFilterApply(filter);
    // Vänta lite så att filtret hinner appliceras, sedan scrolla
    setTimeout(() => {
      onScrollToResults();
    }, 100);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background image with fade-out gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero_jul.png')",
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
          
          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xs sm:max-w-2xl mx-auto px-4 sm:px-0">
            {quickFilters.map((filter) => {
              const IconComponent = filter.icon;
              
              return (
                <Button
                  key={filter.id}
                  onClick={() => handleFilterClick(filter)}
                  variant="outline"
                  size="lg"
                  className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 h-auto transition-all duration-200 shadow-lg hover:shadow-xl border w-full text-sm sm:text-base backdrop-blur-md"
                  style={{
                    backgroundColor: 'rgba(215, 235, 255, 0.45)', // Mer blåtonad glas-effekt
                    color: '#08075C',
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.9)'; // Starkare blå vid hover
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.transform = 'scale(1.02)'; // Liten förstoring
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(215, 235, 255, 0.45)'; // Tillbaka till blåtonad glas
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.color = '#08075C';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="font-medium truncate">{filter.label}</span>
                </Button>
              );
            })}
          </div>
          
          {/* Mer + knapp */}
          <div className="mt-6">
            <button
              onClick={onScrollToCategories}
              className="text-sm font-medium transition-colors"
              style={{
                color: '#08075C',
                opacity: 0.8
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              Mer +
            </button>
          </div>
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