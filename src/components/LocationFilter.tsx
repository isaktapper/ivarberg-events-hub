import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center justify-between gap-2 h-10 px-4 bg-white border-border hover:bg-gray-50 w-40 sm:w-44 data-[state=open]:bg-white data-[state=open]:text-foreground"
        >
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm truncate flex-1 text-center">{selectedLocation}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {locations.map((location) => (
            <button
              key={location}
              onClick={() => {
                onLocationChange(location);
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                hover:bg-gray-100 
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
      </PopoverContent>
    </Popover>
  );
}
