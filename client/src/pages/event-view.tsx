import { useParams } from "wouter";
import { useState } from "react";
import Home from "./home";
import { EventProvider } from "@/contexts/EventContext";

export default function EventView() {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id);

  if (isNaN(eventId)) {
    return <div>Invalid event ID</div>;
  }

  return (
    <EventProvider eventId={eventId}>
      <Home />
    </EventProvider>
  );
}