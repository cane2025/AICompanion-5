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

// ====== NEW VERSIONED CARE PLAN/GFP/WEEKLY DOCS API (per spec) ======
// Data shapes per spec (in-memory only)
type UUID = string;

interface CarePlanSpec {
  id: UUID;
  clientId: UUID;
  index: number; // sequential per client
  receivedDate: string; // ISO
  enteredToJournalDate?: string; // ISO
  status: "Mottagen" | "Aktiv" | "Avslutad";
  assignedStaffId?: UUID;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

interface FollowUpSpec {
  key:
    | "Uppföljning1"
    | "Uppföljning2"
    | "Uppföljning3"
    | "Uppföljning4"
    | "Uppföljning5";
  done: boolean;
  note?: string;
  date?: string;
}

interface ImplementationPlanSpec {
  id: UUID;
  clientId: UUID;
  carePlanIndex: number;
  index: number; // sequential per client
  status: "Väntar" | "Aktiv" | "Slutförd";
  dueDate?: string;
  completedDate?: string;
  sentDate?: string;
  followUps: FollowUpSpec[]; // max 5
  createdAt: string;
  updatedAt: string;
}

interface DayDocSpec {
  documented: boolean;
  qualityApproved: boolean;
  onTime: boolean;
  delayed: boolean;
  comment?: string;
  authorStaffId?: UUID;
  timestamp?: string; // ISO
}

interface WeeklyDocumentationSpec {
  id: UUID;
  clientId: UUID;
  year: number;
  week: number;
  days: {
    mon?: DayDocSpec;
    tue?: DayDocSpec;
    wed?: DayDocSpec;
    thu?: DayDocSpec;
    fri?: DayDocSpec;
    sat?: DayDocSpec;
    sun?: DayDocSpec;
  };
  documented: boolean;
  qualityApproved: boolean;
  onTime: boolean;
  delayed: boolean;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

// Ensure collections exist
store.versionedCarePlans = store.versionedCarePlans ?? [];
store.versionedImplementationPlans = store.versionedImplementationPlans ?? [];
store.versionedWeeklyDocs = store.versionedWeeklyDocs ?? [];

// Helpers
function nextIndexFor<T extends { clientId: string; index: number }>(
  list: T[],
  clientId: string
): number {
  const indices = list.filter((x) => x.clientId === clientId).map((x) => x.index);
  return (indices.length ? Math.max(...indices) : 0) + 1;
}

function nowIso() {
  return new Date().toISOString();
}

function toFiveFollowUps(): FollowUpSpec[] {
  return [1, 2, 3, 4, 5].map((n) => ({
    key: `Uppföljning${n}` as FollowUpSpec["key"],
    done: false,
  }));
}

function computeDayOnTimeAndDelay(day?: DayDocSpec): { onTime: boolean; delayed: boolean } {
  if (!day) return { onTime: false, delayed: false };
  if (typeof day.delayed === "boolean" && typeof day.onTime === "boolean") {
    return { onTime: day.onTime, delayed: day.delayed };
  }
  if (!day.timestamp) return { onTime: false, delayed: false };
  const ts = new Date(day.timestamp);
  const midnightNext = new Date(ts);
  midnightNext.setUTCDate(ts.getUTCDate() + 1);
  midnightNext.setUTCHours(0, 0, 0, 0);
  const onTime = ts.getTime() <= midnightNext.getTime();
  return { onTime, delayed: !onTime };
}

function aggregateWeek(week: WeeklyDocumentationSpec): WeeklyDocumentationSpec {
  const days = week.days;
  const dayValues: DayDocSpec[] = (
    [days.mon, days.tue, days.wed, days.thu, days.fri, days.sat, days.sun].filter(Boolean) as DayDocSpec[]
  );

  // Ensure default onTime/delayed for any provided days without explicit values
  for (const d of dayValues) {
    const result = computeDayOnTimeAndDelay(d);
    d.onTime = result.onTime;
    d.delayed = result.delayed;
  }

  const documented = dayValues.some((d) => d.documented);
  const delayed = dayValues.some((d) => d.delayed);
  const qualityApproved = dayValues
    .filter((d) => d.documented)
    .every((d) => d.qualityApproved);
  const onTime = !delayed;
  return { ...week, documented, delayed, qualityApproved, onTime };
}

// ---- CarePlan endpoints ----
devRoutes.get("/clients/:clientId/care-plans", (req, res) => {
  const { clientId } = req.params;
  const list: CarePlanSpec[] = (store.versionedCarePlans as CarePlanSpec[]).filter(
    (p) => p.clientId === clientId
  );
  list.sort((a, b) => b.index - a.index);
  return res.json(list);
});

devRoutes.post("/clients/:clientId/care-plans", (req, res) => {
  const { clientId } = req.params;
  const body = req.body || {};
  const index = nextIndexFor<CarePlanSpec>(store.versionedCarePlans, clientId);
  const plan: CarePlanSpec = {
    id: "cpv_" + randomUUID(),
    clientId,
    index,
    receivedDate: body.receivedDate ?? nowIso(),
    enteredToJournalDate: body.enteredToJournalDate ?? undefined,
    status: (body.status as CarePlanSpec["status"]) ?? "Mottagen",
    assignedStaffId: body.assignedStaffId ?? undefined,
    content: body.content ?? "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  (store.versionedCarePlans as CarePlanSpec[]).push(plan);

  // Auto-create GFP
  const implIndex = nextIndexFor<ImplementationPlanSpec>(
    store.versionedImplementationPlans,
    clientId
  );
  const gfp: ImplementationPlanSpec = {
    id: "ipV_" + randomUUID(),
    clientId,
    carePlanIndex: plan.index,
    index: implIndex,
    status: "Väntar",
    dueDate: body.dueDate ?? undefined,
    completedDate: undefined,
    sentDate: undefined,
    followUps: toFiveFollowUps(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  (store.versionedImplementationPlans as ImplementationPlanSpec[]).push(gfp);
  persist();
  res.status(201).json({ plan, autoImplementationPlan: gfp });
});

devRoutes.patch("/care-plans/:carePlanId", (req, res) => {
  const { carePlanId } = req.params;
  const idx = (store.versionedCarePlans as CarePlanSpec[]).findIndex(
    (p) => p.id === carePlanId
  );
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const updated = {
    ...(store.versionedCarePlans as CarePlanSpec[])[idx],
    ...req.body,
    updatedAt: nowIso(),
  } as CarePlanSpec;
  (store.versionedCarePlans as CarePlanSpec[])[idx] = updated;
  persist();
  return res.json(updated);
});

// ---- ImplementationPlan endpoints ----
devRoutes.get("/clients/:clientId/implementation-plans", (req, res) => {
  const { clientId } = req.params;
  const list: ImplementationPlanSpec[] = (
    store.versionedImplementationPlans as ImplementationPlanSpec[]
  )
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => b.index - a.index);
  return res.json(list);
});

devRoutes.post("/clients/:clientId/implementation-plans", (req, res) => {
  const { clientId } = req.params;
  const body = req.body || {};
  const index = nextIndexFor<ImplementationPlanSpec>(
    store.versionedImplementationPlans,
    clientId
  );
  const carePlanIndex = body.carePlanIndex ?? 1;
  let followUps: FollowUpSpec[] = Array.isArray(body.followUps)
    ? (body.followUps as FollowUpSpec[])
    : toFiveFollowUps();
  if (followUps.length > 5) followUps = followUps.slice(0, 5);
  const plan: ImplementationPlanSpec = {
    id: "ipV_" + randomUUID(),
    clientId,
    carePlanIndex,
    index,
    status: (body.status as ImplementationPlanSpec["status"]) ?? "Väntar",
    dueDate: body.dueDate ?? undefined,
    completedDate: body.completedDate ?? undefined,
    sentDate: body.sentDate ?? undefined,
    followUps,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  (store.versionedImplementationPlans as ImplementationPlanSpec[]).push(plan);
  persist();
  return res.status(201).json(plan);
});

devRoutes.patch("/implementation-plans/:implId", (req, res) => {
  const { implId } = req.params;
  const idx = (store.versionedImplementationPlans as ImplementationPlanSpec[]).findIndex(
    (p) => p.id === implId
  );
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const current = (store.versionedImplementationPlans as ImplementationPlanSpec[])[idx];
  let followUps = req.body.followUps ?? current.followUps;
  if (Array.isArray(followUps) && followUps.length > 5) {
    followUps = followUps.slice(0, 5);
  }
  const updated: ImplementationPlanSpec = {
    ...current,
    ...req.body,
    followUps,
    updatedAt: nowIso(),
  };
  (store.versionedImplementationPlans as ImplementationPlanSpec[])[idx] = updated;
  persist();
  return res.json(updated);
});

// ---- Weekly Documentation endpoints ----
devRoutes.get("/clients/:clientId/weekly-docs", (req, res) => {
  const { clientId } = req.params;
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  const list: WeeklyDocumentationSpec[] = (
    store.versionedWeeklyDocs as WeeklyDocumentationSpec[]
  )
    .filter((w) => w.clientId === clientId && w.year === year)
    .sort((a, b) => a.week - b.week);
  return res.json(list);
});

devRoutes.get("/clients/:clientId/weekly-docs/:year/:week", (req, res) => {
  const { clientId, year, week } = req.params as any;
  const item = (store.versionedWeeklyDocs as WeeklyDocumentationSpec[]).find(
    (w) => w.clientId === clientId && w.year === Number(year) && w.week === Number(week)
  );
  if (!item) return res.status(404).json({ error: "Not found" });
  return res.json(item);
});

devRoutes.put("/clients/:clientId/weekly-docs/:year/:week", (req, res) => {
  const { clientId, year, week } = req.params as any;
  const body = req.body || {};
  const y = Number(year);
  const w = Number(week);
  const idx = (store.versionedWeeklyDocs as WeeklyDocumentationSpec[]).findIndex(
    (it) => it.clientId === clientId && it.year === y && it.week === w
  );
  const base: WeeklyDocumentationSpec = idx === -1
    ? {
        id: "wdV_" + randomUUID(),
        clientId,
        year: y,
        week: w,
        days: body.days ?? {},
        documented: false,
        qualityApproved: false,
        onTime: false,
        delayed: false,
        comments: body.comments ?? "",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
    : (store.versionedWeeklyDocs as WeeklyDocumentationSpec[])[idx];

  const merged: WeeklyDocumentationSpec = aggregateWeek({
    ...base,
    days: { ...base.days, ...(body.days ?? {}) },
    comments: body.comments ?? base.comments,
    updatedAt: nowIso(),
  });

  if (idx === -1) {
    (store.versionedWeeklyDocs as WeeklyDocumentationSpec[]).push(merged);
  } else {
    (store.versionedWeeklyDocs as WeeklyDocumentationSpec[])[idx] = merged;
  }
  persist();
  return res.json(merged);
});

// ---- Stats endpoints ----
devRoutes.get("/stats/staff", (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date("1970-01-01");
  const to = req.query.to ? new Date(String(req.query.to)) : new Date("2999-12-31");
  const weeklyDocs: WeeklyDocumentationSpec[] = store.versionedWeeklyDocs ?? [];

  // Build map staffId -> { year, week -> counts }
  const staffWeek: Record<string, Record<string, { documentedCount: number; delayedCount: number; notApprovedCount: number }>> = {};

  for (const w of weeklyDocs) {
    // Approximate a date for the ISO week (Monday)
    const firstJan = new Date(Date.UTC(w.year, 0, 1));
    const day = firstJan.getUTCDay() || 7;
    const mondayOfWeek = new Date(firstJan);
    mondayOfWeek.setUTCDate(firstJan.getUTCDate() + (w.week - 1) * 7 + (1 - day));
    if (mondayOfWeek < from || mondayOfWeek > to) continue;

    const days = [w.days.mon, w.days.tue, w.days.wed, w.days.thu, w.days.fri, w.days.sat, w.days.sun].filter(Boolean) as DayDocSpec[];
    for (const d of days) {
      const sid = d.authorStaffId ?? "unknown";
      if (!staffWeek[sid]) staffWeek[sid] = {};
      const key = `${w.year}-${w.week}`;
      if (!staffWeek[sid][key]) staffWeek[sid][key] = { documentedCount: 0, delayedCount: 0, notApprovedCount: 0 };
      if (d.documented) {
        staffWeek[sid][key].documentedCount += 1;
        if (d.delayed) staffWeek[sid][key].delayedCount += 1;
        if (!d.qualityApproved) staffWeek[sid][key].notApprovedCount += 1;
      }
    }
  }

  const result: any[] = [];
  for (const staffId of Object.keys(staffWeek)) {
    for (const key of Object.keys(staffWeek[staffId])) {
      const [year, week] = key.split("-").map((n) => Number(n));
      const v = staffWeek[staffId][key];
      result.push({ staffId, year, week, ...v });
    }
  }
  return res.json(result);
});

devRoutes.get("/stats/client/:clientId", (req, res) => {
  const { clientId } = req.params;
  const from = req.query.from ? new Date(String(req.query.from)) : new Date("1970-01-01");
  const to = req.query.to ? new Date(String(req.query.to)) : new Date("2999-12-31");
  const weeklyDocs: WeeklyDocumentationSpec[] = (store.versionedWeeklyDocs as WeeklyDocumentationSpec[]).filter((w) => w.clientId === clientId);

  const out: any[] = [];
  for (const w of weeklyDocs) {
    const firstJan = new Date(Date.UTC(w.year, 0, 1));
    const day = firstJan.getUTCDay() || 7;
    const mondayOfWeek = new Date(firstJan);
    mondayOfWeek.setUTCDate(firstJan.getUTCDate() + (w.week - 1) * 7 + (1 - day));
    if (mondayOfWeek < from || mondayOfWeek > to) continue;
    out.push({
      clientId,
      year: w.year,
      week: w.week,
      documented: w.documented,
      delayed: w.delayed,
      qualityApproved: w.qualityApproved,
    });
  }
  return res.json(out);
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
