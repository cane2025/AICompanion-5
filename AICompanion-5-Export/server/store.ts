import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "server/data/store.json");

type DB = {
  carePlans: any[];
  implementationPlans: any[];
  weeklyDocs: any[];
  clients: any[];
  staff: any[];
  weeklyDocumentation: any[];
  monthlyReports: any[];
  vimsaTime: any[];
};

// Load existing data or create new structure
function loadDB(): DB {
  try {
    const data = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    return {
      carePlans: data.carePlans || [],
      implementationPlans: data.implementationPlans || [],
      weeklyDocs: data.weeklyDocs || [],
      clients: data.clients || [],
      staff: data.staff || [],
      weeklyDocumentation: data.weeklyDocumentation || [],
      monthlyReports: data.monthlyReports || [],
      vimsaTime: data.vimsaTime || [],
    };
  } catch (error) {
    console.log("Creating new store structure");
    return {
      carePlans: [],
      implementationPlans: [],
      weeklyDocs: [],
      clients: [],
      staff: [],
      weeklyDocumentation: [],
      monthlyReports: [],
      vimsaTime: [],
    };
  }
}

export const db: DB = loadDB();

export function persist() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2));
    console.log("💾 Data persisted to store.json");
  } catch (error) {
    console.error("Failed to persist data:", error);
  }
}

// Care Plan helpers
export function addCarePlan(data: any) {
  const now = new Date().toISOString();
  const row = {
    id: nanoid(),
    status: "active",
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  db.carePlans.push(row);
  persist();
  return row;
}

export function updateCarePlan(id: string, patch: any) {
  const idx = db.carePlans.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const current = db.carePlans[idx];
  const next = {
    ...current,
    ...patch,
    version: (current.version || 1) + 1,
    updatedAt: now,
  };
  db.carePlans[idx] = next;
  persist();
  return next;
}

export function removeCarePlan(id: string) {
  const idx = db.carePlans.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  db.carePlans.splice(idx, 1);
  persist();
  return true;
}

// Implementation Plan helpers
export function addImplementationPlan(data: any) {
  const now = new Date().toISOString();
  const row = {
    id: nanoid(),
    status: "planned",
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  db.implementationPlans.push(row);
  persist();
  return row;
}

export function updateImplementationPlan(id: string, patch: any) {
  const idx = db.implementationPlans.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const current = db.implementationPlans[idx];
  const next = {
    ...current,
    ...patch,
    version: (current.version || 1) + 1,
    updatedAt: now,
  };
  db.implementationPlans[idx] = next;
  persist();
  return next;
}

export function removeImplementationPlan(id: string) {
  const idx = db.implementationPlans.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  db.implementationPlans.splice(idx, 1);
  persist();
  return true;
}

// Weekly Docs helpers
export function addWeeklyDoc(data: any) {
  const now = new Date().toISOString();
  const row = {
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    entries: [],
    ...data,
  };
  db.weeklyDocs.push(row);
  persist();
  return row;
}

export function addWeeklyDocEntry(docId: string, entryData: any) {
  const doc = db.weeklyDocs.find((d) => d.id === docId);
  if (!doc) return null;

  const entry = {
    id: nanoid(),
    ...entryData,
  };
  doc.entries.push(entry);
  doc.updatedAt = new Date().toISOString();
  persist();
  return entry;
}

export function updateWeeklyDocEntry(
  docId: string,
  entryId: string,
  patch: any
) {
  const doc = db.weeklyDocs.find((d) => d.id === docId);
  if (!doc) return null;

  const idx = doc.entries.findIndex((e: any) => e.id === entryId);
  if (idx === -1) return null;

  doc.entries[idx] = { ...doc.entries[idx], ...patch };
  doc.updatedAt = new Date().toISOString();
  persist();
  return doc.entries[idx];
}

export function removeWeeklyDocEntry(docId: string, entryId: string) {
  const doc = db.weeklyDocs.find((d) => d.id === docId);
  if (!doc) return false;

  const idx = doc.entries.findIndex((e: any) => e.id === entryId);
  if (idx === -1) return false;

  doc.entries.splice(idx, 1);
  doc.updatedAt = new Date().toISOString();
  persist();
  return true;
}
