import React, { createContext, useContext, useState, useEffect } from "react";

interface EventContextProps {
  eventId: number;
  isAdmin: boolean;
  toggleAdmin: () => void;
}

const EventContext = createContext<EventContextProps | undefined>(undefined);

interface EventProviderProps {
  children: React.ReactNode;
  eventId?: number;
}

export function EventProvider({ children, eventId: providedEventId }: EventProviderProps) {
  const [eventId, setEventId] = useState<number>(providedEventId || 1); // Use provided ID or default to 1
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Effect to restore admin state from localStorage if exists
  useEffect(() => {
    const savedAdminState = localStorage.getItem("rsvp-isAdmin");
    if (savedAdminState) {
      setIsAdmin(savedAdminState === "true");
    }
  }, []);
  
  // Update eventId if the provided ID changes
  useEffect(() => {
    if (providedEventId) {
      setEventId(providedEventId);
    }
  }, [providedEventId]);
  
  const toggleAdmin = () => {
    const newState = !isAdmin;
    setIsAdmin(newState);
    localStorage.setItem("rsvp-isAdmin", newState.toString());
  };
  
  return (
    <EventContext.Provider value={{ eventId, isAdmin, toggleAdmin }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  const context = useContext(EventContext);
  
  if (context === undefined) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  
  return context;
}
