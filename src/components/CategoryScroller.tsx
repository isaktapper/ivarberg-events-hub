import { Drama, Users, Palette, PartyPopper, Trophy, UtensilsCrossed, GraduationCap, Snowflake, Film, TreePine, Compass } from 'lucide-react';
import { EventCategory } from '@/types/event';

interface CategoryItem {
  id: EventCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryScrollerProps {
  selectedCategories: EventCategory[];
  onCategoryToggle: (category: EventCategory) => void;
}

const categories: CategoryItem[] = [
  { id: 'Scen', label: 'Scen', icon: Drama },
  { id: 'Nattliv', label: 'Nattliv', icon: PartyPopper },
  { id: 'Jul', label: 'Jul', icon: Snowflake },
  { id: 'Sport', label: 'Sport', icon: Trophy },
  { id: 'Utställningar', label: 'Utställningar', icon: Palette },
  { id: 'Föreläsningar', label: 'Föreläsning', icon: GraduationCap },
  { id: 'Barn & Familj', label: 'Barn & familj', icon: Users },
  { id: 'Mat & Dryck', label: 'Mat & Dryck', icon: UtensilsCrossed },
  { id: 'Film & bio', label: 'Film & bio', icon: Film },
  { id: 'Djur & Natur', label: 'Djur & Natur', icon: TreePine },
  { id: 'Guidade visningar', label: 'Guidade visningar', icon: Compass },
];

export function CategoryScroller({ selectedCategories, onCategoryToggle }: CategoryScrollerProps) {
  return (
    <div className="w-full py-4">
      <div 
        className="flex gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible scroll-smooth pb-2 scrollbar-hide px-4 sm:px-0 sm:justify-center"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const IconComponent = category.icon;
          // Öka bredden för "Föreläsning" så texten får plats
          const isForelasning = category.id === 'Föreläsningar';

          return (
            <button
              key={category.id}
              onClick={() => onCategoryToggle(category.id)}
              className="flex flex-col items-center gap-2 min-w-0 flex-shrink-0 touch-manipulation"
              style={{ minWidth: isForelasning ? '85px' : '70px' }}
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-95 backdrop-blur-md shadow-lg"
                style={{
                  backgroundColor: isSelected ? 'rgba(74, 144, 226, 0.25)' : 'rgba(255, 255, 255, 0.25)',
                  borderColor: isSelected ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  color: '#08075C',
                  backdropFilter: 'blur(12px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.5)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? 'rgba(74, 144, 226, 0.25)' : 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.borderColor = isSelected ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.color = '#08075C';
                }}
              >
                <IconComponent
                  className="w-6 h-6 sm:w-7 sm:h-7"
                />
              </div>
              <span
                className="text-xs font-medium text-center leading-tight"
                style={{
                  fontFamily: 'Poppins, system-ui, sans-serif',
                  maxWidth: isForelasning ? '80px' : '65px',
                  wordWrap: 'break-word',
                  hyphens: 'auto',
                  color: isSelected ? '#4A90E2' : '#08075C'
                }}
              >
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Scroll hint text - bara på mobil */}
      <div className="text-center mt-2 sm:hidden">
        <span className="text-xs" style={{ color: '#08075C', opacity: 0.6 }}>
          Skrolla →
        </span>
      </div>
    </div>
  );
}
