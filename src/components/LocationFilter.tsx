import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePostHog } from "posthog-js/react";

const locations = [
  "Hela Varberg",
  "Centrum", 
  "Norra Varberg",
  "Östra Varberg",
  "Södra Varberg"
];

interface LocationFilterProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}

export function LocationFilter({ selectedLocation, onLocationChange }: LocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const posthog = usePostHog();

  const handleClick = () => {
    // Track click for analytics
    posthog?.capture('location_filter_clicked', {
      selected_location: selectedLocation,
    });
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
      <PopoverContent className="w-56 p-2 relative" align="start">
        {/* Blurred content */}
        <div className="space-y-1 blur-sm pointer-events-none">
          {locations.map((location) => (
            <button
              key={location}
              className={`
                w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                ${selectedLocation === location 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-gray-700'
                }
              `}
            >
              {location}
            </button>
          ))}
        </div>
        
        {/* Overlay with message */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-md">
          <div className="text-center px-4 py-2">
            <p className="text-sm font-medium text-gray-700">
              Områdesfilter kommer snart!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Vi jobbar på att lägga till denna funktion
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
