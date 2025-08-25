import { Router } from "express";
import { store, persist } from "../devStorage";
import { randomUUID } from "crypto";
import {
  sanitizeInput,
  sanitizeJsonInput,
  sanitizeEmail,
  sanitizePhone,
  RateLimiter,
} from "../security";
import {
  db,
  addCarePlan,
  updateCarePlan,
  removeCarePlan,
  addImplementationPlan,
  updateImplementationPlan,
  removeImplementationPlan,
  addWeeklyDoc,
  addWeeklyDocEntry,
  updateWeeklyDocEntry,
  removeWeeklyDocEntry,
} from "../store.js";

export const devRoutes = Router();

// Rate limiting for login attempts
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

function staffIdOf(req: any) {
  return req.cookies?.devToken || req.get("X-Dev-Token") || "s_demo";
}

// === AUTH ===
devRoutes.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  // Rate limiting
  const clientIP = req.ip || req.connection.remoteAddress || "unknown";
  if (!loginRateLimiter.isAllowed(clientIP)) {
    return res
      .status(429)
      .json({ error: "Too many login attempts. Please try again later." });
  }

  // Input validation
  if (
    !username ||
    !password ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  // Sanitize input using security utilities
  const sanitizedUsername = sanitizeInput(username.trim());
  const sanitizedPassword = sanitizeInput(password.trim());

  // Dev mode: accept any user/pass and create dev token
  const token = "s_demo_" + Date.now();
  res.cookie("devToken", token, {
    httpOnly: false, // Need to be false for dev mode
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Changed from strict for dev
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  return res.json({
    ok: true,
    token: token, // Add token to response body
    user: {
      id: token,
      username: sanitizedUsername,
      name: sanitizedUsername,
    },
  });
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
  return res.json(db.carePlans ?? []);
});

devRoutes.get("/care-plans/:id", (req, res) => {
  // Only handle care plan IDs (not client IDs)
  const plan = (db.carePlans ?? []).find((p: any) => p.id === req.params.id);
  if (!plan) return res.status(404).json({ error: "Care plan not found" });
  return res.json(plan);
});

// Lista alla för klient (nyast först)
devRoutes.get("/care-plans/client/:clientId", (req, res) => {
  const rows = (db.carePlans ?? [])
    .filter((p) => p.clientId === req.params.clientId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json(rows);
});
devRoutes.get("/care-plans/staff/:staffId", (req, res) => {
  const list = (store.carePlans ?? []).filter(
    (p: any) => p.staffId === req.params.staffId
  );
  return res.json(list);
});
// Create – APPEND (ingen överskrivning)
devRoutes.post("/care-plans", (req, res) => {
  const created = addCarePlan(req.body);
  res.status(201).json(created);
});

// Update – via id
devRoutes.put("/care-plans/:id", (req, res) => {
  const updated = updateCarePlan(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

// Delete – via id
devRoutes.delete("/care-plans/:id", (req, res) => {
  const ok = removeCarePlan(req.params.id);
  return ok
    ? res.status(204).end()
    : res.status(404).json({ error: "Not found" });
});

// === IMPLEMENTATION PLANS (administrativ) ===
devRoutes.get("/implementation-plans/all", (_req, res) => {
  return res.json(db.implementationPlans ?? []);
});

// Lista alla för klient (nyast först)
devRoutes.get("/implementation-plans/client/:clientId", (req, res) => {
  const rows = (db.implementationPlans ?? [])
    .filter((p) => p.clientId === req.params.clientId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json(rows);
});
devRoutes.get("/implementation-plans/staff/:staffId", (req, res) => {
  const list = (store.implementationPlans ?? []).filter(
    (p: any) => p.staffId === req.params.staffId
  );
  return res.json(list);
});
// Create – APPEND (ingen överskrivning)
devRoutes.post("/implementation-plans", (req, res) => {
  const created = addImplementationPlan(req.body);
  res.status(201).json(created);
});

// Update – via id
devRoutes.put("/implementation-plans/:id", (req, res) => {
  const updated = updateImplementationPlan(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

// Delete – via id
devRoutes.delete("/implementation-plans/:id", (req, res) => {
  const ok = removeImplementationPlan(req.params.id);
  return ok
    ? res.status(204).end()
    : res.status(404).json({ error: "Not found" });
});

// === WEEKLY DOCS 2.0 ===
devRoutes.get("/weekly-docs/client/:clientId", (req, res) => {
  const { week } = req.query as { week?: string };
  let rows = (db.weeklyDocs ?? []).filter(
    (d) => d.clientId === req.params.clientId
  );
  if (week) rows = rows.filter((d) => d.weekStartISO === week);
  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json(rows);
});

devRoutes.post("/weekly-docs", (req, res) => {
  const created = addWeeklyDoc(req.body);
  res.status(201).json(created);
});

devRoutes.post("/weekly-docs/:id/entries", (req, res) => {
  const entry = addWeeklyDocEntry(req.params.id, req.body);
  if (!entry) return res.status(404).json({ error: "Document not found" });
  res.status(201).json(entry);
});

devRoutes.put("/weekly-docs/:docId/entries/:entryId", (req, res) => {
  const entry = updateWeeklyDocEntry(
    req.params.docId,
    req.params.entryId,
    req.body
  );
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  res.json(entry);
});

devRoutes.delete("/weekly-docs/:docId/entries/:entryId", (req, res) => {
  const ok = removeWeeklyDocEntry(req.params.docId, req.params.entryId);
  return ok
    ? res.status(204).end()
    : res.status(404).json({ error: "Entry not found" });
});

devRoutes.delete("/weekly-docs/:id", (req, res) => {
  const idx = db.weeklyDocs.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Document not found" });
  db.weeklyDocs.splice(idx, 1);
  persist();
  return res.status(204).end();
});

devRoutes.delete("/implementation-plans/:id", (req, res) => {
  const id = req.params.id;
  const index = store.implementationPlans.findIndex((p: any) => p.id === id);
  if (index === -1)
    return res.status(404).json({ error: "Genomförandeplan hittades inte" });

  store.implementationPlans.splice(index, 1);
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

devRoutes.delete("/weekly-documentation/:id", (req, res) => {
  const id = req.params.id;
  const index = store.weeklyDocumentation.findIndex((d: any) => d.id === id);
  if (index === -1)
    return res.status(404).json({ error: "Veckodokumentation hittades inte" });

  store.weeklyDocumentation.splice(index, 1);
  persist();
  return res.status(204).send();
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
