import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EventWithDetails, InsertEvent, DateOption } from "@shared/schema";
import { useEventContext } from "@/contexts/EventContext";

interface UseEventResult {
  event: EventWithDetails | undefined;
  isLoading: boolean;
  updateEvent: (data: UpdateEventParams) => Promise<void>;
  setFinalDate: (dateOptionId: number) => Promise<void>;
  isUpdating: boolean;
}

interface UpdateEventParams {
  title: string;
  description: string;
  image: string;
  locationText: string;
  locationNotes?: string;
  dateOptions: Partial<DateOption>[];
}

export function useEvent(): UseEventResult {
  const { eventId } = useEventContext();
  
  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });
  
  const { mutateAsync: updateEventMutation, isPending: isUpdating } = useMutation({
    mutationFn: async (data: UpdateEventParams) => {
      // First update the event details
      const eventData: InsertEvent = {
        title: data.title,
        description: data.description,
        image: data.image,
        locationText: data.locationText,
        locationNotes: data.locationNotes || '',
      };
      
      await apiRequest('PUT', `/api/events/${eventId}`, eventData);
      
      // Handle date options updates (this is simplified for the example)
      // In a real app, you'd need to create new options, update existing ones, and delete removed ones
      
      // For this example, just refresh the data
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
    },
  });
  
  const updateEvent = async (data: UpdateEventParams) => {
    await updateEventMutation(data);
  };
  
  return { event, isLoading, updateEvent, isUpdating };
}
