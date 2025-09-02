import puppeteer from "puppeteer";
import { databaseService } from "./database.js";
import type { WeeklyDocumentation, MonthlyReport, CarePlan, Staff, Client } from "../../shared/schema.js";

export class PDFService {
  private browser: puppeteer.Browser | null = null;

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  async generateWeeklyDocumentationPDF(
    weeklyDoc: WeeklyDocumentation,
    staff: Staff,
    client: Client
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const html = this.generateWeeklyDocumentationHTML(weeklyDoc, staff, client);
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await page.close();
    return pdf;
  }

  async generateMonthlyReportPDF(
    monthlyReport: MonthlyReport,
    staff: Staff,
    client: Client
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const html = this.generateMonthlyReportHTML(monthlyReport, staff, client);
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await page.close();
    return pdf;
  }

  async generateCarePlanPDF(
    carePlan: CarePlan,
    staff: Staff,
    client: Client
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const html = this.generateCarePlanHTML(carePlan, staff, client);
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await page.close();
    return pdf;
  }

  async generateDashboardReportPDF(
    startDate: Date,
    endDate: Date,
    staffId?: string
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const stats = await databaseService.getDashboardStats();
    const html = this.generateDashboardReportHTML(stats, startDate, endDate, staffId);
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await page.close();
    return pdf;
  }

  private generateWeeklyDocumentationHTML(
    weeklyDoc: WeeklyDocumentation,
    staff: Staff,
    client: Client
  ): string {
    const weekDays = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];
    const statuses = [
      weeklyDoc.mondayStatus,
      weeklyDoc.tuesdayStatus,
      weeklyDoc.wednesdayStatus,
      weeklyDoc.thursdayStatus,
      weeklyDoc.fridayStatus,
      weeklyDoc.saturdayStatus,
      weeklyDoc.sundayStatus,
    ];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Veckodokumentation - ${client.initials}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { padding: 10px; background: #f8f9fa; border-radius: 5px; }
            .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 20px; }
            .day-item { padding: 15px; text-align: center; border: 1px solid #ddd; border-radius: 5px; }
            .status-done { background: #d4edda; color: #155724; }
            .status-not-done { background: #f8d7da; color: #721c24; }
            .content { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .footer { margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Veckodokumentation</h1>
            <h2>${client.initials} - Vecka ${weeklyDoc.week}, ${weeklyDoc.year}</h2>
          </div>

          <div class="section">
            <h3>Grundinformation</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Klient:</strong> ${client.initials}
              </div>
              <div class="info-item">
                <strong>Personal:</strong> ${staff.name}
              </div>
              <div class="info-item">
                <strong>Vecka:</strong> ${weeklyDoc.week}
              </div>
              <div class="info-item">
                <strong>År:</strong> ${weeklyDoc.year}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Veckans status</h3>
            <div class="week-grid">
              ${weekDays.map((day, index) => `
                <div class="day-item ${statuses[index] === 'done' ? 'status-done' : 'status-not-done'}">
                  <strong>${day}</strong><br>
                  ${statuses[index] === 'done' ? 'Genomförd' : 'Ej genomförd'}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <h3>Dokumentation</h3>
            <div class="content">
              ${weeklyDoc.documentation || 'Ingen dokumentation tillgänglig'}
            </div>
          </div>

          <div class="section">
            <h3>Kommentarer</h3>
            <div class="content">
              ${weeklyDoc.comments || 'Inga kommentarer'}
            </div>
          </div>

          <div class="section">
            <h3>Kvalitetsbedömning</h3>
            <div class="info-item">
              <strong>Status:</strong> ${weeklyDoc.qualityAssessment}
            </div>
          </div>

          <div class="footer">
            <p>Genererad: ${new Date().toLocaleDateString('sv-SE')}</p>
            <p>System: Uppföljningssystem</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateMonthlyReportHTML(
    monthlyReport: MonthlyReport,
    staff: Staff,
    client: Client
  ): string {
    const months = [
      "januari", "februari", "mars", "april", "maj", "juni",
      "juli", "augusti", "september", "oktober", "november", "december"
    ];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Månadsrapport - ${client.initials}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { padding: 10px; background: #f8f9fa; border-radius: 5px; }
            .content { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .status { padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
            .status-not-started { background: #f8d7da; color: #721c24; }
            .status-in-progress { background: #fff3cd; color: #856404; }
            .status-completed { background: #d4edda; color: #155724; }
            .footer { margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Månadsrapport</h1>
            <h2>${client.initials} - ${months[monthlyReport.month - 1]} ${monthlyReport.year}</h2>
          </div>

          <div class="section">
            <h3>Grundinformation</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Klient:</strong> ${client.initials}
              </div>
              <div class="info-item">
                <strong>Personal:</strong> ${staff.name}
              </div>
              <div class="info-item">
                <strong>Månad:</strong> ${months[monthlyReport.month - 1]}
              </div>
              <div class="info-item">
                <strong>År:</strong> ${monthlyReport.year}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Status</h3>
            <div class="info-item">
              <span class="status status-${monthlyReport.status.replace('_', '-')}">
                ${monthlyReport.status === 'not_started' ? 'Ej påbörjad' :
                  monthlyReport.status === 'in_progress' ? 'Pågående' : 'Slutförd'}
              </span>
            </div>
          </div>

          <div class="section">
            <h3>Rapportinnehåll</h3>
            <div class="content">
              ${monthlyReport.reportContent || 'Inget innehåll tillgängligt'}
            </div>
          </div>

          <div class="section">
            <h3>Kommentarer</h3>
            <div class="content">
              ${monthlyReport.comment || 'Inga kommentarer'}
            </div>
          </div>

          <div class="section">
            <h3>Kvalitet</h3>
            <div class="info-item">
              <strong>Bedömning:</strong> ${monthlyReport.quality || 'Ej bedömd'}
            </div>
          </div>

          <div class="footer">
            <p>Genererad: ${new Date().toLocaleDateString('sv-SE')}</p>
            <p>System: Uppföljningssystem</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateCarePlanHTML(
    carePlan: CarePlan,
    staff: Staff,
    client: Client
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Vårdplan - ${client.initials}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { padding: 10px; background: #f8f9fa; border-radius: 5px; }
            .content { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .footer { margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Vårdplan</h1>
            <h2>${client.initials}</h2>
          </div>

          <div class="section">
            <h3>Grundinformation</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Klient:</strong> ${client.initials}
              </div>
              <div class="info-item">
                <strong>Skapad av:</strong> ${staff.name}
              </div>
              <div class="info-item">
                <strong>Skapad:</strong> ${new Date(carePlan.createdAt).toLocaleDateString('sv-SE')}
              </div>
              <div class="info-item">
                <strong>Uppdaterad:</strong> ${new Date(carePlan.updatedAt).toLocaleDateString('sv-SE')}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Vårdplan</h3>
            <div class="content">
              ${carePlan.carePlanContent || 'Ingen vårdplan tillgänglig'}
            </div>
          </div>

          <div class="section">
            <h3>Mål</h3>
            <div class="content">
              ${carePlan.goals || 'Inga mål definierade'}
            </div>
          </div>

          <div class="section">
            <h3>Åtgärder</h3>
            <div class="content">
              ${carePlan.interventions || 'Inga åtgärder definierade'}
            </div>
          </div>

          <div class="section">
            <h3>Utvärdering</h3>
            <div class="content">
              ${carePlan.evaluation || 'Ingen utvärdering tillgänglig'}
            </div>
          </div>

          <div class="footer">
            <p>Genererad: ${new Date().toLocaleDateString('sv-SE')}</p>
            <p>System: Uppföljningssystem</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateDashboardReportHTML(
    stats: any,
    startDate: Date,
    endDate: Date,
    staffId?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Dashboard Rapport</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
            .stat-item { padding: 20px; background: #f8f9fa; border-radius: 5px; text-align: center; }
            .stat-number { font-size: 2em; font-weight: bold; color: #2c3e50; }
            .stat-label { color: #7f8c8d; margin-top: 5px; }
            .footer { margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dashboard Rapport</h1>
            <h2>${startDate.toLocaleDateString('sv-SE')} - ${endDate.toLocaleDateString('sv-SE')}</h2>
          </div>

          <div class="section">
            <h3>Översikt</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">${stats.totalStaff}</div>
                <div class="stat-label">Personal</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.totalClients}</div>
                <div class="stat-label">Klienter</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.totalWeeklyDocs}</div>
                <div class="stat-label">Veckodokumentation</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.totalMonthlyReports}</div>
                <div class="stat-label">Månadsrapporter</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Genererad: ${new Date().toLocaleDateString('sv-SE')}</p>
            <p>System: Uppföljningssystem</p>
          </div>
        </body>
      </html>
    `;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfService = new PDFService();