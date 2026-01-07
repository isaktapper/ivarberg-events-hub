import { Drama, Users, Image, PartyPopper, Trophy, UtensilsCrossed, GraduationCap, Film, TreePine, Compass, Store } from 'lucide-react';
import { EventCategory } from '@/types/event';
import { usePostHog } from "posthog-js/react";

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
  { id: 'Barn & Familj', label: 'Barn & familj', icon: Users },
  { id: 'Scen', label: 'Scen', icon: Drama },
  { id: 'Mat & Dryck', label: 'Mat & Dryck', icon: UtensilsCrossed },
  { id: 'Marknader', label: 'Marknader', icon: Store },
  { id: 'Nattliv', label: 'Nattliv', icon: PartyPopper },
  { id: 'Sport', label: 'Sport', icon: Trophy },
  { id: 'Film & bio', label: 'Film & bio', icon: Film },
  { id: 'Föreläsningar', label: 'Föreläsning', icon: GraduationCap },
  { id: 'Utställningar', label: 'Utställningar', icon: Image },
  { id: 'Djur & Natur', label: 'Djur & Natur', icon: TreePine },
  { id: 'Guidade visningar', label: 'Guidade visningar', icon: Compass },
];

export function CategoryScroller({ selectedCategories, onCategoryToggle }: CategoryScrollerProps) {
  const posthog = usePostHog();

  const handleCategoryClick = (category: EventCategory) => {
    const isCurrentlySelected = selectedCategories.includes(category);
    const action = isCurrentlySelected ? 'deselected' : 'selected';
    
    // Track the category click with specific category information
    posthog?.capture('category_clicked', {
      category: category,
      action: action,
      selected_categories_count: isCurrentlySelected 
        ? selectedCategories.length - 1 
        : selectedCategories.length + 1
    });
    
    onCategoryToggle(category);
  };

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
          // Öka bredden för "Föreläsning", "Utställningar" och "Marknader" så texten får plats
          const isForelasning = category.id === 'Föreläsningar';
          const isUtstallningar = category.id === 'Utställningar';
          const isMarknader = category.id === 'Marknader';

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="flex flex-col items-center gap-2 min-w-0 flex-shrink-0 touch-manipulation"
              style={{ minWidth: (isForelasning || isUtstallningar || isMarknader) ? '85px' : '70px' }}
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
                  maxWidth: (isForelasning || isUtstallningar || isMarknader) ? '80px' : '65px',
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
