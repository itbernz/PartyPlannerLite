import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RsvpWithDateSelections, DateOptionWithVotes } from "@shared/schema";
import { useEventContext } from "@/contexts/EventContext";

interface UseRsvpResult {
  rsvps: RsvpWithDateSelections[];
  isLoading: boolean;
  submitRsvp: (data: SubmitRsvpParams) => Promise<void>;
  isSubmitting: boolean;
  dateOptionsWithVotes: DateOptionWithVotes[];
}

interface SubmitRsvpParams {
  name: string;
  message?: string;
  dateOptionIds: number[];
}

export function useRsvp(): UseRsvpResult {
  const { eventId } = useEventContext();
  
  const { data: rsvps = [], isLoading: isRsvpsLoading } = useQuery<RsvpWithDateSelections[]>({
    queryKey: [`/api/events/${eventId}/rsvps`],
    enabled: !!eventId,
  });
  
  const { data: dateOptionsWithVotes = [], isLoading: isVotesLoading } = useQuery<DateOptionWithVotes[]>({
    queryKey: [`/api/events/${eventId}/date-options-votes`],
    enabled: !!eventId,
  });
  
  const { mutateAsync: submitRsvpMutation, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: SubmitRsvpParams) => {
      await apiRequest('POST', `/api/events/${eventId}/rsvps`, {
        name: data.name,
        message: data.message,
        dateOptionIds: data.dateOptionIds,
      });
      
      // Refresh RSVPs and vote counts
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/rsvps`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/date-options-votes`] });
    },
  });
  
  const submitRsvp = async (data: SubmitRsvpParams) => {
    await submitRsvpMutation(data);
  };
  
  return { 
    rsvps, 
    isLoading: isRsvpsLoading || isVotesLoading, 
    submitRsvp, 
    isSubmitting,
    dateOptionsWithVotes,
  };
}
