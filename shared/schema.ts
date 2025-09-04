import { pgTable, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  role: varchar("role").notNull().default("staff"), // admin, staff, viewer
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff table - uppdaterad enligt spec
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  role: varchar("role"), // optional role
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table - uppdaterad enligt spec (inga personnummer)
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayCode: varchar("display_code").notNull(), // t.ex. initialer (ej personnummer)
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly documentation - ny struktur med dagvy
export const weeklyDocumentation = pgTable("weekly_documentation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  year: integer("year").notNull(),
  week: integer("week").notNull(),
  days: text("days").default("{}"), // JSON med mon, tue, wed, thu, fri, sat, sun
  // sammanfattande status fält för snabb listvy
  documented: boolean("documented").default(false).notNull(), // minst en dag markerad dokumenterad
  qualityApproved: boolean("quality_approved").default(false).notNull(), // godkänd kvalitet för veckan
  onTime: boolean("on_time").default(true).notNull(), // ej försenad
  delayed: boolean("delayed").default(false).notNull(), // ifall inrapporterad efter deadline
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly reports
export const monthlyReports = pgTable("monthly_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  content: text("content").default(""),
  reportContent: text("report_content").default(""),
  status: varchar("status").default("not_started"), // not_started, in_progress, completed
  comment: text("comment").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  quality: varchar("quality").default("pending"), // quality evaluation
  submissionDate: timestamp("submission_date"), // date of submission
});

// Care plans - versionsbara per klient
export const carePlans = pgTable("care_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  index: integer("index").notNull(), // 1,2,3... per klient. Ny vårdplan => index++
  receivedDate: varchar("received_date").notNull(), // ISO date
  enteredToJournalDate: varchar("entered_to_journal_date"), // ISO
  status: varchar("status").notNull().default("Mottagen"), // 'Mottagen' | 'Aktiv' | 'Avslutad'
  assignedStaffId: varchar("assigned_staff_id"), // ansvarig personal
  content: text("content"), // rik text eller JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Implementation plans (GFP) - versionsbara per klient
export const implementationPlans = pgTable("implementation_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  carePlanIndex: integer("care_plan_index").notNull(), // refererar till CarePlan.index
  index: integer("index").notNull(), // 1,2,3... per klient. Ny GFP => index++
  status: varchar("status").notNull().default("Väntar"), // 'Väntar' | 'Aktiv' | 'Slutförd'
  dueDate: varchar("due_date"), // förfallodatum (ISO)
  completedDate: varchar("completed_date"), // slutförd (ISO)
  sentDate: varchar("sent_date"), // skickad (ISO)
  followUps: text("follow_ups").default("[]"), // JSON array med max 5 uppföljningar
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff weekly statistics - för rapporter
export const staffWeeklyStats = pgTable("staff_weekly_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(),
  year: integer("year").notNull(),
  week: integer("week").notNull(),
  documentedCount: integer("documented_count").default(0), // antal klient-dagar markerade
  delayedCount: integer("delayed_count").default(0),
  notApprovedCount: integer("not_approved_count").default(0), // ej qualityApproved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3, "Användarnamn måste vara minst 3 tecken"),
  password: z.string().min(6, "Lösenord måste vara minst 6 tecken"),
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyDocumentationSchema = createInsertSchema(weeklyDocumentation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyReportSchema = createInsertSchema(monthlyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCarePlanSchema = createInsertSchema(carePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImplementationPlanSchema = createInsertSchema(implementationPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffWeeklyStatsSchema = createInsertSchema(staffWeeklyStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schemas
export const updateStaffSchema = insertStaffSchema.partial();
export const updateClientSchema = insertClientSchema.partial();
export const updateWeeklyDocumentationSchema = insertWeeklyDocumentationSchema.partial();
export const updateMonthlyReportSchema = insertMonthlyReportSchema.partial();
export const updateCarePlanSchema = insertCarePlanSchema.partial();
export const updateImplementationPlanSchema = insertImplementationPlanSchema.partial();
export const updateStaffWeeklyStatsSchema = insertStaffWeeklyStatsSchema.partial();

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type UpdateStaff = z.infer<typeof updateStaffSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;

export type WeeklyDocumentation = typeof weeklyDocumentation.$inferSelect;
export type InsertWeeklyDocumentation = z.infer<typeof insertWeeklyDocumentationSchema>;
export type UpdateWeeklyDocumentation = z.infer<typeof updateWeeklyDocumentationSchema>;

export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
export type UpdateMonthlyReport = z.infer<typeof updateMonthlyReportSchema>;

export type CarePlan = typeof carePlans.$inferSelect;
export type InsertCarePlan = z.infer<typeof insertCarePlanSchema>;
export type UpdateCarePlan = z.infer<typeof updateCarePlanSchema>;

export type ImplementationPlan = typeof implementationPlans.$inferSelect;
export type InsertImplementationPlan = z.infer<typeof insertImplementationPlanSchema>;
export type UpdateImplementationPlan = z.infer<typeof updateImplementationPlanSchema>;

export type StaffWeeklyStat = typeof staffWeeklyStats.$inferSelect;
export type InsertStaffWeeklyStat = z.infer<typeof insertStaffWeeklyStatsSchema>;
export type UpdateStaffWeeklyStat = z.infer<typeof updateStaffWeeklyStatsSchema>;

// ── Härledda/stats typer enligt spec ──────────────────────────────────────────────
export type UUID = string;

export interface DayDoc {
  documented: boolean;
  qualityApproved: boolean;
  onTime: boolean;
  delayed: boolean;
  comment?: string;
  authorStaffId?: UUID;
  timestamp?: string; // ISO
}

export interface WeeklyDocumentationWithDays {
  id: UUID;
  clientId: UUID;
  year: number;
  week: number;
  days: {
    mon?: DayDoc; tue?: DayDoc; wed?: DayDoc; thu?: DayDoc; fri?: DayDoc; sat?: DayDoc; sun?: DayDoc;
  };
  documented: boolean;
  qualityApproved: boolean;
  onTime: boolean;
  delayed: boolean;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  key: 'Uppföljning1'|'Uppföljning2'|'Uppföljning3'|'Uppföljning4'|'Uppföljning5';
  done: boolean;
  note?: string;
  date?: string; // ISO
}

export interface ImplementationPlanWithFollowUps {
  id: UUID;
  clientId: UUID;
  carePlanIndex: number;
  index: number;
  status: 'Väntar' | 'Aktiv' | 'Slutförd';
  dueDate?: string;
  completedDate?: string;
  sentDate?: string;
  followUps: FollowUp[];
  createdAt: string;
  updatedAt: string;
}