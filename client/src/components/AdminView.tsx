import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DateOption, DateOptionWithVotes, RsvpWithDateSelections } from "@shared/schema";
import { format } from "date-fns";
import { useEvent } from "@/hooks/useEvent";
import { useRsvp } from "@/hooks/useRsvp";
import { useActivities } from "@/hooks/useActivities";

type AdminTabType = "event" | "rsvps" | "moderate";

const eventFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  image: z.string().url({
    message: "Please enter a valid URL.",
  }),
  locationText: z.string().min(5, {
    message: "Location must be at least 5 characters.",
  }),
  locationNotes: z.string().optional(),
});

type DateOptionInput = {
  id?: number;
  date: string;
  time: string;
};

export function AdminView() {
  const [currentTab, setCurrentTab] = useState<AdminTabType>("event");
  const { toast } = useToast();
  const { event, isLoading: isEventLoading, updateEvent, setFinalDate } = useEvent();
  const { rsvps, dateOptionsWithVotes, isLoading: isRsvpsLoading } = useRsvp();
  const { activities, isLoading: isActivitiesLoading, deleteActivity } = useActivities();
  
  const [dateOptions, setDateOptions] = useState<DateOptionInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      image: event?.image || "",
      locationText: event?.locationText || "",
      locationNotes: event?.locationNotes || "",
    },
  });
  
  // Update form when event data is loaded
  useState(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description,
        image: event.image,
        locationText: event.locationText,
        locationNotes: event.locationNotes,
      });
      
      if (event.dateOptions) {
        setDateOptions(event.dateOptions.map(option => ({
          id: option.id,
          date: option.date,
          time: option.time,
        })));
      }
    }
  });
  
  const onSubmit = async (values: z.infer<typeof eventFormSchema>) => {
    if (!event) return;
    
    try {
      setIsSubmitting(true);
      
      await updateEvent({
        ...values,
        dateOptions: dateOptions.map(opt => ({
          id: opt.id,
          date: opt.date,
          time: opt.time,
          eventId: event.id,
        })),
      });
      
      toast({
        title: "Event details saved successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save event details",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addDateOption = () => {
    setDateOptions([...dateOptions, { date: "", time: "" }]);
  };
  
  const removeDateOption = (index: number) => {
    setDateOptions(dateOptions.filter((_, i) => i !== index));
  };
  
  const updateDateOption = (index: number, field: 'date' | 'time', value: string) => {
    setDateOptions(
      dateOptions.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    );
  };
  
  const handleDeleteActivity = async (activityId: number) => {
    try {
      await deleteActivity(activityId);
      toast({
        title: "Post deleted successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete post",
        description: "Please try again later.",
      });
    }
  };
  
  return (
    <div className="p-4">
      {/* Admin Tabs */}
      <div className="flex border-b mb-4">
        <button 
          className={`flex-1 py-2 px-2 text-center ${currentTab === 'event' ? 'active-tab' : 'text-muted-foreground'}`} 
          onClick={() => setCurrentTab('event')}
        >
          Event Details
        </button>
        <button 
          className={`flex-1 py-2 px-2 text-center ${currentTab === 'rsvps' ? 'active-tab' : 'text-muted-foreground'}`} 
          onClick={() => setCurrentTab('rsvps')}
        >
          RSVPs
        </button>
        <button 
          className={`flex-1 py-2 px-2 text-center ${currentTab === 'moderate' ? 'active-tab' : 'text-muted-foreground'}`} 
          onClick={() => setCurrentTab('moderate')}
        >
          Moderate
        </button>
      </div>
      
      {/* Event Details Tab */}
      {currentTab === 'event' && (
        <div>
          {isEventLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mb-4">
                  <FormLabel className="block text-sm font-medium mb-2">Event Dates</FormLabel>
                  
                  {dateOptions.map((dateOption, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input 
                        value={dateOption.date}
                        onChange={(e) => updateDateOption(index, 'date', e.target.value)}
                        placeholder="Date"
                        className="flex-grow"
                      />
                      <Input 
                        value={dateOption.time}
                        onChange={(e) => updateDateOption(index, 'time', e.target.value)}
                        placeholder="Time"
                        className="w-32"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeDateOption(index)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addDateOption}
                    className="mt-2 flex items-center gap-1 text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                    Add another date
                  </Button>
                </div>
                
                <FormField
                  control={form.control}
                  name="locationText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="locationNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Event Details"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      )}
      
      {/* RSVPs Tab */}
      {currentTab === 'rsvps' && (
        <div>
          {isRsvpsLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-semibold mb-1">RSVP Summary</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between mb-2">
                      <span>Total RSVPs:</span>
                      <span className="font-medium">{rsvps.length}</span>
                    </div>
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-1">Date Preferences:</h4>
                      <div className="bg-muted p-2 rounded">
                        {event?.finalDateOptionId ? (
                          <div className="mb-3 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <p className="font-semibold text-green-800 dark:text-green-100">
                              Final date selected!
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                              {dateOptionsWithVotes.find(option => option.id === event.finalDateOptionId)?.date}
                              {" at "}
                              {dateOptionsWithVotes.find(option => option.id === event.finalDateOptionId)?.time}
                            </p>
                          </div>
                        ) : (
                          <div className="mb-3 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-200">
                              Select a final date from the options below to lock it in. Guests will be notified of your selection.
                            </p>
                          </div>
                        )}
                        
                        {dateOptionsWithVotes.map((option) => (
                          <div key={option.id} className="relative">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{option.date}:</span>
                              <span className="text-sm font-medium">{option.votes} {option.votes === 1 ? 'vote' : 'votes'}</span>
                            </div>
                            <div className="w-full bg-muted-foreground/20 rounded-full h-2 mb-1">
                              <div 
                                className={`${option.id === event?.finalDateOptionId ? 'bg-green-500' : 'bg-primary'} h-2 rounded-full`}
                                style={{ width: `${option.percentage}%` }}
                              />
                            </div>
                            {event?.finalDateOptionId === option.id ? (
                              <div className="text-xs text-green-600 dark:text-green-400 mb-3 font-medium">
                                Final date ✓
                              </div>
                            ) : (
                              <div className="flex justify-end mb-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setFinalDate(option.id)}
                                  disabled={!!event?.finalDateOptionId}
                                  className="text-xs"
                                >
                                  Set as final date
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <h3 className="font-semibold mb-2">All RSVPs</h3>
              <div className="space-y-3">
                {rsvps.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-muted-foreground">No RSVPs yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  rsvps.map((rsvp) => (
                    <Card key={rsvp.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{rsvp.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(rsvp.created), "MMMM d, yyyy")}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Going</span>
                        </div>
                        {rsvp.message && (
                          <p className="text-sm mt-1">{rsvp.message}</p>
                        )}
                        <div className="mt-2 bg-muted p-2 rounded text-sm">
                          <p className="font-medium">Available dates:</p>
                          <ul className="list-disc list-inside ml-1 text-muted-foreground">
                            {rsvp.dateSelections.map((date) => (
                              <li key={date.id}>{date.date}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Moderate Tab */}
      {currentTab === 'moderate' && (
        <div>
          <h3 className="font-semibold mb-2">Moderate Activity Feed</h3>
          
          {isActivitiesLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground">No activity yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{activity.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.created), "MMMM d, yyyy • h:mm a")}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        Delete
                      </Button>
                    </div>
                    
                    <p className="mt-1 text-muted-foreground text-sm">{activity.message}</p>
                    
                    {/* Replies */}
                    {activity.replies && activity.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-muted">
                        {activity.replies.map((reply) => (
                          <div key={reply.id} className="mt-2 flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-medium">{reply.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(reply.created), "MMMM d, yyyy • h:mm a")}
                              </p>
                              <p className="mt-1 text-muted-foreground text-sm">{reply.message}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteActivity(reply.id)}
                              className="text-xs text-destructive hover:text-destructive/90"
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
