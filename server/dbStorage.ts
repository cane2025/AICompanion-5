import {
  users as usersTable,
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
  type VimsaTime,
  type InsertVimsaTime,
  type UpdateVimsaTime,
} from "../shared/schema.js";
import { and, eq } from "drizzle-orm";

async function getDb() {
  const mod = await import("./db.js");
  return mod.db as any;
}

export class DBStorage {
  // Users
  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await getDb();
    const rows = await db.select().from(usersTable).where(eq(usersTable.username, username));
    return rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await getDb();
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return rows[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const db = await getDb();
    const [row] = await db
      .insert(usersTable)
      .values({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: userData.role ?? "staff",
        isActive: userData.isActive ?? true,
      })
      .returning();
    return row;
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<User | undefined> {
    const db = await getDb();
    const [row] = await db
      .update(usersTable)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    return row;
  }

  // Staff
  async getAllStaff(): Promise<Staff[]> {
    const db = await getDb();
    const rows = await db.select().from(staffTable);
    return rows.sort((a: Staff, b: Staff) => (a.name || "").localeCompare(b.name || ""));
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const db = await getDb();
    const [row] = await db.select().from(staffTable).where(eq(staffTable.id, id));
    return row;
  }

  async getStaffByName(name: string): Promise<Staff | undefined> {
    const db = await getDb();
    const rows = await db.select().from(staffTable).where(eq(staffTable.name, name));
    return rows[0];
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const db = await getDb();
    const [row] = await db
      .insert(staffTable)
      .values({
        name: insertStaff.name,
        initials: insertStaff.initials,
        personnummer: insertStaff.personnummer ?? "",
        telefon: insertStaff.telefon ?? "",
        epost: insertStaff.epost ?? "",
        adress: insertStaff.adress ?? "",
        anställningsdatum: insertStaff.anställningsdatum ?? "",
        roll: insertStaff.roll ?? "",
        avdelning: insertStaff.avdelning ?? "",
      })
      .returning();
    return row;
  }

  async updateStaff(id: string, updates: UpdateStaff): Promise<Staff | undefined> {
    const db = await getDb();
    const [row] = await db
      .update(staffTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(staffTable.id, id))
      .returning();
    return row;
  }

  async deleteStaff(id: string): Promise<boolean> {
    const db = await getDb();
    const rows = await db.delete(staffTable).where(eq(staffTable.id, id)).returning();
    return rows.length > 0;
  }

  // Clients
  async getAllClients(): Promise<Client[]> {
    const db = await getDb();
    const rows = await db.select().from(clientsTable);
    return rows;
  }

  async getClientsByStaffId(staffId: string): Promise<Client[]> {
    const db = await getDb();
    const rows = await db.select().from(clientsTable).where(eq(clientsTable.staffId, staffId));
    return rows.sort((a: Client, b: Client) => (a.initials || "").localeCompare(b.initials || ""));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const db = await getDb();
    const [row] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
    return row;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const db = await getDb();
    const [row] = await db
      .insert(clientsTable)
      .values({
        initials: insertClient.initials,
        staffId: insertClient.staffId,
        personalNumber: insertClient.personalNumber ?? "",
        notes: insertClient.notes ?? "",
        status: insertClient.status ?? "active",
      })
      .returning();
    return row;
  }

  async updateClient(id: string, updates: UpdateClient): Promise<Client | undefined> {
    const db = await getDb();
    const [row] = await db
      .update(clientsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientsTable.id, id))
      .returning();
    return row;
  }

  async deleteClient(id: string): Promise<boolean> {
    const db = await getDb();
    const rows = await db.delete(clientsTable).where(eq(clientsTable.id, id)).returning();
    return rows.length > 0;
  }

  // Weekly Documentation
  async getAllWeeklyDocumentation(): Promise<WeeklyDocumentation[]> {
    const db = await getDb();
    const rows = await db.select().from(weeklyDocumentationTable);
    return rows;
  }

  async getWeeklyDocumentation(clientId: string, year: number, week: number): Promise<WeeklyDocumentation | undefined> {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(weeklyDocumentationTable)
      .where(
        and(
          eq(weeklyDocumentationTable.clientId, clientId),
          eq(weeklyDocumentationTable.year, year),
          eq(weeklyDocumentationTable.week, week)
        )
      );
    return row;
  }

  async createWeeklyDocumentation(insertDoc: InsertWeeklyDocumentation): Promise<WeeklyDocumentation> {
    const db = await getDb();
    const [row] = await db
      .insert(weeklyDocumentationTable)
      .values({
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
        comments: insertDoc.comments ?? "",
        qualityAssessment: (insertDoc as any).qualityAssessment ?? "pending",
      })
      .returning();
    return row;
  }

  async updateWeeklyDocumentation(id: string, updates: UpdateWeeklyDocumentation): Promise<WeeklyDocumentation | undefined> {
    const db = await getDb();
    const [row] = await db
      .update(weeklyDocumentationTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(weeklyDocumentationTable.id, id))
      .returning();
    return row;
  }

  // Monthly Reports
  async getAllMonthlyReports(): Promise<MonthlyReport[]> {
    const db = await getDb();
    const rows = await db.select().from(monthlyReportsTable);
    return rows;
  }

  async getMonthlyReport(clientId: string, year: number, month: number): Promise<MonthlyReport | undefined> {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(monthlyReportsTable)
      .where(
        and(
          eq(monthlyReportsTable.clientId, clientId),
          eq(monthlyReportsTable.year, year),
          eq(monthlyReportsTable.month, month)
        )
      );
    return row;
  }

  async createMonthlyReport(insertReport: InsertMonthlyReport): Promise<MonthlyReport> {
    const db = await getDb();
    const [row] = await db
      .insert(monthlyReportsTable)
      .values({
        clientId: insertReport.clientId,
        staffId: insertReport.staffId,
        year: insertReport.year,
        month: insertReport.month,
        content: (insertReport as any).content ?? "",
        reportContent: insertReport.reportContent ?? "",
        status: insertReport.status ?? "not_started",
        comment: insertReport.comment ?? "",
        quality: (insertReport as any).quality ?? "pending",
        submissionDate: (insertReport as any).submissionDate ?? null,
      })
      .returning();
    return row;
  }

  async updateMonthlyReport(id: string, updates: UpdateMonthlyReport): Promise<MonthlyReport | undefined> {
    const db = await getDb();
    const [row] = await db
      .update(monthlyReportsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(monthlyReportsTable.id, id))
      .returning();
    return row;
  }

  // Care Plans
  async getAllCarePlans(): Promise<CarePlan[]> {
    const db = await getDb();
    const rows = await db.select().from(carePlansTable);
    return rows;
  }

  async getCarePlan(clientId: string): Promise<CarePlan | undefined> {
    const db = await getDb();
    const [row] = await db.select().from(carePlansTable).where(eq(carePlansTable.clientId, clientId));
    return row;
  }

  async createCarePlan(insertPlan: InsertCarePlan): Promise<CarePlan> {
    const db = await getDb();
    const [row] = await db
      .insert(carePlansTable)
      .values({
        clientId: insertPlan.clientId,
        staffId: insertPlan.staffId,
        responsibleId: (insertPlan as any).responsibleId ?? null,
        planContent: insertPlan.planContent ?? "",
        goals: insertPlan.goals ?? "",
        interventions: insertPlan.interventions ?? "",
        evaluationCriteria: (insertPlan as any).evaluationCriteria ?? null,
        receivedDate: (insertPlan as any).receivedDate ?? null,
        enteredJournalDate: (insertPlan as any).enteredJournalDate ?? null,
        staffNotifiedDate: (insertPlan as any).staffNotifiedDate ?? null,
        status: insertPlan.status ?? "received",
        isActive: insertPlan.isActive ?? true,
        comment: insertPlan.comment ?? "",
      })
      .returning();
    return row;
  }

  async updateCarePlan(id: string, updates: UpdateCarePlan): Promise<CarePlan | undefined> {
    const db = await getDb();
    const [row] = await db
      .update(carePlansTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(carePlansTable.id, id))
      .returning();
    return row;
  }

  async deleteCarePlan(id: string): Promise<boolean> {
    const db = await getDb();
    const rows = await db.delete(carePlansTable).where(eq(carePlansTable.id, id)).returning();
    return rows.length > 0;
  }

  // Implementation Plans
  async getAllImplementationPlans(): Promise<ImplementationPlan[]> {
    const db = await getDb();
    const rows = await db.select().from(implementationPlansTable);
    return rows;
  }

  async getImplementationPlan(clientId: string): Promise<ImplementationPlan | undefined> {
    const db = await getDb();
    const [row] = await db.select().from(implementationPlansTable).where(eq(implementationPlansTable.clientId, clientId));
    return row;
  }

  async getImplementationPlanById(id: string): Promise<ImplementationPlan | undefined> {
    const db = await getDb();
    const [row] = await db.select().from(implementationPlansTable).where(eq(implementationPlansTable.id, id));
    return row;
  }

  async createImplementationPlan(insertPlan: InsertImplementationPlan): Promise<ImplementationPlan> {
    const db = await getDb();
    const [row] = await db
      .insert(implementationPlansTable)
      .values({
        clientId: insertPlan.clientId,
        staffId: insertPlan.staffId,
        carePlanId: (insertPlan as any).carePlanId ?? null,
        planContent: insertPlan.planContent ?? "",
        goals: insertPlan.goals ?? "",
        activities: (insertPlan as any).activities ?? "",
        followUpSchedule: insertPlan.followUpSchedule ?? "",
        status: insertPlan.status ?? "pending",
        isActive: insertPlan.isActive ?? true,
        followup1: (insertPlan as any).followup1 ?? false,
        followup2: (insertPlan as any).followup2 ?? false,
        createdDate: (insertPlan as any).createdDate ?? new Date(),
        comments: insertPlan.comments ?? "",
        dueDate: (insertPlan as any).dueDate ?? null,
        completedDate: (insertPlan as any).completedDate ?? null,
        sentDate: (insertPlan as any).sentDate ?? null,
        planType: (insertPlan as any).planType ?? "care",
      })
      .returning();
    return row;
  }

  async updateImplementationPlan(id: string, updates: UpdateImplementationPlan): Promise<ImplementationPlan | undefined> {
    const db = await getDb();
    const [row] = await db
      .update(implementationPlansTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(implementationPlansTable.id, id))
      .returning();
    return row;
  }

  // Vimsa Time
  async getAllVimsaTime(): Promise<VimsaTime[]> {
    const db = await getDb();
    const rows = await db.select().from(vimsaTimeTable);
    return rows;
  }

  async getVimsaTime(clientId: string, year: number, week: number): Promise<VimsaTime | undefined> {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(vimsaTimeTable)
      .where(
        and(
          eq(vimsaTimeTable.clientId, clientId),
          eq(vimsaTimeTable.year, year),
          eq(vimsaTimeTable.week, week)
        )
      );
    return row;
  }

  async createVimsaTime(insertTime: InsertVimsaTime): Promise<VimsaTime> {
    const db = await getDb();
    const [row] = await db
      .insert(vimsaTimeTable)
      .values({
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
        status: insertTime.status ?? "not_started",
        approved: insertTime.approved ?? false,
        comments: insertTime.comments ?? "",
        matchesDocumentation: insertTime.matchesDocumentation ?? false,
        hoursWorked: insertTime.hoursWorked ?? 0,
      })
      .returning();
    return row;
  }

  async updateVimsaTime(id: string, updates: UpdateVimsaTime): Promise<VimsaTime | undefined> {
    const db = await getDb();
    const [row] = await db
      .update(vimsaTimeTable)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(vimsaTimeTable.id, id))
      .returning();
    return row;
  }
}

export const dbStorage = new DBStorage();

