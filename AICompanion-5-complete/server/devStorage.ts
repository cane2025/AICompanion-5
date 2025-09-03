import { z } from "zod";
import { randomUUID } from "crypto";
import {
  clientSchema,
  carePlanSchema,
  implementationPlanSchema,
  weeklyDocumentationSchema,
  monthlyReportSchema,
  vimsaTimeSchema,
  type Client,
  type CarePlan,
  type ImplementationPlan,
  type WeeklyDocumentation,
  type MonthlyReport,
  type VimsaTime,
} from "./schemas";

// Define interfaces for our data models
export interface IClient extends Omit<z.infer<typeof clientSchema>, "id"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICarePlan extends Omit<z.infer<typeof carePlanSchema>, "id"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface IImplementationPlan
  extends Omit<z.infer<typeof implementationPlanSchema>, "id"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWeeklyDocumentation
  extends Omit<z.infer<typeof weeklyDocumentationSchema>, "id"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMonthlyReport
  extends Omit<z.infer<typeof monthlyReportSchema>, "id"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVimsaTime
  extends Omit<z.infer<typeof vimsaTimeSchema>, "id"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Define interfaces for staff
export interface IStaff {
  id: string;
  name: string;
  initials: string;
  // Optional fields for display/normalization
  displayName?: string;
  fullName?: string;
  personnummer?: string;
  telefon?: string;
  epost?: string;
  adress?: string;
  anställningsdatum?: string;
  roll?: string;
  avdelning?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Define the store structure
interface IStore {
  staff: IStaff[];
  clients: IClient[];
  carePlans: ICarePlan[];
  implementationPlans: IImplementationPlan[];
  weeklyDocs: IWeeklyDocumentation[];
  monthlyReports: IMonthlyReport[];
  vimsaTime: IVimsaTime[];
}

// Initialize or get existing store from global scope
const store: IStore = (global as any).__DEV_STORE__ || {
  staff: (function seedStaff() {
    const now = new Date().toISOString();
    const names = [
      "Afif Derbas-",
      "Ahmed Alrakabi",
      "Ahmed Ramadan –",
      "Ajmen Rafiq-",
      "Alana Salah-",
      "Alharis Albayati",
      "Amir Al-Istarabadi  -",
      "Anjelika Bååth-",
      "Bashdar Reza –",
      "Constanza Soto",
      "Deni Dulji",
      "Diana Gharib",
      "Drilon Muqkurtaj",
      "Heidar Farhan",
      "Hussein Ahmed",
      "Ida Björkbacka",
      "Ikhlas Almaliki",
      "Intisar Almansour",
      "Israa Touman",
      "Johan Wessberg",
      "Kim Torneus",
      "Lejla Kocacik",
      "Mirza Celik",
      "Mirza Hodzic",
      "Nasima Kuraishe",
      "Nicolas Lazcano",
      "Omar Mezza",
      "Qasin Abdullahi",
      "Robert Ackar",
      "Samir Bezzina",
      "Sebastian Holm",
      "Wissam Hemissi",
      "Yasmin Ibrahim",
    ];
    function normalize(n: string) {
      return n.replace(/[\u2013\u2014\u2012\-]+\s*$/u, "").replace(/\s+/g, " ").trim();
    }
    function initials(n: string) {
      return normalize(n)
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    }
    const demo: IStaff = {
      id: "s_demo",
      name: "Demo Personal",
      displayName: "Demo Personal",
      fullName: "Demo Personal",
      initials: "DP",
      personnummer: "",
      telefon: "",
      epost: "demo@example.com",
      adress: "",
      anställningsdatum: "",
      roll: "sjuksköterska",
      avdelning: "demo",
      createdAt: now,
      updatedAt: now,
    };
    const seeded = names.map((n, idx) => ({
      id: `s_seed_${idx}`,
      name: n,
      displayName: n,
      fullName: normalize(n),
      initials: initials(n),
      personnummer: "",
      telefon: "",
      epost: "",
      adress: "",
      anställningsdatum: "",
      roll: "",
      avdelning: "",
      createdAt: now,
      updatedAt: now,
    }));
    return [demo, ...seeded];
  })(),
  clients: [],
  carePlans: [],
  implementationPlans: [],
  weeklyDocs: [],
  monthlyReports: [],
  vimsaTime: [],
};

// Persist store in global scope for hot reloads
(global as any).__DEV_STORE__ = store;

// Helper functions
const findById = <T extends { id: string }>(
  arr: T[],
  id: string
): T | undefined => arr.find((item) => item.id === id);

const updateById = <T extends { id: string }>(
  arr: T[],
  id: string,
  updates: Partial<Omit<T, "id">>
): T | undefined => {
  const index = arr.findIndex((item) => item.id === id);
  if (index === -1) return undefined;

  const updated = { ...arr[index], ...updates };
  arr[index] = updated;
  return updated;
};

// Storage implementation
export const devStorage = {
  // Client operations
  async createClient(
    data: Omit<IClient, "id" | "createdAt" | "updatedAt">
  ): Promise<IClient> {
    const now = new Date().toISOString();
    const client: IClient = {
      ...data,
      id: `c_${randomUUID()}`,
      status: data.status || "active",
      createdAt: now,
      updatedAt: now,
    };
    store.clients.push(client);
    return client;
  },

  async getClientsByStaff(staffId: string): Promise<IClient[]> {
    return store.clients.filter((client) => client.staffId === staffId);
  },

  async getClient(id: string): Promise<IClient | undefined> {
    return findById(store.clients, id);
  },

  // Care plan operations
  async createCarePlan(
    data: Omit<ICarePlan, "id" | "createdAt" | "updatedAt">
  ): Promise<ICarePlan> {
    const now = new Date().toISOString();
    const carePlan: ICarePlan = {
      ...data,
      id: `cp_${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    store.carePlans.push(carePlan);
    return carePlan;
  },

  async updateCarePlan(
    id: string,
    data: Partial<Omit<ICarePlan, "id" | "createdAt" | "updatedAt">>
  ): Promise<ICarePlan> {
    const plan = updateById(store.carePlans, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    if (!plan) {
      throw new Error("Care plan not found");
    }
    return plan;
  },

  async deleteCarePlan(id: string): Promise<void> {
    const idx = store.carePlans.findIndex((p) => p.id === id);
    if (idx !== -1) {
      store.carePlans.splice(idx, 1);
    }
  },

  async getCarePlansByClient(clientId: string): Promise<ICarePlan[]> {
    return store.carePlans.filter((plan) => plan.clientId === clientId);
  },

  // Implementation plan operations
  async createImplementationPlan(
    data: Omit<IImplementationPlan, "id" | "createdAt" | "updatedAt">
  ): Promise<IImplementationPlan> {
    const now = new Date().toISOString();
    const plan: IImplementationPlan = {
      ...data,
      id: `ip_${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    store.implementationPlans.push(plan);
    return plan;
  },

  async getImplementationPlansByClient(
    clientId: string
  ): Promise<IImplementationPlan[]> {
    return store.implementationPlans.filter(
      (plan) => plan.clientId === clientId
    );
  },

  async updateImplementationPlan(
    id: string,
    data: Partial<Omit<IImplementationPlan, "id" | "createdAt" | "updatedAt">>
  ): Promise<IImplementationPlan> {
    const plan = updateById(store.implementationPlans, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    if (!plan) {
      throw new Error("Implementation plan not found");
    }
    return plan;
  },

  async deleteImplementationPlan(id: string): Promise<void> {
    const idx = store.implementationPlans.findIndex((p) => p.id === id);
    if (idx !== -1) {
      store.implementationPlans.splice(idx, 1);
    }
  },

  // Weekly documentation operations
  async createWeeklyDocumentation(
    data: Omit<IWeeklyDocumentation, "id" | "createdAt" | "updatedAt">
  ): Promise<IWeeklyDocumentation> {
    const now = new Date().toISOString();
    const doc: IWeeklyDocumentation = {
      ...data,
      id: `wd_${randomUUID()}`,
      qualityAssessment: (data as any).qualityAssessment ?? "pending",
      matchesDocumentation: data.matchesDocumentation || false,
      createdAt: now,
      updatedAt: now,
    };
    store.weeklyDocs.push(doc);
    return doc;
  },

  async getWeeklyDocumentationByClient(
    clientId: string
  ): Promise<IWeeklyDocumentation[]> {
    return store.weeklyDocs.filter((doc) => doc.clientId === clientId);
  },

  // Monthly report operations
  async createMonthlyReport(
    data: Omit<IMonthlyReport, "id" | "createdAt" | "updatedAt">
  ): Promise<IMonthlyReport> {
    const now = new Date().toISOString();
    const report: IMonthlyReport = {
      ...data,
      id: `mr_${randomUUID()}`,
      status: data.status || "in_progress",
      quality: data.quality || "pending",
      createdAt: now,
      updatedAt: now,
    };
    store.monthlyReports.push(report);
    return report;
  },

  async getMonthlyReportsByClient(clientId: string): Promise<IMonthlyReport[]> {
    return store.monthlyReports.filter(
      (report) => report.clientId === clientId
    );
  },

  // Vimsa time operations
  async createVimsaTime(
    data: Omit<IVimsaTime, "id" | "createdAt" | "updatedAt">
  ): Promise<IVimsaTime> {
    const now = new Date().toISOString();
    const vimsaTime: IVimsaTime = {
      ...data,
      id: `vt_${randomUUID()}`,
      approved: data.approved || false,
      matchesDocumentation: data.matchesDocumentation || false,
      createdAt: now,
      updatedAt: now,
    };
    store.vimsaTime.push(vimsaTime);
    return vimsaTime;
  },

  async getVimsaTimeByClient(clientId: string): Promise<IVimsaTime[]> {
    return store.vimsaTime.filter((vt) => vt.clientId === clientId);
  },

  // Staff operations
  async createStaff(
    data: Omit<IStaff, "id" | "createdAt" | "updatedAt">
  ): Promise<IStaff> {
    const now = new Date().toISOString();
    const staff: IStaff = {
      ...data,
      id: `s_${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    store.staff.push(staff);
    return staff;
  },

  async getStaff(): Promise<IStaff[]> {
    return store.staff.filter((s) => !s.deletedAt);
  },

  async deleteStaff(id: string): Promise<void> {
    const staff = store.staff.find((s) => s.id === id);
    if (staff) {
      staff.deletedAt = new Date().toISOString();
      // Unassign clients linked to this staff
      store.clients = store.clients.map((c) =>
        c.staffId === id ? { ...c, staffId: "unassigned", updatedAt: new Date().toISOString() } : c
      );
    }
  },

  // Utility methods
  async clear(): Promise<void> {
    store.staff = [];
    store.clients = [];
    store.carePlans = [];
    store.implementationPlans = [];
    store.weeklyDocs = [];
    store.monthlyReports = [];
    store.vimsaTime = [];
  },

  // For debugging
  getStore(): IStore {
    return JSON.parse(JSON.stringify(store));
  },
};

export default devStorage;
