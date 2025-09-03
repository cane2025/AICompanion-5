import { addDays, addWeeks, addMonths, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { sv } from 'date-fns/locale';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'care-plan-due' | 'monthly-report-due' | 'weekly-doc-due' | 'follow-up' | 'meeting';
  clientId?: string;
  staffId?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  metadata?: any;
}

export interface CalendarReminder {
  eventId: string;
  reminderDate: Date;
  type: 'email' | 'system' | 'both';
  sent: boolean;
}

export class CalendarService {
  // Generate recurring events for care plan reviews
  static generateCarePlanEvents(carePlans: any[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    
    for (const plan of carePlans) {
      if (plan.isActive && plan.status !== 'completed') {
        // Generate quarterly review events
        const createdDate = new Date(plan.createdAt);
        for (let i = 1; i <= 4; i++) {
          const reviewDate = addMonths(createdDate, i * 3);
          
          events.push({
            id: `care-plan-review-${plan.id}-${i}`,
            title: `Vårdplansgranskning - ${plan.clientInitials || 'Klient'}`,
            description: `Kvartalsgranskning av vårdplan för klient`,
            start: reviewDate,
            end: addDays(reviewDate, 1),
            type: 'care-plan-due',
            clientId: plan.clientId,
            staffId: plan.staffId,
            priority: 'high',
            status: reviewDate < new Date() ? 'overdue' : 'pending',
            metadata: { carePlanId: plan.id, quarter: i }
          });
        }
      }
    }
    
    return events;
  }
  
  // Generate monthly report deadlines
  static generateMonthlyReportEvents(clients: any[], year: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    
    for (const client of clients) {
      if (client.status === 'active') {
        for (let month = 1; month <= 12; month++) {
          // Monthly reports are due on the 5th of the following month
          const dueDate = new Date(year, month, 5);
          
          events.push({
            id: `monthly-report-${client.id}-${year}-${month}`,
            title: `Månadsrapport - ${client.initials}`,
            description: `Månadsrapport för ${format(new Date(year, month - 1), 'MMMM yyyy', { locale: sv })}`,
            start: dueDate,
            end: addDays(dueDate, 1),
            type: 'monthly-report-due',
            clientId: client.id,
            staffId: client.staffId,
            priority: 'high',
            status: dueDate < new Date() ? 'overdue' : 'pending',
            metadata: { year, month }
          });
        }
      }
    }
    
    return events;
  }
  
  // Generate weekly documentation reminders
  static generateWeeklyDocEvents(clients: any[], year: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    
    for (const client of clients) {
      if (client.status === 'active') {
        // Generate events for each week of the year
        for (let week = 1; week <= 52; week++) {
          const weekStart = startOfWeek(new Date(year, 0, 1 + (week - 1) * 7));
          const weekEnd = endOfWeek(weekStart);
          
          // Documentation due on Monday of the following week
          const dueDate = addWeeks(weekEnd, 1);
          
          events.push({
            id: `weekly-doc-${client.id}-${year}-${week}`,
            title: `Veckodokumentation - ${client.initials}`,
            description: `Veckodokumentation för vecka ${week}, ${year}`,
            start: dueDate,
            end: addDays(dueDate, 1),
            type: 'weekly-doc-due',
            clientId: client.id,
            staffId: client.staffId,
            priority: 'medium',
            status: dueDate < new Date() ? 'overdue' : 'pending',
            metadata: { year, week }
          });
        }
      }
    }
    
    return events;
  }
  
  // Generate follow-up events from implementation plans
  static generateFollowUpEvents(implementationPlans: any[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    
    for (const plan of implementationPlans) {
      if (plan.isActive && plan.followUpSchedule) {
        try {
          const schedule = JSON.parse(plan.followUpSchedule);
          
          schedule.forEach((followUp: any, index: number) => {
            if (followUp.date) {
              events.push({
                id: `follow-up-${plan.id}-${index}`,
                title: `Uppföljning - ${plan.clientInitials || 'Klient'}`,
                description: followUp.description || 'Uppföljning av genomförandeplan',
                start: new Date(followUp.date),
                end: addDays(new Date(followUp.date), 1),
                type: 'follow-up',
                clientId: plan.clientId,
                staffId: plan.staffId,
                priority: followUp.priority || 'medium',
                status: followUp.completed ? 'completed' : (new Date(followUp.date) < new Date() ? 'overdue' : 'pending'),
                metadata: { implementationPlanId: plan.id, followUpIndex: index }
              });
            }
          });
        } catch (error) {
          console.error('Error parsing follow-up schedule:', error);
        }
      }
    }
    
    return events;
  }
  
  // Get events for a specific date range
  static getEventsForDateRange(events: CalendarEvent[], startDate: Date, endDate: Date): CalendarEvent[] {
    return events.filter(event => 
      event.start >= startDate && event.start <= endDate
    ).sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  
  // Get upcoming events (next 30 days)
  static getUpcomingEvents(events: CalendarEvent[], days: number = 30): CalendarEvent[] {
    const now = new Date();
    const futureDate = addDays(now, days);
    
    return this.getEventsForDateRange(events, now, futureDate);
  }
  
  // Get overdue events
  static getOverdueEvents(events: CalendarEvent[]): CalendarEvent[] {
    const now = new Date();
    
    return events.filter(event => 
      event.start < now && event.status !== 'completed'
    ).sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  
  // Generate calendar data for a specific month
  static getMonthlyCalendarData(events: CalendarEvent[], year: number, month: number) {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    
    const monthEvents = this.getEventsForDateRange(events, monthStart, monthEnd);
    
    // Group events by date
    const eventsByDate: { [key: string]: CalendarEvent[] } = {};
    
    monthEvents.forEach(event => {
      const dateKey = format(event.start, 'yyyy-MM-dd');
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });
    
    return {
      year,
      month,
      events: monthEvents,
      eventsByDate,
      summary: {
        total: monthEvents.length,
        overdue: monthEvents.filter(e => e.status === 'overdue').length,
        pending: monthEvents.filter(e => e.status === 'pending').length,
        completed: monthEvents.filter(e => e.status === 'completed').length,
      }
    };
  }
  
  // Generate iCal format for export
  static generateICalendar(events: CalendarEvent[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vårdplanering//Calendar//SV',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    events.forEach(event => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.id}@vardplanering.se`);
      lines.push(`DTSTART:${format(event.start, "yyyyMMdd'T'HHmmss'Z'")}`);
      lines.push(`DTEND:${format(event.end, "yyyyMMdd'T'HHmmss'Z'")}`);
      lines.push(`SUMMARY:${event.title}`);
      if (event.description) {
        lines.push(`DESCRIPTION:${event.description}`);
      }
      lines.push(`STATUS:${event.status.toUpperCase()}`);
      lines.push(`PRIORITY:${event.priority === 'high' ? '1' : event.priority === 'medium' ? '5' : '9'}`);
      lines.push('END:VEVENT');
    });
    
    lines.push('END:VCALENDAR');
    
    return lines.join('\r\n');
  }
  
  // Create reminders for upcoming events
  static createReminders(events: CalendarEvent[], reminderDays: number = 3): CalendarReminder[] {
    const reminders: CalendarReminder[] = [];
    const now = new Date();
    
    events.forEach(event => {
      if (event.status === 'pending' && event.start > now) {
        const reminderDate = addDays(event.start, -reminderDays);
        
        if (reminderDate > now) {
          reminders.push({
            eventId: event.id,
            reminderDate,
            type: 'both',
            sent: false
          });
        }
      }
    });
    
    return reminders;
  }
}
