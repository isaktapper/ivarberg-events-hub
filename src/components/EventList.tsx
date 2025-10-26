import { EventDisplay, EventCategory } from "@/types/event";
import { EventListItem } from "./EventListItem";

interface EventListProps {
  events: EventDisplay[];
  activeFilter?: EventCategory | null; // För smart kategori-visning
}

export function EventList({ events, activeFilter }: EventListProps) {
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
        <EventListItem key={event.id} event={event} activeFilter={activeFilter} />
      ))}
    </div>
  );
}