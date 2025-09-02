import { db } from "../db.js";
import {
  users,
  staff,
  clients,
  weeklyDocumentation,
  monthlyReports,
  carePlans,
  implementationPlans,
  vimsaTime,
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
} from "../../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";

export class DatabaseService {
  // User operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Staff operations
  async getAllStaff(): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.deletedAt, null)).orderBy(desc(staff.createdAt));
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const result = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
    return result[0];
  }

  async getStaffByName(name: string): Promise<Staff | undefined> {
    const result = await db.select().from(staff).where(eq(staff.name, name)).limit(1);
    return result[0];
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const result = await db.insert(staff).values(staffData).returning();
    return result[0];
  }

  async updateStaff(id: string, updates: UpdateStaff): Promise<Staff | undefined> {
    const result = await db
      .update(staff)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return result[0];
  }

  async deleteStaff(id: string): Promise<boolean> {
    const result = await db
      .update(staff)
      .set({ deletedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return result.length > 0;
  }

  // Client operations
  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.deletedAt, null)).orderBy(desc(clients.createdAt));
  }

  async getClientsByStaffId(staffId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(and(eq(clients.staffId, staffId), eq(clients.deletedAt, null)))
      .orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(clientData).returning();
    return result[0];
  }

  async updateClient(id: string, updates: UpdateClient): Promise<Client | undefined> {
    const result = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db
      .update(clients)
      .set({ deletedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return result.length > 0;
  }

  // Weekly documentation operations
  async getAllWeeklyDocumentation(): Promise<WeeklyDocumentation[]> {
    return await db.select().from(weeklyDocumentation).orderBy(desc(weeklyDocumentation.createdAt));
  }

  async getWeeklyDocumentation(
    clientId: string,
    year: number,
    week: number
  ): Promise<WeeklyDocumentation | undefined> {
    const result = await db
      .select()
      .from(weeklyDocumentation)
      .where(and(eq(weeklyDocumentation.clientId, clientId), eq(weeklyDocumentation.year, year), eq(weeklyDocumentation.week, week)))
      .limit(1);
    return result[0];
  }

  async createWeeklyDocumentation(doc: InsertWeeklyDocumentation): Promise<WeeklyDocumentation> {
    const result = await db.insert(weeklyDocumentation).values(doc).returning();
    return result[0];
  }

  async updateWeeklyDocumentation(
    id: string,
    updates: UpdateWeeklyDocumentation
  ): Promise<WeeklyDocumentation | undefined> {
    const result = await db
      .update(weeklyDocumentation)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(weeklyDocumentation.id, id))
      .returning();
    return result[0];
  }

  // Monthly report operations
  async getAllMonthlyReports(): Promise<MonthlyReport[]> {
    return await db.select().from(monthlyReports).orderBy(desc(monthlyReports.createdAt));
  }

  async getMonthlyReport(
    clientId: string,
    year: number,
    month: number
  ): Promise<MonthlyReport | undefined> {
    const result = await db
      .select()
      .from(monthlyReports)
      .where(and(eq(monthlyReports.clientId, clientId), eq(monthlyReports.year, year), eq(monthlyReports.month, month)))
      .limit(1);
    return result[0];
  }

  async createMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport> {
    const result = await db.insert(monthlyReports).values(report).returning();
    return result[0];
  }

  async updateMonthlyReport(
    id: string,
    updates: UpdateMonthlyReport
  ): Promise<MonthlyReport | undefined> {
    const result = await db
      .update(monthlyReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(monthlyReports.id, id))
      .returning();
    return result[0];
  }

  // Care plan operations
  async getAllCarePlans(): Promise<CarePlan[]> {
    return await db.select().from(carePlans).orderBy(desc(carePlans.createdAt));
  }

  async getCarePlan(clientId: string): Promise<CarePlan | undefined> {
    const result = await db.select().from(carePlans).where(eq(carePlans.clientId, clientId)).limit(1);
    return result[0];
  }

  async createCarePlan(plan: InsertCarePlan): Promise<CarePlan> {
    const result = await db.insert(carePlans).values(plan).returning();
    return result[0];
  }

  async updateCarePlan(id: string, updates: UpdateCarePlan): Promise<CarePlan | undefined> {
    const result = await db
      .update(carePlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(carePlans.id, id))
      .returning();
    return result[0];
  }

  async deleteCarePlan(id: string): Promise<boolean> {
    const result = await db.delete(carePlans).where(eq(carePlans.id, id)).returning();
    return result.length > 0;
  }

  // Implementation plan operations
  async getAllImplementationPlans(): Promise<ImplementationPlan[]> {
    return await db.select().from(implementationPlans).orderBy(desc(implementationPlans.createdAt));
  }

  async getImplementationPlan(clientId: string): Promise<ImplementationPlan | undefined> {
    const result = await db.select().from(implementationPlans).where(eq(implementationPlans.clientId, clientId)).limit(1);
    return result[0];
  }

  async createImplementationPlan(plan: InsertImplementationPlan): Promise<ImplementationPlan> {
    const result = await db.insert(implementationPlans).values(plan).returning();
    return result[0];
  }

  async updateImplementationPlan(
    id: string,
    updates: UpdateImplementationPlan
  ): Promise<ImplementationPlan | undefined> {
    const result = await db
      .update(implementationPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(implementationPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteImplementationPlan(id: string): Promise<boolean> {
    const result = await db.delete(implementationPlans).where(eq(implementationPlans.id, id)).returning();
    return result.length > 0;
  }

  // Vimsa time operations
  async getAllVimsaTime(): Promise<VimsaTime[]> {
    return await db.select().from(vimsaTime).orderBy(desc(vimsaTime.createdAt));
  }

  async getVimsaTime(clientId: string): Promise<VimsaTime | undefined> {
    const result = await db.select().from(vimsaTime).where(eq(vimsaTime.clientId, clientId)).limit(1);
    return result[0];
  }

  async createVimsaTime(vimsaData: InsertVimsaTime): Promise<VimsaTime> {
    const result = await db.insert(vimsaTime).values(vimsaData).returning();
    return result[0];
  }

  async updateVimsaTime(id: string, updates: UpdateVimsaTime): Promise<VimsaTime | undefined> {
    const result = await db
      .update(vimsaTime)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vimsaTime.id, id))
      .returning();
    return result[0];
  }

  async deleteVimsaTime(id: string): Promise<boolean> {
    const result = await db.delete(vimsaTime).where(eq(vimsaTime.id, id)).returning();
    return result.length > 0;
  }

  // Search and filtering operations
  async searchStaff(query: string): Promise<Staff[]> {
    return await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.deletedAt, null),
          sql`(${staff.name} ILIKE ${`%${query}%`} OR ${staff.initials} ILIKE ${`%${query}%`})`
        )
      )
      .orderBy(desc(staff.createdAt));
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.deletedAt, null),
          sql`(${clients.initials} ILIKE ${`%${query}%`} OR ${clients.personalNumber} ILIKE ${`%${query}%`})`
        )
      )
      .orderBy(desc(clients.createdAt));
  }

  // Bulk operations
  async bulkCreateStaff(staffList: InsertStaff[]): Promise<Staff[]> {
    const result = await db.insert(staff).values(staffList).returning();
    return result;
  }

  async bulkCreateClients(clientList: InsertClient[]): Promise<Client[]> {
    const result = await db.insert(clients).values(clientList).returning();
    return result;
  }

  // Statistics and dashboard data
  async getDashboardStats() {
    const [totalStaff, totalClients, totalWeeklyDocs, totalMonthlyReports] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(staff).where(eq(staff.deletedAt, null)),
      db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.deletedAt, null)),
      db.select({ count: sql<number>`count(*)` }).from(weeklyDocumentation),
      db.select({ count: sql<number>`count(*)` }).from(monthlyReports),
    ]);

    return {
      totalStaff: totalStaff[0]?.count || 0,
      totalClients: totalClients[0]?.count || 0,
      totalWeeklyDocs: totalWeeklyDocs[0]?.count || 0,
      totalMonthlyReports: totalMonthlyReports[0]?.count || 0,
    };
  }

  async getWeeklyDocumentationStats(year: number, week: number) {
    const result = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${weeklyDocumentation.approved} = true)`,
        pending: sql<number>`count(*) filter (where ${weeklyDocumentation.approved} = false)`,
      })
      .from(weeklyDocumentation)
      .where(and(eq(weeklyDocumentation.year, year), eq(weeklyDocumentation.week, week)));

    return result[0] || { total: 0, completed: 0, pending: 0 };
  }
}

export const databaseService = new DatabaseService();