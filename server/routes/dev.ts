import { Router } from "express";
import { store, persist } from "../devStorage";
import { randomUUID } from "crypto";

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

// ── New Versioned Care Plan Routes ──
devRoutes.get("/clients/:clientId/care-plans", (req, res) => {
  const { clientId } = req.params;
  const carePlans = (store.carePlans || [])
    .filter(plan => plan.clientId === clientId)
    .sort((a, b) => (b.index || 0) - (a.index || 0));
  return res.json(carePlans);
});

devRoutes.post("/clients/:clientId/care-plans", (req, res) => {
  const { clientId } = req.params;
  const carePlanData = { ...req.body, clientId };
  
  // Get next index for this client
  const existingPlans = (store.carePlans || []).filter(p => p.clientId === clientId);
  const nextIndex = existingPlans.length > 0 ? Math.max(...existingPlans.map(p => p.index || 0)) + 1 : 1;
  
  const carePlan = {
    id: randomUUID(),
    ...carePlanData,
    index: nextIndex,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  if (!store.carePlans) store.carePlans = [];
  store.carePlans.push(carePlan);
  
  // Auto-generate GFP
  const gfp = {
    id: randomUUID(),
    clientId,
    carePlanIndex: carePlan.index,
    index: ((store.implementationPlans || []).filter(p => p.clientId === clientId).length) + 1,
    status: 'Väntar',
    followUps: JSON.stringify([
      { key: 'Uppföljning1', done: false },
      { key: 'Uppföljning2', done: false },
      { key: 'Uppföljning3', done: false },
      { key: 'Uppföljning4', done: false },
      { key: 'Uppföljning5', done: false },
    ]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  if (!store.implementationPlans) store.implementationPlans = [];
  store.implementationPlans.push(gfp);
  
  persist();
  return res.json({ carePlan, gfp, message: `GFP skapad automatiskt (index ${gfp.index})` });
});

devRoutes.patch("/care-plans/:carePlanId", (req, res) => {
  const { carePlanId } = req.params;
  const updateData = req.body;
  
  const index = (store.carePlans || []).findIndex(p => p.id === carePlanId);
  if (index === -1) return res.status(404).json({ error: "Care plan not found" });
  
  store.carePlans[index] = {
    ...store.carePlans[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  
  persist();
  return res.json(store.carePlans[index]);
});

// ── New Versioned Implementation Plan (GFP) Routes ──
devRoutes.get("/clients/:clientId/implementation-plans", (req, res) => {
  const { clientId } = req.params;
  const plans = (store.implementationPlans || [])
    .filter(plan => plan.clientId === clientId)
    .sort((a, b) => (b.index || 0) - (a.index || 0));
  return res.json(plans);
});

devRoutes.patch("/implementation-plans/:implId", (req, res) => {
  const { implId } = req.params;
  const updateData = req.body;
  
  const index = (store.implementationPlans || []).findIndex(p => p.id === implId);
  if (index === -1) return res.status(404).json({ error: "Implementation plan not found" });
  
  store.implementationPlans[index] = {
    ...store.implementationPlans[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  
  persist();
  return res.json(store.implementationPlans[index]);
});

// ── New Weekly Documentation Routes ──
devRoutes.get("/clients/:clientId/weekly-docs", (req, res) => {
  const { clientId } = req.params;
  const { year = new Date().getFullYear() } = req.query;
  
  const docs = (store.weeklyDocumentation || [])
    .filter(doc => doc.clientId === clientId && doc.year === parseInt(year))
    .sort((a, b) => (b.week || 0) - (a.week || 0));
  
  return res.json(docs);
});

devRoutes.get("/clients/:clientId/weekly-docs/:year/:week", (req, res) => {
  const { clientId, year, week } = req.params;
  
  const doc = (store.weeklyDocumentation || [])
    .find(d => d.clientId === clientId && d.year === parseInt(year) && d.week === parseInt(week));
  
  return res.json(doc || null);
});

devRoutes.put("/clients/:clientId/weekly-docs/:year/:week", (req, res) => {
  const { clientId, year, week } = req.params;
  const docData = {
    ...req.body,
    clientId,
    year: parseInt(year),
    week: parseInt(week),
  };
  
  if (!store.weeklyDocumentation) store.weeklyDocumentation = [];
  
  // Check if document already exists
  const existingIndex = store.weeklyDocumentation.findIndex(
    d => d.clientId === clientId && d.year === parseInt(year) && d.week === parseInt(week)
  );
  
  if (existingIndex !== -1) {
    // Update existing
    store.weeklyDocumentation[existingIndex] = {
      ...store.weeklyDocumentation[existingIndex],
      ...docData,
      updatedAt: new Date().toISOString(),
    };
    persist();
    return res.json(store.weeklyDocumentation[existingIndex]);
  } else {
    // Create new
    const newDoc = {
      id: randomUUID(),
      ...docData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.weeklyDocumentation.push(newDoc);
    persist();
    return res.json(newDoc);
  }
});

// ── Statistics and Reports Routes ──
devRoutes.get("/stats/staff", (req, res) => {
  const { from, to } = req.query;
  
  // Mock implementation - in real app would calculate from weekly docs
  const stats = (store.staff || []).map(staff => ({
    staffId: staff.id,
    staffName: staff.name,
    documentedCount: Math.floor(Math.random() * 50) + 10,
    delayedCount: Math.floor(Math.random() * 5),
    notApprovedCount: Math.floor(Math.random() * 3),
    totalWeeks: 12,
  }));
  
  return res.json(stats);
});

devRoutes.get("/stats/client/:clientId", (req, res) => {
  const { clientId } = req.params;
  const { from, to } = req.query;
  
  const client = (store.clients || []).find(c => c.id === clientId);
  if (!client) return res.status(404).json({ error: "Client not found" });
  
  // Mock implementation
  const stats = {
    clientId,
    clientDisplayCode: client.initials,
    documentedWeeks: Math.floor(Math.random() * 40) + 30,
    delayedWeeks: Math.floor(Math.random() * 5),
    notApprovedWeeks: Math.floor(Math.random() * 3),
    totalWeeks: 52,
  };
  
  return res.json(stats);
});
