import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ActivityWithReplies } from "@shared/schema";
import { useEventContext } from "@/contexts/EventContext";

interface UseActivitiesResult {
  activities: ActivityWithReplies[];
  isLoading: boolean;
  addActivity: (name: string, message: string) => Promise<void>;
  addReply: (parentId: number, name: string, message: string) => Promise<void>;
  addReaction: (activityId: number, name: string, emoji: string) => Promise<void>;
  deleteActivity: (activityId: number) => Promise<void>;
}

export function useActivities(): UseActivitiesResult {
  const { eventId } = useEventContext();
  
  const { data: activities = [], isLoading } = useQuery<ActivityWithReplies[]>({
    queryKey: [`/api/events/${eventId}/activities`],
    enabled: !!eventId,
  });
  
  const { mutateAsync: addActivityMutation } = useMutation({
    mutationFn: async ({ name, message }: { name: string; message: string }) => {
      await apiRequest('POST', `/api/events/${eventId}/activities`, {
        name,
        message,
      });
      
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/activities`] });
    },
  });
  
  const { mutateAsync: addReplyMutation } = useMutation({
    mutationFn: async ({ parentId, name, message }: { parentId: number; name: string; message: string }) => {
      await apiRequest('POST', `/api/events/${eventId}/activities`, {
        name,
        message,
        parentId,
      });
      
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/activities`] });
    },
  });
  
  const { mutateAsync: addReactionMutation } = useMutation({
    mutationFn: async ({ activityId, name, emoji }: { activityId: number; name: string; emoji: string }) => {
      await apiRequest('POST', `/api/activities/${activityId}/reactions`, {
        name,
        emoji,
      });
      
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/activities`] });
    },
  });
  
  const { mutateAsync: deleteActivityMutation } = useMutation({
    mutationFn: async (activityId: number) => {
      await apiRequest('DELETE', `/api/activities/${activityId}`, undefined);
      
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/activities`] });
    },
  });
  
  const addActivity = async (name: string, message: string) => {
    await addActivityMutation({ name, message });
  };
  
  const addReply = async (parentId: number, name: string, message: string) => {
    await addReplyMutation({ parentId, name, message });
  };
  
  const addReaction = async (activityId: number, name: string, emoji: string) => {
    await addReactionMutation({ activityId, name, emoji });
  };
  
  const deleteActivity = async (activityId: number) => {
    await deleteActivityMutation(activityId);
  };
  
  return { 
    activities, 
    isLoading, 
    addActivity, 
    addReply, 
    addReaction,
    deleteActivity,
  };
}
