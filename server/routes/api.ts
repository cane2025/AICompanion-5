import { Router } from "express";
import { authService } from "../services/auth.js";
import { databaseService } from "../services/database.js";
import { pdfService } from "../services/pdf.js";
import { emailService } from "../services/email.js";
import { calendarService } from "../services/calendar.js";
import { dashboardService } from "../services/dashboard.js";
import { exportImportService } from "../services/export-import.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Authentication routes
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    
    if (!result) {
      return res.status(401).json({ message: "Ogiltigt användarnamn eller lösenord" });
    }

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid inloggning" });
  }
});

router.post("/auth/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token saknas" });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    if (!result) {
      return res.status(401).json({ message: "Ogiltig refresh token" });
    }

    // Update refresh token cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken: result.accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid token-uppdatering" });
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Utloggning lyckades" });
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid utloggning" });
  }
});

router.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserFromToken(req.token);
    if (!user) {
      return res.status(401).json({ message: "Användare inte hittad" });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av användardata" });
  }
});

// Staff routes
router.get("/staff", authenticateToken, async (req, res) => {
  try {
    const staff = await databaseService.getAllStaff();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av personal" });
  }
});

router.get("/staff/:id", authenticateToken, async (req, res) => {
  try {
    const staff = await databaseService.getStaff(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Personal inte hittad" });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av personal" });
  }
});

router.post("/staff", authenticateToken, async (req, res) => {
  try {
    const staff = await databaseService.createStaff(req.body);
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid skapande av personal" });
  }
});

router.put("/staff/:id", authenticateToken, async (req, res) => {
  try {
    const staff = await databaseService.updateStaff(req.params.id, req.body);
    if (!staff) {
      return res.status(404).json({ message: "Personal inte hittad" });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid uppdatering av personal" });
  }
});

router.delete("/staff/:id", authenticateToken, async (req, res) => {
  try {
    const success = await databaseService.deleteStaff(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Personal inte hittad" });
    }
    res.json({ message: "Personal borttagen" });
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid borttagning av personal" });
  }
});

// Client routes
router.get("/clients", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.query;
    let clients;
    
    if (staffId) {
      clients = await databaseService.getClientsByStaffId(staffId as string);
    } else {
      clients = await databaseService.getAllClients();
    }
    
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av klienter" });
  }
});

router.get("/clients/:id", authenticateToken, async (req, res) => {
  try {
    const client = await databaseService.getClient(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Klient inte hittad" });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av klient" });
  }
});

router.post("/clients", authenticateToken, async (req, res) => {
  try {
    const client = await databaseService.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid skapande av klient" });
  }
});

router.put("/clients/:id", authenticateToken, async (req, res) => {
  try {
    const client = await databaseService.updateClient(req.params.id, req.body);
    if (!client) {
      return res.status(404).json({ message: "Klient inte hittad" });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid uppdatering av klient" });
  }
});

router.delete("/clients/:id", authenticateToken, async (req, res) => {
  try {
    const success = await databaseService.deleteClient(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Klient inte hittad" });
    }
    res.json({ message: "Klient borttagen" });
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid borttagning av klient" });
  }
});

// Weekly documentation routes
router.get("/weekly-documentation", authenticateToken, async (req, res) => {
  try {
    const { clientId, year, week } = req.query;
    
    if (clientId && year && week) {
      const doc = await databaseService.getWeeklyDocumentation(
        clientId as string,
        parseInt(year as string),
        parseInt(week as string)
      );
      if (!doc) {
        return res.status(404).json({ message: "Dokumentation inte hittad" });
      }
      res.json(doc);
    } else {
      const docs = await databaseService.getAllWeeklyDocumentation();
      res.json(docs);
    }
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av veckodokumentation" });
  }
});

router.post("/weekly-documentation", authenticateToken, async (req, res) => {
  try {
    const doc = await databaseService.createWeeklyDocumentation(req.body);
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid skapande av veckodokumentation" });
  }
});

router.put("/weekly-documentation/:id", authenticateToken, async (req, res) => {
  try {
    const doc = await databaseService.updateWeeklyDocumentation(req.params.id, req.body);
    if (!doc) {
      return res.status(404).json({ message: "Dokumentation inte hittad" });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid uppdatering av veckodokumentation" });
  }
});

// Monthly reports routes
router.get("/monthly-reports", authenticateToken, async (req, res) => {
  try {
    const { clientId, year, month } = req.query;
    
    if (clientId && year && month) {
      const report = await databaseService.getMonthlyReport(
        clientId as string,
        parseInt(year as string),
        parseInt(month as string)
      );
      if (!report) {
        return res.status(404).json({ message: "Rapport inte hittad" });
      }
      res.json(report);
    } else {
      const reports = await databaseService.getAllMonthlyReports();
      res.json(reports);
    }
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av månadsrapporter" });
  }
});

router.post("/monthly-reports", authenticateToken, async (req, res) => {
  try {
    const report = await databaseService.createMonthlyReport(req.body);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid skapande av månadsrapport" });
  }
});

router.put("/monthly-reports/:id", authenticateToken, async (req, res) => {
  try {
    const report = await databaseService.updateMonthlyReport(req.params.id, req.body);
    if (!report) {
      return res.status(404).json({ message: "Rapport inte hittad" });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid uppdatering av månadsrapport" });
  }
});

// PDF generation routes
router.post("/pdf/weekly-documentation/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const weeklyDoc = await databaseService.getWeeklyDocumentation(
      req.body.clientId,
      req.body.year,
      req.body.week
    );
    
    if (!weeklyDoc) {
      return res.status(404).json({ message: "Veckodokumentation inte hittad" });
    }

    const staff = await databaseService.getStaff(weeklyDoc.staffId);
    const client = await databaseService.getClient(weeklyDoc.clientId);
    
    if (!staff || !client) {
      return res.status(404).json({ message: "Personal eller klient inte hittad" });
    }

    const pdfBuffer = await pdfService.generateWeeklyDocumentationPDF(weeklyDoc, staff, client);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="weekly-doc-${client.initials}-w${weeklyDoc.week}-${weeklyDoc.year}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid PDF-generering" });
  }
});

router.post("/pdf/monthly-report/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const monthlyReport = await databaseService.getMonthlyReport(
      req.body.clientId,
      req.body.year,
      req.body.month
    );
    
    if (!monthlyReport) {
      return res.status(404).json({ message: "Månadsrapport inte hittad" });
    }

    const staff = await databaseService.getStaff(monthlyReport.staffId);
    const client = await databaseService.getClient(monthlyReport.clientId);
    
    if (!staff || !client) {
      return res.status(404).json({ message: "Personal eller klient inte hittad" });
    }

    const pdfBuffer = await pdfService.generateMonthlyReportPDF(monthlyReport, staff, client);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="monthly-report-${client.initials}-${monthlyReport.month}-${monthlyReport.year}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid PDF-generering" });
  }
});

// Dashboard routes
router.get("/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av dashboard-statistik" });
  }
});

router.get("/dashboard/weekly-stats", authenticateToken, async (req, res) => {
  try {
    const { year, week } = req.query;
    const stats = await dashboardService.getWeeklyStats(
      parseInt(year as string),
      week ? parseInt(week as string) : undefined
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av veckostatistik" });
  }
});

router.get("/dashboard/monthly-stats", authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.query;
    const stats = await dashboardService.getMonthlyStats(
      parseInt(year as string),
      month ? parseInt(month as string) : undefined
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av månadsstatistik" });
  }
});

router.get("/dashboard/quality-metrics", authenticateToken, async (req, res) => {
  try {
    const metrics = await dashboardService.getQualityMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av kvalitetsmetrik" });
  }
});

router.get("/dashboard/staff-performance", authenticateToken, async (req, res) => {
  try {
    const performance = await dashboardService.getStaffPerformance();
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av personalprestanda" });
  }
});

router.get("/dashboard/client-overview", authenticateToken, async (req, res) => {
  try {
    const overview = await dashboardService.getClientOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av klientöversikt" });
  }
});

// Export/Import routes
router.post("/export/staff", authenticateToken, async (req, res) => {
  try {
    const { format, filters, dateRange } = req.body;
    const data = await exportImportService.exportStaff({ format, filters, dateRange });
    
    if (format === 'csv') {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=staff.csv");
      res.send(data);
    } else if (format === 'json') {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=staff.json");
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid export" });
  }
});

router.post("/export/clients", authenticateToken, async (req, res) => {
  try {
    const { format, filters, dateRange } = req.body;
    const data = await exportImportService.exportClients({ format, filters, dateRange });
    
    if (format === 'csv') {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=clients.csv");
      res.send(data);
    } else if (format === 'json') {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=clients.json");
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid export" });
  }
});

router.post("/import/staff", authenticateToken, async (req, res) => {
  try {
    const { data, format, options } = req.body;
    const result = await exportImportService.importStaff(data, { format, ...options });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid import" });
  }
});

router.post("/import/clients", authenticateToken, async (req, res) => {
  try {
    const { data, format, options } = req.body;
    const result = await exportImportService.importClients(data, { format, ...options });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid import" });
  }
});

// Search routes
router.get("/search/staff", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Sökterm krävs" });
    }
    
    const results = await databaseService.searchStaff(q as string);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid sökning" });
  }
});

router.get("/search/clients", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Sökterm krävs" });
    }
    
    const results = await databaseService.searchClients(q as string);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid sökning" });
  }
});

// Calendar routes
router.get("/calendar/events", authenticateToken, async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    const events = await calendarService.getEventsForStaff(
      staffId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av kalenderhändelser" });
  }
});

router.post("/calendar/events", authenticateToken, async (req, res) => {
  try {
    const event = await calendarService.createEvent(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid skapande av kalenderhändelse" });
  }
});

router.get("/calendar/integrations", authenticateToken, async (req, res) => {
  try {
    const integrations = calendarService.getIntegrations();
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid hämtning av kalenderintegrationer" });
  }
});

// Email notification routes
router.post("/email/weekly-reminder", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.body;
    const success = await emailService.sendWeeklyReminder(staffId);
    
    if (success) {
      res.json({ message: "Veckopåminnelse skickad" });
    } else {
      res.status(400).json({ message: "Kunde inte skicka veckopåminnelse" });
    }
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid skickande av påminnelse" });
  }
});

router.post("/email/monthly-reminder", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.body;
    const success = await emailService.sendMonthlyReportReminder(staffId);
    
    if (success) {
      res.json({ message: "Månadspåminnelse skickad" });
    } else {
      res.status(400).json({ message: "Kunde inte skicka månadspåminnelse" });
    }
  } catch (error) {
    res.status(500).json({ message: "Ett fel uppstod vid skickande av påminnelse" });
  }
});

export default router;