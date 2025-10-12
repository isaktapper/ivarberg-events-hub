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
          backgroundImage: "url('/varberg_hero.jpg')",
        }}
      >
        {/* Solid overlay that fades to background color */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 from-10% via-transparent via-40%" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 10%, transparent 40%, #F5F3F0 90%)'}}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          {/* Tipsa oss knapp */}
          <div className="mb-6">
            <a
              href="/tips"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 backdrop-blur-md shadow-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: '#08075C',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(12px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Tipsa oss
            </a>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-8" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            <span className="text-white drop-shadow-lg">Vad händer i Varberg?</span>
          </h2>
          
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
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#08075C',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(12px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.5)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.color = '#08075C';
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
    </section>
  );
}