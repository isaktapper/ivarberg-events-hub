import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePostHog } from "posthog-js/react";
import { EVENT_AREAS } from "@/types/event";

const locations = ["Hela Varberg", ...EVENT_AREAS];

interface LocationFilterProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  // Antal events per område (beräknat med övriga filter applicerade)
  areaCounts?: Record<string, number>;
}

export function LocationFilter({ selectedLocation, onLocationChange, areaCounts }: LocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const posthog = usePostHog();

  const handleClick = () => {
    // Track click for analytics
    posthog?.capture('location_filter_clicked', {
      selected_location: selectedLocation,
    });
  };

  const handleSelect = (location: string) => {
    posthog?.capture('location_filter_selected', {
      selected_location: location,
    });
    onLocationChange(location);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="filter"
          onClick={handleClick}
          className="flex items-center justify-between gap-2 h-10 px-4 font-normal w-40 sm:w-44 transition-all duration-200 backdrop-blur-md shadow-lg"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            color: '#08075C',
            backdropFilter: 'blur(12px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.7)';
            e.currentTarget.style.borderColor = 'rgba(74, 144, 226, 0.8)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            e.currentTarget.style.color = '#08075C';
          }}
        >
          <MapPin className="h-4 w-4" />
          <span className="text-sm truncate flex-1 text-center">{selectedLocation}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {locations.map((location) => {
            const count = location === "Hela Varberg" ? undefined : areaCounts?.[location];
            const isSelected = selectedLocation === location;
            const isEmpty = count === 0 && !isSelected;

            return (
              <button
                key={location}
                onClick={() => handleSelect(location)}
                disabled={isEmpty}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                  ${isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isEmpty
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="truncate">{location}</span>
                {count !== undefined && (
                  <span className={`ml-2 text-xs tabular-nums ${isSelected ? 'text-primary-foreground/80' : 'text-gray-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
