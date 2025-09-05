import { Router } from "express";
import { eq, and, desc, asc, sql, ilike, or } from "drizzle-orm";
import { db } from "../db.js";
import { 
  staff, 
  clients, 
  carePlans, 
  implementationPlans, 
  weeklyDocumentation, 
  monthlyReports, 
  vimsaTime,
  users,
  type InsertStaff,
  type UpdateStaff,
  type InsertClient,
  type UpdateClient,
  type InsertCarePlan,
  type UpdateCarePlan,
  type InsertImplementationPlan,
  type UpdateImplementationPlan,
  type InsertWeeklyDocumentation,
  type UpdateWeeklyDocumentation,
  type InsertMonthlyReport,
  type UpdateMonthlyReport,
  type InsertVimsaTime,
  type UpdateVimsaTime
} from "../../shared/schema.js";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export const databaseRoutes = Router();

function getCurrentStaffId(req: any): string {
  return req.user?.id || req.cookies?.devToken || req.get("X-Dev-Token") || "s_demo";
}

// === AUTHENTICATION ===
databaseRoutes.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (user.length === 0) {
      return res.status(401).json({ error: "Ogiltiga inloggningsuppgifter" });
    }

    const foundUser = user[0];
    
    // Check if user is active
    if (!foundUser.isActive) {
      return res.status(401).json({ error: "Kontot är inaktiverat" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, foundUser.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Ogiltiga inloggningsuppgifter" });
    }

    // Set session/cookie
    const token = foundUser.id;
    res.cookie("authToken", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.json({
      ok: true,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
      },
      token: token
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Serverfel vid inloggning" });
  }
});

databaseRoutes.post("/auth/logout", (req, res) => {
  res.clearCookie("authToken");
  res.json({ ok: true });
});

databaseRoutes.get("/auth/me", async (req, res) => {
  try {
    const token = req.cookies?.authToken || req.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Ingen autentisering" });
    }

    const user = await db.select().from(users).where(eq(users.id, token)).limit(1);
    
    if (user.length === 0 || !user[0].isActive) {
      return res.status(401).json({ error: "Ogiltig session" });
    }

    return res.json({
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      role: user[0].role,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return res.status(500).json({ error: "Serverfel vid autentiseringskontroll" });
  }
});

// === STAFF MANAGEMENT ===
databaseRoutes.get("/staff", async (req, res) => {
  try {
    const { search, sort = "name", order = "asc" } = req.query;
    
    let query = db.select().from(staff).where(sql`${staff.deletedAt} IS NULL`);
    
    // Add search functionality
    if (search && typeof search === "string") {
      query = query.where(
        or(
          ilike(staff.name, `%${search}%`),
          ilike(staff.initials, `%${search}%`),
          ilike(staff.epost, `%${search}%`)
        )
      );
    }
    
    // Add sorting
    const orderFn = order === "desc" ? desc : asc;
    if (sort === "name") {
      query = query.orderBy(orderFn(staff.name));
    } else if (sort === "createdAt") {
      query = query.orderBy(orderFn(staff.createdAt));
    }
    
    const result = await query;
    return res.json(result);
  } catch (error) {
    console.error("Get staff error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av personal" });
  }
});

databaseRoutes.post("/staff", async (req, res) => {
  try {
    const staffData: InsertStaff = {
      id: `staff_${randomUUID()}`,
      ...req.body,
    };
    
    const result = await db.insert(staff).values(staffData).returning();
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create staff error:", error);
    return res.status(500).json({ error: "Fel vid skapande av personal" });
  }
});

databaseRoutes.put("/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateStaff = req.body;
    
    const result = await db
      .update(staff)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(and(eq(staff.id, id), sql`${staff.deletedAt} IS NULL`))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Personal hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update staff error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av personal" });
  }
});

databaseRoutes.delete("/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    const result = await db
      .update(staff)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(staff.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Personal hittades inte" });
    }
    
    return res.json({ message: "Personal borttagen" });
  } catch (error) {
    console.error("Delete staff error:", error);
    return res.status(500).json({ error: "Fel vid borttagning av personal" });
  }
});

databaseRoutes.post("/staff/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .update(staff)
      .set({ deletedAt: null, updatedAt: sql`NOW()` })
      .where(eq(staff.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Personal hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Restore staff error:", error);
    return res.status(500).json({ error: "Fel vid återställning av personal" });
  }
});

// === CLIENT MANAGEMENT ===
databaseRoutes.get("/clients/all", async (req, res) => {
  try {
    const { search, staffId, status, sort = "initials", order = "asc" } = req.query;
    
    let query = db.select().from(clients).where(sql`${clients.deletedAt} IS NULL`);
    
    // Add search functionality
    if (search && typeof search === "string") {
      query = query.where(
        or(
          ilike(clients.initials, `%${search}%`),
          ilike(clients.personalNumber, `%${search}%`),
          ilike(clients.notes, `%${search}%`)
        )
      );
    }
    
    // Filter by staff
    if (staffId && typeof staffId === "string") {
      query = query.where(eq(clients.staffId, staffId));
    }
    
    // Filter by status
    if (status && typeof status === "string") {
      query = query.where(eq(clients.status, status));
    }
    
    // Add sorting
    const orderFn = order === "desc" ? desc : asc;
    if (sort === "initials") {
      query = query.orderBy(orderFn(clients.initials));
    } else if (sort === "createdAt") {
      query = query.orderBy(orderFn(clients.createdAt));
    }
    
    const result = await query;
    return res.json(result);
  } catch (error) {
    console.error("Get clients error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av klienter" });
  }
});

databaseRoutes.get("/staff/:staffId/clients", async (req, res) => {
  try {
    const { staffId } = req.params;
    const { search, status } = req.query;
    
    let query = db.select().from(clients)
      .where(and(
        eq(clients.staffId, staffId),
        sql`${clients.deletedAt} IS NULL`
      ));
    
    if (search && typeof search === "string") {
      query = query.where(ilike(clients.initials, `%${search}%`));
    }
    
    if (status && typeof status === "string") {
      query = query.where(eq(clients.status, status));
    }
    
    const result = await query.orderBy(asc(clients.initials));
    return res.json(result);
  } catch (error) {
    console.error("Get staff clients error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av klienter för personal" });
  }
});

databaseRoutes.post("/clients", async (req, res) => {
  try {
    const clientData: InsertClient = {
      id: `c_${randomUUID()}`,
      staffId: req.body.staffId || getCurrentStaffId(req),
      ...req.body,
    };
    
    const result = await db.insert(clients).values(clientData).returning();
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create client error:", error);
    return res.status(500).json({ error: "Fel vid skapande av klient" });
  }
});

databaseRoutes.put("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateClient = req.body;
    
    const result = await db
      .update(clients)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(and(eq(clients.id, id), sql`${clients.deletedAt} IS NULL`))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Klient hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update client error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av klient" });
  }
});

databaseRoutes.delete("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    const result = await db
      .update(clients)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(clients.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Klient hittades inte" });
    }
    
    return res.json({ message: "Klient borttagen" });
  } catch (error) {
    console.error("Delete client error:", error);
    return res.status(500).json({ error: "Fel vid borttagning av klient" });
  }
});

databaseRoutes.post("/clients/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .update(clients)
      .set({ deletedAt: null, updatedAt: sql`NOW()` })
      .where(eq(clients.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Klient hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Restore client error:", error);
    return res.status(500).json({ error: "Fel vid återställning av klient" });
  }
});

// === CARE PLANS ===
databaseRoutes.get("/care-plans", async (req, res) => {
  try {
    const { clientId, staffId, status, search } = req.query;
    
    let query = db.select().from(carePlans);
    const conditions = [];
    
    if (clientId && typeof clientId === "string") {
      conditions.push(eq(carePlans.clientId, clientId));
    }
    
    if (staffId && typeof staffId === "string") {
      conditions.push(eq(carePlans.staffId, staffId));
    }
    
    if (status && typeof status === "string") {
      conditions.push(eq(carePlans.status, status));
    }
    
    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(carePlans.planContent, `%${search}%`),
          ilike(carePlans.goals, `%${search}%`),
          ilike(carePlans.interventions, `%${search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(carePlans.createdAt));
    return res.json(result);
  } catch (error) {
    console.error("Get care plans error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av vårdplaner" });
  }
});

databaseRoutes.get("/care-plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.select().from(carePlans).where(eq(carePlans.id, id)).limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Vårdplan hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Get care plan error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av vårdplan" });
  }
});

databaseRoutes.post("/care-plans", async (req, res) => {
  try {
    const carePlanData: InsertCarePlan = {
      id: `cp_${randomUUID()}`,
      staffId: getCurrentStaffId(req),
      ...req.body,
    };
    
    const result = await db.insert(carePlans).values(carePlanData).returning();
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create care plan error:", error);
    return res.status(500).json({ error: "Fel vid skapande av vårdplan" });
  }
});

databaseRoutes.put("/care-plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateCarePlan = req.body;
    
    const result = await db
      .update(carePlans)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(carePlans.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Vårdplan hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update care plan error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av vårdplan" });
  }
});

// === IMPLEMENTATION PLANS ===
databaseRoutes.get("/implementation-plans", async (req, res) => {
  try {
    const { clientId, staffId, status, search } = req.query;
    
    let query = db.select().from(implementationPlans);
    const conditions = [];
    
    if (clientId && typeof clientId === "string") {
      conditions.push(eq(implementationPlans.clientId, clientId));
    }
    
    if (staffId && typeof staffId === "string") {
      conditions.push(eq(implementationPlans.staffId, staffId));
    }
    
    if (status && typeof status === "string") {
      conditions.push(eq(implementationPlans.status, status));
    }
    
    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(implementationPlans.planContent, `%${search}%`),
          ilike(implementationPlans.goals, `%${search}%`),
          ilike(implementationPlans.activities, `%${search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(implementationPlans.createdAt));
    return res.json(result);
  } catch (error) {
    console.error("Get implementation plans error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av genomförandeplaner" });
  }
});

databaseRoutes.post("/implementation-plans", async (req, res) => {
  try {
    const planData: InsertImplementationPlan = {
      id: `ip_${randomUUID()}`,
      staffId: getCurrentStaffId(req),
      ...req.body,
    };
    
    const result = await db.insert(implementationPlans).values(planData).returning();
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create implementation plan error:", error);
    return res.status(500).json({ error: "Fel vid skapande av genomförandeplan" });
  }
});

databaseRoutes.put("/implementation-plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateImplementationPlan = req.body;
    
    const result = await db
      .update(implementationPlans)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(implementationPlans.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Genomförandeplan hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update implementation plan error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av genomförandeplan" });
  }
});

// === WEEKLY DOCUMENTATION ===
databaseRoutes.get("/weekly-documentation", async (req, res) => {
  try {
    const { clientId, staffId, year, week, search } = req.query;
    
    let query = db.select().from(weeklyDocumentation);
    const conditions = [];
    
    if (clientId && typeof clientId === "string") {
      conditions.push(eq(weeklyDocumentation.clientId, clientId));
    }
    
    if (staffId && typeof staffId === "string") {
      conditions.push(eq(weeklyDocumentation.staffId, staffId));
    }
    
    if (year && typeof year === "string") {
      conditions.push(eq(weeklyDocumentation.year, parseInt(year)));
    }
    
    if (week && typeof week === "string") {
      conditions.push(eq(weeklyDocumentation.week, parseInt(week)));
    }
    
    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(weeklyDocumentation.content, `%${search}%`),
          ilike(weeklyDocumentation.documentation, `%${search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(weeklyDocumentation.year), desc(weeklyDocumentation.week));
    return res.json(result);
  } catch (error) {
    console.error("Get weekly documentation error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av veckodokumentation" });
  }
});

databaseRoutes.post("/weekly-documentation", async (req, res) => {
  try {
    const docData: InsertWeeklyDocumentation = {
      id: `wd_${randomUUID()}`,
      staffId: getCurrentStaffId(req),
      ...req.body,
    };
    
    const result = await db.insert(weeklyDocumentation).values(docData).returning();
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create weekly documentation error:", error);
    return res.status(500).json({ error: "Fel vid skapande av veckodokumentation" });
  }
});

databaseRoutes.put("/weekly-documentation/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateWeeklyDocumentation = req.body;
    
    const result = await db
      .update(weeklyDocumentation)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(weeklyDocumentation.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Veckodokumentation hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update weekly documentation error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av veckodokumentation" });
  }
});

// === MONTHLY REPORTS ===
databaseRoutes.get("/monthly-reports", async (req, res) => {
  try {
    const { clientId, staffId, year, month, status, search } = req.query;
    
    let query = db.select().from(monthlyReports);
    const conditions = [];
    
    if (clientId && typeof clientId === "string") {
      conditions.push(eq(monthlyReports.clientId, clientId));
    }
    
    if (staffId && typeof staffId === "string") {
      conditions.push(eq(monthlyReports.staffId, staffId));
    }
    
    if (year && typeof year === "string") {
      conditions.push(eq(monthlyReports.year, parseInt(year)));
    }
    
    if (month && typeof month === "string") {
      conditions.push(eq(monthlyReports.month, parseInt(month)));
    }
    
    if (status && typeof status === "string") {
      conditions.push(eq(monthlyReports.status, status));
    }
    
    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(monthlyReports.content, `%${search}%`),
          ilike(monthlyReports.reportContent, `%${search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
    return res.json(result);
  } catch (error) {
    console.error("Get monthly reports error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av månadsrapporter" });
  }
});

databaseRoutes.post("/monthly-reports", async (req, res) => {
  try {
    const reportData: InsertMonthlyReport = {
      id: `mr_${randomUUID()}`,
      staffId: getCurrentStaffId(req),
      ...req.body,
    };
    
    const result = await db.insert(monthlyReports).values(reportData).returning();
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create monthly report error:", error);
    return res.status(500).json({ error: "Fel vid skapande av månadsrapport" });
  }
});

databaseRoutes.put("/monthly-reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateMonthlyReport = req.body;
    
    const result = await db
      .update(monthlyReports)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(monthlyReports.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Månadsrapport hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update monthly report error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av månadsrapport" });
  }
});

databaseRoutes.delete("/monthly-reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.delete(monthlyReports).where(eq(monthlyReports.id, id)).returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Månadsrapport hittades inte" });
    }
    
    return res.json({ message: "Månadsrapport borttagen" });
  } catch (error) {
    console.error("Delete monthly report error:", error);
    return res.status(500).json({ error: "Fel vid borttagning av månadsrapport" });
  }
});

// === VIMSA TIME ===
databaseRoutes.get("/vimsa-time", async (req, res) => {
  try {
    const { clientId, staffId, year, week, approved } = req.query;
    
    let query = db.select().from(vimsaTime);
    const conditions = [];
    
    if (clientId && typeof clientId === "string") {
      conditions.push(eq(vimsaTime.clientId, clientId));
    }
    
    if (staffId && typeof staffId === "string") {
      conditions.push(eq(vimsaTime.staffId, staffId));
    }
    
    if (year && typeof year === "string") {
      conditions.push(eq(vimsaTime.year, parseInt(year)));
    }
    
    if (week && typeof week === "string") {
      conditions.push(eq(vimsaTime.week, parseInt(week)));
    }
    
    if (approved !== undefined) {
      conditions.push(eq(vimsaTime.approved, approved === "true"));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(vimsaTime.year), desc(vimsaTime.week));
    return res.json(result);
  } catch (error) {
    console.error("Get vimsa time error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av vimsa tid" });
  }
});

databaseRoutes.post("/vimsa-time", async (req, res) => {
  try {
    const timeData: InsertVimsaTime = {
      id: `vt_${randomUUID()}`,
      staffId: getCurrentStaffId(req),
      ...req.body,
    };
    
    const result = await db.insert(vimsaTime).values(timeData).returning();
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create vimsa time error:", error);
    return res.status(500).json({ error: "Fel vid skapande av vimsa tid" });
  }
});

databaseRoutes.put("/vimsa-time/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateVimsaTime = req.body;
    
    const result = await db
      .update(vimsaTime)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(vimsaTime.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Vimsa tid hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update vimsa time error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av vimsa tid" });
  }
});

databaseRoutes.delete("/vimsa-time/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.delete(vimsaTime).where(eq(vimsaTime.id, id)).returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Vimsa tid hittades inte" });
    }
    
    return res.json({ message: "Vimsa tid borttagen" });
  } catch (error) {
    console.error("Delete vimsa time error:", error);
    return res.status(500).json({ error: "Fel vid borttagning av vimsa tid" });
  }
});

// === BULK OPERATIONS ===
databaseRoutes.post("/bulk/clients", async (req, res) => {
  try {
    const { action, clientIds, updates } = req.body;
    
    if (action === "delete") {
      const result = await db
        .update(clients)
        .set({ deletedAt: sql`NOW()` })
        .where(sql`${clients.id} = ANY(${clientIds})`);
      
      return res.json({ message: `${clientIds.length} klienter borttagna` });
    }
    
    if (action === "update" && updates) {
      const result = await db
        .update(clients)
        .set({ ...updates, updatedAt: sql`NOW()` })
        .where(sql`${clients.id} = ANY(${clientIds})`);
      
      return res.json({ message: `${clientIds.length} klienter uppdaterade` });
    }
    
    return res.status(400).json({ error: "Ogiltig bulk-operation" });
  } catch (error) {
    console.error("Bulk clients error:", error);
    return res.status(500).json({ error: "Fel vid bulk-operation på klienter" });
  }
});

databaseRoutes.post("/bulk/staff", async (req, res) => {
  try {
    const { action, staffIds, updates } = req.body;
    
    if (action === "delete") {
      const result = await db
        .update(staff)
        .set({ deletedAt: sql`NOW()` })
        .where(sql`${staff.id} = ANY(${staffIds})`);
      
      return res.json({ message: `${staffIds.length} personal borttagna` });
    }
    
    if (action === "update" && updates) {
      const result = await db
        .update(staff)
        .set({ ...updates, updatedAt: sql`NOW()` })
        .where(sql`${staff.id} = ANY(${staffIds})`);
      
      return res.json({ message: `${staffIds.length} personal uppdaterade` });
    }
    
    return res.status(400).json({ error: "Ogiltig bulk-operation" });
  } catch (error) {
    console.error("Bulk staff error:", error);
    return res.status(500).json({ error: "Fel vid bulk-operation på personal" });
  }
});

// === STATISTICS AND DASHBOARD ===
databaseRoutes.get("/dashboard/stats", async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    
    // Get basic counts
    const [
      totalClients,
      totalStaff,
      totalCarePlans,
      totalImplementationPlans,
      totalWeeklyDocs,
      totalMonthlyReports
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(clients).where(sql`${clients.deletedAt} IS NULL`),
      db.select({ count: sql<number>`count(*)` }).from(staff).where(sql`${staff.deletedAt} IS NULL`),
      db.select({ count: sql<number>`count(*)` }).from(carePlans),
      db.select({ count: sql<number>`count(*)` }).from(implementationPlans),
      db.select({ count: sql<number>`count(*)` }).from(weeklyDocumentation),
      db.select({ count: sql<number>`count(*)` }).from(monthlyReports)
    ]);
    
    // Get status distributions
    const carePlanStats = await db
      .select({ 
        status: carePlans.status, 
        count: sql<number>`count(*)` 
      })
      .from(carePlans)
      .groupBy(carePlans.status);
    
    const monthlyReportStats = await db
      .select({ 
        status: monthlyReports.status, 
        count: sql<number>`count(*)` 
      })
      .from(monthlyReports)
      .groupBy(monthlyReports.status);
    
    return res.json({
      totals: {
        clients: totalClients[0].count,
        staff: totalStaff[0].count,
        carePlans: totalCarePlans[0].count,
        implementationPlans: totalImplementationPlans[0].count,
        weeklyDocumentation: totalWeeklyDocs[0].count,
        monthlyReports: totalMonthlyReports[0].count
      },
      distributions: {
        carePlans: carePlanStats,
        monthlyReports: monthlyReportStats
      }
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av statistik" });
  }
});

export default databaseRoutes;