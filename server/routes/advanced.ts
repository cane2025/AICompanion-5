import { Router } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "../db.js";
import { 
  staff, 
  clients, 
  carePlans, 
  implementationPlans, 
  weeklyDocumentation, 
  monthlyReports, 
  vimsaTime
} from "../../shared/schema.js";
import { PDFService, type ReportData } from "../services/pdf.js";
import { 
  getEmailService, 
  sendCarePlanNotification, 
  sendMonthlyReportReminder,
  sendWeeklyDocReminder,
  sendBulkOperationNotification
} from "../services/email.js";
import { CalendarService } from "../services/calendar.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

export const advancedRoutes = Router();

// Apply authentication to all advanced routes
advancedRoutes.use(requireAuth);

// === PDF GENERATION ===
advancedRoutes.get("/pdf/monthly-report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get report with related data
    const [report] = await db
      .select({
        report: monthlyReports,
        client: clients,
        staff: staff
      })
      .from(monthlyReports)
      .leftJoin(clients, eq(monthlyReports.clientId, clients.id))
      .leftJoin(staff, eq(monthlyReports.staffId, staff.id))
      .where(eq(monthlyReports.id, id))
      .limit(1);
    
    if (!report) {
      return res.status(404).json({ error: "Rapport hittades inte" });
    }
    
    const reportData: ReportData = {
      client: {
        initials: report.client?.initials || 'Okänd',
        personalNumber: report.client?.personalNumber || undefined
      },
      staff: {
        name: report.staff?.name || 'Okänd',
        initials: report.staff?.initials || 'OK'
      },
      period: {
        year: report.report.year,
        month: report.report.month
      },
      content: report.report.reportContent || report.report.content || '',
      reportType: 'monthly',
      status: report.report.status || undefined,
      quality: report.report.quality || undefined,
      createdAt: report.report.createdAt || new Date()
    };
    
    const pdfBuffer = PDFService.generateMonthlyReport(reportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="månadsrapport-${report.client?.initials}-${reportData.period.year}-${reportData.period.month}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).json({ error: "Fel vid PDF-generering" });
  }
});

advancedRoutes.get("/pdf/weekly-documentation/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [doc] = await db
      .select({
        doc: weeklyDocumentation,
        client: clients,
        staff: staff
      })
      .from(weeklyDocumentation)
      .leftJoin(clients, eq(weeklyDocumentation.clientId, clients.id))
      .leftJoin(staff, eq(weeklyDocumentation.staffId, staff.id))
      .where(eq(weeklyDocumentation.id, id))
      .limit(1);
    
    if (!doc) {
      return res.status(404).json({ error: "Dokumentation hittades inte" });
    }
    
    const reportData: ReportData = {
      client: {
        initials: doc.client?.initials || 'Okänd',
        personalNumber: doc.client?.personalNumber || undefined
      },
      staff: {
        name: doc.staff?.name || 'Okänd',
        initials: doc.staff?.initials || 'OK'
      },
      period: {
        year: doc.doc.year,
        week: doc.doc.week
      },
      content: doc.doc.documentation || doc.doc.content || '',
      reportType: 'weekly',
      createdAt: doc.doc.createdAt || new Date()
    };
    
    const pdfBuffer = PDFService.generateWeeklyReport(reportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="veckodokumentation-${doc.client?.initials}-${reportData.period.year}-v${reportData.period.week}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).json({ error: "Fel vid PDF-generering" });
  }
});

advancedRoutes.get("/pdf/care-plan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [plan] = await db
      .select({
        plan: carePlans,
        client: clients,
        staff: staff
      })
      .from(carePlans)
      .leftJoin(clients, eq(carePlans.clientId, clients.id))
      .leftJoin(staff, eq(carePlans.staffId, staff.id))
      .where(eq(carePlans.id, id))
      .limit(1);
    
    if (!plan) {
      return res.status(404).json({ error: "Vårdplan hittades inte" });
    }
    
    const reportData: ReportData = {
      client: {
        initials: plan.client?.initials || 'Okänd',
        personalNumber: plan.client?.personalNumber || undefined
      },
      staff: {
        name: plan.staff?.name || 'Okänd',
        initials: plan.staff?.initials || 'OK'
      },
      period: {
        year: new Date(plan.plan.createdAt || new Date()).getFullYear()
      },
      content: `${plan.plan.planContent || ''}\n\nMål:\n${plan.plan.goals || ''}\n\nInterventioner:\n${plan.plan.interventions || ''}`,
      reportType: 'care-plan',
      status: plan.plan.status || undefined,
      createdAt: plan.plan.createdAt || new Date()
    };
    
    const pdfBuffer = PDFService.generateCarePlan(reportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vårdplan-${plan.client?.initials}-${format(new Date(reportData.createdAt), 'yyyy-MM-dd')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).json({ error: "Fel vid PDF-generering" });
  }
});

advancedRoutes.post("/pdf/bulk", requireRoles(['admin', 'staff']), async (req, res) => {
  try {
    const { reportIds, reportType } = req.body;
    
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ error: "Inga rapporter valda" });
    }
    
    let reports: any[] = [];
    
    if (reportType === 'monthly') {
      reports = await db
        .select({
          report: monthlyReports,
          client: clients,
          staff: staff
        })
        .from(monthlyReports)
        .leftJoin(clients, eq(monthlyReports.clientId, clients.id))
        .leftJoin(staff, eq(monthlyReports.staffId, staff.id))
        .where(sql`${monthlyReports.id} = ANY(${reportIds})`);
    } else if (reportType === 'weekly') {
      reports = await db
        .select({
          doc: weeklyDocumentation,
          client: clients,
          staff: staff
        })
        .from(weeklyDocumentation)
        .leftJoin(clients, eq(weeklyDocumentation.clientId, clients.id))
        .leftJoin(staff, eq(weeklyDocumentation.staffId, staff.id))
        .where(sql`${weeklyDocumentation.id} = ANY(${reportIds})`);
    }
    
    const reportDataList: ReportData[] = reports.map(report => {
      const isMonthly = reportType === 'monthly';
      const data = isMonthly ? report.report : report.doc;
      
      return {
        client: {
          initials: report.client?.initials || 'Okänd',
          personalNumber: report.client?.personalNumber || undefined
        },
        staff: {
          name: report.staff?.name || 'Okänd',
          initials: report.staff?.initials || 'OK'
        },
        period: {
          year: data.year,
          month: isMonthly ? data.month : undefined,
          week: !isMonthly ? data.week : undefined
        },
        content: data.reportContent || data.documentation || data.content || '',
        reportType: reportType as 'monthly' | 'weekly',
        status: data.status || undefined,
        quality: isMonthly ? data.quality : undefined,
        createdAt: data.createdAt || new Date()
      };
    });
    
    const pdfBuffer = PDFService.generateBulkReport(reportDataList);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sammanställd-rapport-${format(new Date(), 'yyyy-MM-dd')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Bulk PDF generation error:", error);
    return res.status(500).json({ error: "Fel vid bulk PDF-generering" });
  }
});

// === EMAIL NOTIFICATIONS ===
advancedRoutes.post("/notifications/care-plan", requireRoles(['admin', 'staff']), async (req, res) => {
  try {
    const { carePlanId, message } = req.body;
    
    const [plan] = await db
      .select({
        plan: carePlans,
        client: clients,
        staff: staff
      })
      .from(carePlans)
      .leftJoin(clients, eq(carePlans.clientId, clients.id))
      .leftJoin(staff, eq(carePlans.staffId, staff.id))
      .where(eq(carePlans.id, carePlanId))
      .limit(1);
    
    if (!plan || !plan.staff?.epost) {
      return res.status(404).json({ error: "Vårdplan eller e-postadress hittades inte" });
    }
    
    await sendCarePlanNotification({
      clientInitials: plan.client?.initials || 'Okänd',
      staffName: plan.staff.name,
      staffEmail: plan.staff.epost,
      status: plan.plan.status || 'okänd',
      comment: message,
      updatedAt: plan.plan.updatedAt?.toISOString() || new Date().toISOString()
    });
    
    return res.json({ message: "Notifiering skickad" });
  } catch (error) {
    console.error("Email notification error:", error);
    return res.status(500).json({ error: "Fel vid skickning av notifiering" });
  }
});

advancedRoutes.post("/notifications/monthly-report-reminder", requireRoles(['admin']), async (req, res) => {
  try {
    const { year, month } = req.body;
    
    // Get all pending monthly reports for the period
    const pendingReports = await db
      .select({
        report: monthlyReports,
        client: clients,
        staff: staff
      })
      .from(monthlyReports)
      .leftJoin(clients, eq(monthlyReports.clientId, clients.id))
      .leftJoin(staff, eq(monthlyReports.staffId, staff.id))
      .where(
        and(
          eq(monthlyReports.year, year),
          eq(monthlyReports.month, month),
          sql`${monthlyReports.status} != 'completed'`
        )
      );
    
    const notifications = pendingReports
      .filter(report => report.staff?.epost)
      .map(report => ({
        clientInitials: report.client?.initials || 'Okänd',
        staffEmail: report.staff!.epost,
        year,
        month,
        dueDate: new Date(year, month, 5).toISOString(),
        status: report.report.status || 'not_started'
      }));
    
    for (const notification of notifications) {
      await sendMonthlyReportReminder(notification);
    }
    
    return res.json({ message: `${notifications.length} påminnelser skickade` });
  } catch (error) {
    console.error("Monthly report reminder error:", error);
    return res.status(500).json({ error: "Fel vid skickning av påminnelser" });
  }
});

// === CALENDAR INTEGRATION ===
advancedRoutes.get("/calendar/events", async (req, res) => {
  try {
    const { startDate, endDate, staffId, type } = req.query;
    
    // Get all necessary data
    const [allClients, allCarePlans, allImplementationPlans] = await Promise.all([
      db.select().from(clients).where(sql`${clients.deletedAt} IS NULL`),
      db.select().from(carePlans),
      db.select().from(implementationPlans)
    ]);
    
    // Generate different types of events
    let events = [
      ...CalendarService.generateCarePlanEvents(allCarePlans),
      ...CalendarService.generateMonthlyReportEvents(allClients, new Date().getFullYear()),
      ...CalendarService.generateWeeklyDocEvents(allClients, new Date().getFullYear()),
      ...CalendarService.generateFollowUpEvents(allImplementationPlans)
    ];
    
    // Filter by date range if provided
    if (startDate && endDate) {
      events = CalendarService.getEventsForDateRange(
        events, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    }
    
    // Filter by staff if provided
    if (staffId && typeof staffId === "string") {
      events = events.filter(event => event.staffId === staffId);
    }
    
    // Filter by type if provided
    if (type && typeof type === "string") {
      events = events.filter(event => event.type === type);
    }
    
    return res.json(events);
  } catch (error) {
    console.error("Calendar events error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av kalenderhändelser" });
  }
});

advancedRoutes.get("/calendar/month/:year/:month", async (req, res) => {
  try {
    const { year, month } = req.params;
    const { staffId } = req.query;
    
    // Get all necessary data
    const [allClients, allCarePlans, allImplementationPlans] = await Promise.all([
      db.select().from(clients).where(sql`${clients.deletedAt} IS NULL`),
      db.select().from(carePlans),
      db.select().from(implementationPlans)
    ]);
    
    // Generate events
    let events = [
      ...CalendarService.generateCarePlanEvents(allCarePlans),
      ...CalendarService.generateMonthlyReportEvents(allClients, parseInt(year)),
      ...CalendarService.generateWeeklyDocEvents(allClients, parseInt(year)),
      ...CalendarService.generateFollowUpEvents(allImplementationPlans)
    ];
    
    // Filter by staff if provided
    if (staffId && typeof staffId === "string") {
      events = events.filter(event => event.staffId === staffId);
    }
    
    const monthlyData = CalendarService.getMonthlyCalendarData(events, parseInt(year), parseInt(month));
    
    return res.json(monthlyData);
  } catch (error) {
    console.error("Monthly calendar error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av månadskalender" });
  }
});

advancedRoutes.get("/calendar/upcoming", async (req, res) => {
  try {
    const { days = 30, staffId } = req.query;
    
    // Get all necessary data
    const [allClients, allCarePlans, allImplementationPlans] = await Promise.all([
      db.select().from(clients).where(sql`${clients.deletedAt} IS NULL`),
      db.select().from(carePlans),
      db.select().from(implementationPlans)
    ]);
    
    // Generate events
    let events = [
      ...CalendarService.generateCarePlanEvents(allCarePlans),
      ...CalendarService.generateMonthlyReportEvents(allClients, new Date().getFullYear()),
      ...CalendarService.generateWeeklyDocEvents(allClients, new Date().getFullYear()),
      ...CalendarService.generateFollowUpEvents(allImplementationPlans)
    ];
    
    // Filter by staff if provided
    if (staffId && typeof staffId === "string") {
      events = events.filter(event => event.staffId === staffId);
    }
    
    const upcomingEvents = CalendarService.getUpcomingEvents(events, parseInt(days as string));
    
    return res.json(upcomingEvents);
  } catch (error) {
    console.error("Upcoming events error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av kommande händelser" });
  }
});

advancedRoutes.get("/calendar/overdue", async (req, res) => {
  try {
    const { staffId } = req.query;
    
    // Get all necessary data
    const [allClients, allCarePlans, allImplementationPlans] = await Promise.all([
      db.select().from(clients).where(sql`${clients.deletedAt} IS NULL`),
      db.select().from(carePlans),
      db.select().from(implementationPlans)
    ]);
    
    // Generate events
    let events = [
      ...CalendarService.generateCarePlanEvents(allCarePlans),
      ...CalendarService.generateMonthlyReportEvents(allClients, new Date().getFullYear()),
      ...CalendarService.generateWeeklyDocEvents(allClients, new Date().getFullYear()),
      ...CalendarService.generateFollowUpEvents(allImplementationPlans)
    ];
    
    // Filter by staff if provided
    if (staffId && typeof staffId === "string") {
      events = events.filter(event => event.staffId === staffId);
    }
    
    const overdueEvents = CalendarService.getOverdueEvents(events);
    
    return res.json(overdueEvents);
  } catch (error) {
    console.error("Overdue events error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av försenade händelser" });
  }
});

advancedRoutes.get("/calendar/export", async (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    
    // Get all necessary data
    const [allClients, allCarePlans, allImplementationPlans] = await Promise.all([
      db.select().from(clients).where(sql`${clients.deletedAt} IS NULL`),
      db.select().from(carePlans),
      db.select().from(implementationPlans)
    ]);
    
    // Generate events
    let events = [
      ...CalendarService.generateCarePlanEvents(allCarePlans),
      ...CalendarService.generateMonthlyReportEvents(allClients, new Date().getFullYear()),
      ...CalendarService.generateWeeklyDocEvents(allClients, new Date().getFullYear()),
      ...CalendarService.generateFollowUpEvents(allImplementationPlans)
    ];
    
    // Filter by date range if provided
    if (startDate && endDate) {
      events = CalendarService.getEventsForDateRange(
        events, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    }
    
    // Filter by staff if provided
    if (staffId && typeof staffId === "string") {
      events = events.filter(event => event.staffId === staffId);
    }
    
    const icalData = CalendarService.generateICalendar(events);
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="kalender-${format(new Date(), 'yyyy-MM-dd')}.ics"`);
    res.send(icalData);
  } catch (error) {
    console.error("Calendar export error:", error);
    return res.status(500).json({ error: "Fel vid export av kalender" });
  }
});

// === DATA EXPORT/IMPORT ===
advancedRoutes.get("/export/data", requireRoles(['admin']), async (req, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;
    
    let data: any = {};
    
    if (!type || type === 'all') {
      // Export all data
      data = {
        staff: await db.select().from(staff).where(sql`${staff.deletedAt} IS NULL`),
        clients: await db.select().from(clients).where(sql`${clients.deletedAt} IS NULL`),
        carePlans: await db.select().from(carePlans),
        implementationPlans: await db.select().from(implementationPlans),
        weeklyDocumentation: await db.select().from(weeklyDocumentation),
        monthlyReports: await db.select().from(monthlyReports),
        vimsaTime: await db.select().from(vimsaTime),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } else {
      // Export specific type
      switch (type) {
        case 'staff':
          data.staff = await db.select().from(staff).where(sql`${staff.deletedAt} IS NULL`);
          break;
        case 'clients':
          data.clients = await db.select().from(clients).where(sql`${clients.deletedAt} IS NULL`);
          break;
        case 'care-plans':
          data.carePlans = await db.select().from(carePlans);
          break;
        case 'monthly-reports':
          data.monthlyReports = await db.select().from(monthlyReports);
          break;
        case 'weekly-documentation':
          data.weeklyDocumentation = await db.select().from(weeklyDocumentation);
          break;
        default:
          return res.status(400).json({ error: "Ogiltig exporttyp" });
      }
    }
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="export-${type}-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="export-${type}-${format(new Date(), 'yyyy-MM-dd')}.json"`);
      res.json(data);
    }
  } catch (error) {
    console.error("Data export error:", error);
    return res.status(500).json({ error: "Fel vid dataexport" });
  }
});

advancedRoutes.post("/import/data", requireRoles(['admin']), async (req, res) => {
  try {
    const { data, type, overwrite = false } = req.body;
    
    if (!data || !type) {
      return res.status(400).json({ error: "Data och typ måste anges" });
    }
    
    let importedCount = 0;
    
    switch (type) {
      case 'staff':
        if (overwrite) {
          await db.delete(staff);
        }
        const staffResult = await db.insert(staff).values(data.staff || data).returning();
        importedCount = staffResult.length;
        break;
        
      case 'clients':
        if (overwrite) {
          await db.delete(clients);
        }
        const clientResult = await db.insert(clients).values(data.clients || data).returning();
        importedCount = clientResult.length;
        break;
        
      case 'care-plans':
        if (overwrite) {
          await db.delete(carePlans);
        }
        const carePlanResult = await db.insert(carePlans).values(data.carePlans || data).returning();
        importedCount = carePlanResult.length;
        break;
        
      default:
        return res.status(400).json({ error: "Ogiltig importtyp" });
    }
    
    return res.json({ 
      message: `${importedCount} objekt importerade`,
      count: importedCount
    });
  } catch (error) {
    console.error("Data import error:", error);
    return res.status(500).json({ error: "Fel vid dataimport" });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  if (!data || typeof data !== 'object') {
    return '';
  }
  
  // Handle single array
  if (Array.isArray(data)) {
    return arrayToCSV(data);
  }
  
  // Handle object with multiple arrays
  let csv = '';
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0) {
      csv += `${key.toUpperCase()}\n`;
      csv += arrayToCSV(value);
      csv += '\n\n';
    }
  }
  
  return csv;
}

function arrayToCSV(array: any[]): string {
  if (array.length === 0) return '';
  
  const headers = Object.keys(array[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = array.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

export default advancedRoutes;
