import { Calendar, Clock, Snowflake } from "lucide-react";
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

interface QuickFiltersProps {
  onFilterApply: (filter: QuickFilter) => void;
  onScrollToResults: () => void;
  onScrollToCategories: () => void;
}

export type { QuickFilter };

export function QuickFilters({ onFilterApply, onScrollToResults, onScrollToCategories }: QuickFiltersProps) {
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
    <>
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
                backgroundColor: 'rgba(215, 235, 255, 0.45)',
                color: '#08075C',
                borderColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(215, 235, 255, 0.45)';
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
    </>
  );
}

