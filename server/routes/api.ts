import { Router } from "express";
import { dbStorage } from "../dbStorage.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  loginSchema,
  insertStaffSchema,
  insertClientSchema,
  insertWeeklyDocumentationSchema,
  insertMonthlyReportSchema,
  insertCarePlanSchema,
  insertImplementationPlanSchema,
  insertVimsaTimeSchema,
  updateStaffSchema,
  updateClientSchema,
  updateWeeklyDocumentationSchema,
  updateMonthlyReportSchema,
  updateCarePlanSchema,
  updateImplementationPlanSchema,
  updateVimsaTimeSchema,
} from "../../shared/schema.js";

export const apiRoutes = Router();

// Middleware for authentication
function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies?.authToken || req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Middleware for role-based access
function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// === AUTH ===
apiRoutes.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, role = "staff" } = req.body;

    // Check if user already exists
    const existingUser = await dbStorage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingEmail = await dbStorage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await dbStorage.createUser({
      username,
      email,
      passwordHash,
      role,
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("authToken", token, { 
      httpOnly: true, 
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

apiRoutes.post("/auth/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { username, password } = result.data;

    // Find user
    const user = await dbStorage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: "Account is disabled" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("authToken", token, { 
      httpOnly: true, 
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to login" });
  }
});

apiRoutes.post("/auth/logout", (req, res) => {
  res.clearCookie("authToken");
  return res.json({ ok: true });
});

apiRoutes.get("/auth/session", requireAuth, async (req: any, res) => {
  try {
    const user = await dbStorage.getUserByUsername(req.user.username);
    if (!user) {
      return res.status(401).json({ ok: false });
    }
    return res.json({ 
      ok: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to get session" });
  }
});

// === STAFF ===
apiRoutes.get("/staff", requireAuth, async (_req, res) => {
  try {
    const staff = await dbStorage.getAllStaff();
    return res.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return res.status(500).json({ error: "Failed to fetch staff" });
  }
});

apiRoutes.get("/staff/:id", requireAuth, async (req, res) => {
  try {
    const staff = await dbStorage.getStaff(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }
    return res.json(staff);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch staff" });
  }
});

apiRoutes.post("/staff", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const result = insertStaffSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const staff = await dbStorage.createStaff(result.data);
    return res.status(201).json(staff);
  } catch (error) {
    console.error("Error creating staff:", error);
    return res.status(500).json({ error: "Failed to create staff" });
  }
});

apiRoutes.put("/staff/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const result = updateStaffSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const staff = await dbStorage.updateStaff(req.params.id, result.data);
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }
    return res.json(staff);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update staff" });
  }
});

apiRoutes.delete("/staff/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const success = await dbStorage.deleteStaff(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Staff not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete staff" });
  }
});

// === CLIENTS ===
apiRoutes.get("/clients/all", requireAuth, async (_req, res) => {
  try {
    const clients = await dbStorage.getAllClients();
    return res.json(clients);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch clients" });
  }
});

apiRoutes.get("/staff/:staffId/clients", requireAuth, async (req, res) => {
  try {
    const clients = await dbStorage.getClientsByStaffId(req.params.staffId);
    return res.json(clients);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch clients" });
  }
});

apiRoutes.get("/clients/:id", requireAuth, async (req, res) => {
  try {
    const client = await dbStorage.getClient(req.params.id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    return res.json(client);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch client" });
  }
});

apiRoutes.post("/clients", requireAuth, async (req: any, res) => {
  try {
    const result = insertClientSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const clientData = {
      ...result.data,
      staffId: result.data.staffId || req.user.id,
    };

    const client = await dbStorage.createClient(clientData);
    return res.status(201).json(client);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create client" });
  }
});

apiRoutes.put("/clients/:id", requireAuth, async (req, res) => {
  try {
    const result = updateClientSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const client = await dbStorage.updateClient(req.params.id, result.data);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    return res.json(client);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update client" });
  }
});

apiRoutes.delete("/clients/:id", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const success = await dbStorage.deleteClient(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Client not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete client" });
  }
});

// === WEEKLY DOCUMENTATION ===
apiRoutes.get("/weekly-documentation/all", requireAuth, async (_req, res) => {
  try {
    const docs = await dbStorage.getAllWeeklyDocumentation();
    return res.json(docs);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch weekly documentation" });
  }
});

apiRoutes.get("/weekly-documentation/:clientId", requireAuth, async (req, res) => {
  try {
    const docs = await dbStorage.getWeeklyDocumentationByClient(req.params.clientId);
    return res.json(docs);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch weekly documentation" });
  }
});

apiRoutes.post("/weekly-documentation", requireAuth, async (req: any, res) => {
  try {
    const result = insertWeeklyDocumentationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const docData = {
      ...result.data,
      staffId: result.data.staffId || req.user.id,
    };

    const doc = await dbStorage.createWeeklyDocumentation(docData);
    return res.status(201).json(doc);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create weekly documentation" });
  }
});

apiRoutes.put("/weekly-documentation/:id", requireAuth, async (req, res) => {
  try {
    const result = updateWeeklyDocumentationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const doc = await dbStorage.updateWeeklyDocumentation(req.params.id, result.data);
    if (!doc) {
      return res.status(404).json({ error: "Documentation not found" });
    }
    return res.json(doc);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update weekly documentation" });
  }
});

// === MONTHLY REPORTS ===
apiRoutes.get("/monthly-reports/all", requireAuth, async (_req, res) => {
  try {
    const reports = await dbStorage.getAllMonthlyReports();
    return res.json(reports);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch monthly reports" });
  }
});

apiRoutes.get("/monthly-reports/:clientId", requireAuth, async (req, res) => {
  try {
    const reports = await dbStorage.getMonthlyReportsByClient(req.params.clientId);
    return res.json(reports);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch monthly reports" });
  }
});

apiRoutes.post("/monthly-reports", requireAuth, async (req: any, res) => {
  try {
    const result = insertMonthlyReportSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const reportData = {
      ...result.data,
      staffId: result.data.staffId || req.user.id,
    };

    const report = await dbStorage.createMonthlyReport(reportData);
    return res.status(201).json(report);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create monthly report" });
  }
});

apiRoutes.put("/monthly-reports/:id", requireAuth, async (req, res) => {
  try {
    const result = updateMonthlyReportSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const report = await dbStorage.updateMonthlyReport(req.params.id, result.data);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update monthly report" });
  }
});

// === CARE PLANS ===
apiRoutes.get("/care-plans/all", requireAuth, async (_req, res) => {
  try {
    const plans = await dbStorage.getAllCarePlans();
    return res.json(plans);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch care plans" });
  }
});

apiRoutes.get("/care-plans/client/:clientId", requireAuth, async (req, res) => {
  try {
    const plans = await dbStorage.getCarePlansByClient(req.params.clientId);
    return res.json(plans);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch care plans" });
  }
});

apiRoutes.post("/care-plans", requireAuth, async (req: any, res) => {
  try {
    const result = insertCarePlanSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const planData = {
      ...result.data,
      staffId: result.data.staffId || req.user.id,
    };

    const plan = await dbStorage.createCarePlan(planData);
    return res.status(201).json(plan);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create care plan" });
  }
});

apiRoutes.put("/care-plans/:id", requireAuth, async (req, res) => {
  try {
    const result = updateCarePlanSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const plan = await dbStorage.updateCarePlan(req.params.id, result.data);
    if (!plan) {
      return res.status(404).json({ error: "Care plan not found" });
    }
    return res.json(plan);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update care plan" });
  }
});

// === IMPLEMENTATION PLANS ===
apiRoutes.get("/implementation-plans/all", requireAuth, async (_req, res) => {
  try {
    const plans = await dbStorage.getAllImplementationPlans();
    return res.json(plans);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch implementation plans" });
  }
});

apiRoutes.get("/implementation-plans/:clientId", requireAuth, async (req, res) => {
  try {
    const plans = await dbStorage.getImplementationPlansByClient(req.params.clientId);
    return res.json(plans);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch implementation plans" });
  }
});

apiRoutes.post("/implementation-plans", requireAuth, async (req: any, res) => {
  try {
    const result = insertImplementationPlanSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const planData = {
      ...result.data,
      staffId: result.data.staffId || req.user.id,
    };

    const plan = await dbStorage.createImplementationPlan(planData);
    return res.status(201).json(plan);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create implementation plan" });
  }
});

apiRoutes.put("/implementation-plans/:id", requireAuth, async (req, res) => {
  try {
    const result = updateImplementationPlanSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const plan = await dbStorage.updateImplementationPlan(req.params.id, result.data);
    if (!plan) {
      return res.status(404).json({ error: "Implementation plan not found" });
    }
    return res.json(plan);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update implementation plan" });
  }
});

// === VIMSA TIME ===
apiRoutes.get("/vimsa-time/all", requireAuth, async (_req, res) => {
  try {
    const times = await dbStorage.getAllVimsaTime();
    return res.json(times);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch vimsa time" });
  }
});

apiRoutes.get("/vimsa-time/:clientId", requireAuth, async (req, res) => {
  try {
    const times = await dbStorage.getVimsaTimeByClient(req.params.clientId);
    return res.json(times);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch vimsa time" });
  }
});

apiRoutes.post("/vimsa-time", requireAuth, async (req: any, res) => {
  try {
    const result = insertVimsaTimeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const timeData = {
      ...result.data,
      staffId: result.data.staffId || req.user.id,
    };

    const time = await dbStorage.createVimsaTime(timeData);
    return res.status(201).json(time);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create vimsa time" });
  }
});

apiRoutes.put("/vimsa-time/:id", requireAuth, async (req, res) => {
  try {
    const result = updateVimsaTimeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const time = await dbStorage.updateVimsaTime(req.params.id, result.data);
    if (!time) {
      return res.status(404).json({ error: "Vimsa time not found" });
    }
    return res.json(time);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update vimsa time" });
  }
});

// === SEARCH ENDPOINTS ===
apiRoutes.get("/search/staff", requireAuth, async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }
    const results = await dbStorage.searchStaff(query);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: "Failed to search staff" });
  }
});

apiRoutes.get("/search/clients", requireAuth, async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }
    const results = await dbStorage.searchClients(query);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: "Failed to search clients" });
  }
});

// === STATISTICS ===
apiRoutes.get("/statistics", requireAuth, async (_req, res) => {
  try {
    const stats = await dbStorage.getStatistics();
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

apiRoutes.get("/statistics/recent-activity", requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activity = await dbStorage.getRecentActivity(limit);
    return res.json(activity);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch recent activity" });
  }
});

// === BULK OPERATIONS ===
apiRoutes.post("/bulk/staff", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const staffList = req.body.staff;
    if (!Array.isArray(staffList)) {
      return res.status(400).json({ error: "Staff list must be an array" });
    }

    const results = await dbStorage.bulkCreateStaff(staffList);
    return res.json({ created: results.length, staff: results });
  } catch (error) {
    return res.status(500).json({ error: "Failed to bulk create staff" });
  }
});

apiRoutes.delete("/bulk/staff", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs must be an array" });
    }

    const success = await dbStorage.bulkDeleteStaff(ids);
    return res.json({ success, deleted: ids.length });
  } catch (error) {
    return res.status(500).json({ error: "Failed to bulk delete staff" });
  }
});

apiRoutes.post("/bulk/clients", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const clientList = req.body.clients;
    if (!Array.isArray(clientList)) {
      return res.status(400).json({ error: "Client list must be an array" });
    }

    const results = await dbStorage.bulkCreateClients(clientList);
    return res.json({ created: results.length, clients: results });
  } catch (error) {
    return res.status(500).json({ error: "Failed to bulk create clients" });
  }
});

apiRoutes.delete("/bulk/clients", requireAuth, requireRole(["admin", "staff"]), async (req, res) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs must be an array" });
    }

    const success = await dbStorage.bulkDeleteClients(ids);
    return res.json({ success, deleted: ids.length });
  } catch (error) {
    return res.status(500).json({ error: "Failed to bulk delete clients" });
  }
});
