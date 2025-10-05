import { EventDisplay } from "@/types/event";
import { EventListItem } from "./EventListItem";

interface EventListProps {
  events: EventDisplay[];
}

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Inga evenemang hittades</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventListItem key={event.id} event={event} />
      ))}
    </div>
  );
}