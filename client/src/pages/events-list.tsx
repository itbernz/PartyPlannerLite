import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Event } from "@shared/schema";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
      const response = await apiRequest('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event created successfully!",
        description: "Your new event has been created.",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to create event",
        description: "Something went wrong. Please try again.",
      });
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    createEventMutation.mutate(values);
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold">Your Events</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <DialogTrigger asChild>
              <Button>Create Your First Event</Button>
            </DialogTrigger>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eventsQuery.data?.map((event) => (
            <Link href={`/events/${event.id}`} key={event.id}>
              <a className="block">
                <Card className="rounded-xl overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="h-40 w-full">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
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
                      <Button variant="outline" size="sm">
                        View Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}