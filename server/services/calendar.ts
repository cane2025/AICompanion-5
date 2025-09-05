import { databaseService } from "./database.js";
import type { Staff, Client, WeeklyDocumentation, MonthlyReport } from "../../shared/schema.js";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  type: 'appointment' | 'deadline' | 'reminder' | 'meeting';
  staffId: string;
  clientId?: string;
  location?: string;
  attendees?: string[];
  color?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
}

export interface CalendarIntegration {
  name: string;
  type: 'google' | 'outlook' | 'ical' | 'custom';
  config: Record<string, any>;
  enabled: boolean;
}

export class CalendarService {
  private integrations: Map<string, CalendarIntegration> = new Map();
  private events: Map<string, CalendarEvent> = new Map();

  constructor() {
    this.initializeDefaultIntegrations();
  }

  private initializeDefaultIntegrations(): void {
    // Google Calendar integration
    this.integrations.set('google', {
      name: 'Google Calendar',
      type: 'google',
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
        scopes: ['https://www.googleapis.com/auth/calendar'],
      },
      enabled: false,
    });

    // Outlook/Office 365 integration
    this.integrations.set('outlook', {
      name: 'Outlook Calendar',
      type: 'outlook',
      config: {
        clientId: process.env.OUTLOOK_CLIENT_ID || '',
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
        tenantId: process.env.OUTLOOK_TENANT_ID || '',
        scopes: ['https://graph.microsoft.com/Calendars.ReadWrite'],
      },
      enabled: false,
    });

    // iCal integration
    this.integrations.set('ical', {
      name: 'iCal Feed',
      type: 'ical',
      config: {
        url: process.env.ICAL_FEED_URL || '',
        username: process.env.ICAL_USERNAME || '',
        password: process.env.ICAL_PASSWORD || '',
      },
      enabled: false,
    });
  }

  // Event management
  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const id = crypto.randomUUID();
    const newEvent: CalendarEvent = {
      ...event,
      id,
    };

    this.events.set(id, newEvent);
    await this.syncToExternalCalendars(newEvent);
    
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const event = this.events.get(id);
    if (!event) return null;

    const updatedEvent: CalendarEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    await this.syncToExternalCalendars(updatedEvent);
    
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const event = this.events.get(id);
    if (!event) return false;

    this.events.delete(id);
    await this.removeFromExternalCalendars(event);
    
    return true;
  }

  async getEvent(id: string): Promise<CalendarEvent | null> {
    return this.events.get(id) || null;
  }

  async getEventsForStaff(staffId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    let events = Array.from(this.events.values()).filter(event => event.staffId === staffId);
    
    if (startDate && endDate) {
      events = events.filter(event => 
        event.startDate >= startDate && event.endDate <= endDate
      );
    }
    
    return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async getEventsForClient(clientId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    let events = Array.from(this.events.values()).filter(event => event.clientId === clientId);
    
    if (startDate && endDate) {
      events = events.filter(event => 
        event.startDate >= startDate && event.endDate <= endDate
      );
    }
    
    return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  // Automatic event creation from system data
  async createWeeklyDeadlineEvents(staffId: string, week: number, year: number): Promise<void> {
    const clients = await databaseService.getClientsByStaffId(staffId);
    
    for (const client of clients) {
      const deadlineDate = this.getWeekDeadlineDate(week, year);
      
      const event: Omit<CalendarEvent, 'id'> = {
        title: `Veckodokumentation deadline - ${client.initials}`,
        description: `Slutför veckodokumentation för klient ${client.initials} för vecka ${week}, ${year}`,
        startDate: deadlineDate,
        endDate: deadlineDate,
        allDay: true,
        type: 'deadline',
        staffId,
        clientId: client.id,
        color: '#dc3545', // Red for deadlines
      };

      await this.createEvent(event);
    }
  }

  async createMonthlyDeadlineEvents(staffId: string, month: number, year: number): Promise<void> {
    const clients = await databaseService.getClientsByStaffId(staffId);
    
    for (const client of clients) {
      const deadlineDate = this.getMonthDeadlineDate(month, year);
      
      const event: Omit<CalendarEvent, 'id'> = {
        title: `Månadsrapport deadline - ${client.initials}`,
        description: `Slutför månadsrapport för klient ${client.initials} för ${month}/${year}`,
        startDate: deadlineDate,
        endDate: deadlineDate,
        allDay: true,
        type: 'deadline',
        staffId,
        clientId: client.id,
        color: '#dc3545', // Red for deadlines
      };

      await this.createEvent(event);
    }
  }

  async createQualityAssessmentReminders(staffId: string, clientId: string): Promise<void> {
    const client = await databaseService.getClient(clientId);
    if (!client) return;

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 7); // 1 week from now

    const event: Omit<CalendarEvent, 'id'> = {
      title: `Kvalitetsbedömning - ${client.initials}`,
      description: `Genomför kvalitetsbedömning för klient ${client.initials}`,
      startDate: reminderDate,
      endDate: reminderDate,
      allDay: true,
        type: 'reminder',
        staffId,
        clientId,
        color: '#ffc107', // Yellow for reminders
    };

    await this.createEvent(event);
  }

  // Calendar integration methods
  async enableIntegration(name: string, config: Record<string, any>): Promise<boolean> {
    const integration = this.integrations.get(name);
    if (!integration) return false;

    integration.config = { ...integration.config, ...config };
    integration.enabled = true;

    try {
      await this.testIntegration(name);
      return true;
    } catch (error) {
      integration.enabled = false;
      console.error(`Failed to enable ${name} integration:`, error);
      return false;
    }
  }

  async disableIntegration(name: string): Promise<boolean> {
    const integration = this.integrations.get(name);
    if (!integration) return false;

    integration.enabled = false;
    return true;
  }

  async testIntegration(name: string): Promise<boolean> {
    const integration = this.integrations.get(name);
    if (!integration || !integration.enabled) return false;

    switch (integration.type) {
      case 'google':
        return await this.testGoogleCalendarIntegration(integration);
      case 'outlook':
        return await this.testOutlookCalendarIntegration(integration);
      case 'ical':
        return await this.testICalIntegration(integration);
      default:
        return false;
    }
  }

  private async testGoogleCalendarIntegration(integration: CalendarIntegration): Promise<boolean> {
    // Implementation would use Google Calendar API
    // For now, return true if credentials are present
    return !!(integration.config.clientId && integration.config.clientSecret);
  }

  private async testOutlookCalendarIntegration(integration: CalendarIntegration): Promise<boolean> {
    // Implementation would use Microsoft Graph API
    // For now, return true if credentials are present
    return !!(integration.config.clientId && integration.config.clientSecret);
  }

  private async testICalIntegration(integration: CalendarIntegration): Promise<boolean> {
    // Implementation would test iCal feed URL
    // For now, return true if URL is present
    return !!integration.config.url;
  }

  // External calendar sync
  private async syncToExternalCalendars(event: CalendarEvent): Promise<void> {
    for (const [name, integration] of this.integrations) {
      if (integration.enabled) {
        try {
          await this.syncEventToIntegration(event, integration);
        } catch (error) {
          console.error(`Failed to sync event to ${name}:`, error);
        }
      }
    }
  }

  private async removeFromExternalCalendars(event: CalendarEvent): Promise<void> {
    for (const [name, integration] of this.integrations) {
      if (integration.enabled) {
        try {
          await this.removeEventFromIntegration(event, integration);
        } catch (error) {
          console.error(`Failed to remove event from ${name}:`, error);
        }
      }
    }
  }

  private async syncEventToIntegration(event: CalendarEvent, integration: CalendarIntegration): Promise<void> {
    // Implementation would sync to external calendar
    // This is a placeholder for the actual integration logic
    console.log(`Syncing event ${event.id} to ${integration.name}`);
  }

  private async removeEventFromIntegration(event: CalendarEvent, integration: CalendarIntegration): Promise<void> {
    // Implementation would remove from external calendar
    // This is a placeholder for the actual integration logic
    console.log(`Removing event ${event.id} from ${integration.name}`);
  }

  // Utility methods
  private getWeekDeadlineDate(week: number, year: number): Date {
    // Get the Sunday of the specified week
    const firstDayOfYear = new Date(year, 0, 1);
    const firstSunday = new Date(firstDayOfYear);
    
    // Find the first Sunday of the year
    while (firstSunday.getDay() !== 0) {
      firstSunday.setDate(firstSunday.getDate() + 1);
    }
    
    // Add weeks to get to the target week
    const targetDate = new Date(firstSunday);
    targetDate.setDate(targetDate.getDate() + (week - 1) * 7);
    
    return targetDate;
  }

  private getMonthDeadlineDate(month: number, year: number): Date {
    // Get the last day of the month
    return new Date(year, month, 0);
  }

  // Calendar export
  async exportToICal(staffId: string, startDate: Date, endDate: Date): Promise<string> {
    const events = await this.getEventsForStaff(staffId, startDate, endDate);
    
    let ical = `BEGIN:VCALENDAR\r\n`;
    ical += `VERSION:2.0\r\n`;
    ical += `PRODID:-//Uppföljningssystem//Calendar//SV\r\n`;
    ical += `CALSCALE:GREGORIAN\r\n`;
    ical += `METHOD:PUBLISH\r\n`;

    for (const event of events) {
      ical += `BEGIN:VEVENT\r\n`;
      ical += `UID:${event.id}\r\n`;
      ical += `DTSTAMP:${this.formatDateForICal(new Date())}\r\n`;
      ical += `DTSTART:${this.formatDateForICal(event.startDate)}\r\n`;
      ical += `DTEND:${this.formatDateForICal(event.endDate)}\r\n`;
      ical += `SUMMARY:${event.title}\r\n`;
      ical += `DESCRIPTION:${event.description}\r\n`;
      if (event.location) {
        ical += `LOCATION:${event.location}\r\n`;
      }
      ical += `END:VEVENT\r\n`;
    }

    ical += `END:VCALENDAR\r\n`;
    return ical;
  }

  private formatDateForICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  // Get integration status
  getIntegrations(): CalendarIntegration[] {
    return Array.from(this.integrations.values());
  }

  getIntegration(name: string): CalendarIntegration | null {
    return this.integrations.get(name) || null;
  }

  // Cleanup
  async close(): Promise<void> {
    // Cleanup any external connections
    for (const [name, integration] of this.integrations) {
      if (integration.enabled) {
        try {
          await this.disableIntegration(name);
        } catch (error) {
          console.error(`Error disabling ${name} integration:`, error);
        }
      }
    }
  }
}

export const calendarService = new CalendarService();