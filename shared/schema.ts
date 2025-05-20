import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  timestamp, 
  boolean, 
  json, 
  primaryKey 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Event table - stores event information
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  locationText: text("location_text").notNull(),
  locationNotes: text("location_notes"),
  finalDateOptionId: integer("final_date_option_id"),
  created: timestamp("created").defaultNow().notNull(),
});

// Date options for an event
export const dateOptions = pgTable("date_options", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  time: text("time").notNull(),
});

// RSVPs from guests
export const rsvps = pgTable("rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  message: text("message"),
  email: text("email"),
  wantsUpdates: boolean("wants_updates").default(false),
  created: timestamp("created").defaultNow().notNull(),
});

// Date selections from guests
export const dateSelections = pgTable("date_selections", {
  rsvpId: integer("rsvp_id").notNull().references(() => rsvps.id, { onDelete: "cascade" }),
  dateOptionId: integer("date_option_id").notNull().references(() => dateOptions.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.rsvpId, t.dateOptionId] }),
}));

// Activities (messages, replies) in the activity feed
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  parentId: integer("parent_id").references(() => activities.id, { onDelete: "cascade" }),
  created: timestamp("created").defaultNow().notNull(),
});

// Reactions to activities
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
});

// Insert schemas
export const insertEventSchema = createInsertSchema(events).omit({ id: true, created: true });
export const insertDateOptionSchema = createInsertSchema(dateOptions).omit({ id: true });
export const insertRsvpSchema = createInsertSchema(rsvps).omit({ id: true, created: true });
export const insertDateSelectionSchema = createInsertSchema(dateSelections);
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, created: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true });

// Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type DateOption = typeof dateOptions.$inferSelect;
export type InsertDateOption = z.infer<typeof insertDateOptionSchema>;

export type Rsvp = typeof rsvps.$inferSelect;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;

export type DateSelection = typeof dateSelections.$inferSelect;
export type InsertDateSelection = z.infer<typeof insertDateSelectionSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

// Extended types for frontend use
export type ActivityWithReplies = Activity & {
  replies?: ActivityWithReplies[];
  reactions?: ReactionCount[];
};

export type ReactionCount = {
  emoji: string;
  count: number;
};

export type RsvpWithDateSelections = Rsvp & {
  dateSelections: DateOption[];
};

export type EventWithDetails = Event & {
  dateOptions: DateOption[];
};

export type DateOptionWithVotes = DateOption & {
  votes: number;
  percentage: number;
};
