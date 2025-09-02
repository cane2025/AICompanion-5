import cron from "node-cron";
import { dbStorage } from "../dbStorage.js";
import { emailService } from "./emailService.js";
import { format, startOfWeek, endOfWeek, addDays, isMonday, isFriday, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";

export class ScheduledTasksService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  start() {
    if (process.env.ENABLE_SCHEDULED_TASKS !== "true") {
      console.log("Scheduled tasks are disabled");
      return;
    }

    console.log("Starting scheduled tasks...");

    // Daily morning check at 8:00 AM
    this.scheduleTask("dailyMorningCheck", "0 8 * * *", this.dailyMorningCheck.bind(this));

    // Weekly documentation reminder - Every Monday at 9:00 AM
    this.scheduleTask("weeklyDocReminder", "0 9 * * 1", this.weeklyDocumentationReminder.bind(this));

    // Weekly documentation deadline - Every Friday at 3:00 PM
    this.scheduleTask("weeklyDocDeadline", "0 15 * * 5", this.weeklyDocumentationDeadline.bind(this));

    // Monthly report reminder - 25th of each month at 10:00 AM
    this.scheduleTask("monthlyReportReminder", "0 10 25 * *", this.monthlyReportReminder.bind(this));

    // Daily summary email - Every weekday at 5:00 PM
    this.scheduleTask("dailySummary", "0 17 * * 1-5", this.dailySummaryEmail.bind(this));

    // Care plan follow-up check - Every day at 10:00 AM
    this.scheduleTask("carePlanFollowUp", "0 10 * * *", this.carePlanFollowUpCheck.bind(this));

    console.log("Scheduled tasks started");
  }

  stop() {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });
    this.tasks.clear();
  }

  private scheduleTask(name: string, schedule: string, handler: () => Promise<void>) {
    const task = cron.schedule(schedule, async () => {
      try {
        console.log(`Running scheduled task: ${name}`);
        await handler();
        console.log(`Completed scheduled task: ${name}`);
      } catch (error) {
        console.error(`Error in scheduled task ${name}:`, error);
      }
    });

    this.tasks.set(name, task);
    task.start();
  }

  private async dailyMorningCheck() {
    const today = new Date();
    const staff = await dbStorage.getAllStaff();
    
    for (const staffMember of staff) {
      if (!staffMember.epost) continue;

      // Get all active clients for this staff member
      const clients = await dbStorage.getClientsByStaffId(staffMember.id!);
      const activeClients = clients.filter(c => c.status === "active");

      // Check for pending tasks
      const pendingTasks = await this.getPendingTasksForStaff(staffMember.id!, activeClients);

      if (pendingTasks.length > 0) {
        // Send reminder email
        await emailService.sendCustomEmail(
          staffMember.epost,
          `Påminnelse: Du har ${pendingTasks.length} väntande uppgifter`,
          this.generatePendingTasksEmail(staffMember.name, pendingTasks)
        );
      }
    }
  }

  private async weeklyDocumentationReminder() {
    const currentWeek = this.getWeekNumber(new Date());
    const currentYear = new Date().getFullYear();
    
    const staff = await dbStorage.getAllStaff();
    
    for (const staffMember of staff) {
      if (!staffMember.epost) continue;

      const clients = await dbStorage.getClientsByStaffId(staffMember.id!);
      const activeClients = clients.filter(c => c.status === "active");

      for (const client of activeClients) {
        // Check if documentation exists for current week
        const doc = await dbStorage.getWeeklyDocumentationByWeek(
          client.id!,
          currentYear,
          currentWeek
        );

        if (!doc || !doc.approved) {
          await emailService.sendEmail(
            staffMember.epost,
            "weeklyDocumentationReminder",
            staffMember.name,
            client.initials,
            currentWeek,
            currentYear
          );
        }
      }
    }
  }

  private async weeklyDocumentationDeadline() {
    const currentWeek = this.getWeekNumber(new Date());
    const currentYear = new Date().getFullYear();
    
    const allDocs = await dbStorage.getAllWeeklyDocumentation();
    const currentWeekDocs = allDocs.filter(
      d => d.year === currentYear && d.week === currentWeek && !d.approved
    );

    // Group by staff
    const docsByStaff = new Map<string, any[]>();
    
    for (const doc of currentWeekDocs) {
      if (!docsByStaff.has(doc.staffId)) {
        docsByStaff.set(doc.staffId, []);
      }
      docsByStaff.get(doc.staffId)!.push(doc);
    }

    // Send deadline reminders
    for (const [staffId, docs] of docsByStaff) {
      const staff = await dbStorage.getStaff(staffId);
      if (!staff || !staff.epost) continue;

      const clientList = await Promise.all(
        docs.map(async d => {
          const client = await dbStorage.getClient(d.clientId);
          return client?.initials || "Unknown";
        })
      );

      await emailService.sendCustomEmail(
        staff.epost,
        `DEADLINE: ${docs.length} veckodokumentationer måste slutföras idag`,
        this.generateDeadlineEmail(staff.name, clientList, currentWeek, currentYear)
      );
    }
  }

  private async monthlyReportReminder() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthName = format(new Date(), "MMMM", { locale: sv });
    
    const staff = await dbStorage.getAllStaff();
    
    for (const staffMember of staff) {
      if (!staffMember.epost) continue;

      const clients = await dbStorage.getClientsByStaffId(staffMember.id!);
      const activeClients = clients.filter(c => c.status === "active");

      const pendingReports: string[] = [];

      for (const client of activeClients) {
        const report = await dbStorage.getMonthlyReportByMonth(
          client.id!,
          currentYear,
          currentMonth
        );

        if (!report || report.status !== "completed") {
          pendingReports.push(client.initials);
        }
      }

      if (pendingReports.length > 0) {
        await emailService.sendCustomEmail(
          staffMember.epost,
          `Månadsrapporter förfaller snart - ${monthName} ${currentYear}`,
          this.generateMonthlyReportReminderEmail(
            staffMember.name,
            pendingReports,
            monthName,
            currentYear
          )
        );
      }
    }
  }

  private async dailySummaryEmail() {
    const staff = await dbStorage.getAllStaff();
    
    for (const staffMember of staff) {
      if (!staffMember.epost) continue;

      const stats = await this.getStaffDailyStats(staffMember.id!);
      
      if (stats.hasActivity) {
        await emailService.sendEmail(
          staffMember.epost,
          "dailySummary",
          staffMember.name,
          stats
        );
      }
    }
  }

  private async carePlanFollowUpCheck() {
    const today = new Date();
    const plans = await dbStorage.getAllCarePlans();
    const activePlans = plans.filter(p => p.isActive);

    for (const plan of activePlans) {
      const staff = await dbStorage.getStaff(plan.staffId);
      if (!staff || !staff.epost) continue;

      const client = await dbStorage.getClient(plan.clientId);
      if (!client) continue;

      // Check if follow-up is needed (example: 30 days after creation)
      const planDate = new Date(plan.createdAt!);
      const daysSinceCreation = Math.floor((today.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceCreation % 30 === 0 && daysSinceCreation > 0) {
        await emailService.sendCustomEmail(
          staff.epost,
          `Uppföljning krävs: Genomförandeplan för ${client.initials}`,
          this.generateCarePlanFollowUpEmail(
            staff.name,
            client.initials,
            plan.id!,
            daysSinceCreation
          )
        );
      }
    }
  }

  // Helper methods
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private async getPendingTasksForStaff(staffId: string, clients: any[]): Promise<any[]> {
    const tasks: any[] = [];
    const currentWeek = this.getWeekNumber(new Date());
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    for (const client of clients) {
      // Check weekly documentation
      const weeklyDoc = await dbStorage.getWeeklyDocumentationByWeek(
        client.id!,
        currentYear,
        currentWeek
      );
      
      if (!weeklyDoc || !weeklyDoc.approved) {
        tasks.push({
          type: "weekly_documentation",
          client: client.initials,
          week: currentWeek,
        });
      }

      // Check monthly report (if it's after 20th of month)
      if (new Date().getDate() >= 20) {
        const monthlyReport = await dbStorage.getMonthlyReportByMonth(
          client.id!,
          currentYear,
          currentMonth
        );
        
        if (!monthlyReport || monthlyReport.status !== "completed") {
          tasks.push({
            type: "monthly_report",
            client: client.initials,
            month: format(new Date(), "MMMM", { locale: sv }),
          });
        }
      }
    }

    return tasks;
  }

  private async getStaffDailyStats(staffId: string) {
    const clients = await dbStorage.getClientsByStaffId(staffId);
    const activeClients = clients.filter(c => c.status === "active").length;
    
    const currentWeek = this.getWeekNumber(new Date());
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Count weekly docs for current week
    let weeklyDocs = 0;
    for (const client of clients) {
      const doc = await dbStorage.getWeeklyDocumentationByWeek(
        client.id!,
        currentYear,
        currentWeek
      );
      if (doc) weeklyDocs++;
    }

    // Count pending monthly reports
    let monthlyReportsDue = 0;
    if (new Date().getDate() >= 20) {
      for (const client of clients) {
        const report = await dbStorage.getMonthlyReportByMonth(
          client.id!,
          currentYear,
          currentMonth
        );
        if (!report || report.status !== "completed") {
          monthlyReportsDue++;
        }
      }
    }

    // Count pending care plans and follow-ups
    const carePlans = await dbStorage.getCarePlansByStaff(staffId);
    const pendingCarePlans = carePlans.filter(p => p.status === "received").length;
    
    const implementationPlans = await dbStorage.getImplementationPlansByStaff(staffId);
    const pendingFollowUps = implementationPlans.filter(
      p => p.isActive && (!p.followup1 || !p.followup2)
    ).length;

    return {
      activeClients,
      weeklyDocs,
      monthlyReportsDue,
      pendingCarePlans,
      pendingFollowUps,
      hasActivity: activeClients > 0,
    };
  }

  // Email template generators
  private generatePendingTasksEmail(staffName: string, tasks: any[]): string {
    const tasksByType = tasks.reduce((acc, task) => {
      if (!acc[task.type]) acc[task.type] = [];
      acc[task.type].push(task);
      return acc;
    }, {} as Record<string, any[]>);

    let html = `
      <h2>Hej ${staffName},</h2>
      <p>Här är en sammanfattning av dina väntande uppgifter:</p>
    `;

    if (tasksByType.weekly_documentation) {
      html += `
        <h3>Veckodokumentation som behöver slutföras:</h3>
        <ul>
          ${tasksByType.weekly_documentation.map(t => 
            `<li>${t.client} - Vecka ${t.week}</li>`
          ).join("")}
        </ul>
      `;
    }

    if (tasksByType.monthly_report) {
      html += `
        <h3>Månadsrapporter som behöver slutföras:</h3>
        <ul>
          ${tasksByType.monthly_report.map(t => 
            `<li>${t.client} - ${t.month}</li>`
          ).join("")}
        </ul>
      `;
    }

    html += `
      <p>Vänligen logga in i systemet för att slutföra dessa uppgifter.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `;

    return html;
  }

  private generateDeadlineEmail(
    staffName: string, 
    clients: string[], 
    week: number, 
    year: number
  ): string {
    return `
      <h2>Hej ${staffName},</h2>
      <p><strong>VIKTIGT:</strong> Följande veckodokumentationer för vecka ${week}, ${year} måste slutföras idag:</p>
      <ul>
        ${clients.map(client => `<li>${client}</li>`).join("")}
      </ul>
      <p>Deadline är kl. 17:00 idag.</p>
      <p>Vänligen logga in omedelbart och slutför dokumentationen.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `;
  }

  private generateMonthlyReportReminderEmail(
    staffName: string,
    clients: string[],
    month: string,
    year: number
  ): string {
    return `
      <h2>Hej ${staffName},</h2>
      <p>Månadsrapporter för ${month} ${year} förfaller snart.</p>
      <p>Följande klienter saknar färdiga rapporter:</p>
      <ul>
        ${clients.map(client => `<li>${client}</li>`).join("")}
      </ul>
      <p>Vänligen se till att alla rapporter är klara senast den sista dagen i månaden.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `;
  }

  private generateCarePlanFollowUpEmail(
    staffName: string,
    clientInitials: string,
    planId: string,
    daysSince: number
  ): string {
    return `
      <h2>Hej ${staffName},</h2>
      <p>Det har gått ${daysSince} dagar sedan genomförandeplanen för ${clientInitials} skapades.</p>
      <p>Det är dags för en uppföljning av planen.</p>
      <p>Plan-ID: ${planId}</p>
      <p>Vänligen granska planen och gör nödvändiga uppdateringar.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `;
  }
}

// Export singleton instance
export const scheduledTasksService = new ScheduledTasksService();