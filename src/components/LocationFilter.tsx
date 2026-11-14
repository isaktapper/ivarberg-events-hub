"use client";

import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePostHog } from "posthog-js/react";
import { useSite } from "@/config/SiteProvider";

/**
 * Värdet för "inget områdesfilter". Internt och stabilt (state, statistik):
 * det är samma för alla städer. Det som visas är `Hela ${site.cityName}`.
 */
export const ALL_LOCATIONS = "Hela Varberg";

// "glass" = ursprungliga triggern (frostat glas). "plain" = nya startsidans
// ljusgrå knapp i "Alla evenemang".
type FilterVariant = "glass" | "plain";
const PLAIN_TRIGGER = "h-11 w-full justify-between gap-2 rounded-xl border-0 bg-[#F4F5F7] px-3.5 text-sm font-semibold text-ink shadow-none hover:bg-[#E9ECF0] hover:text-ink";
const GLASS_TRIGGER = {
  style: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    color: 'hsl(var(--ink))',
    backdropFilter: 'blur(12px)',
  },
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(15, 90, 166, 0.7)';
    e.currentTarget.style.borderColor = 'rgba(15, 90, 166, 0.8)';
    e.currentTarget.style.color = '#FFFFFF';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    e.currentTarget.style.color = 'hsl(var(--ink))';
  },
};

interface LocationFilterProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  // Antal events per område (beräknat med övriga filter applicerade)
  areaCounts?: Record<string, number>;
  variant?: FilterVariant;
}

export function LocationFilter({ selectedLocation, onLocationChange, areaCounts, variant = "glass" }: LocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const posthog = usePostHog();
  const site = useSite();
  const locations = [ALL_LOCATIONS, ...site.areas];
  const labelFor = (location: string) => (location === ALL_LOCATIONS ? `Hela ${site.cityName}` : location);

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
          className={variant === "plain" ? PLAIN_TRIGGER : "flex items-center justify-between gap-2 h-10 px-4 font-normal w-40 sm:w-44 transition-all duration-200 backdrop-blur-md shadow-lg"}
          {...(variant === "plain" ? {} : GLASS_TRIGGER)}
        >
          <MapPin className="h-4 w-4" />
          <span className={variant === "plain" ? "text-sm truncate flex-1 text-left" : "text-sm truncate flex-1 text-center"}>{labelFor(selectedLocation)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {locations.map((location) => {
            const count = location === ALL_LOCATIONS ? undefined : areaCounts?.[location];
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
                <span className="truncate">{labelFor(location)}</span>
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
