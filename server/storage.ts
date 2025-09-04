import {
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
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { join } from "path";

export interface IStorage {
  // User operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(
    userId: string,
    newPasswordHash: string
  ): Promise<User | undefined>;

  // Staff operations
  getAllStaff(): Promise<Staff[]>;
  getStaff(id: string): Promise<Staff | undefined>;
  getStaffByName(name: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, updates: UpdateStaff): Promise<Staff | undefined>;
  deleteStaff(id: string): Promise<boolean>;

  // Client operations
  getAllClients(): Promise<Client[]>;
  getClientsByStaffId(staffId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: UpdateClient): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Weekly documentation operations
  getAllWeeklyDocumentation(): Promise<WeeklyDocumentation[]>;
  getWeeklyDocumentation(
    clientId: string,
    year: number,
    week: number
  ): Promise<WeeklyDocumentation | undefined>;
  createWeeklyDocumentation(
    doc: InsertWeeklyDocumentation
  ): Promise<WeeklyDocumentation>;
  updateWeeklyDocumentation(
    id: string,
    updates: UpdateWeeklyDocumentation
  ): Promise<WeeklyDocumentation | undefined>;

  // Monthly report operations
  getAllMonthlyReports(): Promise<MonthlyReport[]>;
  getMonthlyReport(
    clientId: string,
    year: number,
    month: number
  ): Promise<MonthlyReport | undefined>;
  createMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport>;
  updateMonthlyReport(
    id: string,
    updates: UpdateMonthlyReport
  ): Promise<MonthlyReport | undefined>;

  // Care plan operations
  getAllCarePlans(): Promise<CarePlan[]>;
  getCarePlan(clientId: string): Promise<CarePlan | undefined>;
  createCarePlan(plan: InsertCarePlan): Promise<CarePlan>;
  updateCarePlan(
    id: string,
    updates: UpdateCarePlan
  ): Promise<CarePlan | undefined>;
  deleteCarePlan(id: string): Promise<boolean>;

  // Implementation plan operations
  getAllImplementationPlans(): Promise<ImplementationPlan[]>;
  getImplementationPlan(
    clientId: string
  ): Promise<ImplementationPlan | undefined>;
  createImplementationPlan(
    plan: InsertImplementationPlan
  ): Promise<ImplementationPlan>;
  updateImplementationPlan(
    id: string,
    updates: UpdateImplementationPlan
  ): Promise<ImplementationPlan | undefined>;
  deleteImplementationPlan(id: string): Promise<boolean>;

  // Vimsa time operations
  getAllVimsaTime(): Promise<VimsaTime[]>;
  getVimsaTime(
    clientId: string,
    year: number,
    week: number
  ): Promise<VimsaTime | undefined>;
  createVimsaTime(time: InsertVimsaTime): Promise<VimsaTime>;
  updateVimsaTime(
    id: string,
    updates: UpdateVimsaTime
  ): Promise<VimsaTime | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private staff: Map<string, Staff>;
  private clients: Map<string, Client>;
  private weeklyDocumentation: Map<string, WeeklyDocumentation>;
  private monthlyReports: Map<string, MonthlyReport>;
  private carePlans: Map<string, CarePlan>;
  private implementationPlans: Map<string, ImplementationPlan>;
  private vimsaTime: Map<string, VimsaTime>;
  private backupTimer: NodeJS.Timer | null = null;
  private readonly backupPath: string;
  private lastBackupTime: Date | null = null;

  constructor() {
    this.users = new Map();
    this.staff = new Map();
    this.clients = new Map();
    this.weeklyDocumentation = new Map();
    this.monthlyReports = new Map();
    this.carePlans = new Map();
    this.implementationPlans = new Map();
    this.vimsaTime = new Map();
    
    this.backupPath = join(process.cwd(), "server", "data");
    
    this.initializeDefaultData();
    this.loadFromBackup().catch(console.error);
    this.startBackupScheduler();
  }

  private async initializeDefaultData() {
    // Create default admin user
    try {
      const bcrypt = await import("bcryptjs");
      const adminPasswordHash = await bcrypt.default.hash("admin123", 12);

      const adminUser: User = {
        id: randomUUID(),
        username: "admin",
        email: "admin@ungdoms.se",
        passwordHash: adminPasswordHash,
        role: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(adminUser.id, adminUser);
    } catch (error) {
      console.error("Failed to create default admin user:", error);
    }

    // Initialize default staff
    this.initializeDefaultStaff();
  }

  // Backup and restore functionality
  private async createBackup(): Promise<void> {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupPath, { recursive: true });

      const backupData = {
        timestamp: new Date().toISOString(),
        data: {
          users: Array.from(this.users.entries()),
          staff: Array.from(this.staff.entries()),
          clients: Array.from(this.clients.entries()),
          weeklyDocumentation: Array.from(this.weeklyDocumentation.entries()),
          monthlyReports: Array.from(this.monthlyReports.entries()),
          carePlans: Array.from(this.carePlans.entries()),
          implementationPlans: Array.from(this.implementationPlans.entries()),
          vimsaTime: Array.from(this.vimsaTime.entries()),
        },
      };

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = join(this.backupPath, `backup-${timestamp}.json`);
      const currentBackupFile = join(this.backupPath, 'current-backup.json');

      // Write timestamped backup
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
      
      // Write current backup (for easy restoration)
      await fs.writeFile(currentBackupFile, JSON.stringify(backupData, null, 2));

      this.lastBackupTime = new Date();
      console.log(`✅ Backup created: ${backupFile}`);

      // Clean old backups (keep last 10)
      await this.cleanOldBackups();
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first

      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        for (const file of filesToDelete) {
          await fs.unlink(join(this.backupPath, file));
          console.log(`🗑️ Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to clean old backups:', error);
    }
  }

  private async loadFromBackup(): Promise<void> {
    try {
      const currentBackupFile = join(this.backupPath, 'current-backup.json');
      
      try {
        await fs.access(currentBackupFile);
      } catch {
        console.log('📁 No existing backup found, starting with fresh data');
        return;
      }

      const backupContent = await fs.readFile(currentBackupFile, 'utf-8');
      const backup = JSON.parse(backupContent);

      if (backup.data) {
        // Restore data from backup
        this.users = new Map(backup.data.users || []);
        this.staff = new Map(backup.data.staff || []);
        this.clients = new Map(backup.data.clients || []);
        this.weeklyDocumentation = new Map(backup.data.weeklyDocumentation || []);
        this.monthlyReports = new Map(backup.data.monthlyReports || []);
        this.carePlans = new Map(backup.data.carePlans || []);
        this.implementationPlans = new Map(backup.data.implementationPlans || []);
        this.vimsaTime = new Map(backup.data.vimsaTime || []);

        console.log(`✅ Data restored from backup: ${backup.timestamp}`);
        console.log(`📊 Restored: ${this.staff.size} staff, ${this.clients.size} clients, ${this.implementationPlans.size} GFP plans`);
      }
    } catch (error) {
      console.error('❌ Failed to load from backup:', error);
      console.log('🔄 Continuing with fresh data');
    }
  }

  private startBackupScheduler(): void {
    // Create backup every 5 minutes
    this.backupTimer = setInterval(() => {
      this.createBackup().catch(console.error);
    }, 5 * 60 * 1000);

    // Create initial backup after 30 seconds
    setTimeout(() => {
      this.createBackup().catch(console.error);
    }, 30 * 1000);
  }

  // Method to trigger manual backup
  public async forceBackup(): Promise<void> {
    await this.createBackup();
  }

  // Method to get backup status
  public getBackupStatus(): { lastBackup: Date | null; backupPath: string } {
    return {
      lastBackup: this.lastBackupTime,
      backupPath: this.backupPath,
    };
  }

  // Schedule backup with debouncing to avoid too frequent backups
  private backupDebounceTimer: NodeJS.Timeout | null = null;
  private scheduleBackup(): void {
    // Clear existing timer
    if (this.backupDebounceTimer) {
      clearTimeout(this.backupDebounceTimer);
    }

    // Schedule backup after 30 seconds of inactivity
    this.backupDebounceTimer = setTimeout(() => {
      this.createBackup().catch(console.error);
    }, 30 * 1000);
  }

  // User operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      username: userData.username,
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role || "user",
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  private getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  }

  private initializeDefaultStaff() {
    const defaultStaffNames = [
      "Afif Derbas",
      "Ahmed Alrakabi",
      "Ahmed Ramadan",
      "Ajmen Rafiq",
      "Alana Salah",
      "Alharis Albayati",
      "Amir Al-istarabadi",
      "Anjelika Bååth",
      "Bashdar Reza",
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
      "Kaoula Channoufi",
      "Kim Torneus",
      "Lejla Kocacik",
      "Michelle Nilsson",
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

    defaultStaffNames.forEach((name) => {
      const id = randomUUID();
          const staff: Staff = {
      id,
      name,
      fullName: name,
      initials: this.getInitials(name),
      telefon: null,
      epost: null,
      adress: null,
      anställningsdatum: null,
      roll: null,
      avdelning: null,
      weeklyCapacityHours: 40,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
      this.staff.set(id, staff);
    });
  }

  // Staff operations
  async getAllStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async getStaffByName(name: string): Promise<Staff | undefined> {
    return Array.from(this.staff.values()).find((staff) => staff.name === name);
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const id = randomUUID();
    const staff: Staff = {
      id,
      name: insertStaff.name,
      fullName: insertStaff.fullName || insertStaff.name,
      initials: insertStaff.initials,
      telefon: insertStaff.telefon || null,
      epost: insertStaff.epost || null,
      adress: insertStaff.adress || null,
      anställningsdatum: insertStaff.anställningsdatum || null,
      roll: insertStaff.roll || null,
      avdelning: insertStaff.avdelning || null,
      weeklyCapacityHours: insertStaff.weeklyCapacityHours || 40,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.staff.set(id, staff);
    return staff;
  }

  async updateStaff(
    id: string,
    updates: UpdateStaff
  ): Promise<Staff | undefined> {
    const existing = this.staff.get(id);
    if (!existing) return undefined;

    const updated: Staff = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.staff.set(id, updated);
    return updated;
  }

  async deleteStaff(id: string): Promise<boolean> {
    // Update all clients that have this staff member assigned
    const allClients = Array.from(this.clients.values());
    for (const client of allClients) {
      if (client.staffId === id) {
        const updated = {
          ...client,
          staffId: 'unassigned',
          updatedAt: new Date()
        };
        this.clients.set(client.id, updated);
      }
    }
    
    // Update all care plans that have this staff member as responsible
    const allCarePlans = Array.from(this.carePlans.values());
    for (const plan of allCarePlans) {
      if (plan.staffId === id || plan.responsibleId === id) {
        const updated = {
          ...plan,
          staffId: plan.staffId === id ? 'unassigned' : plan.staffId,
          responsibleId: plan.responsibleId === id ? 'unassigned' : plan.responsibleId,
          updatedAt: new Date()
        };
        this.carePlans.set(plan.id, updated);
      }
    }
    
    // Update all implementation plans
    const allImplPlans = Array.from(this.implementationPlans.values());
    for (const plan of allImplPlans) {
      if (plan.staffId === id) {
        const updated = {
          ...plan,
          staffId: 'unassigned',
          updatedAt: new Date()
        };
        this.implementationPlans.set(plan.id, updated);
      }
    }
    
    return this.staff.delete(id);
  }

  // Client operations
  async getClientsByStaffId(staffId: string): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter((client) => client.staffId === staffId)
      .sort((a, b) => a.initials.localeCompare(b.initials));
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      id,
      initials: insertClient.initials,
      staffId: insertClient.staffId,
      notes: insertClient.notes || "",
      status: insertClient.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(
    id: string,
    updates: UpdateClient
  ): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;

    const updated: Client = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  // Weekly documentation operations
  async getWeeklyDocumentation(
    clientId: string,
    year: number,
    week: number
  ): Promise<WeeklyDocumentation | undefined> {
    return Array.from(this.weeklyDocumentation.values()).find(
      (doc) =>
        doc.clientId === clientId && doc.year === year && doc.week === week
    );
  }

  async createWeeklyDocumentation(
    insertDoc: InsertWeeklyDocumentation
  ): Promise<WeeklyDocumentation> {
    const id = randomUUID();
    const doc: WeeklyDocumentation = {
      id,
      clientId: insertDoc.clientId,
      staffId: insertDoc.staffId,
      year: insertDoc.year,
      week: insertDoc.week,
      content: insertDoc.content || null,
      mondayStatus: insertDoc.mondayStatus || null,
      tuesdayStatus: insertDoc.tuesdayStatus || null,
      wednesdayStatus: insertDoc.wednesdayStatus || null,
      thursdayStatus: insertDoc.thursdayStatus || null,
      fridayStatus: insertDoc.fridayStatus || null,
      saturdayStatus: insertDoc.saturdayStatus || null,
      sundayStatus: insertDoc.sundayStatus || null,
      mondayDocumented:
        insertDoc.mondayDocumented !== undefined
          ? insertDoc.mondayDocumented
          : false,
      tuesdayDocumented:
        insertDoc.tuesdayDocumented !== undefined
          ? insertDoc.tuesdayDocumented
          : false,
      wednesdayDocumented:
        insertDoc.wednesdayDocumented !== undefined
          ? insertDoc.wednesdayDocumented
          : false,
      thursdayDocumented:
        insertDoc.thursdayDocumented !== undefined
          ? insertDoc.thursdayDocumented
          : false,
      fridayDocumented:
        insertDoc.fridayDocumented !== undefined
          ? insertDoc.fridayDocumented
          : false,
      saturdayDocumented:
        insertDoc.saturdayDocumented !== undefined
          ? insertDoc.saturdayDocumented
          : false,
      sundayDocumented:
        insertDoc.sundayDocumented !== undefined
          ? insertDoc.sundayDocumented
          : false,
      documentation: insertDoc.documentation || null,
      approved: insertDoc.approved !== undefined ? insertDoc.approved : false,
      comments: insertDoc.comments || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      qualityAssessment: insertDoc.qualityAssessment ?? null, // synced: nullable default
    };
    this.weeklyDocumentation.set(id, doc);
    return doc;
  }

  async updateWeeklyDocumentation(
    id: string,
    updates: UpdateWeeklyDocumentation
  ): Promise<WeeklyDocumentation | undefined> {
    const existing = this.weeklyDocumentation.get(id);
    if (!existing) return undefined;

    const updated: WeeklyDocumentation = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.weeklyDocumentation.set(id, updated);
    return updated;
  }

  // Monthly report operations
  async getMonthlyReport(
    clientId: string,
    year: number,
    month: number
  ): Promise<MonthlyReport | undefined> {
    return Array.from(this.monthlyReports.values()).find(
      (report) => report.year === year && report.month === month
    );
  }

  async createMonthlyReport(
    insertReport: InsertMonthlyReport
  ): Promise<MonthlyReport> {
    const id = randomUUID();
    const report: MonthlyReport = {
      id,
      clientId: insertReport.clientId,
      staffId: insertReport.staffId,
      year: insertReport.year,
      month: insertReport.month,
      content: insertReport.content || null,
      reportContent: insertReport.reportContent || null,
      status: insertReport.status || null,
      comment: insertReport.comment || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      quality: insertReport.quality ?? null, // synced: nullable default
      submissionDate: insertReport.submissionDate ?? null, // explicit null default
    };
    this.monthlyReports.set(id, report);
    return report;
  }

  async updateMonthlyReport(
    id: string,
    updates: UpdateMonthlyReport
  ): Promise<MonthlyReport | undefined> {
    const existing = this.monthlyReports.get(id);
    if (!existing) return undefined;

    const updated: MonthlyReport = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.monthlyReports.set(id, updated);
    return updated;
  }

  // Care plan operations
  async getCarePlan(clientId: string): Promise<CarePlan | undefined> {
    return Array.from(this.carePlans.values()).find(
      (plan) => plan.clientId === clientId
    );
  }

  async createCarePlan(insertPlan: InsertCarePlan): Promise<CarePlan> {
    const id = randomUUID();
    const plan: CarePlan = {
      id,
      clientId: insertPlan.clientId,
      staffId: insertPlan.staffId,
      responsibleId: (insertPlan as any).responsibleId || null,
      planContent: insertPlan.planContent || null,
      goals: insertPlan.goals || null,
      interventions: insertPlan.interventions || null,
      evaluationCriteria: insertPlan.evaluationCriteria || null,
      receivedDate: insertPlan.receivedDate || null,
      enteredJournalDate: insertPlan.enteredJournalDate || null,
      staffNotifiedDate: insertPlan.staffNotifiedDate || null,
      status: insertPlan.status || "received",
      isActive: insertPlan.isActive ?? true,
      comment: insertPlan.comment || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.carePlans.set(id, plan);
    return plan;
  }

  async updateCarePlan(
    id: string,
    updates: UpdateCarePlan
  ): Promise<CarePlan | undefined> {
    const existing = this.carePlans.get(id);
    if (!existing) return undefined;

    const updated: CarePlan = {
      ...existing,
      ...updates,
      responsibleId:
        (updates as any).responsibleId !== undefined
          ? (updates as any).responsibleId
          : existing.responsibleId,
      updatedAt: new Date(),
    };
    this.carePlans.set(id, updated);
    return updated;
  }

  async deleteCarePlan(id: string): Promise<boolean> {
    return this.carePlans.delete(id);
  }

  // Implementation plan operations
  async getImplementationPlan(
    clientId: string
  ): Promise<ImplementationPlan | undefined> {
    return Array.from(this.implementationPlans.values()).find(
      (plan) => plan.clientId === clientId
    );
  }

  async getImplementationPlanById(
    id: string
  ): Promise<ImplementationPlan | undefined> {
    return this.implementationPlans.get(id);
  }

  async createImplementationPlan(
    insertPlan: InsertImplementationPlan
  ): Promise<ImplementationPlan> {
    const id = randomUUID();
    const plan: ImplementationPlan = {
      id,
      clientId: insertPlan.clientId,
      staffId: insertPlan.staffId,
      carePlanId: insertPlan.carePlanId || null,
      title: insertPlan.title || "", // New field for GFP
      planContent: insertPlan.planContent || null,
      goals: insertPlan.goals || null,
      activities: insertPlan.activities || null,
      followUpSchedule: insertPlan.followUpSchedule || null,
      status: insertPlan.status || "pending",
      isActive: insertPlan.isActive !== undefined ? insertPlan.isActive : true,
      followup1: insertPlan.followup1 || false,
      followup2: insertPlan.followup2 || false,
      createdDate: insertPlan.createdDate || new Date(),
      comments: insertPlan.comments || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: insertPlan.dueDate || null,
      completedDate: insertPlan.completedDate || null,
      sentDate: insertPlan.sentDate || null,
      planType: insertPlan.planType || "care", // synced default
      version: insertPlan.version || 1, // New field for optimistic concurrency
      locked: insertPlan.locked || false, // New field for lock functionality
    };
    this.implementationPlans.set(id, plan);
    
    // Trigger backup on important data changes
    this.scheduleBackup();
    
    return plan;
  }

  async updateImplementationPlan(
    id: string,
    updates: UpdateImplementationPlan
  ): Promise<ImplementationPlan | undefined> {
    const existing = this.implementationPlans.get(id);
    if (!existing) return undefined;

    const updated: ImplementationPlan = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.implementationPlans.set(id, updated);
    
    // Trigger backup on important data changes
    this.scheduleBackup();
    
    return updated;
  }

  async deleteImplementationPlan(id: string): Promise<boolean> {
    const result = this.implementationPlans.delete(id);
    if (result) {
      // Trigger backup on important data changes
      this.scheduleBackup();
    }
    return result;
  }

  // Vimsa time operations
  async getVimsaTime(
    clientId: string,
    year: number,
    week: number
  ): Promise<VimsaTime | undefined> {
    return Array.from(this.vimsaTime.values()).find(
      (time) =>
        time.clientId === clientId && time.year === year && time.week === week
    );
  }

  async createVimsaTime(insertTime: InsertVimsaTime): Promise<VimsaTime> {
    const id = randomUUID();
    const time: VimsaTime = {
      id,
      clientId: insertTime.clientId,
      staffId: insertTime.staffId,
      year: insertTime.year,
      week: insertTime.week,
      monday: insertTime.monday || 0,
      tuesday: insertTime.tuesday || 0,
      wednesday: insertTime.wednesday || 0,
      thursday: insertTime.thursday || 0,
      friday: insertTime.friday || 0,
      saturday: insertTime.saturday || 0,
      sunday: insertTime.sunday || 0,
      totalHours: insertTime.totalHours || 0,
      status: insertTime.status || null,
      approved: insertTime.approved || false,
      comments: insertTime.comments || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      matchesDocumentation: insertTime.matchesDocumentation ?? false, // ensured default false
      hoursWorked: insertTime.hoursWorked ?? 0, // ensured default 0
    };
    this.vimsaTime.set(id, time);
    return time;
  }

  async updateVimsaTime(
    id: string,
    updates: UpdateVimsaTime
  ): Promise<VimsaTime | undefined> {
    const existing = this.vimsaTime.get(id);
    if (!existing) return undefined;

    const updated: VimsaTime = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.vimsaTime.set(id, updated);
    return updated;
  }

  // Get all care plans
  async getAllCarePlans(): Promise<CarePlan[]> {
    return Array.from(this.carePlans.values());
  }

  // Get all implementation plans
  async getAllImplementationPlans(): Promise<ImplementationPlan[]> {
    return Array.from(this.implementationPlans.values());
  }

  // Get all weekly documentation
  async getAllWeeklyDocumentation(): Promise<WeeklyDocumentation[]> {
    return Array.from(this.weeklyDocumentation.values());
  }

  // Get all monthly reports
  async getAllMonthlyReports(): Promise<MonthlyReport[]> {
    return Array.from(this.monthlyReports.values());
  }

  // Get all Vimsa time data
  async getAllVimsaTime(): Promise<VimsaTime[]> {
    return Array.from(this.vimsaTime.values());
  }

  // Update user password
  async updateUserPassword(
    userId: string,
    newPasswordHash: string
  ): Promise<User | undefined> {
    const existing = this.users.get(userId);
    if (!existing) return undefined;

    const updated: User = {
      ...existing,
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    };
    this.users.set(userId, updated);
    return updated;
  }
}

export const storage = new MemStorage();
