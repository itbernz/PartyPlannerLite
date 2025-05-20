import { Card, CardContent } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useEvent } from "@/hooks/useEvent";
import { useRsvp } from "@/hooks/useRsvp";
import { DateOption } from "@shared/schema";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  message: z.string().optional(),
  dateOptions: z.array(z.number()).min(1, {
    message: "You must select at least one date.",
  }),
});

export function EventTab() {
  const { toast } = useToast();
  const { event, isLoading: isEventLoading } = useEvent();
  const { submitRsvp, isSubmitting } = useRsvp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      message: "",
      dateOptions: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await submitRsvp({
        name: values.name,
        message: values.message,
        dateOptionIds: values.dateOptions,
      });
      
      form.reset();
      
      toast({
        title: "RSVP submitted successfully!",
        description: "Thank you for your response.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit RSVP",
        description: "Please try again later.",
      });
    }
  }

  if (isEventLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Event Details Card */}
      <Card className="rounded-xl overflow-hidden mb-6">
        <img 
          src={event.image} 
          alt="Event cover" 
          className="w-full h-48 object-cover" 
        />
        
        <CardContent className="p-4">
          <h2 className="text-2xl font-heading font-bold text-foreground">
            {event.title}
          </h2>
          <p className="text-muted-foreground mt-2">
            {event.description}
          </p>
        </CardContent>
      </Card>
      
      {/* Date Selection Section */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-lg mb-3">Select available dates</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="dateOptions"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-3">
                    {event.dateOptions?.map((option: DateOption) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="dateOptions"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex items-center p-4 border border-input rounded-xl bg-card hover:border-primary transition cursor-pointer"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="ml-4">
                                <p className="font-medium">{option.date}</p>
                                <p className="text-sm text-muted-foreground">{option.time}</p>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* RSVP Form */}
            <Card className="rounded-xl">
              <CardContent className="p-4">
                <h3 className="font-heading font-semibold text-lg mb-3">RSVP</h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add a message to your RSVP" 
                            rows={3} 
                            {...field} 
                          />
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
                        Submitting...
                      </>
                    ) : (
                      "Submit RSVP"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
