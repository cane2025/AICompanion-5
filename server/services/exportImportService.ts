import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { dbStorage } from "../dbStorage.js";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type {
  InsertStaff,
  InsertClient,
  InsertWeeklyDocumentation,
  InsertMonthlyReport,
  InsertCarePlan,
  InsertImplementationPlan,
  InsertVimsaTime,
} from "../../shared/schema.js";

export class ExportImportService {
  // Export functions
  async exportStaffToCSV(): Promise<string> {
    const staff = await dbStorage.getAllStaff();
    
    const records = staff.map(s => ({
      id: s.id,
      namn: s.name,
      initialer: s.initials,
      personnummer: s.personnummer || "",
      telefon: s.telefon || "",
      epost: s.epost || "",
      adress: s.adress || "",
      anställningsdatum: s.anställningsdatum || "",
      roll: s.roll || "",
      avdelning: s.avdelning || "",
      skapad: format(new Date(s.createdAt!), "yyyy-MM-dd HH:mm:ss"),
      uppdaterad: format(new Date(s.updatedAt!), "yyyy-MM-dd HH:mm:ss"),
    }));

    return stringify(records, {
      header: true,
      delimiter: ";",
      bom: true, // Add BOM for Excel compatibility
    });
  }

  async exportClientsToCSV(): Promise<string> {
    const clients = await dbStorage.getAllClients();
    
    const records = clients.map(c => ({
      id: c.id,
      initialer: c.initials,
      personal_id: c.staffId,
      personnummer: c.personalNumber || "",
      anteckningar: c.notes || "",
      status: c.status || "active",
      skapad: format(new Date(c.createdAt!), "yyyy-MM-dd HH:mm:ss"),
      uppdaterad: format(new Date(c.updatedAt!), "yyyy-MM-dd HH:mm:ss"),
    }));

    return stringify(records, {
      header: true,
      delimiter: ";",
      bom: true,
    });
  }

  async exportWeeklyDocumentationToCSV(clientId?: string): Promise<string> {
    const docs = clientId 
      ? await dbStorage.getWeeklyDocumentationByClient(clientId)
      : await dbStorage.getAllWeeklyDocumentation();
    
    const records = docs.map(d => ({
      id: d.id,
      klient_id: d.clientId,
      personal_id: d.staffId,
      år: d.year,
      vecka: d.week,
      måndag_status: d.mondayStatus,
      tisdag_status: d.tuesdayStatus,
      onsdag_status: d.wednesdayStatus,
      torsdag_status: d.thursdayStatus,
      fredag_status: d.fridayStatus,
      lördag_status: d.saturdayStatus,
      söndag_status: d.sundayStatus,
      dokumentation: d.documentation || "",
      godkänd: d.approved ? "Ja" : "Nej",
      kommentarer: d.comments || "",
      kvalitetsbedömning: d.qualityAssessment || "",
      skapad: format(new Date(d.createdAt!), "yyyy-MM-dd HH:mm:ss"),
    }));

    return stringify(records, {
      header: true,
      delimiter: ";",
      bom: true,
    });
  }

  async exportMonthlyReportsToCSV(clientId?: string): Promise<string> {
    const reports = clientId
      ? await dbStorage.getMonthlyReportsByClient(clientId)
      : await dbStorage.getAllMonthlyReports();
    
    const records = reports.map(r => ({
      id: r.id,
      klient_id: r.clientId,
      personal_id: r.staffId,
      år: r.year,
      månad: r.month,
      rapportinnehåll: r.reportContent || r.content || "",
      status: r.status,
      kvalitet: r.quality || "",
      kommentar: r.comment || "",
      inlämningsdatum: r.submissionDate 
        ? format(new Date(r.submissionDate), "yyyy-MM-dd")
        : "",
      skapad: format(new Date(r.createdAt!), "yyyy-MM-dd HH:mm:ss"),
    }));

    return stringify(records, {
      header: true,
      delimiter: ";",
      bom: true,
    });
  }

  async exportCarePlansToCSV(clientId?: string): Promise<string> {
    const plans = clientId
      ? await dbStorage.getCarePlansByClient(clientId)
      : await dbStorage.getAllCarePlans();
    
    const records = plans.map(p => ({
      id: p.id,
      klient_id: p.clientId,
      personal_id: p.staffId,
      ansvarig_id: p.responsibleId || "",
      planinnehåll: p.planContent || "",
      mål: p.goals || "",
      insatser: p.interventions || "",
      utvärderingskriterier: p.evaluationCriteria || "",
      mottagen_datum: p.receivedDate || "",
      journalförd_datum: p.enteredJournalDate || "",
      personal_informerad_datum: p.staffNotifiedDate || "",
      status: p.status || "received",
      aktiv: p.isActive ? "Ja" : "Nej",
      kommentar: p.comment || "",
      skapad: format(new Date(p.createdAt!), "yyyy-MM-dd HH:mm:ss"),
    }));

    return stringify(records, {
      header: true,
      delimiter: ";",
      bom: true,
    });
  }

  // Export all data to JSON
  async exportAllDataToJSON(): Promise<string> {
    const [
      staff,
      clients,
      weeklyDocs,
      monthlyReports,
      carePlans,
      implementationPlans,
      vimsaTimes,
    ] = await Promise.all([
      dbStorage.getAllStaff(),
      dbStorage.getAllClients(),
      dbStorage.getAllWeeklyDocumentation(),
      dbStorage.getAllMonthlyReports(),
      dbStorage.getAllCarePlans(),
      dbStorage.getAllImplementationPlans(),
      dbStorage.getAllVimsaTime(),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      data: {
        staff,
        clients,
        weeklyDocumentation: weeklyDocs,
        monthlyReports,
        carePlans,
        implementationPlans,
        vimsaTime: vimsaTimes,
      },
      counts: {
        staff: staff.length,
        clients: clients.length,
        weeklyDocumentation: weeklyDocs.length,
        monthlyReports: monthlyReports.length,
        carePlans: carePlans.length,
        implementationPlans: implementationPlans.length,
        vimsaTime: vimsaTimes.length,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import functions
  async importStaffFromCSV(csvContent: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    try {
      const records = parse(csvContent, {
        columns: true,
        delimiter: ";",
        skip_empty_lines: true,
        bom: true,
      });

      for (const record of records) {
        try {
          const staffData: InsertStaff = {
            name: record.namn || record.name,
            initials: record.initialer || record.initials,
            personnummer: record.personnummer || "",
            telefon: record.telefon || "",
            epost: record.epost || "",
            adress: record.adress || "",
            anställningsdatum: record.anställningsdatum || "",
            roll: record.roll || "",
            avdelning: record.avdelning || "",
          };

          await dbStorage.createStaff(staffData);
          success++;
        } catch (error) {
          failed++;
          errors.push(`Failed to import staff ${record.namn}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`CSV parsing error: ${error}`);
    }

    return { success, failed, errors };
  }

  async importClientsFromCSV(csvContent: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    try {
      const records = parse(csvContent, {
        columns: true,
        delimiter: ";",
        skip_empty_lines: true,
        bom: true,
      });

      for (const record of records) {
        try {
          const clientData: InsertClient = {
            initials: record.initialer || record.initials,
            staffId: record.personal_id || record.staffId,
            personalNumber: record.personnummer || "",
            notes: record.anteckningar || record.notes || "",
            status: record.status || "active",
          };

          await dbStorage.createClient(clientData);
          success++;
        } catch (error) {
          failed++;
          errors.push(`Failed to import client ${record.initialer}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`CSV parsing error: ${error}`);
    }

    return { success, failed, errors };
  }

  async importFromJSON(jsonContent: string): Promise<{
    success: { [key: string]: number };
    failed: { [key: string]: number };
    errors: string[];
  }> {
    const errors: string[] = [];
    const success: { [key: string]: number } = {};
    const failed: { [key: string]: number } = {};

    try {
      const importData = JSON.parse(jsonContent);
      
      if (!importData.data) {
        throw new Error("Invalid JSON format: missing data property");
      }

      // Import staff
      if (importData.data.staff) {
        success.staff = 0;
        failed.staff = 0;
        
        for (const staffMember of importData.data.staff) {
          try {
            const { id, createdAt, updatedAt, deletedAt, ...staffData } = staffMember;
            await dbStorage.createStaff(staffData as InsertStaff);
            success.staff++;
          } catch (error) {
            failed.staff++;
            errors.push(`Failed to import staff ${staffMember.name}: ${error}`);
          }
        }
      }

      // Import clients
      if (importData.data.clients) {
        success.clients = 0;
        failed.clients = 0;
        
        for (const client of importData.data.clients) {
          try {
            const { id, createdAt, updatedAt, deletedAt, ...clientData } = client;
            await dbStorage.createClient(clientData as InsertClient);
            success.clients++;
          } catch (error) {
            failed.clients++;
            errors.push(`Failed to import client ${client.initials}: ${error}`);
          }
        }
      }

      // Import weekly documentation
      if (importData.data.weeklyDocumentation) {
        success.weeklyDocumentation = 0;
        failed.weeklyDocumentation = 0;
        
        for (const doc of importData.data.weeklyDocumentation) {
          try {
            const { id, createdAt, updatedAt, ...docData } = doc;
            await dbStorage.createWeeklyDocumentation(docData as InsertWeeklyDocumentation);
            success.weeklyDocumentation++;
          } catch (error) {
            failed.weeklyDocumentation++;
            errors.push(`Failed to import weekly documentation: ${error}`);
          }
        }
      }

      // Import monthly reports
      if (importData.data.monthlyReports) {
        success.monthlyReports = 0;
        failed.monthlyReports = 0;
        
        for (const report of importData.data.monthlyReports) {
          try {
            const { id, createdAt, updatedAt, ...reportData } = report;
            await dbStorage.createMonthlyReport(reportData as InsertMonthlyReport);
            success.monthlyReports++;
          } catch (error) {
            failed.monthlyReports++;
            errors.push(`Failed to import monthly report: ${error}`);
          }
        }
      }

      // Import care plans
      if (importData.data.carePlans) {
        success.carePlans = 0;
        failed.carePlans = 0;
        
        for (const plan of importData.data.carePlans) {
          try {
            const { id, createdAt, updatedAt, ...planData } = plan;
            await dbStorage.createCarePlan(planData as InsertCarePlan);
            success.carePlans++;
          } catch (error) {
            failed.carePlans++;
            errors.push(`Failed to import care plan: ${error}`);
          }
        }
      }

    } catch (error) {
      errors.push(`JSON parsing error: ${error}`);
    }

    return { success, failed, errors };
  }

  // Generate sample CSV templates
  generateStaffCSVTemplate(): string {
    const template = [
      {
        namn: "Exempel Person",
        initialer: "EP",
        personnummer: "19900101-1234",
        telefon: "070-1234567",
        epost: "exempel@example.com",
        adress: "Exempelgatan 1, 12345 Stad",
        anställningsdatum: "2024-01-01",
        roll: "Vårdare",
        avdelning: "Avdelning A",
      },
    ];

    return stringify(template, {
      header: true,
      delimiter: ";",
      bom: true,
    });
  }

  generateClientCSVTemplate(): string {
    const template = [
      {
        initialer: "AB",
        personal_id: "staff_123",
        personnummer: "19800101-1234",
        anteckningar: "Exempel anteckningar",
        status: "active",
      },
    ];

    return stringify(template, {
      header: true,
      delimiter: ";",
      bom: true,
    });
  }
}

// Export singleton instance
export const exportImportService = new ExportImportService();
