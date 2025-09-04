import { Router } from "express";
import { store, persist } from "../devStorage";
import { randomUUID } from "crypto";
import { z } from "zod";

export const devRoutes = Router();

function staffIdOf(req: any) {
  return req.cookies?.devToken || req.get("X-Dev-Token") || "s_demo";
}

// === AUTH ===
devRoutes.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  // Simple demo authentication
  if (username === "admin" && password === "admin123") {
    const token = "s_demo";
    res.cookie("devToken", token, { httpOnly: false, sameSite: "lax" });
    return res.json({
      ok: true,
      user: {
        id: token,
        username: username,
        name: "Administrator",
      },
    });
  }

  // Check if it's a dev token login
  const devToken = req.get("X-Dev-Token");
  if (devToken) {
    res.cookie("devToken", devToken, { httpOnly: false, sameSite: "lax" });
    return res.json({ ok: true, user: { id: devToken, username: devToken } });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

devRoutes.get("/auth/session", (req, res) => {
  const t = req.cookies?.devToken;
  if (!t) return res.status(401).json({ ok: false });
  return res.json({ ok: true, user: { id: t } });
});

// === STAFF ===
devRoutes.get("/staff", (_req, res) => {
  return res.json(store.staff ?? []);
});

devRoutes.post("/staff", (req, res) => {
  const item = {
    id: "staff_" + randomUUID(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!store.staff) store.staff = [];
  store.staff.push(item);
  persist();
  return res.status(201).json(item);
});

// === CLIENTS ===
devRoutes.get("/clients/all", (_req, res) => {
  return res.json(store.clients ?? []);
});

devRoutes.get("/staff/:staffId/clients", (req, res) => {
  const list = (store.clients ?? []).filter(
    (c: any) => c.staffId === req.params.staffId
  );
  return res.json(list);
});

devRoutes.post("/clients", (req, res) => {
  const body = req.body || {};
  const item = {
    id: "c_" + randomUUID(),
    initials: body.initials ?? "",
    staffId: body.staffId ?? staffIdOf(req),
    status: body.status ?? "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.clients.push(item);
  persist();
  return res.status(201).json(item);
});

devRoutes.put("/clients/:id", (req, res) => {
  const id = req.params.id;
  const updates = req.body || {};
  const index = store.clients.findIndex((c: any) => c.id === id);
  if (index === -1)
    return res.status(404).json({ error: "Klient hittades inte" });

  store.clients[index] = {
    ...store.clients[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return res.json(store.clients[index]);
});

devRoutes.delete("/clients/:id", (req, res) => {
  const id = req.params.id;
  const index = store.clients.findIndex((c: any) => c.id === id);
  if (index === -1)
    return res.status(404).json({ error: "Klient hittades inte" });

  store.clients.splice(index, 1);
  persist();
  return res.status(204).send();
});

// === CARE PLANS ===
devRoutes.get("/care-plans/all", (_req, res) => {
  return res.json(store.carePlans ?? []);
});

devRoutes.get("/care-plans/:id", (req, res) => {
  const plan = (store.carePlans ?? []).find((p: any) => p.id === req.params.id);
  if (!plan) return res.status(404).json({ error: "Not found" });
  return res.json(plan);
});

devRoutes.get("/care-plans/client/:clientId", (req, res) => {
  const list = (store.carePlans ?? []).filter(
    (p: any) => p.clientId === req.params.clientId
  );
  return res.json(list);
});
devRoutes.get("/care-plans/staff/:staffId", (req, res) => {
  const list = (store.carePlans ?? []).filter(
    (p: any) => p.staffId === req.params.staffId
  );
  return res.json(list);
});
devRoutes.post("/care-plans", (req, res) => {
  const staffId = staffIdOf(req);
  const body = req.body || {};
  const item = {
    id: "cp_" + randomUUID(),
    clientId: body.clientId,
    staffId,
    planContent: body.planContent ?? "",
    goals: body.goals ?? "",
    interventions: body.interventions ?? "",
    status: body.status ?? "received",
    isActive: body.isActive ?? true,
    comment: body.comment ?? "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.carePlans.push(item);
  persist();
  return res.status(201).json(item);
});

devRoutes.put("/care-plans/:id", (req, res) => {
  const idx = (store.carePlans ?? []).findIndex(
    (p: any) => p.id === req.params.id
  );
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  store.carePlans[idx] = {
    ...store.carePlans[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return res.json(store.carePlans[idx]);
});

// === IMPLEMENTATION PLANS (administrativ) ===
devRoutes.get("/implementation-plans/all", (_req, res) => {
  return res.json(store.implementationPlans ?? []);
});

devRoutes.get("/implementation-plans/:clientId", (req, res) => {
  const list = (store.implementationPlans ?? []).filter(
    (p: any) => p.clientId === req.params.clientId
  );
  return res.json(list);
});
devRoutes.get("/implementation-plans/staff/:staffId", (req, res) => {
  const list = (store.implementationPlans ?? []).filter(
    (p: any) => p.staffId === req.params.staffId
  );
  return res.json(list);
});
devRoutes.post("/implementation-plans", (req, res) => {
  const staffId = staffIdOf(req);
  const b = req.body || {};
  const item = {
    id: "ip_" + randomUUID(),
    clientId: b.clientId,
    staffId,
    // ADMIN fields (no goals/treatment UI):
    planRef: b.planRef ?? "", // vilken genomförandeplan
    sentDate: b.sentDate ?? null, // YYYY-MM-DD
    completedDate: b.completedDate ?? null,
    followups: b.followups ?? [false, false, false, false, false, false], // 1..6
    // fallback: serialisera extra i comments
    comments: b.comments ?? "",
    status: b.status ?? "pending",
    isActive: b.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.implementationPlans.push(item);
  persist();
  return res.status(201).json(item);
});

devRoutes.put("/implementation-plans/:id", (req, res) => {
  const idx = (store.implementationPlans ?? []).findIndex(
    (p: any) => p.id === req.params.id
  );
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  store.implementationPlans[idx] = {
    ...store.implementationPlans[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return res.json(store.implementationPlans[idx]);
});

// === GFP (Genomförandeplan) ===
const gfpGoalSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1).max(280),
  done: z.boolean().optional().default(false),
});

const gfpCreateSchema = z.object({
  title: z.string().min(1).max(120),
  clientRef: z.string().min(1),
  goals: z.array(gfpGoalSchema).min(1),
});

const gfpUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  clientRef: z.string().min(1).optional(),
  goals: z.array(gfpGoalSchema).min(1).optional(),
  version: z.number().int(),
});

// List GFPs, optional filter by clientRef
devRoutes.get("/gfp", (req, res) => {
  const clientRef = (req.query.clientRef as string) || "";
  const list = (store.gfp ?? []).filter((p: any) =>
    clientRef ? p.clientRef === clientRef : true
  );
  return res.json(list);
});

// Get GFP by id
devRoutes.get("/gfp/:id", (req, res) => {
  const item = (store.gfp ?? []).find((p: any) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: "GFP hittades inte" });
  return res.json(item);
});

// Create GFP
devRoutes.post("/gfp", (req, res) => {
  try {
    const parsed = gfpCreateSchema.parse(req.body || {});
    const now = new Date().toISOString();
    const item = {
      id: "gfp_" + randomUUID(),
      title: parsed.title,
      clientRef: parsed.clientRef,
      goals: parsed.goals.map((g: any) => ({
        id: g.id || ("goal_" + randomUUID()),
        text: g.text,
        done: !!g.done,
      })),
      version: 1,
      locked: false,
      lockedBy: null as string | null,
      lockedAt: null as string | null,
      ownerId: staffIdOf(req),
      createdAt: now,
      updatedAt: now,
    };
    if (!store.gfp) store.gfp = [];
    store.gfp.push(item);
    persist();
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(400).json({ error: "Ogiltig GFP-data", details: err?.message });
  }
});

// Update GFP with optimistic concurrency
devRoutes.put("/gfp/:id", (req, res) => {
  try {
    const parsed = gfpUpdateSchema.parse(req.body || {});
    const idx = (store.gfp ?? []).findIndex((p: any) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "GFP hittades inte" });
    const existing = store.gfp[idx];

    // Respect locking
    if (existing.locked && existing.lockedBy && existing.lockedBy !== staffIdOf(req)) {
      return res.status(423).json({ error: "GFP är låst av annan användare" });
    }

    // Optimistic concurrency control
    if (typeof parsed.version !== "number" || parsed.version !== existing.version) {
      return res.status(409).json({
        error: "Version conflict",
        serverVersion: existing.version,
      });
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      ...(parsed.clientRef !== undefined ? { clientRef: parsed.clientRef } : {}),
      ...(parsed.goals !== undefined
        ? {
            goals: parsed.goals.map((g: any) => ({
              id: g.id || ("goal_" + randomUUID()),
              text: g.text,
              done: !!g.done,
            })),
          }
        : {}),
      version: existing.version + 1,
      updatedAt: now,
    };
    store.gfp[idx] = updated;
    persist();
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: "Ogiltig GFP-data", details: err?.message });
  }
});

// Lock/unlock GFP
devRoutes.patch("/gfp/:id/lock", (req, res) => {
  const idx = (store.gfp ?? []).findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "GFP hittades inte" });
  const { locked } = req.body || {};
  if (typeof locked !== "boolean") {
    return res.status(400).json({ error: "locked måste vara boolean" });
  }
  const current = store.gfp[idx];
  const user = staffIdOf(req);

  if (locked) {
    // Attempt to lock
    if (current.locked && current.lockedBy && current.lockedBy !== user) {
      return res.status(409).json({ error: "GFP redan låst av annan användare" });
    }
    store.gfp[idx] = {
      ...current,
      locked: true,
      lockedBy: user,
      lockedAt: new Date().toISOString(),
    };
  } else {
    // Unlock only if same user or no owner
    if (current.lockedBy && current.lockedBy !== user) {
      return res.status(403).json({ error: "Endast låsägare kan låsa upp" });
    }
    store.gfp[idx] = {
      ...current,
      locked: false,
      lockedBy: null,
      lockedAt: null,
    };
  }
  persist();
  return res.json(store.gfp[idx]);
});

// Delete GFP
devRoutes.delete("/gfp/:id", (req, res) => {
  const idx = (store.gfp ?? []).findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "GFP hittades inte" });
  const item = store.gfp[idx];
  if (item.locked && item.lockedBy && item.lockedBy !== staffIdOf(req)) {
    return res.status(423).json({ error: "GFP är låst av annan användare" });
  }
  store.gfp.splice(idx, 1);
  persist();
  return res.status(204).send();
});

// === WEEKLY DOCS (inkl. lör/sön) ===
devRoutes.get("/weekly-documentation/all", (_req, res) => {
  return res.json(store.weeklyDocumentation ?? []);
});

devRoutes.get("/weekly-documentation/:clientId", (req, res) => {
  const list = (store.weeklyDocumentation ?? []).filter(
    (p: any) => p.clientId === req.params.clientId
  );
  return res.json(list);
});
devRoutes.post("/weekly-documentation", (req, res) => {
  const staffId = staffIdOf(req);
  const b = req.body || {};
  const item = {
    id: "wd_" + randomUUID(),
    clientId: b.clientId,
    staffId,
    year: b.year,
    week: b.week,
    documentation: b.documentation ?? "",
    days: b.days ?? {
      mon: false,
      tue: false,
      wed: false,
      thu: false,
      fri: false,
      sat: false,
      sun: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.weeklyDocumentation.push(item);
  persist();
  return res.status(201).json(item);
});

devRoutes.put("/weekly-documentation/:id", (req, res) => {
  const idx = (store.weeklyDocumentation ?? []).findIndex(
    (d: any) => d.id === req.params.id
  );
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  store.weeklyDocumentation[idx] = {
    ...store.weeklyDocumentation[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return res.json(store.weeklyDocumentation[idx]);
});

// === MONTHLY REPORTS ===
devRoutes.get("/monthly-reports/all", (_req, res) => {
  return res.json(store.monthlyReports ?? []);
});

devRoutes.get("/monthly-reports/:clientId", (req, res) => {
  const list = (store.monthlyReports ?? []).filter(
    (p: any) => p.clientId === req.params.clientId
  );
  return res.json(list);
});
devRoutes.post("/monthly-reports", (req, res) => {
  const staffId = staffIdOf(req);
  const b = req.body || {};
  const item = {
    id: "mr_" + randomUUID(),
    clientId: b.clientId,
    staffId,
    year: b.year,
    month: b.month,
    reportContent: b.reportContent ?? "",
    approved: !!b.approved,
    status: b.status ?? "not_started",
    quality: b.quality ?? "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.monthlyReports.push(item);
  persist();
  return res.status(201).json(item);
});
devRoutes.put("/monthly-reports/:id", (req, res) => {
  const id = req.params.id;
  const updates = req.body || {};
  const index = store.monthlyReports.findIndex((r: any) => r.id === id);
  if (index === -1)
    return res.status(404).json({ error: "Månadsrapport hittades inte" });

  store.monthlyReports[index] = {
    ...store.monthlyReports[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return res.json(store.monthlyReports[index]);
});
devRoutes.delete("/monthly-reports/:id", (req, res) => {
  const id = req.params.id;
  const index = store.monthlyReports.findIndex((r: any) => r.id === id);
  if (index === -1)
    return res.status(404).json({ error: "Månadsrapport hittades inte" });

  store.monthlyReports.splice(index, 1);
  persist();
  return res.status(204).send();
});

// === VIMSA TIME ===
devRoutes.get("/vimsa-time/all", (_req, res) => {
  return res.json(store.vimsaTime ?? []);
});

devRoutes.get("/vimsa-time/:clientId", (req, res) => {
  const list = (store.vimsaTime ?? []).filter(
    (p: any) => p.clientId === req.params.clientId
  );
  return res.json(list);
});
devRoutes.post("/vimsa-time", (req, res) => {
  const staffId = staffIdOf(req);
  const b = req.body || {};
  const item = {
    id: "vt_" + randomUUID(),
    clientId: b.clientId,
    staffId,
    year: b.year,
    week: b.week,
    hoursWorked: Number(b.hoursWorked ?? 0),
    approved: !!b.approved,
    matchesDocumentation: !!b.matchesDocumentation,
    comments: b.comments ?? "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.vimsaTime.push(item);
  persist();
  return res.status(201).json(item);
});
devRoutes.put("/vimsa-time/:id", (req, res) => {
  const id = req.params.id;
  const updates = req.body || {};
  const index = store.vimsaTime.findIndex((v: any) => v.id === id);
  if (index === -1)
    return res.status(404).json({ error: "Vimsa tid hittades inte" });

  store.vimsaTime[index] = {
    ...store.vimsaTime[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return res.json(store.vimsaTime[index]);
});
devRoutes.delete("/vimsa-time/:id", (req, res) => {
  const id = req.params.id;
  const index = store.vimsaTime.findIndex((v: any) => v.id === id);
  if (index === -1)
    return res.status(404).json({ error: "Vimsa tid hittades inte" });

  store.vimsaTime.splice(index, 1);
  persist();
  return res.status(204).send();
});
