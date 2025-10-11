import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function DateTimePicker({ value, onChange, required }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse existing value or create defaults
  const parseValue = () => {
    if (!value) return { date: undefined, time: "19:00" };

    // If value is datetime-local format (YYYY-MM-DDTHH:MM)
    if (value.includes('T')) {
      const [dateStr, timeStr] = value.split('T');
      return {
        date: new Date(dateStr),
        time: timeStr || "19:00"
      };
    }

    return { date: undefined, time: "19:00" };
  };

  const { date: selectedDate, time: selectedTime } = parseValue();
  const [tempDate, setTempDate] = useState<Date | undefined>(selectedDate);
  const [tempTime, setTempTime] = useState(selectedTime);

  const handleDateSelect = (date: Date | undefined) => {
    setTempDate(date);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempTime(e.target.value);
  };

  const handleApply = () => {
    if (tempDate && tempTime) {
      // Format as datetime-local string (YYYY-MM-DDTHH:MM)
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const dateTimeValue = `${year}-${month}-${day}T${tempTime}`;
      onChange(dateTimeValue);
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (selectedDate && selectedTime) {
      return `${format(selectedDate, "d MMM yyyy", { locale: sv })} kl ${selectedTime}`;
    }
    return "Välj datum och tid";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal h-10 px-3 py-2 border border-input bg-background hover:bg-background hover:text-foreground"
        >
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className={selectedDate ? "" : "text-muted-foreground"}>
            {getDisplayText()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <div className="p-4">
          <div className="flex gap-4">
            {/* Calendar */}
            <div className="flex-shrink-0">
              <label className="text-sm font-medium mb-2 block">Välj datum</label>
              <CalendarComponent
                mode="single"
                selected={tempDate}
                onSelect={handleDateSelect}
                className="rounded-md border pointer-events-auto"
                locale={sv}
                fixedWeeks={false}
              />
            </div>

            {/* Time picker and buttons */}
            <div className="flex flex-col justify-between py-1">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Välj tid
                </label>
                <Input
                  type="time"
                  value={tempTime}
                  onChange={handleTimeChange}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="button"
                  onClick={handleApply}
                  disabled={!tempDate || !tempTime}
                  className="w-full"
                  style={{
                    backgroundColor: tempDate && tempTime ? '#4A90E2' : undefined,
                    color: tempDate && tempTime ? '#FFFFFF' : undefined,
                  }}
                >
                  Klar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="w-full"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
