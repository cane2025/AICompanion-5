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

// ==============================
// V2 ENDPOINTS (versioned flows)
// ==============================

// Helpers
function sortByIndexAsc(a: any, b: any) {
  return (a.index || 0) - (b.index || 0);
}
function sortByIndexDesc(a: any, b: any) {
  return (b.index || 0) - (a.index || 0);
}

function nextIndexFor(list: any[], clientId: string): number {
  const clientItems = (list || []).filter((x: any) => x.clientId === clientId);
  if (clientItems.length === 0) return 1;
  return (
    Math.max(
      ...clientItems.map((x: any) => (typeof x.index === "number" ? x.index : 0))
    ) + 1
  );
}

// Compute ISO week start (Monday) for given year/week (ISO 8601)
function getIsoWeekStartDate(year: number, week: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const day = simple.getUTCDay() || 7;
  const ISOweekStart = new Date(simple);
  if (day <= 4) {
    ISOweekStart.setUTCDate(simple.getUTCDate() - day + 1);
  } else {
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - day);
  }
  ISOweekStart.setUTCHours(0, 0, 0, 0);
  return ISOweekStart;
}

const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = typeof dayKeys[number];

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function computeDayDefaults(
  year: number,
  week: number,
  dayKey: DayKey,
  partial: any,
  authorStaffId: string
) {
  const index = dayKeys.indexOf(dayKey);
  const monday = getIsoWeekStartDate(year, week);
  const dayDate = addDaysUTC(monday, index);
  const nextMidnight = new Date(Date.UTC(dayDate.getUTCFullYear(), dayDate.getUTCMonth(), dayDate.getUTCDate() + 1));

  const timestamp = partial?.timestamp ? new Date(partial.timestamp) : new Date();
  const hasManualDelayed = typeof partial?.delayed === "boolean";
  const onTimeDefault = timestamp.getTime() <= nextMidnight.getTime();
  const delayedDefault = !onTimeDefault;

  const documented = !!partial?.documented;
  const qualityApproved = !!partial?.qualityApproved;

  return {
    documented,
    qualityApproved,
    onTime: typeof partial?.onTime === "boolean" ? partial.onTime : !hasManualDelayed ? onTimeDefault : !partial.delayed,
    delayed: hasManualDelayed ? !!partial.delayed : delayedDefault,
    comment: partial?.comment || undefined,
    authorStaffId: partial?.authorStaffId || authorStaffId,
    timestamp: (partial?.timestamp ? new Date(partial.timestamp) : new Date()).toISOString(),
  };
}

function aggregateWeek(days: Record<DayKey, any | undefined>) {
  const dayList = dayKeys.map((k) => days[k]).filter(Boolean) as any[];
  const anyDocumented = dayList.some((d) => d.documented);
  const allApprovedIfDocumented = dayList
    .filter((d) => d.documented)
    .every((d) => d.qualityApproved);
  const anyDelayed = dayList.some((d) => d.delayed);
  const allOnTime = dayList.every((d) => d.onTime !== false) && !anyDelayed;
  return {
    documented: anyDocumented,
    qualityApproved: anyDocumented ? allApprovedIfDocumented : false,
    delayed: anyDelayed,
    onTime: anyDocumented ? allOnTime : true,
  };
}

function normalizeFollowUps(input: any): any[] {
  // Ensure exactly max 5 items with keys Uppföljning1..5
  const keys = ["Uppföljning1", "Uppföljning2", "Uppföljning3", "Uppföljning4", "Uppföljning5"];
  const arr = Array.isArray(input) ? input : [];
  const mapped: any[] = [];
  for (let i = 0; i < 5; i++) {
    const exist = arr[i] || {};
    mapped.push({
      key: keys[i],
      done: !!exist.done,
      note: exist.note || undefined,
      date: exist.date || undefined,
    });
  }
  return mapped;
}

// CarePlan V2
devRoutes.get("/clients/:clientId/care-plans", (req, res) => {
  const { clientId } = req.params;
  const list = (store.v2CarePlans ?? []).filter((p: any) => p.clientId === clientId);
  return res.json(list.sort(sortByIndexAsc));
});

devRoutes.post("/clients/:clientId/care-plans", (req, res) => {
  const { clientId } = req.params;
  const b = req.body || {};
  if (!store.v2CarePlans) store.v2CarePlans = [];
  if (!store.v2ImplementationPlans) store.v2ImplementationPlans = [];

  const careIndex = nextIndexFor(store.v2CarePlans, clientId);
  const now = new Date().toISOString();
  const plan = {
    id: "cp2_" + randomUUID(),
    clientId,
    index: careIndex,
    receivedDate: b.receivedDate || now.substring(0, 10),
    enteredToJournalDate: b.enteredToJournalDate || undefined,
    status: b.status || "Mottagen",
    assignedStaffId: b.assignedStaffId || staffIdOf(req),
    content: b.content || "",
    createdAt: now,
    updatedAt: now,
  };
  store.v2CarePlans.push(plan);

  // Auto-create GFP linked to this care plan index
  const gfpIndex = nextIndexFor(store.v2ImplementationPlans, clientId);
  const gfp = {
    id: "gfp2_" + randomUUID(),
    clientId,
    carePlanIndex: plan.index,
    index: gfpIndex,
    status: "Väntar" as const,
    dueDate: b.dueDate || undefined,
    completedDate: undefined,
    sentDate: undefined,
    followUps: normalizeFollowUps([]),
    createdAt: now,
    updatedAt: now,
  };
  store.v2ImplementationPlans.push(gfp);
  persist();
  return res.status(201).json({ plan, autoGfp: gfp });
});

devRoutes.patch("/care-plans/:carePlanId", (req, res) => {
  const { carePlanId } = req.params;
  const idx = (store.v2CarePlans ?? []).findIndex((p: any) => p.id === carePlanId);
  if (idx === -1) return res.status(404).json({ error: "Care plan not found" });
  const now = new Date().toISOString();
  const allowed = (({ status, enteredToJournalDate, assignedStaffId, content }) => ({
    status,
    enteredToJournalDate,
    assignedStaffId,
    content,
  }))(req.body || {});
  store.v2CarePlans[idx] = { ...store.v2CarePlans[idx], ...allowed, updatedAt: now };
  persist();
  return res.json(store.v2CarePlans[idx]);
});

// ImplementationPlan (GFP) V2
devRoutes.get("/clients/:clientId/implementation-plans", (req, res) => {
  const { clientId } = req.params;
  const list = (store.v2ImplementationPlans ?? []).filter((p: any) => p.clientId === clientId);
  return res.json(list.sort(sortByIndexDesc));
});

devRoutes.post("/clients/:clientId/implementation-plans", (req, res) => {
  const { clientId } = req.params;
  const b = req.body || {};
  if (!store.v2ImplementationPlans) store.v2ImplementationPlans = [];
  if (!store.v2CarePlans) store.v2CarePlans = [];
  // Validate carePlanIndex exists for client
  const cpIndex = Number(b.carePlanIndex);
  const exists = (store.v2CarePlans || []).some(
    (cp: any) => cp.clientId === clientId && cp.index === cpIndex
  );
  if (!exists) {
    return res.status(400).json({ error: "Ogiltig carePlanIndex för klient" });
  }
  const index = nextIndexFor(store.v2ImplementationPlans, clientId);
  const now = new Date().toISOString();
  const plan = {
    id: "gfp2_" + randomUUID(),
    clientId,
    carePlanIndex: cpIndex,
    index,
    status: (b.status as any) || "Väntar",
    dueDate: b.dueDate || undefined,
    completedDate: b.completedDate || undefined,
    sentDate: b.sentDate || undefined,
    followUps: normalizeFollowUps(b.followUps),
    createdAt: now,
    updatedAt: now,
  };
  store.v2ImplementationPlans.push(plan);
  persist();
  return res.status(201).json(plan);
});

devRoutes.patch("/implementation-plans/:implId", (req, res) => {
  const { implId } = req.params;
  const idx = (store.v2ImplementationPlans ?? []).findIndex((p: any) => p.id === implId);
  if (idx === -1)
    return res.status(404).json({ error: "Implementation plan not found" });
  const b = req.body || {};
  const now = new Date().toISOString();
  const updates: any = {};
  if (b.status) updates.status = b.status;
  if ("dueDate" in b) updates.dueDate = b.dueDate || undefined;
  if ("completedDate" in b) updates.completedDate = b.completedDate || undefined;
  if ("sentDate" in b) updates.sentDate = b.sentDate || undefined;
  if ("followUps" in b) updates.followUps = normalizeFollowUps(b.followUps);
  store.v2ImplementationPlans[idx] = {
    ...store.v2ImplementationPlans[idx],
    ...updates,
    updatedAt: now,
  };
  persist();
  return res.json(store.v2ImplementationPlans[idx]);
});

// Weekly Documentation V2
devRoutes.get("/clients/:clientId/weekly-docs", (req, res) => {
  const { clientId } = req.params;
  const year = req.query.year ? Number(req.query.year) : new Date().getUTCFullYear();
  const list = (store.v2WeeklyDocs ?? []).filter(
    (w: any) => w.clientId === clientId && w.year === year
  );
  return res.json(list.sort((a: any, b: any) => a.week - b.week));
});

devRoutes.get("/clients/:clientId/weekly-docs/:year/:week", (req, res) => {
  const { clientId, year, week } = req.params as any;
  const doc = (store.v2WeeklyDocs ?? []).find(
    (w: any) => w.clientId === clientId && w.year === Number(year) && w.week === Number(week)
  );
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json(doc);
});

devRoutes.put("/clients/:clientId/weekly-docs/:year/:week", (req, res) => {
  const { clientId } = req.params;
  const year = Number(req.params.year);
  const week = Number(req.params.week);
  if (!store.v2WeeklyDocs) store.v2WeeklyDocs = [];
  const b = req.body || {};
  const author = staffIdOf(req);
  const existingIdx = store.v2WeeklyDocs.findIndex(
    (w: any) => w.clientId === clientId && w.year === year && w.week === week
  );

  // Merge day updates with defaults
  const days: Record<DayKey, any | undefined> = { mon: undefined, tue: undefined, wed: undefined, thu: undefined, fri: undefined, sat: undefined, sun: undefined } as any;
  for (const key of dayKeys) {
    if (b?.days && key in b.days) {
      const merged = computeDayDefaults(year, week, key, b.days[key], author);
      (days as any)[key] = merged;
    }
  }

  const agg = aggregateWeek(days);
  const now = new Date().toISOString();

  if (existingIdx === -1) {
    const item = {
      id: "wd2_" + randomUUID(),
      clientId,
      year,
      week,
      days,
      documented: agg.documented,
      qualityApproved: agg.qualityApproved,
      onTime: agg.onTime,
      delayed: agg.delayed,
      comments: b.comments || "",
      createdAt: now,
      updatedAt: now,
    };
    store.v2WeeklyDocs.push(item);
    persist();
    return res.status(201).json(item);
  } else {
    const prev = store.v2WeeklyDocs[existingIdx];
    // Merge provided day updates into existing
    const mergedDays: any = { ...(prev.days || {}) };
    for (const key of dayKeys) {
      if (days[key]) mergedDays[key] = days[key];
    }
    const newAgg = aggregateWeek(mergedDays);
    const updated = {
      ...prev,
      days: mergedDays,
      documented: newAgg.documented,
      qualityApproved: newAgg.qualityApproved,
      onTime: newAgg.onTime,
      delayed: newAgg.delayed,
      comments: b.comments !== undefined ? b.comments : prev.comments,
      updatedAt: now,
    };
    store.v2WeeklyDocs[existingIdx] = updated;
    persist();
    return res.json(updated);
  }
});

// Stats/Reports V2
function dateInRange(d: Date, from?: Date, to?: Date): boolean {
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

devRoutes.get("/stats/staff", (req, res) => {
  const fromStr = (req.query.from as string) || undefined;
  const toStr = (req.query.to as string) || undefined;
  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;
  const resultMap = new Map<string, { staffId: string; year: number; week: number; documentedCount: number; delayedCount: number; notApprovedCount: number }>();

  for (const wd of store.v2WeeklyDocs || []) {
    const monday = getIsoWeekStartDate(wd.year, wd.week);
    for (let i = 0; i < dayKeys.length; i++) {
      const key = dayKeys[i];
      const day = wd.days?.[key];
      if (!day || !day.documented || !day.authorStaffId) continue;
      const dayDate = addDaysUTC(monday, i);
      if (!dateInRange(dayDate, from, to)) continue;
      const staffId = day.authorStaffId;
      const compositeKey = `${staffId}:${wd.year}:${wd.week}`;
      if (!resultMap.has(compositeKey)) {
        resultMap.set(compositeKey, {
          staffId,
          year: wd.year,
          week: wd.week,
          documentedCount: 0,
          delayedCount: 0,
          notApprovedCount: 0,
        });
      }
      const obj = resultMap.get(compositeKey)!;
      obj.documentedCount += 1;
      if (day.delayed) obj.delayedCount += 1;
      if (!day.qualityApproved) obj.notApprovedCount += 1;
    }
  }

  const out = Array.from(resultMap.values()).sort((a, b) => (a.staffId + a.year + a.week).localeCompare(b.staffId + b.year + b.week));
  return res.json(out);
});

devRoutes.get("/stats/client/:clientId", (req, res) => {
  const { clientId } = req.params;
  const fromStr = (req.query.from as string) || undefined;
  const toStr = (req.query.to as string) || undefined;
  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;
  const resultMap = new Map<string, { clientId: string; year: number; week: number; documentedCount: number; delayedCount: number; notApprovedCount: number }>();

  for (const wd of store.v2WeeklyDocs || []) {
    if (wd.clientId !== clientId) continue;
    const monday = getIsoWeekStartDate(wd.year, wd.week);
    for (let i = 0; i < dayKeys.length; i++) {
      const key = dayKeys[i];
      const day = wd.days?.[key];
      if (!day || !day.documented) continue;
      const dayDate = addDaysUTC(monday, i);
      if (!dateInRange(dayDate, from, to)) continue;
      const compositeKey = `${clientId}:${wd.year}:${wd.week}`;
      if (!resultMap.has(compositeKey)) {
        resultMap.set(compositeKey, {
          clientId,
          year: wd.year,
          week: wd.week,
          documentedCount: 0,
          delayedCount: 0,
          notApprovedCount: 0,
        });
      }
      const obj = resultMap.get(compositeKey)!;
      obj.documentedCount += 1;
      if (day.delayed) obj.delayedCount += 1;
      if (!day.qualityApproved) obj.notApprovedCount += 1;
    }
  }

  const out = Array.from(resultMap.values()).sort((a, b) => (a.year - b.year) || (a.week - b.week));
  return res.json(out);
});
