import nodemailer from "nodemailer";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

// Email templates
const emailTemplates = {
  welcomeUser: (username: string, email: string) => ({
    subject: "Välkommen till Uppföljningssystemet",
    html: `
      <h2>Välkommen ${username}!</h2>
      <p>Ditt konto har skapats framgångsrikt.</p>
      <p>Du kan nu logga in med din e-postadress: ${email}</p>
      <p>Om du har några frågor, kontakta administratören.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `,
  }),

  passwordReset: (username: string, resetToken: string) => ({
    subject: "Återställ ditt lösenord",
    html: `
      <h2>Hej ${username},</h2>
      <p>Vi har fått en begäran om att återställa ditt lösenord.</p>
      <p>Klicka på länken nedan för att återställa ditt lösenord:</p>
      <a href="${process.env.APP_URL}/reset-password?token=${resetToken}">Återställ lösenord</a>
      <p>Länken är giltig i 1 timme.</p>
      <p>Om du inte begärt detta, ignorera detta e-postmeddelande.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `,
  }),

  weeklyDocumentationReminder: (staffName: string, clientInitials: string, week: number, year: number) => ({
    subject: `Påminnelse: Veckodokumentation för ${clientInitials} - Vecka ${week}, ${year}`,
    html: `
      <h2>Hej ${staffName},</h2>
      <p>Detta är en påminnelse om att veckodokumentationen för klient ${clientInitials} för vecka ${week}, ${year} behöver slutföras.</p>
      <p>Vänligen logga in i systemet och slutför dokumentationen så snart som möjligt.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `,
  }),

  monthlyReportDue: (staffName: string, clientInitials: string, month: string, year: number) => ({
    subject: `Månadsrapport förfaller: ${clientInitials} - ${month} ${year}`,
    html: `
      <h2>Hej ${staffName},</h2>
      <p>Månadsrapporten för klient ${clientInitials} för ${month} ${year} förfaller snart.</p>
      <p>Vänligen se till att rapporten är klar och godkänd innan månadens slut.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `,
  }),

  carePlanNotification: (staffName: string, clientInitials: string, action: string) => ({
    subject: `Genomförandeplan ${action}: ${clientInitials}`,
    html: `
      <h2>Hej ${staffName},</h2>
      <p>En genomförandeplan för klient ${clientInitials} har ${action}.</p>
      <p>Vänligen logga in i systemet för att granska och vidta nödvändiga åtgärder.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `,
  }),

  reportApproved: (staffName: string, reportType: string, clientInitials: string, period: string) => ({
    subject: `${reportType} godkänd: ${clientInitials} - ${period}`,
    html: `
      <h2>Hej ${staffName},</h2>
      <p>Din ${reportType.toLowerCase()} för klient ${clientInitials} för perioden ${period} har godkänts.</p>
      <p>Tack för ditt arbete!</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `,
  }),

  reportRejected: (staffName: string, reportType: string, clientInitials: string, period: string, reason: string) => ({
    subject: `${reportType} kräver revidering: ${clientInitials} - ${period}`,
    html: `
      <h2>Hej ${staffName},</h2>
      <p>Din ${reportType.toLowerCase()} för klient ${clientInitials} för perioden ${period} kräver revidering.</p>
      <p><strong>Anledning:</strong> ${reason}</p>
      <p>Vänligen logga in i systemet och gör nödvändiga korrigeringar.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `,
  }),

  dailySummary: (staffName: string, stats: any) => ({
    subject: `Daglig sammanfattning - ${format(new Date(), "d MMMM yyyy", { locale: sv })}`,
    html: `
      <h2>Hej ${staffName},</h2>
      <h3>Här är din dagliga sammanfattning:</h3>
      <ul>
        <li>Aktiva klienter: ${stats.activeClients}</li>
        <li>Veckodokumentationer denna vecka: ${stats.weeklyDocs}</li>
        <li>Månadsrapporter som förfaller: ${stats.monthlyReportsDue}</li>
        <li>Väntande genomförandeplaner: ${stats.pendingCarePlans}</li>
        <li>Obehandlade uppföljningar: ${stats.pendingFollowUps}</li>
      </ul>
      <p>Logga in i systemet för mer information.</p>
      <br>
      <p>Med vänliga hälsningar,<br>Uppföljningssystemet</p>
    `,
  }),
};

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter with environment configuration
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, template: keyof typeof emailTemplates, ...args: any[]) {
    try {
      const { subject, html } = (emailTemplates[template] as any)(...args);
      
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Uppföljningssystemet" <noreply@uppfoljning.se>',
        to,
        subject,
        html,
      });

      console.log("Email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }
  }

  async sendCustomEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Uppföljningssystemet" <noreply@uppfoljning.se>',
        to,
        subject,
        html,
      });

      console.log("Custom email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Custom email send error:", error);
      return { success: false, error };
    }
  }

  async sendBulkEmails(recipients: { email: string; template: keyof typeof emailTemplates; args: any[] }[]) {
    const results = await Promise.allSettled(
      recipients.map(({ email, template, args }) => this.sendEmail(email, template, ...args))
    );

    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    return { successful, failed, total: recipients.length };
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready");
      return true;
    } catch (error) {
      console.error("Email service verification failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();