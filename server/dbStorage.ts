import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "./db.js";
import {
  users,
  staff as staffTable,
  clients as clientsTable,
  weeklyDocumentation as weeklyDocumentationTable,
  monthlyReports as monthlyReportsTable,
  carePlans as carePlansTable,
  implementationPlans as implementationPlansTable,
  vimsaTime as vimsaTimeTable,
  type User,
  type InsertUser,
  type Staff,
  type InsertStaff,
  type UpdateStaff,
  type Client,
  type InsertClient,
  type UpdateClient,
  type WeeklyDocumentation,
  type InsertWeeklyDocumentation,
  type UpdateWeeklyDocumentation,
  type MonthlyReport,
  type InsertMonthlyReport,
  type UpdateMonthlyReport,
  type CarePlan,
  type InsertCarePlan,
  type UpdateCarePlan,
  type ImplementationPlan,
  type InsertImplementationPlan,
  type UpdateImplementationPlan,
  type InsertVimsaTime,
  type UpdateVimsaTime,
  type VimsaTime,
} from "../shared/schema.js";

export class DbStorage {
  // Users
  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.username, username) }) as Promise<User | undefined>;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.email, email) }) as Promise<User | undefined>;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    const [created] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: (userData as any).role ?? "staff",
        isActive: (userData as any).isActive ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created as User;
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated as User | undefined;
  }

  // Staff
  async getAllStaff(): Promise<Staff[]> {
    return db.query.staff.findMany({ orderBy: (t, { asc: _asc }) => _asc(t.name) }) as Promise<Staff[]>;
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    return db.query.staff.findFirst({ where: eq(staffTable.id, id) }) as Promise<Staff | undefined>;
  }

  async getStaffByName(name: string): Promise<Staff | undefined> {
    return db.query.staff.findFirst({ where: eq(staffTable.name, name) }) as Promise<Staff | undefined>;
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    const now = new Date();
    const [created] = await db
      .insert(staffTable)
      .values({
        id: randomUUID(),
        name: staff.name,
        initials: staff.initials,
        personnummer: (staff as any).personnummer ?? "",
        telefon: (staff as any).telefon ?? "",
        epost: (staff as any).epost ?? "",
        adress: (staff as any).adress ?? "",
        anställningsdatum: (staff as any).anställningsdatum ?? "",
        roll: (staff as any).roll ?? "",
        avdelning: (staff as any).avdelning ?? "",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
      .returning();
    return created as Staff;
  }

  async updateStaff(id: string, updates: UpdateStaff): Promise<Staff | undefined> {
    const [updated] = await db
      .update(staffTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(staffTable.id, id))
      .returning();
    return updated as Staff | undefined;
  }

  async deleteStaff(id: string): Promise<boolean> {
    const deleted = await db
      .delete(staffTable)
      .where(eq(staffTable.id, id))
      .returning({ id: staffTable.id });
    return deleted.length > 0;
  }

  // Clients
  async getAllClients(): Promise<Client[]> {
    return db.query.clients.findMany({ orderBy: (t, { asc: _asc }) => _asc(t.initials) }) as Promise<Client[]>;
  }

  async getClientsByStaffId(staffId: string): Promise<Client[]> {
    return db.query.clients.findMany({
      where: eq(clientsTable.staffId, staffId),
      orderBy: (t, { asc: _asc }) => _asc(t.initials),
    }) as Promise<Client[]>;
  }

  async getClient(id: string): Promise<Client | undefined> {
    return db.query.clients.findFirst({ where: eq(clientsTable.id, id) }) as Promise<Client | undefined>;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const now = new Date();
    const [created] = await db
      .insert(clientsTable)
      .values({
        id: randomUUID(),
        initials: client.initials,
        staffId: client.staffId,
        personalNumber: (client as any).personalNumber ?? "",
        notes: (client as any).notes ?? "",
        status: (client as any).status ?? "active",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })
      .returning();
    return created as Client;
  }

  async updateClient(id: string, updates: UpdateClient): Promise<Client | undefined> {
    const [updated] = await db
      .update(clientsTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(clientsTable.id, id))
      .returning();
    return updated as Client | undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    const deleted = await db
      .delete(clientsTable)
      .where(eq(clientsTable.id, id))
      .returning({ id: clientsTable.id });
    return deleted.length > 0;
  }

  // Weekly Documentation
  async getAllWeeklyDocumentation(): Promise<WeeklyDocumentation[]> {
    return db.query.weeklyDocumentation.findMany({
      orderBy: (t, { desc }) => desc(t.updatedAt),
    }) as Promise<WeeklyDocumentation[]>;
  }

  async getWeeklyDocumentation(clientId: string, year: number, week: number): Promise<WeeklyDocumentation | undefined> {
    return db.query.weeklyDocumentation.findFirst({
      where: and(
        eq(weeklyDocumentationTable.clientId, clientId),
        eq(weeklyDocumentationTable.year, year),
        eq(weeklyDocumentationTable.week, week)
      ),
    }) as Promise<WeeklyDocumentation | undefined>;
  }

  async createWeeklyDocumentation(insertDoc: InsertWeeklyDocumentation): Promise<WeeklyDocumentation> {
    const now = new Date();
    const [created] = await db
      .insert(weeklyDocumentationTable)
      .values({
        id: randomUUID(),
        clientId: insertDoc.clientId,
        staffId: insertDoc.staffId,
        year: insertDoc.year,
        week: insertDoc.week,
        content: (insertDoc as any).content ?? "",
        mondayStatus: (insertDoc as any).mondayStatus ?? "not_done",
        tuesdayStatus: (insertDoc as any).tuesdayStatus ?? "not_done",
        wednesdayStatus: (insertDoc as any).wednesdayStatus ?? "not_done",
        thursdayStatus: (insertDoc as any).thursdayStatus ?? "not_done",
        fridayStatus: (insertDoc as any).fridayStatus ?? "not_done",
        saturdayStatus: (insertDoc as any).saturdayStatus ?? "not_done",
        sundayStatus: (insertDoc as any).sundayStatus ?? "not_done",
        mondayDocumented: (insertDoc as any).mondayDocumented ?? false,
        tuesdayDocumented: (insertDoc as any).tuesdayDocumented ?? false,
        wednesdayDocumented: (insertDoc as any).wednesdayDocumented ?? false,
        thursdayDocumented: (insertDoc as any).thursdayDocumented ?? false,
        fridayDocumented: (insertDoc as any).fridayDocumented ?? false,
        saturdayDocumented: (insertDoc as any).saturdayDocumented ?? false,
        sundayDocumented: (insertDoc as any).sundayDocumented ?? false,
        documentation: (insertDoc as any).documentation ?? "",
        approved: (insertDoc as any).approved ?? false,
        comments: (insertDoc as any).comments ?? "",
        qualityAssessment: (insertDoc as any).qualityAssessment ?? "pending",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created as WeeklyDocumentation;
  }

  async updateWeeklyDocumentation(id: string, updates: UpdateWeeklyDocumentation): Promise<WeeklyDocumentation | undefined> {
    const [updated] = await db
      .update(weeklyDocumentationTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(weeklyDocumentationTable.id, id))
      .returning();
    return updated as WeeklyDocumentation | undefined;
  }

  // Monthly Reports
  async getAllMonthlyReports(): Promise<MonthlyReport[]> {
    return db.query.monthlyReports.findMany({ orderBy: (t, { desc }) => desc(t.updatedAt) }) as Promise<MonthlyReport[]>;
  }

  async getMonthlyReport(clientId: string, year: number, month: number): Promise<MonthlyReport | undefined> {
    return db.query.monthlyReports.findFirst({
      where: and(
        eq(monthlyReportsTable.clientId, clientId),
        eq(monthlyReportsTable.year, year),
        eq(monthlyReportsTable.month, month)
      ),
    }) as Promise<MonthlyReport | undefined>;
  }

  async createMonthlyReport(insertReport: InsertMonthlyReport): Promise<MonthlyReport> {
    const now = new Date();
    const [created] = await db
      .insert(monthlyReportsTable)
      .values({
        id: randomUUID(),
        clientId: insertReport.clientId,
        staffId: insertReport.staffId,
        year: insertReport.year,
        month: insertReport.month,
        content: (insertReport as any).content ?? "",
        reportContent: (insertReport as any).reportContent ?? "",
        status: (insertReport as any).status ?? "not_started",
        comment: (insertReport as any).comment ?? "",
        quality: (insertReport as any).quality ?? "pending",
        submissionDate: (insertReport as any).submissionDate ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created as MonthlyReport;
  }

  async updateMonthlyReport(id: string, updates: UpdateMonthlyReport): Promise<MonthlyReport | undefined> {
    const [updated] = await db
      .update(monthlyReportsTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(monthlyReportsTable.id, id))
      .returning();
    return updated as MonthlyReport | undefined;
  }

  // Care Plans
  async getAllCarePlans(): Promise<CarePlan[]> {
    return db.query.carePlans.findMany({ orderBy: (t, { desc }) => desc(t.updatedAt) }) as Promise<CarePlan[]>;
  }

  async getCarePlan(clientId: string): Promise[CarePlan | undefined] {
    return db.query.carePlans.findFirst({ where: eq(carePlansTable.clientId, clientId) }) as Promise<CarePlan | undefined>;
  }

  async createCarePlan(insertPlan: InsertCarePlan): Promise<CarePlan> {
    const now = new Date();
    const [created] = await db
      .insert(carePlansTable)
      .values({
        id: randomUUID(),
        clientId: insertPlan.clientId,
        staffId: insertPlan.staffId,
        responsibleId: (insertPlan as any).responsibleId ?? null,
        planContent: (insertPlan as any).planContent ?? "",
        goals: (insertPlan as any).goals ?? "",
        interventions: (insertPlan as any).interventions ?? "",
        evaluationCriteria: (insertPlan as any).evaluationCriteria ?? null,
        receivedDate: (insertPlan as any).receivedDate ?? null,
        enteredJournalDate: (insertPlan as any).enteredJournalDate ?? null,
        staffNotifiedDate: (insertPlan as any).staffNotifiedDate ?? null,
        status: (insertPlan as any).status ?? "received",
        isActive: (insertPlan as any).isActive ?? true,
        comment: (insertPlan as any).comment ?? "",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created as CarePlan;
  }

  async updateCarePlan(id: string, updates: UpdateCarePlan): Promise<CarePlan | undefined> {
    const [updated] = await db
      .update(carePlansTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(carePlansTable.id, id))
      .returning();
    return updated as CarePlan | undefined;
  }

  async deleteCarePlan(id: string): Promise<boolean> {
    const deleted = await db
      .delete(carePlansTable)
      .where(eq(carePlansTable.id, id))
      .returning({ id: carePlansTable.id });
    return deleted.length > 0;
  }

  // Implementation Plans
  async getAllImplementationPlans(): Promise<ImplementationPlan[]> {
    return db.query.implementationPlans.findMany({ orderBy: (t, { desc }) => desc(t.updatedAt) }) as Promise<ImplementationPlan[]>;
  }

  async getImplementationPlan(clientId: string): Promise<ImplementationPlan | undefined> {
    return db.query.implementationPlans.findFirst({ where: eq(implementationPlansTable.clientId, clientId) }) as Promise<ImplementationPlan | undefined>;
  }

  async getImplementationPlanById(id: string): Promise<ImplementationPlan | undefined> {
    return db.query.implementationPlans.findFirst({ where: eq(implementationPlansTable.id, id) }) as Promise<ImplementationPlan | undefined>;
  }

  async createImplementationPlan(insertPlan: InsertImplementationPlan): Promise<ImplementationPlan> {
    const now = new Date();
    const [created] = await db
      .insert(implementationPlansTable)
      .values({
        id: randomUUID(),
        clientId: insertPlan.clientId,
        staffId: insertPlan.staffId,
        carePlanId: (insertPlan as any).carePlanId ?? null,
        planContent: (insertPlan as any).planContent ?? "",
        goals: (insertPlan as any).goals ?? "",
        activities: (insertPlan as any).activities ?? "",
        followUpSchedule: (insertPlan as any).followUpSchedule ?? "",
        status: (insertPlan as any).status ?? "pending",
        isActive: (insertPlan as any).isActive ?? true,
        followup1: (insertPlan as any).followup1 ?? false,
        followup2: (insertPlan as any).followup2 ?? false,
        createdDate: (insertPlan as any).createdDate ?? now,
        comments: (insertPlan as any).comments ?? "",
        createdAt: now,
        updatedAt: now,
        dueDate: (insertPlan as any).dueDate ?? null,
        completedDate: (insertPlan as any).completedDate ?? null,
        sentDate: (insertPlan as any).sentDate ?? null,
        planType: (insertPlan as any).planType ?? "care",
      })
      .returning();
    return created as ImplementationPlan;
  }

  async updateImplementationPlan(id: string, updates: UpdateImplementationPlan): Promise<ImplementationPlan | undefined> {
    const [updated] = await db
      .update(implementationPlansTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(implementationPlansTable.id, id))
      .returning();
    return updated as ImplementationPlan | undefined;
  }

  // Vimsa Time
  async getAllVimsaTime(): Promise<VimsaTime[]> {
    return db.query.vimsaTime.findMany({ orderBy: (t, { desc }) => desc(t.updatedAt) }) as Promise<VimsaTime[]>;
  }

  async getVimsaTime(clientId: string, year: number, week: number): Promise<VimsaTime | undefined> {
    return db.query.vimsaTime.findFirst({
      where: and(
        eq(vimsaTimeTable.clientId, clientId),
        eq(vimsaTimeTable.year, year),
        eq(vimsaTimeTable.week, week)
      ),
    }) as Promise<VimsaTime | undefined>;
  }

  async getVimsaTimeById(id: string): Promise<VimsaTime | undefined> {
    return db.query.vimsaTime.findFirst({ where: eq(vimsaTimeTable.id, id) }) as Promise<VimsaTime | undefined>;
  }

  async createVimsaTime(insertTime: InsertVimsaTime): Promise<VimsaTime> {
    const now = new Date();
    const [created] = await db
      .insert(vimsaTimeTable)
      .values({
        id: randomUUID(),
        clientId: insertTime.clientId,
        staffId: insertTime.staffId,
        year: insertTime.year,
        week: insertTime.week,
        monday: (insertTime as any).monday ?? 0,
        tuesday: (insertTime as any).tuesday ?? 0,
        wednesday: (insertTime as any).wednesday ?? 0,
        thursday: (insertTime as any).thursday ?? 0,
        friday: (insertTime as any).friday ?? 0,
        saturday: (insertTime as any).saturday ?? 0,
        sunday: (insertTime as any).sunday ?? 0,
        totalHours: (insertTime as any).totalHours ?? 0,
        status: (insertTime as any).status ?? "not_started",
        approved: (insertTime as any).approved ?? false,
        comments: (insertTime as any).comments ?? "",
        matchesDocumentation: (insertTime as any).matchesDocumentation ?? false,
        hoursWorked: (insertTime as any).hoursWorked ?? 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created as VimsaTime;
  }

  async updateVimsaTime(id: string, updates: UpdateVimsaTime): Promise<VimsaTime | undefined> {
    const [updated] = await db
      .update(vimsaTimeTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(vimsaTimeTable.id, id))
      .returning();
    return updated as VimsaTime | undefined;
  }
}

