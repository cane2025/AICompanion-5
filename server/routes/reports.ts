import { Router } from "express";
import { dbStorage } from "../dbStorage.js";
import { pdfService } from "../services/pdfService.js";
import { exportImportService } from "../services/exportImportService.js";
import { z } from "zod";

export const reportsRouter = Router();

// Middleware for authentication (reuse from api.ts)
function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies?.authToken || req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// === PDF GENERATION ENDPOINTS ===

reportsRouter.get("/pdf/weekly-documentation/:docId", requireAuth, async (req, res) => {
  try {
    const doc = await dbStorage.getWeeklyDocumentation(req.params.docId);
    if (!doc) {
      return res.status(404).json({ error: "Documentation not found" });
    }

    const [client, staff] = await Promise.all([
      dbStorage.getClient(doc.clientId),
      dbStorage.getStaff(doc.staffId),
    ]);

    if (!client || !staff) {
      return res.status(404).json({ error: "Client or staff not found" });
    }

    const pdf = await pdfService.generateWeeklyDocumentationPDF({
      client,
      staff,
      documentation: doc,
      week: doc.week,
      year: doc.year,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="veckodokumentation-${client.initials}-v${doc.week}-${doc.year}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

reportsRouter.get("/pdf/monthly-report/:reportId", requireAuth, async (req, res) => {
  try {
    const report = await dbStorage.getMonthlyReport(req.params.reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const [client, staff] = await Promise.all([
      dbStorage.getClient(report.clientId),
      dbStorage.getStaff(report.staffId),
    ]);

    if (!client || !staff) {
      return res.status(404).json({ error: "Client or staff not found" });
    }

    const pdf = await pdfService.generateMonthlyReportPDF({
      client,
      staff,
      report,
      month: report.month,
      year: report.year,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="manadsrapport-${client.initials}-${report.year}-${report.month}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

reportsRouter.get("/pdf/care-plan/:planId", requireAuth, async (req, res) => {
  try {
    const carePlan = await dbStorage.getCarePlan(req.params.planId);
    if (!carePlan) {
      return res.status(404).json({ error: "Care plan not found" });
    }

    const [client, staff] = await Promise.all([
      dbStorage.getClient(carePlan.clientId),
      dbStorage.getStaff(carePlan.staffId),
    ]);

    if (!client || !staff) {
      return res.status(404).json({ error: "Client or staff not found" });
    }

    const pdf = await pdfService.generateCarePlanPDF({
      client,
      staff,
      carePlan,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="genomforandeplan-${client.initials}-${new Date().toISOString().split("T")[0]}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

reportsRouter.get("/pdf/implementation-plan/:planId", requireAuth, async (req, res) => {
  try {
    const implementationPlan = await dbStorage.getImplementationPlan(req.params.planId);
    if (!implementationPlan) {
      return res.status(404).json({ error: "Implementation plan not found" });
    }

    const [client, staff] = await Promise.all([
      dbStorage.getClient(implementationPlan.clientId),
      dbStorage.getStaff(implementationPlan.staffId),
    ]);

    if (!client || !staff) {
      return res.status(404).json({ error: "Client or staff not found" });
    }

    let carePlan;
    if (implementationPlan.carePlanId) {
      carePlan = await dbStorage.getCarePlan(implementationPlan.carePlanId);
    }

    const pdf = await pdfService.generateImplementationPlanPDF({
      client,
      staff,
      implementationPlan,
      carePlan,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="admin-uppfoljning-${client.initials}-${new Date().toISOString().split("T")[0]}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

const staffReportSchema = z.object({
  staffId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

reportsRouter.post("/pdf/staff-report", requireAuth, async (req, res) => {
  try {
    const result = staffReportSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { staffId, startDate, endDate } = result.data;
    const staff = await dbStorage.getStaff(staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    const clients = await dbStorage.getClientsByStaffId(staffId);
    const period = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    // Calculate statistics
    const [weeklyDocs, monthlyReports, carePlans] = await Promise.all([
      dbStorage.getWeeklyDocumentationByStaff(staffId),
      dbStorage.getMonthlyReportsByStaff(staffId),
      dbStorage.getCarePlansByStaff(staffId),
    ]);

    const statistics = {
      totalClients: clients.length,
      weeklyDocumentations: weeklyDocs.filter(d => {
        const docDate = new Date(d.createdAt!);
        return docDate >= period.start && docDate <= period.end;
      }).length,
      monthlyReports: monthlyReports.filter(r => {
        const reportDate = new Date(r.createdAt!);
        return reportDate >= period.start && reportDate <= period.end;
      }).length,
      carePlans: carePlans.filter(p => p.isActive).length,
      approvedDocuments: weeklyDocs.filter(d => d.approved).length,
      pendingDocuments: weeklyDocs.filter(d => !d.approved).length,
    };

    // Add last documentation info to clients
    const clientsWithInfo = await Promise.all(
      clients.map(async (client) => {
        const docs = await dbStorage.getWeeklyDocumentationByClient(client.id!);
        const lastDoc = docs[0]; // Already sorted by date
        return {
          ...client,
          lastDocumentation: lastDoc?.createdAt,
          nextFollowUp: null, // Could be calculated based on rules
        };
      })
    );

    const pdf = await pdfService.generateStaffReportPDF({
      staff,
      period,
      statistics,
      clients: clientsWithInfo,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="personalrapport-${staff.initials}-${new Date().toISOString().split("T")[0]}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// === EXPORT ENDPOINTS ===

reportsRouter.get("/export/staff/csv", requireAuth, async (_req, res) => {
  try {
    const csv = await exportImportService.exportStaffToCSV();
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="personal-${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export staff data" });
  }
});

reportsRouter.get("/export/clients/csv", requireAuth, async (_req, res) => {
  try {
    const csv = await exportImportService.exportClientsToCSV();
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="klienter-${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export client data" });
  }
});

reportsRouter.get("/export/weekly-documentation/csv", requireAuth, async (req, res) => {
  try {
    const clientId = req.query.clientId as string | undefined;
    const csv = await exportImportService.exportWeeklyDocumentationToCSV(clientId);
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="veckodokumentation-${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export weekly documentation" });
  }
});

reportsRouter.get("/export/monthly-reports/csv", requireAuth, async (req, res) => {
  try {
    const clientId = req.query.clientId as string | undefined;
    const csv = await exportImportService.exportMonthlyReportsToCSV(clientId);
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="manadsrapporter-${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export monthly reports" });
  }
});

reportsRouter.get("/export/care-plans/csv", requireAuth, async (req, res) => {
  try {
    const clientId = req.query.clientId as string | undefined;
    const csv = await exportImportService.exportCarePlansToCSV(clientId);
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="genomforandeplaner-${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export care plans" });
  }
});

reportsRouter.get("/export/all/json", requireAuth, async (_req, res) => {
  try {
    const json = await exportImportService.exportAllDataToJSON();
    
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="uppfoljningssystem-backup-${new Date().toISOString().split("T")[0]}.json"`
    );
    res.send(json);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// === IMPORT ENDPOINTS ===

reportsRouter.post("/import/staff/csv", requireAuth, async (req, res) => {
  try {
    if (!req.body.csvContent) {
      return res.status(400).json({ error: "CSV content required" });
    }

    const result = await exportImportService.importStaffFromCSV(req.body.csvContent);
    res.json(result);
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: "Failed to import staff data" });
  }
});

reportsRouter.post("/import/clients/csv", requireAuth, async (req, res) => {
  try {
    if (!req.body.csvContent) {
      return res.status(400).json({ error: "CSV content required" });
    }

    const result = await exportImportService.importClientsFromCSV(req.body.csvContent);
    res.json(result);
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: "Failed to import client data" });
  }
});

reportsRouter.post("/import/all/json", requireAuth, async (req, res) => {
  try {
    if (!req.body.jsonContent) {
      return res.status(400).json({ error: "JSON content required" });
    }

    const result = await exportImportService.importFromJSON(req.body.jsonContent);
    res.json(result);
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: "Failed to import data" });
  }
});

// === TEMPLATE ENDPOINTS ===

reportsRouter.get("/templates/staff/csv", (_req, res) => {
  const template = exportImportService.generateStaffCSVTemplate();
  
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="personal-mall.csv"'
  );
  res.send(template);
});

reportsRouter.get("/templates/clients/csv", (_req, res) => {
  const template = exportImportService.generateClientCSVTemplate();
  
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="klienter-mall.csv"'
  );
  res.send(template);
});
