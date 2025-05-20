import { 
  activities, 
  dateOptions, 
  dateSelections, 
  events, 
  reactions, 
  rsvps,
  type Event,
  type InsertEvent,
  type DateOption,
  type InsertDateOption,
  type Rsvp,
  type InsertRsvp,
  type DateSelection,
  type InsertDateSelection,
  type Activity,
  type InsertActivity,
  type Reaction,
  type InsertReaction,
  type ActivityWithReplies,
  type RsvpWithDateSelections,
  type DateOptionWithVotes
} from "@shared/schema";

export interface IStorage {
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: InsertEvent): Promise<Event | undefined>;
  
  // Date options operations
  getDateOptionsByEventId(eventId: number): Promise<DateOption[]>;
  createDateOption(dateOption: InsertDateOption): Promise<DateOption>;
  deleteDateOption(id: number): Promise<void>;
  
  // RSVP operations
  getRsvpsByEventId(eventId: number): Promise<RsvpWithDateSelections[]>;
  createRsvp(rsvp: InsertRsvp, dateOptionIds: number[]): Promise<Rsvp>;
  
  // Activity operations
  getActivitiesByEventId(eventId: number): Promise<ActivityWithReplies[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: number): Promise<void>;
  
  // Reaction operations
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  removeReaction(id: number): Promise<void>;
  
  // Summary operations
  getDateOptionsWithVotes(eventId: number): Promise<DateOptionWithVotes[]>;
}

export class MemStorage implements IStorage {
  private events: Map<number, Event>;
  private dateOptions: Map<number, DateOption>;
  private rsvps: Map<number, Rsvp>;
  private dateSelections: Map<string, DateSelection>; // Composite key: rsvpId-dateOptionId
  private activities: Map<number, Activity>;
  private reactions: Map<number, Reaction>;
  
  private eventIdCounter: number;
  private dateOptionIdCounter: number;
  private rsvpIdCounter: number;
  private activityIdCounter: number;
  private reactionIdCounter: number;
  
  constructor() {
    this.events = new Map();
    this.dateOptions = new Map();
    this.rsvps = new Map();
    this.dateSelections = new Map();
    this.activities = new Map();
    this.reactions = new Map();
    
    this.eventIdCounter = 1;
    this.dateOptionIdCounter = 1;
    this.rsvpIdCounter = 1;
    this.activityIdCounter = 1;
    this.reactionIdCounter = 1;
    
    // Initialize with a sample event for testing
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Create a sample event
    const event: Event = {
      id: this.eventIdCounter++,
      title: "Summer Rooftop Party",
      description: "Join us for a fun evening of drinks, music, and great company on the rooftop! Bring your favorite summer vibes and energy.",
      image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=450",
      locationText: "123 Sunshine Blvd, Rooftop Area",
      locationNotes: "Take the elevator to the 15th floor. The rooftop area is accessible via the staircase next to the elevator. Look for the colorful lanterns!",
      created: new Date(),
    };
    this.events.set(event.id, event);
    
    // Create date options
    const dateOption1: DateOption = {
      id: this.dateOptionIdCounter++,
      eventId: event.id,
      date: "Saturday, July 15",
      time: "7:00 PM - 11:00 PM",
    };
    this.dateOptions.set(dateOption1.id, dateOption1);
    
    const dateOption2: DateOption = {
      id: this.dateOptionIdCounter++,
      eventId: event.id,
      date: "Saturday, July 22",
      time: "7:00 PM - 11:00 PM",
    };
    this.dateOptions.set(dateOption2.id, dateOption2);
    
    const dateOption3: DateOption = {
      id: this.dateOptionIdCounter++,
      eventId: event.id,
      date: "Saturday, July 29",
      time: "7:00 PM - 11:00 PM",
    };
    this.dateOptions.set(dateOption3.id, dateOption3);
  }
  
  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = {
      ...eventData,
      id,
      created: new Date(),
    };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, eventData: InsertEvent): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent: Event = {
      ...existingEvent,
      ...eventData,
    };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  // Date options operations
  async getDateOptionsByEventId(eventId: number): Promise<DateOption[]> {
    return Array.from(this.dateOptions.values())
      .filter(option => option.eventId === eventId);
  }
  
  async createDateOption(dateOptionData: InsertDateOption): Promise<DateOption> {
    const id = this.dateOptionIdCounter++;
    const dateOption: DateOption = {
      ...dateOptionData,
      id,
    };
    this.dateOptions.set(id, dateOption);
    return dateOption;
  }
  
  async deleteDateOption(id: number): Promise<void> {
    this.dateOptions.delete(id);
  }
  
  // RSVP operations
  async getRsvpsByEventId(eventId: number): Promise<RsvpWithDateSelections[]> {
    const eventRsvps = Array.from(this.rsvps.values())
      .filter(rsvp => rsvp.eventId === eventId);
    
    return await Promise.all(eventRsvps.map(async rsvp => {
      const dateSelections = await this.getDateSelectionsByRsvpId(rsvp.id);
      return {
        ...rsvp,
        dateSelections,
      };
    }));
  }
  
  private async getDateSelectionsByRsvpId(rsvpId: number): Promise<DateOption[]> {
    const selectionKeys = Array.from(this.dateSelections.keys())
      .filter(key => key.startsWith(`${rsvpId}-`));
    
    const dateOptionIds = selectionKeys.map(key => {
      const selection = this.dateSelections.get(key);
      return selection ? selection.dateOptionId : -1;
    });
    
    return dateOptionIds
      .filter(id => id !== -1)
      .map(id => this.dateOptions.get(id)!)
      .filter(Boolean);
  }
  
  async createRsvp(rsvpData: InsertRsvp, dateOptionIds: number[]): Promise<Rsvp> {
    const id = this.rsvpIdCounter++;
    const rsvp: Rsvp = {
      ...rsvpData,
      id,
      created: new Date(),
    };
    this.rsvps.set(id, rsvp);
    
    // Create date selections
    dateOptionIds.forEach(dateOptionId => {
      const key = `${id}-${dateOptionId}`;
      const dateSelection: DateSelection = {
        rsvpId: id,
        dateOptionId,
      };
      this.dateSelections.set(key, dateSelection);
    });
    
    return rsvp;
  }
  
  // Activity operations
  async getActivitiesByEventId(eventId: number): Promise<ActivityWithReplies[]> {
    const eventActivities = Array.from(this.activities.values())
      .filter(activity => activity.eventId === eventId);
    
    // Get all top-level activities (no parentId)
    const topLevelActivities = eventActivities.filter(activity => !activity.parentId);
    
    // Build activity tree
    return topLevelActivities.map(activity => {
      return this.buildActivityWithReplies(activity, eventActivities);
    });
  }
  
  private buildActivityWithReplies(activity: Activity, allActivities: Activity[]): ActivityWithReplies {
    const replies = allActivities
      .filter(a => a.parentId === activity.id)
      .map(reply => this.buildActivityWithReplies(reply, allActivities));
    
    const activityReactions = Array.from(this.reactions.values())
      .filter(reaction => reaction.activityId === activity.id);
    
    // Group reactions by emoji and count
    const reactionCounts = activityReactions.reduce((acc, reaction) => {
      const existingReaction = acc.find(r => r.emoji === reaction.emoji);
      if (existingReaction) {
        existingReaction.count++;
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
        });
      }
      return acc;
    }, [] as { emoji: string; count: number }[]);
    
    return {
      ...activity,
      replies,
      reactions: reactionCounts,
    };
  }
  
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const activity: Activity = {
      ...activityData,
      id,
      created: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  async deleteActivity(id: number): Promise<void> {
    // Delete activity and all replies recursively
    const deleteRecursively = (activityId: number) => {
      const replies = Array.from(this.activities.values())
        .filter(a => a.parentId === activityId);
      
      replies.forEach(reply => deleteRecursively(reply.id));
      
      // Delete reactions for this activity
      Array.from(this.reactions.values())
        .filter(r => r.activityId === activityId)
        .forEach(r => this.reactions.delete(r.id));
      
      // Delete the activity itself
      this.activities.delete(activityId);
    };
    
    deleteRecursively(id);
  }
  
  // Reaction operations
  async addReaction(reactionData: InsertReaction): Promise<Reaction> {
    const id = this.reactionIdCounter++;
    const reaction: Reaction = {
      ...reactionData,
      id,
    };
    this.reactions.set(id, reaction);
    return reaction;
  }
  
  async removeReaction(id: number): Promise<void> {
    this.reactions.delete(id);
  }
  
  // Summary operations
  async getDateOptionsWithVotes(eventId: number): Promise<DateOptionWithVotes[]> {
    const dateOptions = await this.getDateOptionsByEventId(eventId);
    const eventRsvps = await this.getRsvpsByEventId(eventId);
    
    const voteCounts = new Map<number, number>();
    
    // Count votes for each date option
    eventRsvps.forEach(rsvp => {
      rsvp.dateSelections.forEach(option => {
        const currentCount = voteCounts.get(option.id) || 0;
        voteCounts.set(option.id, currentCount + 1);
      });
    });
    
    // Find max votes for percentage calculation
    const maxVotes = Math.max(...Array.from(voteCounts.values()), 1);
    
    return dateOptions.map(option => {
      const votes = voteCounts.get(option.id) || 0;
      return {
        ...option,
        votes,
        percentage: (votes / maxVotes) * 100,
      };
    });
  }
}

export const storage = new MemStorage();
