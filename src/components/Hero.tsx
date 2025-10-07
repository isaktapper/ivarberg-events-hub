import { Calendar, Clock, Users, Snowflake, MessageCircle } from "lucide-react";
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

  // Beräkna nästa veckas datum (måndag till söndag)
  const getNextWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = söndag, 1 = måndag, ..., 6 = lördag
    
    // Beräkna måndag nästa vecka
    const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    
    // Söndag nästa vecka är 6 dagar efter måndag
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    
    return { start: nextMonday, end: nextSunday };
  };

  const quickFilters: QuickFilter[] = [
    {
      id: 'weekend',
      label: 'I helgen',
      icon: Calendar,
      type: 'date',
      dateRange: getWeekendDates()
    },
    {
      id: 'next-week',
      label: 'Nästa vecka',
      icon: Clock,
      type: 'date',
      dateRange: getNextWeekDates()
    },
    {
      id: 'family',
      label: 'För familjen',
      icon: Users,
      type: 'category',
      value: 'Barn & Familj'
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
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#08075C',
                border: '1px solid rgba(8, 7, 92, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4A90E2';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.color = '#08075C';
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Tipsa oss
            </a>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
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
                  className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 h-auto transition-all duration-200 shadow-sm hover:shadow-md border w-full text-sm sm:text-base"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#08075C',
                    borderColor: '#08075C'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4A90E2';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#4A90E2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = '#08075C';
                    e.currentTarget.style.borderColor = '#08075C';
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