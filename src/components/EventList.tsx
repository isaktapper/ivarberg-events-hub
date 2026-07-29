import { Fragment, ReactNode } from "react";
import { EventDisplay, EventCategory } from "@/types/event";
import { EventListItem } from "./EventListItem";

interface EventListProps {
  events: EventDisplay[];
  activeFilter?: EventCategory | null; // För smart kategori-visning
  promoSlot?: ReactNode; // Renderas efter kortet på promoSlotAfterIndex (eller sista kortet om listan är kortare)
  promoSlotAfterIndex?: number;
}

export function EventList({ events, activeFilter, promoSlot, promoSlotAfterIndex = 2 }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Inga evenemang hittades</p>
      </div>
    );
  }

  const slotIndex = Math.min(promoSlotAfterIndex, events.length - 1);

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <Fragment key={event.id}>
          <EventListItem event={event} activeFilter={activeFilter} />
          {promoSlot && index === slotIndex && promoSlot}
        </Fragment>
      ))}
    </div>
  );
}
