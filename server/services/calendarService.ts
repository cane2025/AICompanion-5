import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";
import { dbStorage } from "../dbStorage.js";
import ical from "ical-generator";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  type: "weekly_documentation" | "monthly_report" | "care_plan" | "follow_up" | "deadline";
  clientId?: string;
  staffId?: string;
  documentId?: string;
  status?: string;
  location?: string;
  reminder?: number; // minutes before event
}

export class CalendarService {
  // Generate calendar events for a staff member
  async getStaffCalendarEvents(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];
    
    // Get all clients for this staff member
    const clients = await dbStorage.getClientsByStaffId(staffId);
    const activeClients = clients.filter(c => c.status === "active");

    // Weekly documentation events
    for (const client of activeClients) {
      const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(endDate, { weekStartsOn: 1 });
      
      let currentWeek = weekStart;
      while (currentWeek <= weekEnd) {
        const weekNumber = this.getWeekNumber(currentWeek);
        const year = currentWeek.getFullYear();
        
        // Check if documentation exists
        const doc = await dbStorage.getWeeklyDocumentationByWeek(
          client.id!,
          year,
          weekNumber
        );

        // Friday deadline for weekly documentation
        const friday = addDays(currentWeek, 4);
        if (friday >= startDate && friday <= endDate) {
          events.push({
            id: `weekly-doc-${client.id}-${year}-${weekNumber}`,
            title: `Veckodokumentation: ${client.initials}`,
            description: `Deadline för veckodokumentation vecka ${weekNumber}`,
            start: new Date(friday.setHours(15, 0, 0, 0)),
            end: new Date(friday.setHours(17, 0, 0, 0)),
            type: "weekly_documentation",
            clientId: client.id,
            staffId: staffId,
            documentId: doc?.id,
            status: doc?.approved ? "completed" : "pending",
            reminder: 120, // 2 hours before
          });
        }

        currentWeek = addDays(currentWeek, 7);
      }
    }

    // Monthly report events
    for (const client of activeClients) {
      const monthStart = startOfMonth(startDate);
      const monthEnd = endOfMonth(endDate);
      
      let currentMonth = monthStart;
      while (currentMonth <= monthEnd) {
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        const lastDay = endOfMonth(currentMonth);
        
        // Check if report exists
        const report = await dbStorage.getMonthlyReportByMonth(
          client.id!,
          year,
          month
        );

        // Last day of month deadline
        if (lastDay >= startDate && lastDay <= endDate) {
          events.push({
            id: `monthly-report-${client.id}-${year}-${month}`,
            title: `Månadsrapport: ${client.initials}`,
            description: `Deadline för månadsrapport ${format(currentMonth, "MMMM yyyy", { locale: sv })}`,
            start: new Date(lastDay.setHours(15, 0, 0, 0)),
            end: new Date(lastDay.setHours(17, 0, 0, 0)),
            type: "monthly_report",
            clientId: client.id,
            staffId: staffId,
            documentId: report?.id,
            status: report?.status || "not_started",
            reminder: 1440, // 24 hours before
          });
        }

        currentMonth = addDays(endOfMonth(currentMonth), 1);
      }
    }

    // Care plan follow-ups
    const carePlans = await dbStorage.getCarePlansByStaff(staffId);
    const activePlans = carePlans.filter(p => p.isActive);

    for (const plan of activePlans) {
      const planDate = new Date(plan.createdAt!);
      
      // 30-day follow-ups
      let followUpDate = addDays(planDate, 30);
      let followUpCount = 1;
      
      while (followUpDate <= endDate) {
        if (followUpDate >= startDate) {
          const client = await dbStorage.getClient(plan.clientId);
          
          events.push({
            id: `care-plan-followup-${plan.id}-${followUpCount}`,
            title: `Uppföljning: ${client?.initials || "Unknown"}`,
            description: `${followUpCount * 30}-dagars uppföljning av genomförandeplan`,
            start: new Date(followUpDate.setHours(10, 0, 0, 0)),
            end: new Date(followUpDate.setHours(11, 0, 0, 0)),
            type: "follow_up",
            clientId: plan.clientId,
            staffId: staffId,
            documentId: plan.id,
            status: plan.status,
            reminder: 1440, // 24 hours before
          });
        }
        
        followUpDate = addDays(followUpDate, 30);
        followUpCount++;
      }
    }

    // Implementation plan deadlines
    const implementationPlans = await dbStorage.getImplementationPlansByStaff(staffId);
    const activeImplPlans = implementationPlans.filter(p => p.isActive);

    for (const plan of activeImplPlans) {
      if (plan.dueDate) {
        const dueDate = new Date(plan.dueDate);
        if (dueDate >= startDate && dueDate <= endDate) {
          const client = await dbStorage.getClient(plan.clientId);
          
          events.push({
            id: `impl-plan-due-${plan.id}`,
            title: `Deadline GFP: ${client?.initials || "Unknown"}`,
            description: `Deadline för administrativ uppföljning`,
            start: new Date(dueDate.setHours(12, 0, 0, 0)),
            end: new Date(dueDate.setHours(13, 0, 0, 0)),
            type: "deadline",
            clientId: plan.clientId,
            staffId: staffId,
            documentId: plan.id,
            status: plan.status,
            reminder: 2880, // 48 hours before
          });
        }
      }
    }

    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  // Generate iCal format for calendar export
  async generateICalForStaff(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const staff = await dbStorage.getStaff(staffId);
    if (!staff) throw new Error("Staff not found");

    const events = await this.getStaffCalendarEvents(staffId, startDate, endDate);
    
    const calendar = ical({
      name: `Uppföljningssystem - ${staff.name}`,
      description: `Kalender för ${staff.name} - Uppföljningssystem`,
      timezone: "Europe/Stockholm",
      prodId: "//Uppföljningssystem//Calendar//SV",
    });

    for (const event of events) {
      const icalEvent = calendar.createEvent({
        start: event.start,
        end: event.end,
        summary: event.title,
        description: event.description,
        location: event.location || "Uppföljningssystem",
        uid: event.id + "@uppfoljning.se",
      });

      // Add status
      if (event.status === "completed") {
        icalEvent.status("CONFIRMED");
      } else {
        icalEvent.status("TENTATIVE");
      }

      // Add reminder
      if (event.reminder) {
        icalEvent.createAlarm({
          type: "display",
          trigger: event.reminder * 60, // Convert to seconds
          description: `Påminnelse: ${event.title}`,
        });
      }

      // Add categories
      icalEvent.categories([event.type]);
    }

    return calendar.toString();
  }

  // Get upcoming events for dashboard
  async getUpcomingEvents(
    staffId?: string,
    days: number = 7
  ): Promise<CalendarEvent[]> {
    const startDate = new Date();
    const endDate = addDays(startDate, days);

    if (staffId) {
      return this.getStaffCalendarEvents(staffId, startDate, endDate);
    }

    // Get events for all staff
    const allStaff = await dbStorage.getAllStaff();
    const allEvents: CalendarEvent[] = [];

    for (const staff of allStaff) {
      const staffEvents = await this.getStaffCalendarEvents(
        staff.id!,
        startDate,
        endDate
      );
      allEvents.push(...staffEvents);
    }

    return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  // Get events for a specific client
  async getClientCalendarEvents(
    clientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const client = await dbStorage.getClient(clientId);
    if (!client) throw new Error("Client not found");

    // Get events from the staff member's calendar but filter for this client
    const staffEvents = await this.getStaffCalendarEvents(
      client.staffId,
      startDate,
      endDate
    );

    return staffEvents.filter(event => event.clientId === clientId);
  }

  // Create a shared calendar URL (for integration with external calendars)
  generateCalendarUrl(staffId: string, token: string): string {
    const baseUrl = process.env.APP_URL || "http://localhost:3001";
    return `${baseUrl}/api/calendar/ical/${staffId}?token=${token}`;
  }

  // Helper function to get week number
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Convert events to JSON format for API responses
  formatEventsForAPI(events: CalendarEvent[]): any[] {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      type: event.type,
      clientId: event.clientId,
      staffId: event.staffId,
      documentId: event.documentId,
      status: event.status,
      location: event.location,
      reminder: event.reminder,
      color: this.getEventColor(event.type, event.status),
    }));
  }

  // Get color for event based on type and status
  private getEventColor(type: string, status?: string): string {
    if (status === "completed") return "#10b981"; // green
    
    switch (type) {
      case "weekly_documentation":
        return "#3b82f6"; // blue
      case "monthly_report":
        return "#8b5cf6"; // purple
      case "care_plan":
        return "#f59e0b"; // amber
      case "follow_up":
        return "#06b6d4"; // cyan
      case "deadline":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
