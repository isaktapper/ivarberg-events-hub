import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks } from "date-fns";
import { sv } from "date-fns/locale";

interface DateFilterProps {
  selectedDate: Date | undefined;
  dateRange: { start: Date; end: Date } | undefined;
  onDateChange: (date: Date | undefined) => void;
  onDateRangeChange: (range: { start: Date; end: Date } | undefined) => void;
}

export function DateFilter({ selectedDate, dateRange, onDateChange, onDateRangeChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    onDateChange(date);
    onDateRangeChange(undefined); // Clear range when selecting single date
    setIsOpen(false);
  };

  const clearDate = () => {
    onDateChange(undefined);
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  const getDateText = () => {
    if (dateRange) {
      return `${format(dateRange.start, "d MMM", { locale: sv })} - ${format(dateRange.end, "d MMM", { locale: sv })}`;
    }
    if (selectedDate) {
      return format(selectedDate, "d MMM", { locale: sv });
    }
    return "Välj datum";
  };

  const quickFilters = [
    {
      label: "Idag",
      type: "single" as const,
      date: new Date()
    },
    {
      label: "Denna veckan",
      type: "range" as const,
      range: {
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
      }
    },
    {
      label: "Nästa vecka", 
      type: "range" as const,
      range: {
        start: startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }),
        end: endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 })
      }
    },
    {
      label: "Denna månaden",
      type: "range" as const,
      range: {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      }
    }
  ];

  const handleQuickFilter = (filter: typeof quickFilters[0]) => {
    if (filter.type === "single") {
      onDateChange(filter.date);
      onDateRangeChange(undefined);
    } else {
      onDateChange(undefined);
      onDateRangeChange(filter.range);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="filter"
          className="justify-start text-left font-normal w-40 sm:w-44 transition-all duration-200 backdrop-blur-md shadow-lg"
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
          <Calendar className="mr-2 h-4 w-4" />
          {getDateText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        sideOffset={4}
      >
        <div className="p-4">
          <div className="space-y-4">
            {/* Quick filters */}
            <div>
              <label className="text-sm font-medium mb-2 block">Snabbval</label>
              <div className="grid grid-cols-2 gap-2">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(filter)}
                    className="text-xs"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Calendar */}
            <div>
              <label className="text-sm font-medium mb-2 block">Välj datum</label>
              <div className="w-full max-w-sm mx-auto">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border pointer-events-auto w-full"
                  locale={sv}
                  fixedWeeks={false}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearDate}
                className="flex-1"
              >
                Rensa
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Klar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}