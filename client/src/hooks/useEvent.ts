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

  const { mutateAsync: updateEventMutation, isPending: isUpdating } =
    useMutation({
      mutationFn: async (data: UpdateEventParams) => {
        const eventData: InsertEvent = {
          title: data.title,
          description: data.description,
          image: data.image,
          locationText: data.locationText,
          locationNotes: data.locationNotes || "",
        };

        await apiRequest("PUT", `/api/events/${eventId}`, eventData);
        await queryClient.invalidateQueries({
          queryKey: [`/api/events/${eventId}`],
        });
      },
    });

  const { mutateAsync: setFinalDateMutation } = useMutation({
    mutationFn: async (dateOptionId: number) => {
      await apiRequest("POST", `/api/events/${eventId}/final-date`, {
        dateOptionId,
      });
      await queryClient.invalidateQueries({
        queryKey: [`/api/events/${eventId}`],
      });
    },
  });

  const updateEvent = async (data: UpdateEventParams) => {
    console.log("🔁 updateEvent() called with:", data);

    try {
      await updateEventMutation(data);
      console.log("✅ Local API update successful.");
    } catch (err) {
      console.error("❌ Local API update failed:", err);
      throw err;
    }

    const webhookUrl =
      "https://script.google.com/macros/s/AKfycbzQfGc98HWv1Ac3YkcfkPxSKuYAYORhFlOedTLy-g51BNInbMTQH_Kmv6LdLsyFi-6kRg/exec";

    const formattedData = {
      Title: data.title,
      Description: data.description,
      Image: data.image,
      Location: data.locationText,
      LocationNotes: data.locationNotes || "",
      Timestamp: new Date().toISOString(),
    };

    console.log("📤 Sending data to Google Sheets:", formattedData);

    try {
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      console.log("✅ Event data also sent to Google Sheet.");
    } catch (error) {
      console.error("❌ Failed to send event data to Google Sheet:", error);
    }
  };

  const setFinalDate = async (dateOptionId: number) => {
    await setFinalDateMutation(dateOptionId);
  };

  return { event, isLoading, updateEvent, setFinalDate, isUpdating };
}
