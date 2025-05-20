import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus, Loader2, Edit, Trash2, Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Event } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  image: z.string().url({
    message: "Please enter a valid image URL.",
  }),
  locationText: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  locationNotes: z.string().optional(),
});

export default function EventsList() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const eventsQuery = useQuery<Event[]>({
    queryKey: ['/api/events'],
    staleTime: 10000,
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      locationText: "",
      locationNotes: "",
    },
  });
  
  const createEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest('/api/events', {
        method: 'POST',
        body: data,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event created successfully!",
        description: "Your new event has been created.",
      });
      form.reset();
      setIsCreateDialogOpen(false);
      // Navigate to the new event
      navigate(`/events/${data.id}`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to create event",
        description: "Something went wrong. Please try again.",
      });
    },
  });
  
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event deleted",
        description: "The event has been permanently deleted.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to delete event",
        description: "Something went wrong. Please try again.",
      });
    },
  });
  
  function handleOpenDeleteDialog(event: Event) {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  }
  
  function handleDeleteEvent() {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  }
  
  async function handleExportEvent(event: Event) {
    try {
      // Create a JSON blob with the event data
      const eventData = JSON.stringify(event, null, 2);
      const blob = new Blob([eventData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${event.id}-${event.title.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Event exported",
        description: "The event data has been downloaded as a JSON file.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export event data.",
      });
    }
  }
  
  async function handleExportRsvps(event: Event) {
    try {
      // Fetch RSVPs for this event
      const res = await fetch(`/api/events/${event.id}/rsvps/export`);
      if (!res.ok) throw new Error("Failed to export RSVPs");
      
      // Get the blob from response
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `rsvps-${event.id}-${event.title.toLowerCase().replace(/\s+/g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "RSVPs exported",
        description: "The RSVPs have been downloaded as a CSV file.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export RSVPs data.",
      });
    }
  }
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    createEventMutation.mutate(values);
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold">Your Events</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Party" {...field} />
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
                        <Textarea
                          placeholder="Join us for a fun evening..."
                          rows={3}
                          {...field}
                        />
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
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="locationText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123 Main St, City" 
                          {...field} 
                        />
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
                      <FormLabel>Location Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Parking information, directions, etc."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={createEventMutation.isPending}
                  >
                    {createEventMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Event"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {eventsQuery.isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : eventsQuery.isError ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Error loading events. Please try again.</p>
          </CardContent>
        </Card>
      ) : eventsQuery.data?.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <p className="text-center text-muted-foreground mb-4">You don't have any events yet.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Event</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eventsQuery.data?.map((event) => (
            <Card key={event.id} className="rounded-xl overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
              <div className="h-40 w-full relative">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white/90">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportEvent(event)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Event Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportRsvps(event)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export RSVPs & Emails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenDeleteDialog(event)}>
                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                        <span className="text-red-500">Delete Event</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <h2 className="text-xl font-heading font-semibold mb-2">{event.title}</h2>
                <p className="text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
                <div className="mt-auto flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {event.finalDateOptionId 
                      ? "Date confirmed" 
                      : "Date voting open"}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                    View Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone and all RSVPs and date options will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteEvent} disabled={deleteEventMutation.isPending}>
              {deleteEventMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}