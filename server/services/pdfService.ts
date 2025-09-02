import puppeteer, { Browser, Page } from "puppeteer";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PDFService {
  private browser: Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async generatePDF(htmlContent: string, filename: string): Promise<Buffer> {
    await this.initialize();
    const page = await this.browser!.newPage();

    try {
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      
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

      return pdf;
    } finally {
      await page.close();
    }
  }

  private getBaseStyles(): string {
    return `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #333;
        }
        
        .header {
          background-color: #f0f0f0;
          padding: 20px;
          margin-bottom: 30px;
          border-bottom: 2px solid #4a5568;
        }
        
        .header h1 {
          color: #2d3748;
          font-size: 24pt;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          color: #4a5568;
          font-size: 14pt;
        }
        
        .content {
          padding: 20px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section h2 {
          color: #2d3748;
          font-size: 18pt;
          margin-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
        }
        
        .section h3 {
          color: #4a5568;
          font-size: 14pt;
          margin-bottom: 8px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .info-item {
          padding: 10px;
          background-color: #f7fafc;
          border-radius: 5px;
        }
        
        .info-item strong {
          color: #2d3748;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        th, td {
          border: 1px solid #e2e8f0;
          padding: 10px;
          text-align: left;
        }
        
        th {
          background-color: #f7fafc;
          font-weight: bold;
          color: #2d3748;
        }
        
        tr:nth-child(even) {
          background-color: #f7fafc;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 10pt;
          color: #718096;
        }
        
        .signature-section {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
        }
        
        .signature-box {
          border-top: 1px solid #333;
          padding-top: 10px;
          text-align: center;
        }
        
        .highlight {
          background-color: #fef3c7;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .approved {
          color: #10b981;
          font-weight: bold;
        }
        
        .pending {
          color: #f59e0b;
          font-weight: bold;
        }
        
        .rejected {
          color: #ef4444;
          font-weight: bold;
        }
      </style>
    `;
  }

  async generateWeeklyDocumentationPDF(data: {
    client: any;
    staff: any;
    documentation: any;
    week: number;
    year: number;
  }): Promise<Buffer> {
    const weekDays = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
    const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    const html = `
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <title>Veckodokumentation - ${data.client.initials} - Vecka ${data.week}, ${data.year}</title>
        ${this.getBaseStyles()}
      </head>
      <body>
        <div class="header">
          <h1>Veckodokumentation</h1>
          <div class="subtitle">Vecka ${data.week}, ${data.year}</div>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Klientinformation</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Klient:</strong> ${data.client.initials}
              </div>
              <div class="info-item">
                <strong>Personnummer:</strong> ${data.client.personalNumber || "Ej angivet"}
              </div>
              <div class="info-item">
                <strong>Personal:</strong> ${data.staff.name}
              </div>
              <div class="info-item">
                <strong>Avdelning:</strong> ${data.staff.avdelning || "Ej angiven"}
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Daglig status</h2>
            <table>
              <thead>
                <tr>
                  <th>Dag</th>
                  <th>Status</th>
                  <th>Dokumenterad</th>
                </tr>
              </thead>
              <tbody>
                ${weekDays.map((day, index) => {
                  const dayKey = dayKeys[index];
                  const status = data.documentation[`${dayKey}Status`] || "not_done";
                  const documented = data.documentation[`${dayKey}Documented`] || false;
                  return `
                    <tr>
                      <td>${day}</td>
                      <td>${status === "done" ? '<span class="approved">Genomförd</span>' : '<span class="pending">Ej genomförd</span>'}</td>
                      <td>${documented ? '<span class="approved">Ja</span>' : '<span class="pending">Nej</span>'}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2>Dokumentation</h2>
            <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px;">
              ${data.documentation.documentation || "Ingen dokumentation tillgänglig"}
            </div>
          </div>
          
          ${data.documentation.comments ? `
            <div class="section">
              <h2>Kommentarer</h2>
              <div style="white-space: pre-wrap; background-color: #fef3c7; padding: 15px; border-radius: 5px;">
                ${data.documentation.comments}
              </div>
            </div>
          ` : ""}
          
          <div class="section">
            <h2>Godkännandestatus</h2>
            <p>
              <strong>Status:</strong> 
              ${data.documentation.approved 
                ? '<span class="approved">Godkänd</span>' 
                : '<span class="pending">Väntar på godkännande</span>'}
            </p>
            <p>
              <strong>Kvalitetsbedömning:</strong> 
              ${data.documentation.qualityAssessment || "Ej bedömd"}
            </p>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <p>Personal</p>
              <p>${data.staff.name}</p>
              <p>${format(new Date(), "yyyy-MM-dd")}</p>
            </div>
            <div class="signature-box">
              <p>Ansvarig chef</p>
              <p>_________________</p>
              <p>Datum: ___________</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Genererad: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: sv })}</p>
          <p>Uppföljningssystem © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    return this.generatePDF(html, `veckodokumentation-${data.client.initials}-v${data.week}-${data.year}.pdf`);
  }

  async generateMonthlyReportPDF(data: {
    client: any;
    staff: any;
    report: any;
    month: number;
    year: number;
  }): Promise<Buffer> {
    const monthName = format(new Date(data.year, data.month - 1), "MMMM", { locale: sv });

    const html = `
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <title>Månadsrapport - ${data.client.initials} - ${monthName} ${data.year}</title>
        ${this.getBaseStyles()}
      </head>
      <body>
        <div class="header">
          <h1>Månadsrapport</h1>
          <div class="subtitle">${monthName} ${data.year}</div>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Klientinformation</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Klient:</strong> ${data.client.initials}
              </div>
              <div class="info-item">
                <strong>Personnummer:</strong> ${data.client.personalNumber || "Ej angivet"}
              </div>
              <div class="info-item">
                <strong>Personal:</strong> ${data.staff.name}
              </div>
              <div class="info-item">
                <strong>Status:</strong> ${data.client.status === "active" ? "Aktiv" : "Inaktiv"}
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Rapportinnehåll</h2>
            <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px; min-height: 200px;">
              ${data.report.reportContent || data.report.content || "Ingen rapport tillgänglig"}
            </div>
          </div>
          
          <div class="section">
            <h2>Status och kvalitet</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Status:</strong> 
                ${data.report.status === "completed" 
                  ? '<span class="approved">Färdig</span>' 
                  : data.report.status === "in_progress"
                  ? '<span class="pending">Pågående</span>'
                  : '<span class="rejected">Ej påbörjad</span>'}
              </div>
              <div class="info-item">
                <strong>Kvalitet:</strong> 
                ${data.report.quality || "Ej bedömd"}
              </div>
              <div class="info-item">
                <strong>Inlämnad:</strong> 
                ${data.report.submissionDate 
                  ? format(new Date(data.report.submissionDate), "d MMMM yyyy", { locale: sv })
                  : "Ej inlämnad"}
              </div>
              <div class="info-item">
                <strong>Senast uppdaterad:</strong> 
                ${format(new Date(data.report.updatedAt), "d MMMM yyyy HH:mm", { locale: sv })}
              </div>
            </div>
          </div>
          
          ${data.report.comment ? `
            <div class="section">
              <h2>Kommentarer</h2>
              <div style="white-space: pre-wrap; background-color: #fef3c7; padding: 15px; border-radius: 5px;">
                ${data.report.comment}
              </div>
            </div>
          ` : ""}
          
          <div class="signature-section">
            <div class="signature-box">
              <p>Personal</p>
              <p>${data.staff.name}</p>
              <p>${format(new Date(), "yyyy-MM-dd")}</p>
            </div>
            <div class="signature-box">
              <p>Ansvarig chef</p>
              <p>_________________</p>
              <p>Datum: ___________</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Genererad: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: sv })}</p>
          <p>Uppföljningssystem © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    return this.generatePDF(html, `manadsrapport-${data.client.initials}-${data.year}-${data.month}.pdf`);
  }

  async generateCarePlanPDF(data: {
    client: any;
    staff: any;
    carePlan: any;
  }): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <title>Genomförandeplan - ${data.client.initials}</title>
        ${this.getBaseStyles()}
      </head>
      <body>
        <div class="header">
          <h1>Genomförandeplan</h1>
          <div class="subtitle">Klient: ${data.client.initials}</div>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Grundinformation</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Klient:</strong> ${data.client.initials}
              </div>
              <div class="info-item">
                <strong>Personnummer:</strong> ${data.client.personalNumber || "Ej angivet"}
              </div>
              <div class="info-item">
                <strong>Upprättad av:</strong> ${data.staff.name}
              </div>
              <div class="info-item">
                <strong>Datum:</strong> ${format(new Date(data.carePlan.createdAt), "d MMMM yyyy", { locale: sv })}
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Planinnehåll</h2>
            <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px;">
              ${data.carePlan.planContent || "Inget innehåll angivet"}
            </div>
          </div>
          
          <div class="section">
            <h2>Mål</h2>
            <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px;">
              ${data.carePlan.goals || "Inga mål angivna"}
            </div>
          </div>
          
          <div class="section">
            <h2>Insatser</h2>
            <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px;">
              ${data.carePlan.interventions || "Inga insatser angivna"}
            </div>
          </div>
          
          ${data.carePlan.evaluationCriteria ? `
            <div class="section">
              <h2>Utvärderingskriterier</h2>
              <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px;">
                ${data.carePlan.evaluationCriteria}
              </div>
            </div>
          ` : ""}
          
          <div class="section">
            <h2>Status och datum</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Status:</strong> 
                ${data.carePlan.status === "completed" 
                  ? '<span class="approved">Genomförd</span>' 
                  : data.carePlan.status === "in_progress"
                  ? '<span class="pending">Pågående</span>'
                  : '<span class="pending">Mottagen</span>'}
              </div>
              <div class="info-item">
                <strong>Aktiv:</strong> 
                ${data.carePlan.isActive ? '<span class="approved">Ja</span>' : '<span class="rejected">Nej</span>'}
              </div>
              ${data.carePlan.receivedDate ? `
                <div class="info-item">
                  <strong>Mottagen:</strong> ${data.carePlan.receivedDate}
                </div>
              ` : ""}
              ${data.carePlan.enteredJournalDate ? `
                <div class="info-item">
                  <strong>Journalförd:</strong> ${data.carePlan.enteredJournalDate}
                </div>
              ` : ""}
              ${data.carePlan.staffNotifiedDate ? `
                <div class="info-item">
                  <strong>Personal informerad:</strong> ${data.carePlan.staffNotifiedDate}
                </div>
              ` : ""}
            </div>
          </div>
          
          ${data.carePlan.comment ? `
            <div class="section">
              <h2>Kommentarer</h2>
              <div style="white-space: pre-wrap; background-color: #fef3c7; padding: 15px; border-radius: 5px;">
                ${data.carePlan.comment}
              </div>
            </div>
          ` : ""}
          
          <div class="signature-section">
            <div class="signature-box">
              <p>Personal</p>
              <p>${data.staff.name}</p>
              <p>${format(new Date(), "yyyy-MM-dd")}</p>
            </div>
            <div class="signature-box">
              <p>Klient/Företrädare</p>
              <p>_________________</p>
              <p>Datum: ___________</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Genererad: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: sv })}</p>
          <p>Uppföljningssystem © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    return this.generatePDF(html, `genomforandeplan-${data.client.initials}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  async generateImplementationPlanPDF(data: {
    client: any;
    staff: any;
    implementationPlan: any;
    carePlan?: any;
  }): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <title>Administrativ uppföljning - ${data.client.initials}</title>
        ${this.getBaseStyles()}
      </head>
      <body>
        <div class="header">
          <h1>Administrativ uppföljning</h1>
          <div class="subtitle">Genomförandeplan - ${data.client.initials}</div>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Grundinformation</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Klient:</strong> ${data.client.initials}
              </div>
              <div class="info-item">
                <strong>Personal:</strong> ${data.staff.name}
              </div>
              <div class="info-item">
                <strong>Plantyp:</strong> ${data.implementationPlan.planType || "Typ 1"}
              </div>
              <div class="info-item">
                <strong>Status:</strong> 
                ${data.implementationPlan.status === "completed" 
                  ? '<span class="approved">Genomförd</span>' 
                  : data.implementationPlan.status === "in_progress"
                  ? '<span class="pending">Pågående</span>'
                  : '<span class="pending">Väntar</span>'}
              </div>
            </div>
          </div>
          
          ${data.carePlan ? `
            <div class="section">
              <h2>Kopplad genomförandeplan</h2>
              <p><strong>ID:</strong> ${data.carePlan.id}</p>
              <p><strong>Status:</strong> ${data.carePlan.status}</p>
            </div>
          ` : ""}
          
          <div class="section">
            <h2>Planinnehåll</h2>
            <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px;">
              ${data.implementationPlan.planContent || "Inget innehåll angivet"}
            </div>
          </div>
          
          ${data.implementationPlan.goals ? `
            <div class="section">
              <h2>Mål</h2>
              <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px;">
                ${data.implementationPlan.goals}
              </div>
            </div>
          ` : ""}
          
          ${data.implementationPlan.activities ? `
            <div class="section">
              <h2>Aktiviteter</h2>
              <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px;">
                ${data.implementationPlan.activities}
              </div>
            </div>
          ` : ""}
          
          <div class="section">
            <h2>Viktiga datum</h2>
            <div class="info-grid">
              ${data.implementationPlan.sentDate ? `
                <div class="info-item">
                  <strong>Skickad:</strong> ${format(new Date(data.implementationPlan.sentDate), "d MMMM yyyy", { locale: sv })}
                </div>
              ` : ""}
              ${data.implementationPlan.dueDate ? `
                <div class="info-item">
                  <strong>Förfallodatum:</strong> ${format(new Date(data.implementationPlan.dueDate), "d MMMM yyyy", { locale: sv })}
                </div>
              ` : ""}
              ${data.implementationPlan.completedDate ? `
                <div class="info-item">
                  <strong>Genomförd:</strong> ${format(new Date(data.implementationPlan.completedDate), "d MMMM yyyy", { locale: sv })}
                </div>
              ` : ""}
              <div class="info-item">
                <strong>Skapad:</strong> ${format(new Date(data.implementationPlan.createdAt), "d MMMM yyyy", { locale: sv })}
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Uppföljningar</h2>
            <table>
              <thead>
                <tr>
                  <th>Uppföljning</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Uppföljning 1</td>
                  <td>${data.implementationPlan.followup1 ? '<span class="approved">Genomförd</span>' : '<span class="pending">Ej genomförd</span>'}</td>
                </tr>
                <tr>
                  <td>Uppföljning 2</td>
                  <td>${data.implementationPlan.followup2 ? '<span class="approved">Genomförd</span>' : '<span class="pending">Ej genomförd</span>'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          ${data.implementationPlan.comments ? `
            <div class="section">
              <h2>Kommentarer</h2>
              <div style="white-space: pre-wrap; background-color: #fef3c7; padding: 15px; border-radius: 5px;">
                ${data.implementationPlan.comments}
              </div>
            </div>
          ` : ""}
          
          <div class="signature-section">
            <div class="signature-box">
              <p>Personal</p>
              <p>${data.staff.name}</p>
              <p>${format(new Date(), "yyyy-MM-dd")}</p>
            </div>
            <div class="signature-box">
              <p>Ansvarig chef</p>
              <p>_________________</p>
              <p>Datum: ___________</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Genererad: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: sv })}</p>
          <p>Uppföljningssystem © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    return this.generatePDF(html, `admin-uppfoljning-${data.client.initials}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  async generateStaffReportPDF(data: {
    staff: any;
    period: { start: Date; end: Date };
    statistics: any;
    clients: any[];
  }): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <title>Personalrapport - ${data.staff.name}</title>
        ${this.getBaseStyles()}
      </head>
      <body>
        <div class="header">
          <h1>Personalrapport</h1>
          <div class="subtitle">
            ${format(data.period.start, "d MMMM", { locale: sv })} - 
            ${format(data.period.end, "d MMMM yyyy", { locale: sv })}
          </div>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Personalinformation</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Namn:</strong> ${data.staff.name}
              </div>
              <div class="info-item">
                <strong>Initialer:</strong> ${data.staff.initials}
              </div>
              <div class="info-item">
                <strong>Roll:</strong> ${data.staff.roll || "Ej angiven"}
              </div>
              <div class="info-item">
                <strong>Avdelning:</strong> ${data.staff.avdelning || "Ej angiven"}
              </div>
              <div class="info-item">
                <strong>E-post:</strong> ${data.staff.epost || "Ej angiven"}
              </div>
              <div class="info-item">
                <strong>Telefon:</strong> ${data.staff.telefon || "Ej angiven"}
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Sammanfattning för perioden</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Antal klienter:</strong> ${data.statistics.totalClients}
              </div>
              <div class="info-item">
                <strong>Veckodokumentationer:</strong> ${data.statistics.weeklyDocumentations}
              </div>
              <div class="info-item">
                <strong>Månadsrapporter:</strong> ${data.statistics.monthlyReports}
              </div>
              <div class="info-item">
                <strong>Genomförandeplaner:</strong> ${data.statistics.carePlans}
              </div>
              <div class="info-item">
                <strong>Godkända dokument:</strong> ${data.statistics.approvedDocuments}
              </div>
              <div class="info-item">
                <strong>Väntande dokument:</strong> ${data.statistics.pendingDocuments}
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Klientöversikt</h2>
            <table>
              <thead>
                <tr>
                  <th>Klient</th>
                  <th>Status</th>
                  <th>Senaste dokumentation</th>
                  <th>Nästa uppföljning</th>
                </tr>
              </thead>
              <tbody>
                ${data.clients.map(client => `
                  <tr>
                    <td>${client.initials}</td>
                    <td>${client.status === "active" ? '<span class="approved">Aktiv</span>' : '<span class="rejected">Inaktiv</span>'}</td>
                    <td>${client.lastDocumentation ? format(new Date(client.lastDocumentation), "d MMM", { locale: sv }) : "Ingen"}</td>
                    <td>${client.nextFollowUp ? format(new Date(client.nextFollowUp), "d MMM", { locale: sv }) : "Ej planerad"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2>Kommentarer och observationer</h2>
            <div style="white-space: pre-wrap; background-color: #f7fafc; padding: 15px; border-radius: 5px; min-height: 100px;">
              ${data.statistics.notes || "Inga särskilda observationer för perioden."}
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <p>Personal</p>
              <p>${data.staff.name}</p>
              <p>${format(new Date(), "yyyy-MM-dd")}</p>
            </div>
            <div class="signature-box">
              <p>Chef</p>
              <p>_________________</p>
              <p>Datum: ___________</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Genererad: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: sv })}</p>
          <p>Uppföljningssystem © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    return this.generatePDF(html, `personalrapport-${data.staff.initials}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }
}

// Export singleton instance
export const pdfService = new PDFService();