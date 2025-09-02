import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export interface ReportData {
  client: {
    initials: string;
    personalNumber?: string;
  };
  staff: {
    name: string;
    initials: string;
  };
  period: {
    year: number;
    month?: number;
    week?: number;
  };
  content: string;
  reportType: 'monthly' | 'weekly' | 'care-plan' | 'implementation-plan';
  status?: string;
  quality?: string;
  createdAt: Date;
}

export class PDFService {
  private static addHeader(doc: jsPDF, title: string, subtitle?: string) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 30);
    
    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, 20, 45);
    }
    
    // Add date
    const dateStr = format(new Date(), 'dd MMMM yyyy', { locale: sv });
    doc.setFontSize(10);
    doc.text(`Genererad: ${dateStr}`, 20, doc.internal.pageSize.height - 20);
  }
  
  private static addClientInfo(doc: jsPDF, data: ReportData, startY: number): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Klientinformation', 20, startY);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let currentY = startY + 15;
    
    doc.text(`Initialer: ${data.client.initials}`, 20, currentY);
    currentY += 10;
    
    if (data.client.personalNumber) {
      doc.text(`Personnummer: ${data.client.personalNumber}`, 20, currentY);
      currentY += 10;
    }
    
    doc.text(`Ansvarig personal: ${data.staff.name} (${data.staff.initials})`, 20, currentY);
    currentY += 15;
    
    return currentY;
  }
  
  private static addPeriodInfo(doc: jsPDF, data: ReportData, startY: number): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tidsperiod', 20, startY);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let currentY = startY + 15;
    
    if (data.period.month) {
      const monthName = format(new Date(data.period.year, data.period.month - 1), 'MMMM yyyy', { locale: sv });
      doc.text(`Månad: ${monthName}`, 20, currentY);
    } else if (data.period.week) {
      doc.text(`År: ${data.period.year}, Vecka: ${data.period.week}`, 20, currentY);
    } else {
      doc.text(`År: ${data.period.year}`, 20, currentY);
    }
    
    currentY += 15;
    return currentY;
  }
  
  private static addContent(doc: jsPDF, content: string, startY: number): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Innehåll', 20, startY);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let currentY = startY + 15;
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(content, 170);
    
    for (const line of lines) {
      if (currentY > doc.internal.pageSize.height - 30) {
        doc.addPage();
        currentY = 30;
      }
      doc.text(line, 20, currentY);
      currentY += 7;
    }
    
    return currentY + 10;
  }
  
  static generateMonthlyReport(data: ReportData): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Månadsrapport', `${data.client.initials} - ${format(new Date(data.period.year, (data.period.month || 1) - 1), 'MMMM yyyy', { locale: sv })}`);
    
    let currentY = 60;
    currentY = this.addClientInfo(doc, data, currentY);
    currentY = this.addPeriodInfo(doc, data, currentY);
    
    if (data.status) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Status', 20, currentY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${data.status}`, 20, currentY + 15);
      currentY += 30;
    }
    
    if (data.quality) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Kvalitetsbedömning', 20, currentY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Kvalitet: ${data.quality}`, 20, currentY + 15);
      currentY += 30;
    }
    
    this.addContent(doc, data.content, currentY);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  static generateWeeklyReport(data: ReportData): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Veckodokumentation', `${data.client.initials} - Vecka ${data.period.week}, ${data.period.year}`);
    
    let currentY = 60;
    currentY = this.addClientInfo(doc, data, currentY);
    currentY = this.addPeriodInfo(doc, data, currentY);
    this.addContent(doc, data.content, currentY);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  static generateCarePlan(data: ReportData): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Vårdplan', `${data.client.initials}`);
    
    let currentY = 60;
    currentY = this.addClientInfo(doc, data, currentY);
    
    if (data.status) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Status', 20, currentY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${data.status}`, 20, currentY + 15);
      currentY += 30;
    }
    
    this.addContent(doc, data.content, currentY);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  static generateImplementationPlan(data: ReportData): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Genomförandeplan', `${data.client.initials}`);
    
    let currentY = 60;
    currentY = this.addClientInfo(doc, data, currentY);
    
    if (data.status) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Status', 20, currentY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${data.status}`, 20, currentY + 15);
      currentY += 30;
    }
    
    this.addContent(doc, data.content, currentY);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  static generateBulkReport(reports: ReportData[]): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Sammanställd Rapport', `${reports.length} rapporter`);
    
    let currentY = 60;
    
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      
      if (currentY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        currentY = 30;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${report.client.initials} - ${report.reportType}`, 20, currentY);
      currentY += 20;
      
      currentY = this.addClientInfo(doc, report, currentY);
      currentY = this.addPeriodInfo(doc, report, currentY);
      currentY = this.addContent(doc, report.content, currentY);
      
      currentY += 20; // Space between reports
    }
    
    return Buffer.from(doc.output('arraybuffer'));
  }
}