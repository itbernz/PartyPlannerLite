import { useEffect, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useEventContext } from "@/contexts/EventContext";

export function useSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { eventId } = useEventContext();
  
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle different types of updates
      switch (data.type) {
        case "event_updated":
          queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
          break;
        case "date_option_created":
        case "date_option_deleted":
          queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/date-options`] });
          break;
        case "rsvp_created":
          queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/rsvps`] });
          queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/date-options-votes`] });
          break;
        case "activity_created":
        case "activity_deleted":
          queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/activities`] });
          break;
        case "reaction_added":
        case "reaction_removed":
          queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/activities`] });
          break;
        default:
          break;
      }
    };
    
    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    setSocket(newSocket);
    
    // Clean up the WebSocket connection on unmount
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [eventId]);
  
  return socket;
}
