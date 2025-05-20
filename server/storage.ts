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
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Event operations
  getAllEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: InsertEvent): Promise<Event | undefined>;
  setFinalDateOption(eventId: number, dateOptionId: number): Promise<Event | undefined>;
  
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



export class DatabaseStorage implements IStorage {
  // Event operations
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.created));
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }
  
  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }
  
  async updateEvent(id: number, eventData: InsertEvent): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }
  
  async setFinalDateOption(eventId: number, dateOptionId: number): Promise<Event | undefined> {
    // Verify the date option exists and belongs to this event
    const [dateOption] = await db
      .select()
      .from(dateOptions)
      .where(and(
        eq(dateOptions.id, dateOptionId),
        eq(dateOptions.eventId, eventId)
      ));
    
    if (!dateOption) return undefined;
    
    const [updatedEvent] = await db
      .update(events)
      .set({ finalDateOptionId: dateOptionId })
      .where(eq(events.id, eventId))
      .returning();
    
    return updatedEvent;
  }
  
  // Date options operations
  async getDateOptionsByEventId(eventId: number): Promise<DateOption[]> {
    return await db
      .select()
      .from(dateOptions)
      .where(eq(dateOptions.eventId, eventId));
  }
  
  async createDateOption(dateOptionData: InsertDateOption): Promise<DateOption> {
    const [dateOption] = await db
      .insert(dateOptions)
      .values(dateOptionData)
      .returning();
    return dateOption;
  }
  
  async deleteDateOption(id: number): Promise<void> {
    await db
      .delete(dateOptions)
      .where(eq(dateOptions.id, id));
  }
  
  // RSVP operations
  async getRsvpsByEventId(eventId: number): Promise<RsvpWithDateSelections[]> {
    const eventRsvps = await db
      .select()
      .from(rsvps)
      .where(eq(rsvps.eventId, eventId))
      .orderBy(desc(rsvps.created));
    
    return await Promise.all(eventRsvps.map(async rsvp => {
      const dateSelections = await this.getDateSelectionsByRsvpId(rsvp.id);
      return {
        ...rsvp,
        dateSelections,
      };
    }));
  }
  
  private async getDateSelectionsByRsvpId(rsvpId: number): Promise<DateOption[]> {
    const selections = await db
      .select({
        dateOption: dateOptions
      })
      .from(dateSelections)
      .innerJoin(dateOptions, eq(dateSelections.dateOptionId, dateOptions.id))
      .where(eq(dateSelections.rsvpId, rsvpId));
    
    return selections.map(s => s.dateOption);
  }
  
  async createRsvp(rsvpData: InsertRsvp, dateOptionIds: number[]): Promise<Rsvp> {
    const [rsvp] = await db
      .insert(rsvps)
      .values(rsvpData)
      .returning();
    
    // Create date selections
    if (dateOptionIds.length > 0) {
      await db.insert(dateSelections).values(
        dateOptionIds.map(dateOptionId => ({
          rsvpId: rsvp.id,
          dateOptionId,
        }))
      );
    }
    
    return rsvp;
  }
  
  // Activity operations
  async getActivitiesByEventId(eventId: number): Promise<ActivityWithReplies[]> {
    const eventActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.eventId, eventId))
      .orderBy(desc(activities.created));
    
    // Get all top-level activities (no parentId)
    const topLevelActivities = eventActivities.filter(activity => !activity.parentId);
    
    // Build activity tree
    return await Promise.all(topLevelActivities.map(async activity => {
      return await this.buildActivityWithReplies(activity, eventActivities);
    }));
  }
  
  private async buildActivityWithReplies(activity: Activity, allActivities: Activity[]): Promise<ActivityWithReplies> {
    // Get replies from the pre-fetched activities to avoid N+1 queries
    const activityReplies = allActivities.filter(a => a.parentId === activity.id);
    
    const replies = await Promise.all(
      activityReplies.map(reply => this.buildActivityWithReplies(reply, allActivities))
    );
    
    // Get reactions for this activity
    const activityReactions = await db
      .select()
      .from(reactions)
      .where(eq(reactions.activityId, activity.id));
    
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
    const [activity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    return activity;
  }
  
  async deleteActivity(id: number): Promise<void> {
    // Since we set up cascade deletes, we only need to delete the activity
    await db
      .delete(activities)
      .where(eq(activities.id, id));
  }
  
  // Reaction operations
  async addReaction(reactionData: InsertReaction): Promise<Reaction> {
    const [reaction] = await db
      .insert(reactions)
      .values(reactionData)
      .returning();
    return reaction;
  }
  
  async removeReaction(id: number): Promise<void> {
    await db
      .delete(reactions)
      .where(eq(reactions.id, id));
  }
  
  // Summary operations
  async getDateOptionsWithVotes(eventId: number): Promise<DateOptionWithVotes[]> {
    const dateOptions = await this.getDateOptionsByEventId(eventId);
    
    // For each date option, count its selections manually
    const results: DateOptionWithVotes[] = [];
    
    for (const option of dateOptions) {
      // Count selections for this option
      const selections = await db
        .select()
        .from(dateSelections)
        .where(eq(dateSelections.dateOptionId, option.id));
      
      const votes = selections.length;
      
      results.push({
        ...option,
        votes,
        percentage: 0 // Will calculate after finding max
      });
    }
    
    // Find max votes for percentage calculation (default to 1 if no votes)
    const maxVotes = Math.max(...results.map(r => r.votes), 1);
    
    // Calculate percentages
    return results.map(option => ({
      ...option,
      percentage: (option.votes / maxVotes) * 100
    }));
  }
}

// Use the database storage instead of in-memory storage
export const storage = new DatabaseStorage();
