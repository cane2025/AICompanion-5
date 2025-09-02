import { Router } from "express";
import { calendarService } from "../services/calendarService.js";
import { z } from "zod";
import jwt from "jsonwebtoken";

export const calendarRouter = Router();

// Middleware for authentication
function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies?.authToken || req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Validate calendar token for iCal feeds
function validateCalendarToken(req: any, res: any, next: any) {
  const token = req.query.token as string;
  
  if (!token) {
    return res.status(401).json({ error: "Calendar token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    req.calendarUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid calendar token" });
  }
}

// Get calendar events for authenticated user
calendarRouter.get("/events", requireAuth, async (req: any, res) => {
  try {
    const startDate = req.query.start ? new Date(req.query.start as string) : new Date();
    const endDate = req.query.end 
      ? new Date(req.query.end as string) 
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Get staff ID from user or query
    const staffId = req.query.staffId || req.user.id;

    const events = await calendarService.getStaffCalendarEvents(
      staffId,
      startDate,
      endDate
    );

    res.json({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      events: calendarService.formatEventsForAPI(events),
    });
  } catch (error) {
    console.error("Calendar events error:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// Get upcoming events
calendarRouter.get("/events/upcoming", requireAuth, async (req: any, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const staffId = req.query.staffId || req.user.id;

    const events = await calendarService.getUpcomingEvents(staffId, days);

    res.json({
      days,
      count: events.length,
      events: calendarService.formatEventsForAPI(events),
    });
  } catch (error) {
    console.error("Upcoming events error:", error);
    res.status(500).json({ error: "Failed to fetch upcoming events" });
  }
});

// Get events for a specific client
calendarRouter.get("/events/client/:clientId", requireAuth, async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const startDate = req.query.start ? new Date(req.query.start as string) : new Date();
    const endDate = req.query.end 
      ? new Date(req.query.end as string) 
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const events = await calendarService.getClientCalendarEvents(
      clientId,
      startDate,
      endDate
    );

    res.json({
      clientId,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      events: calendarService.formatEventsForAPI(events),
    });
  } catch (error) {
    console.error("Client calendar events error:", error);
    res.status(500).json({ error: "Failed to fetch client calendar events" });
  }
});

// Generate calendar token for external access
calendarRouter.post("/token/generate", requireAuth, async (req: any, res) => {
  try {
    // Generate a long-lived token for calendar access
    const calendarToken = jwt.sign(
      { 
        id: req.user.id,
        username: req.user.username,
        type: "calendar",
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "365d" } // 1 year
    );

    const calendarUrl = calendarService.generateCalendarUrl(req.user.id, calendarToken);

    res.json({
      token: calendarToken,
      url: calendarUrl,
      instructions: {
        google: "Lägg till denna URL i Google Calendar under 'Andra kalendrar' > 'Från URL'",
        outlook: "Prenumerera på denna kalender i Outlook genom att lägga till en internetkalender",
        apple: "Öppna Kalender-appen, välj Arkiv > Ny kalenderprenumeration och klistra in URL:en",
      },
    });
  } catch (error) {
    console.error("Calendar token generation error:", error);
    res.status(500).json({ error: "Failed to generate calendar token" });
  }
});

// iCal feed endpoint
calendarRouter.get("/ical/:staffId", validateCalendarToken, async (req: any, res) => {
  try {
    const staffId = req.params.staffId;
    
    // Verify that the token belongs to this staff member
    if (req.calendarUser.id !== staffId && req.calendarUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get events for the next 3 months
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

    const icalContent = await calendarService.generateICalForStaff(
      staffId,
      startDate,
      endDate
    );

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="uppfoljning-kalender.ics"');
    res.send(icalContent);
  } catch (error) {
    console.error("iCal generation error:", error);
    res.status(500).json({ error: "Failed to generate calendar" });
  }
});

// Export calendar as file
calendarRouter.get("/export", requireAuth, async (req: any, res) => {
  try {
    const staffId = req.query.staffId || req.user.id;
    const startDate = req.query.start 
      ? new Date(req.query.start as string) 
      : new Date();
    const endDate = req.query.end 
      ? new Date(req.query.end as string) 
      : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months

    const icalContent = await calendarService.generateICalForStaff(
      staffId,
      startDate,
      endDate
    );

    const filename = `uppfoljning-kalender-${new Date().toISOString().split("T")[0]}.ics`;

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(icalContent);
  } catch (error) {
    console.error("Calendar export error:", error);
    res.status(500).json({ error: "Failed to export calendar" });
  }
});

// Create custom event
const createEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  start: z.string(),
  end: z.string(),
  clientId: z.string().optional(),
  type: z.enum(["weekly_documentation", "monthly_report", "care_plan", "follow_up", "deadline"]),
  reminder: z.number().optional(),
});

calendarRouter.post("/events", requireAuth, async (req: any, res) => {
  try {
    const result = createEventSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    // Note: This is a placeholder for custom event creation
    // In a full implementation, you would store custom events in the database
    
    res.json({
      message: "Custom event creation not yet implemented",
      event: {
        ...result.data,
        id: `custom-${Date.now()}`,
        staffId: req.user.id,
      },
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Get calendar statistics
calendarRouter.get("/statistics", requireAuth, async (req: any, res) => {
  try {
    const staffId = req.query.staffId || req.user.id;
    const now = new Date();
    
    // Get events for current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthEvents = await calendarService.getStaffCalendarEvents(
      staffId,
      monthStart,
      monthEnd
    );

    // Get upcoming week events
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekEvents = await calendarService.getStaffCalendarEvents(
      staffId,
      now,
      weekEnd
    );

    // Calculate statistics
    const stats = {
      currentMonth: {
        total: monthEvents.length,
        completed: monthEvents.filter(e => e.status === "completed").length,
        pending: monthEvents.filter(e => e.status !== "completed").length,
        byType: {
          weeklyDocumentation: monthEvents.filter(e => e.type === "weekly_documentation").length,
          monthlyReports: monthEvents.filter(e => e.type === "monthly_report").length,
          carePlans: monthEvents.filter(e => e.type === "care_plan").length,
          followUps: monthEvents.filter(e => e.type === "follow_up").length,
          deadlines: monthEvents.filter(e => e.type === "deadline").length,
        },
      },
      upcomingWeek: {
        total: weekEvents.length,
        today: weekEvents.filter(e => 
          e.start.toDateString() === now.toDateString()
        ).length,
        overdue: weekEvents.filter(e => 
          e.start < now && e.status !== "completed"
        ).length,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Calendar statistics error:", error);
    res.status(500).json({ error: "Failed to fetch calendar statistics" });
  }
});