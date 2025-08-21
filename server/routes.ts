import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import bcrypt from "bcryptjs";
import {
  insertStaffSchema,
  insertClientSchema,
  insertWeeklyDocumentationSchema,
  insertMonthlyReportSchema,
  insertCarePlanSchema,
  insertImplementationPlanSchema,
  insertVimsaTimeSchema,
  insertUserSchema,
  loginSchema,
  updateStaffSchema,
  updateWeeklyDocumentationSchema,
  updateMonthlyReportSchema,
  updateCarePlanSchema,
  updateImplementationPlanSchema,
  updateVimsaTimeSchema,
} from "../shared/schema.js";

// Simple in-memory session store for tokens -> user mapping
const sessionUsers = new Map<string, any>();

function getTokenFromReq(req: any): string | undefined {
  const headerToken =
    (req.headers && (req.headers["x-dev-token"] as string)) || undefined;
  const cookieToken =
    (req.cookies && (req.cookies.devToken as string)) || undefined;
  return headerToken || cookieToken;
}

// WebSocket broadcasting function
let wss: WebSocketServer;

function broadcastUpdate(type: string, data: any) {
  if (!wss) return;
  const msg = JSON.stringify({ type, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validated.username);

      if (!user || !user.isActive) {
        return res
          .status(401)
          .json({ message: "Ogiltigt användarnamn eller lösenord" });
      }

      const isValidPassword = await bcrypt.compare(
        validated.password,
        user.passwordHash
      );
      if (!isValidPassword) {
        return res
          .status(401)
          .json({ message: "Ogiltigt användarnamn eller lösenord" });
      }

      const token = getTokenFromReq(req) || `dev-${Date.now()}`;
      // Set cookie with token for convenience
      res.cookie("devToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      const { passwordHash, ...userWithoutPassword } = user as any;
      sessionUsers.set(token, userWithoutPassword);

      res.json({ token, user: userWithoutPassword });
    } catch (_error) {
      res.status(400).json({ message: "Ogiltiga inloggningsuppgifter" });
    }
  });

  // Return current authenticated user based on token
  app.get("/api/auth/me", async (req, res) => {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const user = sessionUsers.get(token);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    res.json(user);
  });

  // Logout and clear cookie/session
  app.post("/api/auth/logout", async (req, res) => {
    const token = getTokenFromReq(req);
    if (token) sessionUsers.delete(token);
    res.clearCookie("devToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.status(204).end();
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(
        validated.passwordHash,
        saltRounds
      );

      const userData = {
        ...validated,
        passwordHash,
      };

      const user = await storage.createUser(userData);
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.status(201).json({
        user: userWithoutPassword,
        message: "Användare skapad",
      });
    } catch (error) {
      res.status(400).json({ message: "Kunde inte skapa användare" });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword, userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "Användar-ID krävs" });
      }

      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: "Användare hittades inte" });
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );
      if (!isValidPassword) {
        return res
          .status(401)
          .json({ message: "Nuvarande lösenord är felaktigt" });
      }

      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      const updatedUser = await storage.updateUserPassword(
        user.id,
        newPasswordHash
      );
      if (!updatedUser) {
        return res
          .status(500)
          .json({ message: "Kunde inte uppdatera lösenord" });
      }

      res.json({ message: "Lösenord uppdaterat framgångsrikt" });
    } catch (error) {
      res.status(500).json({ message: "Serverfel vid lösenordsändring" });
    }
  });

  // Staff routes
  app.get("/api/staff", async (req, res) => {
    try {
      const staff = await storage.getAllStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  // Search endpoint for staff
  app.get("/api/staff/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }

      const allStaff = await storage.getAllStaff();
      const filteredStaff = allStaff.filter(
        (staff) =>
          (staff.name || "").toLowerCase().includes(query.toLowerCase()) ||
          (staff.initials || "").toLowerCase().includes(query.toLowerCase()) ||
          (staff.personnummer || "")
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          (staff.telefon || "").toLowerCase().includes(query.toLowerCase()) ||
          (staff.epost || "").toLowerCase().includes(query.toLowerCase()) ||
          (staff.roll || "").toLowerCase().includes(query.toLowerCase()) ||
          (staff.avdelning || "").toLowerCase().includes(query.toLowerCase())
      );

      res.json(filteredStaff);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte söka personal" });
    }
  });

  // Create staff
  app.post("/api/staff", async (req, res) => {
    try {
      const staffData = req.body;
      const staff = await storage.createStaff(staffData);
      broadcastUpdate("staff", staff);
      res.json(staff);
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ message: "Kunde inte skapa personal" });
    }
  });

  // Delete staff
  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStaff(id);
      broadcastUpdate("staff", { deleted: id });
      res.json({ message: "Personal borttagen" });
    } catch (error) {
      console.error("Error deleting staff:", error);
      res.status(500).json({ message: "Kunde inte ta bort personal" });
    }
  });

  // Client routes
  app.get("/api/clients/all", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta klienter" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = req.body;
      const client = await storage.createClient(clientData);
      broadcastUpdate("clients", client);

      // Skapa automatiskt vårdflöde för klienten
      const now = new Date();
      const year = now.getFullYear();
      const week = Math.ceil(
        (now.getTime() - new Date(year, 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      const month = now.getMonth() + 1;
      const staffId = client.staffId;

      // Vårdplan
      const carePlan = await storage.createCarePlan({
        clientId: client.id,
        staffId,
        planContent: `Vårdplan för ${client.initials}`,
        goals: "",
        interventions: "",
        evaluationCriteria: "",
        receivedDate: now.toISOString(),
        status: "received",
        isActive: true,
        comment: "",
      });
      // Genomförandeplan
      const implementationPlan = await storage.createImplementationPlan({
        clientId: client.id,
        staffId,
        carePlanId: carePlan.id,
        planContent: `Genomförandeplan för ${client.initials}`,
        goals: "",
        activities: "",
        followUpSchedule: "",
        status: "pending",
        isActive: true,
        followup1: false,
        followup2: false,
        createdDate: now,
        comments: "",
      });
      // Veckodokumentation
      await storage.createWeeklyDocumentation({
        clientId: client.id,
        staffId,
        year,
        week,
        content: "",
        documentation: "",
        approved: false,
      });
      // Månadsrapport
      await storage.createMonthlyReport({
        clientId: client.id,
        staffId,
        year,
        month,
        content: "",
        reportContent: "",
        status: "draft",
        comment: "",
      });
      // VISMA-tid
      await storage.createVimsaTime({
        clientId: client.id,
        staffId,
        year,
        week,
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
        totalHours: 0,
        status: "pending",
        approved: false,
        comments: "",
      });
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Kunde inte skapa klient" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ message: "Klient borttagen" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Kunde inte ta bort klient" });
    }
  });

  // Care plan routes
  app.get("/api/care-plans/all", async (req, res) => {
    try {
      const carePlans = await storage.getAllCarePlans();
      res.json(carePlans);
    } catch (error) {
      console.error("Error getting care plans:", error);
      res.status(500).json({ message: "Kunde inte hämta vårdplaner" });
    }
  });

  app.post("/api/care-plans", async (req, res) => {
    try {
      const carePlanData = req.body;
      const carePlan = await storage.createCarePlan(carePlanData);
      res.json(carePlan);
    } catch (error) {
      console.error("Error creating care plan:", error);
      res.status(500).json({ message: "Kunde inte skapa vårdplan" });
    }
  });

  // Weekly documentation routes
  app.get("/api/weekly-documentation/all", async (req, res) => {
    try {
      const docs = await storage.getAllWeeklyDocumentation();
      res.json(docs);
    } catch (error) {
      console.error("Error getting weekly documentation:", error);
      res.status(500).json({ message: "Kunde inte hämta veckodokumentation" });
    }
  });

  app.post("/api/weekly-documentation", async (req, res) => {
    try {
      const docData = req.body;
      const doc = await storage.createWeeklyDocumentation(docData);
      res.json(doc);
    } catch (error) {
      console.error("Error creating weekly documentation:", error);
      res.status(500).json({ message: "Kunde inte skapa veckodokumentation" });
    }
  });

  // Monthly report routes
  app.get("/api/monthly-reports/all", async (req, res) => {
    try {
      const reports = await storage.getAllMonthlyReports();
      res.json(reports);
    } catch (error) {
      console.error("Error getting monthly reports:", error);
      res.status(500).json({ message: "Kunde inte hämta månadsrapporter" });
    }
  });

  app.post("/api/monthly-reports", async (req, res) => {
    try {
      const reportData = req.body;
      const report = await storage.createMonthlyReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Error creating monthly report:", error);
      res.status(500).json({ message: "Kunde inte skapa månadsrapport" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const staff = await storage.getStaff(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const validatedData = updateStaffSchema.parse(req.body);
      const staff = await storage.updateStaff(req.params.id, validatedData);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      broadcastUpdate("staff", staff);
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: "Invalid staff data", error });
    }
  });

  // Client routes - Updated to match frontend expectations
  app.get("/api/staff/:id/clients", async (req, res) => {
    try {
      const clients = await storage.getClientsByStaffId(req.params.id);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Kunde inte hämta klienter" });
    }
  });

  app.get("/api/clients/all", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta alla klienter" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      console.log("Creating client with data:", req.body);
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res
        .status(400)
        .json({ message: "Kunde inte skapa klient", error: String(error) });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const updates = req.body;
      const client = await storage.updateClient(req.params.id, updates);
      if (!client) {
        return res.status(404).json({ message: "Klient hittades inte" });
      }
      res.json(client);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Kunde inte uppdatera klient", error: String(error) });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Klient hittades inte" });
      }
      res.json({ message: "Klient borttagen" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Kunde inte ta bort klient" });
    }
  });

  // Weekly documentation routes
  app.get("/api/clients/:clientId/weekly/:year/:week", async (req, res) => {
    try {
      const { clientId, year, week } = req.params;
      const doc = await storage.getWeeklyDocumentation(
        clientId,
        parseInt(year),
        parseInt(week)
      );
      if (!doc) {
        return res
          .status(404)
          .json({ message: "Weekly documentation not found" });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly documentation" });
    }
  });

  app.post("/api/weekly-documentation", async (req, res) => {
    try {
      const validatedData = insertWeeklyDocumentationSchema.parse(req.body);
      const doc = await storage.createWeeklyDocumentation(validatedData);
      res.status(201).json(doc);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Invalid weekly documentation data", error });
    }
  });

  app.put("/api/weekly-documentation/:id", async (req, res) => {
    try {
      const validatedData = updateWeeklyDocumentationSchema.parse(req.body);
      const doc = await storage.updateWeeklyDocumentation(
        req.params.id,
        validatedData
      );
      if (!doc) {
        return res
          .status(404)
          .json({ message: "Weekly documentation not found" });
      }
      res.json(doc);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Invalid weekly documentation data", error });
    }
  });

  // Monthly report routes
  app.get("/api/clients/:clientId/monthly/:year/:month", async (req, res) => {
    try {
      const { clientId, year, month } = req.params;
      const report = await storage.getMonthlyReport(
        clientId,
        parseInt(year),
        parseInt(month)
      );
      if (!report) {
        return res.status(404).json({ message: "Monthly report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly report" });
    }
  });

  app.post("/api/monthly-reports", async (req, res) => {
    try {
      const validatedData = insertMonthlyReportSchema.parse(req.body);
      const report = await storage.createMonthlyReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid monthly report data", error });
    }
  });

  app.put("/api/monthly-reports/:id", async (req, res) => {
    try {
      const validatedData = updateMonthlyReportSchema.parse(req.body);
      const report = await storage.updateMonthlyReport(
        req.params.id,
        validatedData
      );
      if (!report) {
        return res.status(404).json({ message: "Monthly report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid monthly report data", error });
    }
  });

  // Care plan routes
  app.get("/api/care-plans/all", async (req, res) => {
    try {
      const carePlans = await storage.getAllCarePlans();
      res.json(carePlans);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta vårdplaner" });
    }
  });

  app.get("/api/care-plans/:clientId", async (req, res) => {
    try {
      const plan = await storage.getCarePlan(req.params.clientId);
      if (!plan) {
        return res.status(404).json({ message: "Vårdplan hittades inte" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta vårdplan" });
    }
  });

  app.post("/api/care-plans", async (req, res) => {
    try {
      const validated = insertCarePlanSchema.parse(req.body);
      const carePlan = await storage.createCarePlan(validated);

      // Implementation plan will be created separately when needed

      res.status(201).json(carePlan);
    } catch (error) {
      res.status(400).json({ message: "Kunde inte skapa vårdplan" });
    }
  });

  app.delete("/api/care-plans/:id", async (req, res) => {
    try {
      const success = await storage.deleteCarePlan(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Vårdplan hittades inte" });
      }
      res.json({ message: "Vårdplan borttagen" });
    } catch (error) {
      res.status(500).json({ message: "Kunde inte ta bort vårdplan" });
    }
  });

  app.get("/api/care-plans/staff/:staffId", async (req, res) => {
    try {
      const carePlans = await storage.getAllCarePlans();
      const staffCarePlans = carePlans.filter(
        (cp) => cp.staffId === req.params.staffId
      );
      res.json(staffCarePlans);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Kunde inte hämta vårdplaner för personal" });
    }
  });

  // Implementation plan routes
  app.get("/api/implementation-plans/all", async (req, res) => {
    try {
      const implementationPlans = await storage.getAllImplementationPlans();
      res.json(implementationPlans);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta genomförandeplaner" });
    }
  });

  app.get("/api/implementation-plans/client/:clientId", async (req, res) => {
    try {
      const plan = await storage.getImplementationPlan(req.params.clientId);
      if (!plan) {
        return res
          .status(404)
          .json({ message: "Genomförandeplan hittades inte" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta genomförandeplan" });
    }
  });

  app.get("/api/implementation-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getImplementationPlanById(req.params.id);
      if (!plan) {
        return res
          .status(404)
          .json({ message: "Genomförandeplan hittades inte" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta genomförandeplan" });
    }
  });

  app.get("/api/implementation-plans/staff/:staffId", async (req, res) => {
    try {
      const implementationPlans = await storage.getAllImplementationPlans();
      const staffPlans = implementationPlans.filter(
        (ip) => ip.staffId === req.params.staffId
      );
      res.json(staffPlans);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Kunde inte hämta genomförandeplaner för personal" });
    }
  });

  // Weekly documentation routes
  app.get("/api/weekly-documentation/all", async (req, res) => {
    try {
      const weeklyDocs = await storage.getAllWeeklyDocumentation();
      res.json(weeklyDocs);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta veckodokumentation" });
    }
  });

  app.get("/api/weekly-documentation/:clientId", async (req, res) => {
    try {
      const weeklyDocs = await storage.getAllWeeklyDocumentation();
      const clientDocs = weeklyDocs.filter(
        (doc) => doc.clientId === req.params.clientId
      );
      res.json(clientDocs);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Kunde inte hämta veckodokumentation för klient" });
    }
  });

  // Monthly reports routes
  app.get("/api/monthly-reports/all", async (req, res) => {
    try {
      const monthlyReports = await storage.getAllMonthlyReports();
      res.json(monthlyReports);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta månadsrapporter" });
    }
  });

  app.get("/api/monthly-reports/:clientId", async (req, res) => {
    try {
      const monthlyReports = await storage.getAllMonthlyReports();
      const clientReports = monthlyReports.filter(
        (report) => report.staffId === req.params.clientId
      );
      res.json(clientReports);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Kunde inte hämta månadsrapporter för klient" });
    }
  });

  // Vimsa time routes
  app.get("/api/vimsa-time/all", async (req, res) => {
    try {
      const vimsaTimeData = await storage.getAllVimsaTime();
      res.json(vimsaTimeData);
    } catch (error) {
      res.status(500).json({ message: "Kunde inte hämta Vimsa tiddata" });
    }
  });

  app.get("/api/vimsa-time/:clientId", async (req, res) => {
    try {
      const vimsaTimeData = await storage.getAllVimsaTime();
      const clientTimeData = vimsaTimeData.filter(
        (time) => time.clientId === req.params.clientId
      );
      res.json(clientTimeData);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Kunde inte hämta Vimsa tiddata för klient" });
    }
  });

  app.post("/api/care-plans", async (req, res) => {
    try {
      const validatedData = insertCarePlanSchema.parse(req.body);
      const plan = await storage.createCarePlan(validatedData);
      broadcastUpdate("carePlans", plan);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: "Ogiltig vårdplan data", error });
    }
  });

  app.put("/api/care-plans/:id", async (req, res) => {
    try {
      const validatedData = updateCarePlanSchema.parse(req.body);
      const plan = await storage.updateCarePlan(req.params.id, validatedData);
      if (!plan) {
        return res.status(404).json({ message: "Care plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: "Invalid care plan data", error });
    }
  });

  // Implementation plan routes
  app.get("/api/clients/:clientId/implementation-plan", async (req, res) => {
    try {
      const plan = await storage.getImplementationPlan(req.params.clientId);
      if (!plan) {
        return res
          .status(404)
          .json({ message: "Implementation plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch implementation plan" });
    }
  });

  app.post("/api/implementation-plans", async (req, res) => {
    try {
      const validatedData = insertImplementationPlanSchema.parse(req.body);
      const plan = await storage.createImplementationPlan(validatedData);
      broadcastUpdate("implementationPlans", plan);
      res.status(201).json(plan);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Invalid implementation plan data", error });
    }
  });

  app.put("/api/implementation-plans/:id", async (req, res) => {
    try {
      const validatedData = updateImplementationPlanSchema.parse(req.body);
      const plan = await storage.updateImplementationPlan(
        req.params.id,
        validatedData
      );
      if (!plan) {
        return res
          .status(404)
          .json({ message: "Implementation plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Invalid implementation plan data", error });
    }
  });

  // Vimsa time routes
  app.get("/api/clients/:clientId/vimsa/:year/:week", async (req, res) => {
    try {
      const { clientId, year, week } = req.params;
      const time = await storage.getVimsaTime(
        clientId,
        parseInt(year),
        parseInt(week)
      );
      if (!time) {
        return res.status(404).json({ message: "Vimsa time not found" });
      }
      res.json(time);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Vimsa time" });
    }
  });

  app.post("/api/vimsa-time", async (req, res) => {
    try {
      const validatedData = insertVimsaTimeSchema.parse(req.body);
      const time = await storage.createVimsaTime(validatedData);
      res.status(201).json(time);
    } catch (error) {
      res.status(400).json({ message: "Invalid Vimsa time data", error });
    }
  });

  app.put("/api/vimsa-time/:id", async (req, res) => {
    try {
      const validatedData = updateVimsaTimeSchema.parse(req.body);
      const time = await storage.updateVimsaTime(req.params.id, validatedData);
      if (!time) {
        return res.status(404).json({ message: "Vimsa time not found" });
      }
      res.json(time);
    } catch (error) {
      res.status(400).json({ message: "Invalid Vimsa time data", error });
    }
  });

  // Create HTTP server and, in production only, a WebSocket server
  const httpServer = createServer(app);
  if (process.env.NODE_ENV === "production") {
    wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    wss.on("connection", (ws) => {
      console.log("WebSocket client connected");

      ws.on("message", (msg) => {
        // Broadcast to all other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(msg);
          }
        });
      });

      ws.on("close", () => {
        console.log("WebSocket client disconnected");
      });
    });
  }

  return httpServer;
}
