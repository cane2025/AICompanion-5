import { db } from "./db.js";
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
} from "../shared/schema.js";
import { eq, and, isNull, desc, asc, or, ilike, gte, lte, sql } from "drizzle-orm";
import type { IStorage } from "./storage.js";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserPassword(
    userId: string,
    newPasswordHash: string
  ): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Staff operations
  async getAllStaff(): Promise<Staff[]> {
    return await db
      .select()
      .from(staff)
      .where(isNull(staff.deletedAt))
      .orderBy(asc(staff.name));
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const result = await db
      .select()
      .from(staff)
      .where(and(eq(staff.id, id), isNull(staff.deletedAt)))
      .limit(1);
    return result[0];
  }

  async getStaffByName(name: string): Promise<Staff | undefined> {
    const result = await db
      .select()
      .from(staff)
      .where(and(eq(staff.name, name), isNull(staff.deletedAt)))
      .limit(1);
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
      .where(and(eq(staff.id, id), isNull(staff.deletedAt)))
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
    return await db
      .select()
      .from(clients)
      .where(isNull(clients.deletedAt))
      .orderBy(asc(clients.initials));
  }

  async getClientsByStaffId(staffId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(and(eq(clients.staffId, staffId), isNull(clients.deletedAt)))
      .orderBy(asc(clients.initials));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
      .limit(1);
    return result[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: string, updates: UpdateClient): Promise<Client | undefined> {
    const result = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
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

  // Weekly Documentation
  async getAllWeeklyDocumentation(): Promise<WeeklyDocumentation[]> {
    return await db
      .select()
      .from(weeklyDocumentation)
      .orderBy(desc(weeklyDocumentation.year), desc(weeklyDocumentation.week));
  }

  async getWeeklyDocumentationByClient(clientId: string): Promise<WeeklyDocumentation[]> {
    return await db
      .select()
      .from(weeklyDocumentation)
      .where(eq(weeklyDocumentation.clientId, clientId))
      .orderBy(desc(weeklyDocumentation.year), desc(weeklyDocumentation.week));
  }

  async getWeeklyDocumentationByStaff(staffId: string): Promise<WeeklyDocumentation[]> {
    return await db
      .select()
      .from(weeklyDocumentation)
      .where(eq(weeklyDocumentation.staffId, staffId))
      .orderBy(desc(weeklyDocumentation.year), desc(weeklyDocumentation.week));
  }

  async getWeeklyDocumentation(id: string): Promise<WeeklyDocumentation | undefined> {
    const result = await db
      .select()
      .from(weeklyDocumentation)
      .where(eq(weeklyDocumentation.id, id))
      .limit(1);
    return result[0];
  }

  async getWeeklyDocumentationByWeek(
    clientId: string,
    year: number,
    week: number
  ): Promise<WeeklyDocumentation | undefined> {
    const result = await db
      .select()
      .from(weeklyDocumentation)
      .where(
        and(
          eq(weeklyDocumentation.clientId, clientId),
          eq(weeklyDocumentation.year, year),
          eq(weeklyDocumentation.week, week)
        )
      )
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

  async deleteWeeklyDocumentation(id: string): Promise<boolean> {
    const result = await db
      .delete(weeklyDocumentation)
      .where(eq(weeklyDocumentation.id, id))
      .returning();
    return result.length > 0;
  }

  // Monthly Reports
  async getAllMonthlyReports(): Promise<MonthlyReport[]> {
    return await db
      .select()
      .from(monthlyReports)
      .orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
  }

  async getMonthlyReportsByClient(clientId: string): Promise<MonthlyReport[]> {
    return await db
      .select()
      .from(monthlyReports)
      .where(eq(monthlyReports.clientId, clientId))
      .orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
  }

  async getMonthlyReportsByStaff(staffId: string): Promise<MonthlyReport[]> {
    return await db
      .select()
      .from(monthlyReports)
      .where(eq(monthlyReports.staffId, staffId))
      .orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
  }

  async getMonthlyReport(id: string): Promise<MonthlyReport | undefined> {
    const result = await db
      .select()
      .from(monthlyReports)
      .where(eq(monthlyReports.id, id))
      .limit(1);
    return result[0];
  }

  async getMonthlyReportByMonth(
    clientId: string,
    year: number,
    month: number
  ): Promise<MonthlyReport | undefined> {
    const result = await db
      .select()
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.clientId, clientId),
          eq(monthlyReports.year, year),
          eq(monthlyReports.month, month)
        )
      )
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

  async deleteMonthlyReport(id: string): Promise<boolean> {
    const result = await db
      .delete(monthlyReports)
      .where(eq(monthlyReports.id, id))
      .returning();
    return result.length > 0;
  }

  // Care Plans
  async getAllCarePlans(): Promise<CarePlan[]> {
    return await db
      .select()
      .from(carePlans)
      .orderBy(desc(carePlans.createdAt));
  }

  async getCarePlansByClient(clientId: string): Promise<CarePlan[]> {
    return await db
      .select()
      .from(carePlans)
      .where(eq(carePlans.clientId, clientId))
      .orderBy(desc(carePlans.createdAt));
  }

  async getCarePlansByStaff(staffId: string): Promise<CarePlan[]> {
    return await db
      .select()
      .from(carePlans)
      .where(eq(carePlans.staffId, staffId))
      .orderBy(desc(carePlans.createdAt));
  }

  async getCarePlan(id: string): Promise<CarePlan | undefined> {
    const result = await db
      .select()
      .from(carePlans)
      .where(eq(carePlans.id, id))
      .limit(1);
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
    const result = await db
      .delete(carePlans)
      .where(eq(carePlans.id, id))
      .returning();
    return result.length > 0;
  }

  // Implementation Plans
  async getAllImplementationPlans(): Promise<ImplementationPlan[]> {
    return await db
      .select()
      .from(implementationPlans)
      .orderBy(desc(implementationPlans.createdAt));
  }

  async getImplementationPlansByClient(clientId: string): Promise<ImplementationPlan[]> {
    return await db
      .select()
      .from(implementationPlans)
      .where(eq(implementationPlans.clientId, clientId))
      .orderBy(desc(implementationPlans.createdAt));
  }

  async getImplementationPlansByStaff(staffId: string): Promise<ImplementationPlan[]> {
    return await db
      .select()
      .from(implementationPlans)
      .where(eq(implementationPlans.staffId, staffId))
      .orderBy(desc(implementationPlans.createdAt));
  }

  async getImplementationPlan(id: string): Promise<ImplementationPlan | undefined> {
    const result = await db
      .select()
      .from(implementationPlans)
      .where(eq(implementationPlans.id, id))
      .limit(1);
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
    const result = await db
      .delete(implementationPlans)
      .where(eq(implementationPlans.id, id))
      .returning();
    return result.length > 0;
  }

  // Vimsa Time
  async getAllVimsaTime(): Promise<VimsaTime[]> {
    return await db
      .select()
      .from(vimsaTime)
      .orderBy(desc(vimsaTime.year), desc(vimsaTime.week));
  }

  async getVimsaTimeByClient(clientId: string): Promise<VimsaTime[]> {
    return await db
      .select()
      .from(vimsaTime)
      .where(eq(vimsaTime.clientId, clientId))
      .orderBy(desc(vimsaTime.year), desc(vimsaTime.week));
  }

  async getVimsaTimeByStaff(staffId: string): Promise<VimsaTime[]> {
    return await db
      .select()
      .from(vimsaTime)
      .where(eq(vimsaTime.staffId, staffId))
      .orderBy(desc(vimsaTime.year), desc(vimsaTime.week));
  }

  async getVimsaTime(id: string): Promise<VimsaTime | undefined> {
    const result = await db
      .select()
      .from(vimsaTime)
      .where(eq(vimsaTime.id, id))
      .limit(1);
    return result[0];
  }

  async getVimsaTimeByWeek(
    clientId: string,
    year: number,
    week: number
  ): Promise<VimsaTime | undefined> {
    const result = await db
      .select()
      .from(vimsaTime)
      .where(
        and(
          eq(vimsaTime.clientId, clientId),
          eq(vimsaTime.year, year),
          eq(vimsaTime.week, week)
        )
      )
      .limit(1);
    return result[0];
  }

  async createVimsaTime(time: InsertVimsaTime): Promise<VimsaTime> {
    const result = await db.insert(vimsaTime).values(time).returning();
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
    const result = await db
      .delete(vimsaTime)
      .where(eq(vimsaTime.id, id))
      .returning();
    return result.length > 0;
  }

  // Advanced search functionality
  async searchStaff(query: string): Promise<Staff[]> {
    return await db
      .select()
      .from(staff)
      .where(
        and(
          isNull(staff.deletedAt),
          or(
            ilike(staff.name, `%${query}%`),
            ilike(staff.initials, `%${query}%`),
            ilike(staff.epost, `%${query}%`),
            ilike(staff.telefon, `%${query}%`)
          )
        )
      )
      .orderBy(asc(staff.name));
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        and(
          isNull(clients.deletedAt),
          or(
            ilike(clients.initials, `%${query}%`),
            ilike(clients.personalNumber, `%${query}%`),
            ilike(clients.notes, `%${query}%`)
          )
        )
      )
      .orderBy(asc(clients.initials));
  }

  // Bulk operations
  async bulkCreateStaff(staffList: InsertStaff[]): Promise<Staff[]> {
    if (staffList.length === 0) return [];
    const result = await db.insert(staff).values(staffList).returning();
    return result;
  }

  async bulkCreateClients(clientList: InsertClient[]): Promise<Client[]> {
    if (clientList.length === 0) return [];
    const result = await db.insert(clients).values(clientList).returning();
    return result;
  }

  async bulkDeleteStaff(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    const result = await db
      .update(staff)
      .set({ deletedAt: new Date() })
      .where(
        or(...ids.map(id => eq(staff.id, id)))
      )
      .returning();
    return result.length === ids.length;
  }

  async bulkDeleteClients(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    const result = await db
      .update(clients)
      .set({ deletedAt: new Date() })
      .where(
        or(...ids.map(id => eq(clients.id, id)))
      )
      .returning();
    return result.length === ids.length;
  }

  // Statistical queries for dashboard
  async getStatistics() {
    const [staffCount] = await db
      .select({ count: sql`count(*)` })
      .from(staff)
      .where(isNull(staff.deletedAt));

    const [clientCount] = await db
      .select({ count: sql`count(*)` })
      .from(clients)
      .where(isNull(clients.deletedAt));

    const [weeklyDocCount] = await db
      .select({ count: sql`count(*)` })
      .from(weeklyDocumentation);

    const [monthlyReportCount] = await db
      .select({ count: sql`count(*)` })
      .from(monthlyReports);

    const [carePlanCount] = await db
      .select({ count: sql`count(*)` })
      .from(carePlans)
      .where(eq(carePlans.isActive, true));

    const [implementationPlanCount] = await db
      .select({ count: sql`count(*)` })
      .from(implementationPlans)
      .where(eq(implementationPlans.isActive, true));

    return {
      totalStaff: Number(staffCount?.count ?? 0),
      totalClients: Number(clientCount?.count ?? 0),
      totalWeeklyDocumentations: Number(weeklyDocCount?.count ?? 0),
      totalMonthlyReports: Number(monthlyReportCount?.count ?? 0),
      activeCarePlans: Number(carePlanCount?.count ?? 0),
      activeImplementationPlans: Number(implementationPlanCount?.count ?? 0),
    };
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10) {
    const recentDocs = await db
      .select()
      .from(weeklyDocumentation)
      .orderBy(desc(weeklyDocumentation.updatedAt))
      .limit(limit);

    const recentReports = await db
      .select()
      .from(monthlyReports)
      .orderBy(desc(monthlyReports.updatedAt))
      .limit(limit);

    const recentCarePlans = await db
      .select()
      .from(carePlans)
      .orderBy(desc(carePlans.updatedAt))
      .limit(limit);

    return {
      recentDocumentations: recentDocs,
      recentReports: recentReports,
      recentCarePlans: recentCarePlans,
    };
  }
}

// Export a singleton instance
export const dbStorage = new DatabaseStorage();
