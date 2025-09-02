import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailNotification {
  to: string[];
  cc?: string[];
  subject: string;
  type: 'care-plan-update' | 'monthly-report-due' | 'weekly-doc-reminder' | 'system-alert' | 'bulk-operation';
  data: any;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }
  
  private getEmailTemplate(notification: EmailNotification): { html: string; text: string } {
    switch (notification.type) {
      case 'care-plan-update':
        return this.getCarePlanUpdateTemplate(notification.data);
      case 'monthly-report-due':
        return this.getMonthlyReportDueTemplate(notification.data);
      case 'weekly-doc-reminder':
        return this.getWeeklyDocReminderTemplate(notification.data);
      case 'system-alert':
        return this.getSystemAlertTemplate(notification.data);
      case 'bulk-operation':
        return this.getBulkOperationTemplate(notification.data);
      default:
        return { html: '', text: '' };
    }
  }
  
  private getCarePlanUpdateTemplate(data: any): { html: string; text: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Vårdplan uppdaterad</h2>
        <p>En vårdplan har uppdaterats i systemet.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Detaljer:</h3>
          <ul>
            <li><strong>Klient:</strong> ${data.clientInitials}</li>
            <li><strong>Personal:</strong> ${data.staffName}</li>
            <li><strong>Status:</strong> ${data.status}</li>
            <li><strong>Uppdaterad:</strong> ${format(new Date(data.updatedAt), 'dd MMMM yyyy HH:mm', { locale: sv })}</li>
          </ul>
        </div>
        
        ${data.comment ? `<p><strong>Kommentar:</strong> ${data.comment}</p>` : ''}
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
          Detta är ett automatiskt meddelande från vårdplaneringssystemet.
        </p>
      </div>
    `;
    
    const text = `
Vårdplan uppdaterad

En vårdplan har uppdaterats i systemet.

Detaljer:
- Klient: ${data.clientInitials}
- Personal: ${data.staffName}
- Status: ${data.status}
- Uppdaterad: ${format(new Date(data.updatedAt), 'dd MMMM yyyy HH:mm', { locale: sv })}

${data.comment ? `Kommentar: ${data.comment}` : ''}

Detta är ett automatiskt meddelande från vårdplaneringssystemet.
    `;
    
    return { html, text };
  }
  
  private getMonthlyReportDueTemplate(data: any): { html: string; text: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Månadsrapport förfaller snart</h2>
        <p>En månadsrapport behöver lämnas in inom kort.</p>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>Detaljer:</h3>
          <ul>
            <li><strong>Klient:</strong> ${data.clientInitials}</li>
            <li><strong>Period:</strong> ${format(new Date(data.year, data.month - 1), 'MMMM yyyy', { locale: sv })}</li>
            <li><strong>Förfallodatum:</strong> ${format(new Date(data.dueDate), 'dd MMMM yyyy', { locale: sv })}</li>
            <li><strong>Status:</strong> ${data.status}</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
          Logga in i systemet för att slutföra rapporten.
        </p>
      </div>
    `;
    
    const text = `
Månadsrapport förfaller snart

En månadsrapport behöver lämnas in inom kort.

Detaljer:
- Klient: ${data.clientInitials}
- Period: ${format(new Date(data.year, data.month - 1), 'MMMM yyyy', { locale: sv })}
- Förfallodatum: ${format(new Date(data.dueDate), 'dd MMMM yyyy', { locale: sv })}
- Status: ${data.status}

Logga in i systemet för att slutföra rapporten.
    `;
    
    return { html, text };
  }
  
  private getWeeklyDocReminderTemplate(data: any): { html: string; text: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Påminnelse: Veckodokumentation</h2>
        <p>Veckodokumentation behöver slutföras.</p>
        
        <div style="background-color: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
          <h3>Detaljer:</h3>
          <ul>
            <li><strong>Klient:</strong> ${data.clientInitials}</li>
            <li><strong>Vecka:</strong> ${data.week}, ${data.year}</li>
            <li><strong>Ofullständiga dagar:</strong> ${data.incompleteDays.join(', ')}</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
          Logga in i systemet för att slutföra dokumentationen.
        </p>
      </div>
    `;
    
    const text = `
Påminnelse: Veckodokumentation

Veckodokumentation behöver slutföras.

Detaljer:
- Klient: ${data.clientInitials}
- Vecka: ${data.week}, ${data.year}
- Ofullständiga dagar: ${data.incompleteDays.join(', ')}

Logga in i systemet för att slutföra dokumentationen.
    `;
    
    return { html, text };
  }
  
  private getSystemAlertTemplate(data: any): { html: string; text: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Systemvarning</h2>
        <p>${data.message}</p>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>Detaljer:</h3>
          <p><strong>Tidpunkt:</strong> ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: sv })}</p>
          ${data.details ? `<p><strong>Ytterligare information:</strong> ${data.details}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
          Detta är ett automatiskt systemmeddelande.
        </p>
      </div>
    `;
    
    const text = `
Systemvarning

${data.message}

Detaljer:
- Tidpunkt: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: sv })}
${data.details ? `- Ytterligare information: ${data.details}` : ''}

Detta är ett automatiskt systemmeddelande.
    `;
    
    return { html, text };
  }
  
  private getBulkOperationTemplate(data: any): { html: string; text: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Bulk-operation slutförd</h2>
        <p>En bulk-operation har slutförts i systemet.</p>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3>Detaljer:</h3>
          <ul>
            <li><strong>Operation:</strong> ${data.operation}</li>
            <li><strong>Antal objekt:</strong> ${data.count}</li>
            <li><strong>Utförd av:</strong> ${data.performedBy}</li>
            <li><strong>Tidpunkt:</strong> ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: sv })}</li>
          </ul>
        </div>
        
        ${data.summary ? `<p><strong>Sammanfattning:</strong> ${data.summary}</p>` : ''}
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
          Detta är ett automatiskt meddelande från vårdplaneringssystemet.
        </p>
      </div>
    `;
    
    const text = `
Bulk-operation slutförd

En bulk-operation har slutförts i systemet.

Detaljer:
- Operation: ${data.operation}
- Antal objekt: ${data.count}
- Utförd av: ${data.performedBy}
- Tidpunkt: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: sv })}

${data.summary ? `Sammanfattning: ${data.summary}` : ''}

Detta är ett automatiskt meddelande från vårdplaneringssystemet.
    `;
    
    return { html, text };
  }
  
  async sendNotification(notification: EmailNotification): Promise<void> {
    try {
      const { html, text } = this.getEmailTemplate(notification);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@vardplanering.se',
        to: notification.to.join(', '),
        cc: notification.cc?.join(', '),
        subject: notification.subject,
        html,
        text,
      };
      
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully: ${notification.subject}`);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Fel vid skickning av e-post');
    }
  }
  
  async sendBulkNotifications(notifications: EmailNotification[]): Promise<void> {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendNotification(notification))
    );
    
    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length > 0) {
      console.error(`${failed.length} emails failed to send`);
      throw new Error(`${failed.length} e-postmeddelanden misslyckades att skickas`);
    }
  }
  
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export function getEmailService(): EmailService | null {
  if (!emailService && process.env.EMAIL_HOST) {
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    };
    
    emailService = new EmailService(config);
  }
  
  return emailService;
}

export async function sendCarePlanNotification(data: {
  clientInitials: string;
  staffName: string;
  staffEmail: string;
  status: string;
  comment?: string;
  updatedAt: string;
}) {
  const emailService = getEmailService();
  if (!emailService) return;
  
  await emailService.sendNotification({
    to: [data.staffEmail],
    subject: `Vårdplan uppdaterad - ${data.clientInitials}`,
    type: 'care-plan-update',
    data,
  });
}

export async function sendMonthlyReportReminder(data: {
  clientInitials: string;
  staffEmail: string;
  year: number;
  month: number;
  dueDate: string;
  status: string;
}) {
  const emailService = getEmailService();
  if (!emailService) return;
  
  await emailService.sendNotification({
    to: [data.staffEmail],
    subject: `Månadsrapport förfaller snart - ${data.clientInitials}`,
    type: 'monthly-report-due',
    data,
  });
}

export async function sendWeeklyDocReminder(data: {
  clientInitials: string;
  staffEmail: string;
  week: number;
  year: number;
  incompleteDays: string[];
}) {
  const emailService = getEmailService();
  if (!emailService) return;
  
  await emailService.sendNotification({
    to: [data.staffEmail],
    subject: `Påminnelse: Veckodokumentation - ${data.clientInitials}`,
    type: 'weekly-doc-reminder',
    data,
  });
}

export async function sendBulkOperationNotification(data: {
  operation: string;
  count: number;
  performedBy: string;
  adminEmails: string[];
  summary?: string;
}) {
  const emailService = getEmailService();
  if (!emailService) return;
  
  await emailService.sendNotification({
    to: data.adminEmails,
    subject: `Bulk-operation slutförd: ${data.operation}`,
    type: 'bulk-operation',
    data,
  });
}