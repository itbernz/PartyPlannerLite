import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useActivities } from "@/hooks/useActivities";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Activity, ActivityWithReplies } from "@shared/schema";
import { useState } from "react";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useEventContext } from "@/contexts/EventContext";

const activityFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  message: z.string().min(1, {
    message: "Message is required.",
  }),
});

const replyFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  message: z.string().min(1, {
    message: "Reply is required.",
  }),
});

type ActivityCardProps = {
  activity: ActivityWithReplies;
  onAddReply: (parentId: number, name: string, message: string) => Promise<void>;
  onAddReaction: (activityId: number, name: string, emoji: string) => Promise<void>;
  onDeleteActivity: (activityId: number) => Promise<void>;
};

function ActivityCard({ activity, onAddReply, onAddReaction, onDeleteActivity }: ActivityCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isAddingReply, setIsAddingReply] = useState(false);
  const { isAdmin } = useEventContext();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      name: "",
      message: "",
    },
  });

  const onReplySubmit = async (values: z.infer<typeof replyFormSchema>) => {
    try {
      setIsAddingReply(true);
      await onAddReply(activity.id, values.name, values.message);
      form.reset();
      setShowReplyForm(false);
      toast({
        title: "Reply added successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add reply",
        description: "Please try again later.",
      });
    } finally {
      setIsAddingReply(false);
    }
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      const reactionName = "Guest"; // Simplified for this example
      await onAddReaction(activity.id, reactionName, emoji);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add reaction",
        description: "Please try again later.",
      });
    }
  };

  const handleDeleteActivity = async () => {
    try {
      await onDeleteActivity(activity.id);
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
    <Card className="rounded-xl mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-foreground">{activity.name}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(activity.created), "MMMM d, yyyy • h:mm a")}
            </p>
          </div>
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDeleteActivity}
              className="h-7 px-2 text-destructive hover:text-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <p className="mt-2 text-foreground">{activity.message}</p>
        
        <div className="mt-3 flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowReplyForm(!showReplyForm)} 
            className="text-sm text-muted-foreground hover:text-primary"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Reply
          </Button>
          <div className="flex space-x-1">
            {activity.reactions?.map((reaction, index) => (
              <Button 
                key={index} 
                variant="outline" 
                size="sm" 
                onClick={() => handleAddReaction(reaction.emoji)}
                className="px-2 py-1 h-7 text-sm"
              >
                {reaction.emoji} {reaction.count}
              </Button>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleAddReaction("👍")}
              className="px-2 py-1 h-7 text-sm"
            >
              👍
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleAddReaction("❤️")}
              className="px-2 py-1 h-7 text-sm"
            >
              ❤️
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleAddReaction("🎉")}
              className="px-2 py-1 h-7 text-sm"
            >
              🎉
            </Button>
          </div>
        </div>
        
        {showReplyForm && (
          <div className="mt-3 pl-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onReplySubmit)} className="space-y-3">
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
                      <FormLabel>Reply</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write your reply..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-2">
                  <Button 
                    type="submit"
                    disabled={isAddingReply}
                  >
                    {isAddingReply ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Reply"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowReplyForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
        
        {/* Replies */}
        {activity.replies && activity.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-muted">
            {activity.replies.map((reply) => (
              <div key={reply.id} className="mt-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-foreground">{reply.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(reply.created), "MMMM d, yyyy • h:mm a")}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDeleteActivity(reply.id)}
                      className="h-7 px-2 text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-foreground text-sm">{reply.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityTab() {
  const { activities, isLoading, addActivity, addReply, addReaction, deleteActivity } = useActivities();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof activityFormSchema>>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      name: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof activityFormSchema>) => {
    try {
      setIsSubmitting(true);
      await addActivity(values.name, values.message);
      form.reset();
      toast({
        title: "Message posted successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to post message",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (parentId: number, name: string, message: string) => {
    await addReply(parentId, name, message);
  };

  const handleAddReaction = async (activityId: number, name: string, emoji: string) => {
    await addReaction(activityId, name, emoji);
  };

  const handleDeleteActivity = async (activityId: number) => {
    await deleteActivity(activityId);
  };

  return (
    <div className="p-4">
      <h2 className="font-heading font-bold text-xl mb-4">Activity Feed</h2>
      
      <div className="mb-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">No activity yet. Be the first to post!</p>
            </CardContent>
          </Card>
        ) : (
          activities.map((activity) => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              onAddReply={handleAddReply} 
              onAddReaction={handleAddReaction}
              onDeleteActivity={handleDeleteActivity}
            />
          ))
        )}
      </div>
      
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Share your thoughts..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
