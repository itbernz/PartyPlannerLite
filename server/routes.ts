import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { 
  insertEventSchema, 
  insertDateOptionSchema, 
  insertRsvpSchema, 
  insertActivitySchema,
  insertReactionSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handling for live updates
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('error', console.error);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Helper function to broadcast updates to all connected clients
  const broadcastUpdate = (type: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({ type, data }));
      }
    });
  };
  
  // === EVENT ROUTES ===
  
  // Get all events
  app.get('/api/events', async (_req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get event by ID
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const dateOptions = await storage.getDateOptionsByEventId(eventId);
    
    res.json({ ...event, dateOptions });
  });
  
  // Create event
  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error creating event' });
    }
  });
  
  // Update event
  app.put('/api/events/:id', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    try {
      const eventData = insertEventSchema.parse(req.body);
      const updatedEvent = await storage.updateEvent(eventId, eventData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      broadcastUpdate('event_updated', updatedEvent);
      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error updating event' });
    }
  });
  
  // === DATE OPTION ROUTES ===
  
  // Get date options for an event
  app.get('/api/events/:id/date-options', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    const dateOptions = await storage.getDateOptionsByEventId(eventId);
    res.json(dateOptions);
  });
  
  // Create date option
  app.post('/api/date-options', async (req: Request, res: Response) => {
    try {
      const dateOptionData = insertDateOptionSchema.parse(req.body);
      const dateOption = await storage.createDateOption(dateOptionData);
      
      broadcastUpdate('date_option_created', dateOption);
      res.status(201).json(dateOption);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error creating date option' });
    }
  });
  
  // Delete date option
  app.delete('/api/date-options/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid date option ID' });
    }
    
    await storage.deleteDateOption(id);
    
    broadcastUpdate('date_option_deleted', { id });
    res.status(204).send();
  });
  
  // === RSVP ROUTES ===
  
  // Get RSVPs for an event
  app.get('/api/events/:id/rsvps', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    const rsvps = await storage.getRsvpsByEventId(eventId);
    res.json(rsvps);
  });
  
  // Create RSVP
  app.post('/api/events/:id/rsvps', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    try {
      const { dateOptionIds, ...rsvpData } = req.body;
      
      if (!Array.isArray(dateOptionIds) || dateOptionIds.length === 0) {
        return res.status(400).json({ message: 'At least one date option must be selected' });
      }
      
      const validatedRsvpData = insertRsvpSchema.parse({
        ...rsvpData,
        eventId
      });
      
      const rsvp = await storage.createRsvp(validatedRsvpData, dateOptionIds);
      
      const rsvpWithDateSelections = {
        ...rsvp,
        dateSelections: await storage.getDateOptionsByEventId(eventId).then(options => 
          options.filter(option => dateOptionIds.includes(option.id))
        )
      };
      
      broadcastUpdate('rsvp_created', rsvpWithDateSelections);
      res.status(201).json(rsvpWithDateSelections);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error creating RSVP' });
    }
  });
  
  // === ACTIVITY ROUTES ===
  
  // Get activities for an event
  app.get('/api/events/:id/activities', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    const activities = await storage.getActivitiesByEventId(eventId);
    res.json(activities);
  });
  
  // Create activity (post or reply)
  app.post('/api/events/:id/activities', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    try {
      const activityData = insertActivitySchema.parse({
        ...req.body,
        eventId
      });
      
      const activity = await storage.createActivity(activityData);
      
      broadcastUpdate('activity_created', activity);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error creating activity' });
    }
  });
  
  // Delete activity
  app.delete('/api/activities/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }
    
    await storage.deleteActivity(id);
    
    broadcastUpdate('activity_deleted', { id });
    res.status(204).send();
  });
  
  // === REACTION ROUTES ===
  
  // Add reaction to activity
  app.post('/api/activities/:id/reactions', async (req: Request, res: Response) => {
    const activityId = parseInt(req.params.id);
    if (isNaN(activityId)) {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }
    
    try {
      const reactionData = insertReactionSchema.parse({
        ...req.body,
        activityId
      });
      
      const reaction = await storage.addReaction(reactionData);
      
      broadcastUpdate('reaction_added', reaction);
      res.status(201).json(reaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error adding reaction' });
    }
  });
  
  // Remove reaction
  app.delete('/api/reactions/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reaction ID' });
    }
    
    await storage.removeReaction(id);
    
    broadcastUpdate('reaction_removed', { id });
    res.status(204).send();
  });
  
  // === SUMMARY ROUTES ===
  
  // Get date options with vote counts
  app.get('/api/events/:id/date-options-votes', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    const dateOptionsWithVotes = await storage.getDateOptionsWithVotes(eventId);
    res.json(dateOptionsWithVotes);
  });

  // Set final date for an event
  app.post('/api/events/:id/final-date', async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    const { dateOptionId } = req.body;
    if (!dateOptionId || isNaN(parseInt(dateOptionId))) {
      return res.status(400).json({ message: 'Invalid date option ID' });
    }
    
    const updatedEvent = await storage.setFinalDateOption(eventId, parseInt(dateOptionId));
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event or date option not found' });
    }
    
    broadcastUpdate('event_updated', updatedEvent);
    res.json(updatedEvent);
  });

  return httpServer;
}
