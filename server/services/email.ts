import nodemailer from "nodemailer";
import { databaseService } from "./database.js";
import type { User, Staff, Client } from "../../shared/schema.js";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    };
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransporter(this.config);
      
      // Verify connection
      try {
        await this.transporter.verify();
        console.log("Email service connected successfully");
      } catch (error) {
        console.error("Email service connection failed:", error);
        throw error;
      }
    }
    return this.transporter;
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      
      const mailOptions = {
        from: this.config.auth.user,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async sendWeeklyReminder(staffId: string): Promise<boolean> {
    try {
      const staff = await databaseService.getStaff(staffId);
      if (!staff) return false;

      const clients = await databaseService.getClientsByStaffId(staffId);
      if (clients.length === 0) return false;

      const currentDate = new Date();
      const currentWeek = this.getWeekNumber(currentDate);
      const currentYear = currentDate.getFullYear();

      const pendingClients = [];
      for (const client of clients) {
        const weeklyDoc = await databaseService.getWeeklyDocumentation(
          client.id,
          currentYear,
          currentWeek
        );
        if (!weeklyDoc || !weeklyDoc.approved) {
          pendingClients.push(client);
        }
      }

      if (pendingClients.length === 0) return false;

      const template = this.getWeeklyReminderTemplate(staff, pendingClients, currentWeek, currentYear);
      
      return await this.sendEmail(
        staff.epost || "",
        template.subject,
        template.html,
        template.text
      );
    } catch (error) {
      console.error("Failed to send weekly reminder:", error);
      return false;
    }
  }

  async sendMonthlyReportReminder(staffId: string): Promise<boolean> {
    try {
      const staff = await databaseService.getStaff(staffId);
      if (!staff) return false;

      const clients = await databaseService.getClientsByStaffId(staffId);
      if (clients.length === 0) return false;

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const pendingClients = [];
      for (const client of clients) {
        const monthlyReport = await databaseService.getMonthlyReport(
          client.id,
          currentYear,
          currentMonth
        );
        if (!monthlyReport || monthlyReport.status !== "completed") {
          pendingClients.push(client);
        }
      }

      if (pendingClients.length === 0) return false;

      const template = this.getMonthlyReportReminderTemplate(staff, pendingClients, currentMonth, currentYear);
      
      return await this.sendEmail(
        staff.epost || "",
        template.subject,
        template.html,
        template.text
      );
    } catch (error) {
      console.error("Failed to send monthly report reminder:", error);
      return false;
    }
  }

  async sendQualityAssessmentNotification(staffId: string, clientId: string, assessment: string): Promise<boolean> {
    try {
      const [staff, client] = await Promise.all([
        databaseService.getStaff(staffId),
        databaseService.getClient(clientId),
      ]);

      if (!staff || !client) return false;

      const template = this.getQualityAssessmentTemplate(staff, client, assessment);
      
      return await this.sendEmail(
        staff.epost || "",
        template.subject,
        template.html,
        template.text
      );
    } catch (error) {
      console.error("Failed to send quality assessment notification:", error);
      return false;
    }
  }

  async sendBulkNotification(
    recipients: string[],
    subject: string,
    message: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.sendEmail(recipient, subject, message);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  async sendSystemNotification(
    subject: string,
    message: string,
    adminEmails?: string[]
  ): Promise<boolean> {
    try {
      const recipients = adminEmails || await this.getAdminEmails();
      
      if (recipients.length === 0) {
        console.warn("No admin emails found for system notification");
        return false;
      }

      const template = this.getSystemNotificationTemplate(subject, message);
      
      for (const email of recipients) {
        await this.sendEmail(email, template.subject, template.html, template.text);
      }

      return true;
    } catch (error) {
      console.error("Failed to send system notification:", error);
      return false;
    }
  }

  private async getAdminEmails(): Promise<string[]> {
    // This would typically query the database for admin users
    // For now, return environment variable or empty array
    const adminEmails = process.env.ADMIN_EMAILS;
    return adminEmails ? adminEmails.split(",") : [];
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getWeeklyReminderTemplate(
    staff: Staff,
    pendingClients: Client[],
    week: number,
    year: number
  ): EmailTemplate {
    const subject = `Påminnelse: Veckodokumentation vecka ${week}, ${year}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Påminnelse: Veckodokumentation</h2>
        <p>Hej ${staff.name},</p>
        <p>Detta är en påminnelse om att du har oavslutad veckodokumentation för vecka ${week}, ${year}.</p>
        
        <h3 style="color: #34495e;">Klienter som behöver dokumentation:</h3>
        <ul>
          ${pendingClients.map(client => `<li>${client.initials}</li>`).join("")}
        </ul>
        
        <p>Vänligen logga in i systemet och slutför dokumentationen så snart som möjligt.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Deadline:</strong> Söndag vecka ${week}</p>
        </div>
        
        <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
      </div>
    `;

    const text = `
      Påminnelse: Veckodokumentation vecka ${week}, ${year}
      
      Hej ${staff.name},
      
      Detta är en påminnelse om att du har oavslutad veckodokumentation för vecka ${week}, ${year}.
      
      Klienter som behöver dokumentation:
      ${pendingClients.map(client => `- ${client.initials}`).join("\n")}
      
      Vänligen logga in i systemet och slutför dokumentationen så snart som möjligt.
      
      Deadline: Söndag vecka ${week}
      
      Med vänliga hälsningar,
      Uppföljningssystemet
    `;

    return { subject, html, text };
  }

  private getMonthlyReportReminderTemplate(
    staff: Staff,
    pendingClients: Client[],
    month: number,
    year: number
  ): EmailTemplate {
    const months = [
      "januari", "februari", "mars", "april", "maj", "juni",
      "juli", "augusti", "september", "oktober", "november", "december"
    ];
    
    const subject = `Påminnelse: Månadsrapport ${months[month - 1]} ${year}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Påminnelse: Månadsrapport</h2>
        <p>Hej ${staff.name},</p>
        <p>Detta är en påminnelse om att du har oavslutade månadsrapporter för ${months[month - 1]} ${year}.</p>
        
        <h3 style="color: #34495e;">Klienter som behöver rapport:</h3>
        <ul>
          ${pendingClients.map(client => `<li>${client.initials}</li>`).join("")}
        </ul>
        
        <p>Vänligen logga in i systemet och slutför rapporterna så snart som möjligt.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Deadline:</strong> Sista dagen i ${months[month - 1]}</p>
        </div>
        
        <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
      </div>
    `;

    const text = `
      Påminnelse: Månadsrapport ${months[month - 1]} ${year}
      
      Hej ${staff.name},
      
      Detta är en påminnelse om att du har oavslutade månadsrapporter för ${months[month - 1]} ${year}.
      
      Klienter som behöver rapport:
      ${pendingClients.map(client => `- ${client.initials}`).join("\n")}
      
      Vänligen logga in i systemet och slutför rapporterna så snart som möjligt.
      
      Deadline: Sista dagen i ${months[month - 1]}
      
      Med vänliga hälsningar,
      Uppföljningssystemet
    `;

    return { subject, html, text };
  }

  private getQualityAssessmentTemplate(
    staff: Staff,
    client: Client,
    assessment: string
  ): EmailTemplate {
    const subject = `Kvalitetsbedömning för ${client.initials}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Kvalitetsbedömning</h2>
        <p>Hej ${staff.name},</p>
        <p>En kvalitetsbedömning har gjorts för klienten ${client.initials}.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #34495e;">Bedömning:</h3>
          <p style="margin: 0; font-size: 18px;"><strong>${assessment}</strong></p>
        </div>
        
        <p>Vänligen logga in i systemet för att se detaljerna och eventuella åtgärder som behöver vidtas.</p>
        
        <p>Med vänliga hälsningar,<br>Kvalitetsteamet</p>
      </div>
    `;

    const text = `
      Kvalitetsbedömning för ${client.initials}
      
      Hej ${staff.name},
      
      En kvalitetsbedömning har gjorts för klienten ${client.initials}.
      
      Bedömning: ${assessment}
      
      Vänligen logga in i systemet för att se detaljerna och eventuella åtgärder som behöver vidtas.
      
      Med vänliga hälsningar,
      Kvalitetsteamet
    `;

    return { subject, html, text };
  }

  private getSystemNotificationTemplate(subject: string, message: string): EmailTemplate {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Systemmeddelande</h2>
        <h3 style="color: #34495e;">${subject}</h3>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;">${message}</p>
        </div>
        
        <p>Detta är ett automatiskt meddelande från uppföljningssystemet.</p>
        
        <p>Med vänliga hälsningar,<br>Systemet</p>
      </div>
    `;

    const text = `
      Systemmeddelande
      
      ${subject}
      
      ${message}
      
      Detta är ett automatiskt meddelande från uppföljningssystemet.
      
      Med vänliga hälsningar,
      Systemet
    `;

    return { subject: `Systemmeddelande: ${subject}`, html, text };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  async close(): Promise<void> {
    if (this.transporter) {
      await this.transporter.close();
      this.transporter = null;
    }
  }
}

export const emailService = new EmailService();