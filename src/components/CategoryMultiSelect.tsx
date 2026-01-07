import { useState, useEffect, useRef } from "react";
import { EventCategory } from "@/types/event";
import { Check, X, ChevronDown } from "lucide-react";
import { usePostHog } from "posthog-js/react";

interface CategoryMultiSelectProps {
  selectedCategories: EventCategory[];
  onCategoriesChange: (categories: EventCategory[]) => void;
  required?: boolean;
}

const categoryOptions: { id: EventCategory; label: string }[] = [
  { id: 'Barn & Familj', label: 'Barn & Familj' },
  { id: 'Scen', label: 'Scen' },
  { id: 'Mat & Dryck', label: 'Mat & Dryck' },
  { id: 'Marknader', label: 'Marknader' },
  { id: 'Nattliv', label: 'Nattliv' },
  { id: 'Sport', label: 'Sport' },
  { id: 'Film & bio', label: 'Film & bio' },
  { id: 'Föreläsningar', label: 'Föreläsningar' },
  { id: 'Utställningar', label: 'Utställningar' },
  { id: 'Djur & Natur', label: 'Djur & Natur' },
  { id: 'Guidade visningar', label: 'Guidade visningar' },
];

export function CategoryMultiSelect({ selectedCategories, onCategoriesChange, required }: CategoryMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const posthog = usePostHog();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategoryToggle = (category: EventCategory) => {
    if (selectedCategories.includes(category)) {
      // Remove category
      posthog?.capture('category_multiselect_clicked', {
        category: category,
        action: 'deselected',
        selected_categories_count: selectedCategories.length - 1,
        context: 'form'
      });
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      // Add category (max 3)
      if (selectedCategories.length < 3) {
        posthog?.capture('category_multiselect_clicked', {
          category: category,
          action: 'selected',
          selected_categories_count: selectedCategories.length + 1,
          context: 'form'
        });
        onCategoriesChange([...selectedCategories, category]);
      }
    }
  };

  const removeCategory = (category: EventCategory) => {
    posthog?.capture('category_multiselect_clicked', {
      category: category,
      action: 'deselected',
      selected_categories_count: selectedCategories.length - 1,
      context: 'form',
      removed_via: 'x_button'
    });
    onCategoriesChange(selectedCategories.filter(c => c !== category));
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="relative">
        {/* Main clickable area */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[40px] text-left"
        >
          {selectedCategories.length === 0 ? (
            <span className="text-muted-foreground text-sm">
              Välj kategori/er (max 3)
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {category}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCategory(category);
                    }}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </button>

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: '#08075C' }}
          />
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-input rounded-md shadow-md max-h-60 overflow-y-auto">
            {categoryOptions.map((option) => {
              const isSelected = selectedCategories.includes(option.id);
              const isDisabled = !isSelected && selectedCategories.length >= 3;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    handleCategoryToggle(option.id);
                  }}
                  disabled={isDisabled}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <span className="text-sm" style={{ color: '#08075C' }}>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
