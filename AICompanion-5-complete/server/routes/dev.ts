import { Router } from "express";
import { z } from "zod";
import { devStorage } from "../devStorage";
import {
  clientSchema,
  carePlanSchema,
  implementationPlanSchema,
  weeklyDocumentationSchema,
  monthlyReportSchema,
  vimsaTimeSchema,
} from "../schemas";
import { devAuthMiddleware, requireAuth } from "../middleware/auth";

// In-memory token -> user map for dev session info
const sessionUsers = new Map<string, any>();

function getTokenFromReq(req: any): string | undefined {
  const headerToken =
    (req.headers && (req.headers["x-dev-token"] as string)) || undefined;
  const cookieToken =
    (req.cookies && (req.cookies.devToken as string)) || undefined;
  return headerToken || cookieToken;
}

const router = Router();

// Apply dev auth middleware to all routes
router.use(devAuthMiddleware);

// Apply requireAuth to all routes except login and debug
router.use((req, res, next) => {
  if (
    req.path === "/api/auth/login" ||
    req.path === "/login" ||
    req.path === "/api/debug"
  ) {
    return next();
  }
  requireAuth(req, res, next);
});

// Health check
router.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is running in development mode" });
});

// Debug route to test POST
router.post("/api/debug", (req, res) => {
  res.json({ message: "POST works", body: req.body });
});

// Auth routes
router.post("/api/auth/login", (req, res) => {
  try {
    const body = z
      .object({
        username: z.string().min(1).optional(),
        password: z.string().optional(),
      })
      .parse(req.body || {});

    // Use existing dev token from middleware/cookie if available to avoid mismatch
    const existingToken = getTokenFromReq(req);
    const token = existingToken || `dev-${Date.now()}`;

    // Ensure cookie is set to the same token for subsequent requests (so /auth/me works without headers)
    res.cookie("devToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const user = {
      id: token,
      username: body.username || "devuser",
      role: "admin",
      staffId: "s_dev",
      email: "dev@local",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sessionUsers.set(token, user);

    res.json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

// Return current auth user based on token
router.get("/api/auth/me", (req, res) => {
  const token = getTokenFromReq(req) || (req as any).user?.id;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = sessionUsers.get(token) || {
    id: token,
    username: "devuser",
    role: "admin",
    staffId: "s_dev",
    email: "dev@local",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Cache default as well so future requests are consistent
  sessionUsers.set(token, user);
  res.json(user);
});

// Session endpoint (alias for /api/auth/me)
router.get("/api/session", (req, res) => {
  const token = getTokenFromReq(req) || (req as any).user?.id;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = sessionUsers.get(token) || {
    id: token,
    username: "devuser",
    role: "admin",
    staffId: "s_dev",
    email: "dev@local",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Cache default as well so future requests are consistent
  sessionUsers.set(token, user);
  res.json(user);
});

// Logout clears cookie and any stored session mapping
router.post("/api/auth/logout", (req, res) => {
  const token = getTokenFromReq(req);
  if (token) sessionUsers.delete(token);
  res.clearCookie("devToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(204).end();
});

// Staff routes
router.get("/api/staff", async (req, res) => {
  try {
    // Return staff data from storage (filter out deleted staff)
    const staff = await devStorage.getStaff();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// Create staff
router.post("/api/staff", async (req, res) => {
  try {
    const data = z
      .object({
        name: z.string().min(1),
        initials: z.string().min(1),
        personnummer: z.string().optional(),
        telefon: z.string().optional(),
        epost: z.string().email().optional(),
        adress: z.string().optional(),
        anställningsdatum: z.string().optional(),
        roll: z.string().optional(),
        avdelning: z.string().optional(),
      })
      .parse(req.body);

    // Ensure required fields are present
    const staffData = {
      name: data.name,
      initials: data.initials,
      personnummer: data.personnummer || "",
      telefon: data.telefon || "",
      epost: data.epost || "",
      adress: data.adress || "",
      anställningsdatum: data.anställningsdatum || "",
      roll: data.roll || "",
      avdelning: data.avdelning || "",
    };

    const newStaff = await devStorage.createStaff(staffData);
    res.status(201).json(newStaff);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create staff" });
  }
});

// Delete staff
router.delete("/api/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await devStorage.deleteStaff(id);
    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete staff" });
  }
});

// Client routes
router.post("/api/clients", async (req, res) => {
  try {
    const data = clientSchema.omit({ id: true }).parse({
      ...req.body,
      staffId: req.body.staffId || (req as any).user.id,
    });
    const client = await devStorage.createClient(data);
    res.status(201).json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create client" });
  }
});

router.get("/api/staff/:staffId/clients", async (req, res) => {
  try {
    const { staffId } = req.params;
    const clients = await devStorage.getClientsByStaff(staffId);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Get all clients (for forms that need client selection)
router.get("/api/clients/all", async (req, res) => {
  try {
    const store = devStorage.getStore();
    res.json(store.clients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Care plan routes
router.post("/api/care-plans", async (req, res) => {
  try {
    const data = carePlanSchema.omit({ id: true }).parse({
      ...req.body,
      staffId: req.body.staffId || (req as any).user.id,
    });
    const carePlan = await devStorage.createCarePlan(data);
    res.status(201).json(carePlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create care plan" });
  }
});

router.get("/api/clients/:clientId/care-plans", async (req, res) => {
  try {
    const { clientId } = req.params;
    const carePlans = await devStorage.getCarePlansByClient(clientId);
    res.json(carePlans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch care plans" });
  }
});

// Get single care plan by client ID (for client detail view)
router.get("/api/care-plans/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const carePlans = await devStorage.getCarePlansByClient(clientId);
    // Return the first care plan for this client
    res.json(carePlans[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch care plan" });
  }
});

// Staff-scoped care plans
router.get("/api/care-plans/staff/:staffId", async (req, res) => {
  try {
    const { staffId } = z
      .object({ staffId: z.string().min(1) })
      .parse(req.params);
    const store = devStorage.getStore();
    const staffCarePlans = store.carePlans.filter(
      (cp: any) => cp.staffId === staffId
    );
    res.json(staffCarePlans);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to fetch care plans for staff" });
  }
});

// Implementation plan routes
router.post("/api/implementation-plans", async (req, res) => {
  try {
    // Check if this is an update (has id in body)
    if (req.body.id) {
      const { id, ...data } = req.body;
      const updateData = implementationPlanSchema.omit({ id: true }).parse({
        ...data,
        staffId: data.staffId || (req as any).user.id,
      });
      const plan = await devStorage.updateImplementationPlan(id, updateData);
      res.json(plan);
    } else {
      // Create new plan
      const data = implementationPlanSchema.omit({ id: true }).parse({
        ...req.body,
        staffId: req.body.staffId || (req as any).user.id,
      });
      const plan = await devStorage.createImplementationPlan(data);
      res.status(201).json(plan);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res
      .status(500)
      .json({ error: "Failed to create/update implementation plan" });
  }
});

router.get("/api/clients/:clientId/implementation-plans", async (req, res) => {
  try {
    const { clientId } = req.params;
    const plans = await devStorage.getImplementationPlansByClient(clientId);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch implementation plans" });
  }
});

// Update implementation plan (must come before GET routes to avoid conflicts)
router.put("/api/implementation-plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = implementationPlanSchema.omit({ id: true }).parse({
      ...req.body,
      staffId: req.body.staffId || (req as any).user.id,
    });
    const plan = await devStorage.updateImplementationPlan(id, data);
    res.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update implementation plan" });
  }
});

// Get single implementation plan by client ID (for client detail view)
router.get("/api/implementation-plans/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const plans = await devStorage.getImplementationPlansByClient(clientId);
    // Return the first implementation plan for this client
    res.json(plans[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch implementation plan" });
  }
});

// Staff-scoped implementation plans
router.get("/api/implementation-plans/staff/:staffId", async (req, res) => {
  try {
    const { staffId } = z
      .object({ staffId: z.string().min(1) })
      .parse(req.params);
    const store = devStorage.getStore();
    const staffPlans = store.implementationPlans.filter(
      (ip: any) => ip.staffId === staffId
    );
    res.json(staffPlans);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res
      .status(500)
      .json({ error: "Failed to fetch implementation plans for staff" });
  }
});

// Weekly documentation routes
router.post("/api/weekly-documentation", async (req, res) => {
  try {
    const data = weeklyDocumentationSchema.omit({ id: true }).parse({
      ...req.body,
      staffId: req.body.staffId || (req as any).user.id,
      year: req.body.year || new Date().getFullYear(),
      week:
        req.body.week ||
        Math.ceil(
          (new Date().getTime() -
            new Date(new Date().getFullYear(), 0, 1).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        ),
    });
    const doc = await devStorage.createWeeklyDocumentation(data);
    res.status(201).json(doc);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create weekly documentation" });
  }
});

router.get("/api/clients/:clientId/weekly-documentation", async (req, res) => {
  try {
    const { clientId } = req.params;
    const docs = await devStorage.getWeeklyDocumentationByClient(clientId);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weekly documentation" });
  }
});

// Get weekly documentation by client ID (for client detail view)
router.get("/api/weekly-documentation/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const docs = await devStorage.getWeeklyDocumentationByClient(clientId);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weekly documentation" });
  }
});

// Monthly report routes
router.post("/api/monthly-reports", async (req, res) => {
  try {
    const data = monthlyReportSchema.omit({ id: true }).parse({
      ...req.body,
      staffId: req.body.staffId || (req as any).user.id,
      year: req.body.year || new Date().getFullYear(),
      month: req.body.month || new Date().getMonth() + 1,
    });
    const report = await devStorage.createMonthlyReport(data);
    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create monthly report" });
  }
});

router.get("/api/clients/:clientId/monthly-reports", async (req, res) => {
  try {
    const { clientId } = req.params;
    const reports = await devStorage.getMonthlyReportsByClient(clientId);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch monthly reports" });
  }
});

// Get monthly reports by client ID (for client detail view)
router.get("/api/monthly-reports/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const reports = await devStorage.getMonthlyReportsByClient(clientId);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch monthly reports" });
  }
});

// Vimsa time routes
router.post("/api/vimsa-time", async (req, res) => {
  try {
    const data = vimsaTimeSchema.omit({ id: true }).parse({
      ...req.body,
      staffId: req.body.staffId || (req as any).user.id,
      year: req.body.year || new Date().getFullYear(),
      week:
        req.body.week ||
        Math.ceil(
          (new Date().getTime() -
            new Date(new Date().getFullYear(), 0, 1).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        ),
    });
    const vimsaTime = await devStorage.createVimsaTime(data);
    res.status(201).json(vimsaTime);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create Vimsa time entry" });
  }
});

router.get("/api/clients/:clientId/vimsa-time", async (req, res) => {
  try {
    const { clientId } = req.params;
    const vimsaTime = await devStorage.getVimsaTimeByClient(clientId);
    res.json(vimsaTime);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Vimsa time entries" });
  }
});

// Get vimsa time by client ID (for client detail view)
router.get("/api/vimsa-time/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const vimsaTime = await devStorage.getVimsaTimeByClient(clientId);
    res.json(vimsaTime);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Vimsa time entries" });
  }
});

// Development-only routes
if (process.env.NODE_ENV !== "production") {
  // Clear all data (for testing)
  router.post("/api/dev/clear", async (req, res) => {
    await devStorage.clear();
    res.json({ message: "All data cleared" });
  });

  // Get all data (for debugging)
  router.get("/api/dev/store", (req, res) => {
    res.json(devStorage.getStore());
  });
}

export default router;
