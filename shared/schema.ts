import { pgTable, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Core Types ─────────────────────────────────────────────────────────
type UUID = string;

export interface Client {
  id: UUID;
  displayCode: string;   // e.g. initials (not personnummer)
  active: boolean;
}

export interface Staff {
  id: UUID;
  name: string;
  role?: string;
  active: boolean;
}

// ── Vårdplan (CarePlan) ─────────────────────────────────────────
export interface CarePlan {
  id: UUID;
  clientId: UUID;
  index: number;          // 1,2,3... per client. New care plan => index++
  receivedDate: string;   // ISO date
  enteredToJournalDate?: string; // ISO
  status: 'Mottagen' | 'Aktiv' | 'Avslutad';
  assignedStaffId?: UUID; // responsible staff
  content?: string;       // rich text or JSON
  createdAt: string; 
  updatedAt: string;
}

// ── Genomförandeplan (ImplementationPlan/GFP) ───────────────────
export interface ImplementationPlan {
  id: UUID;
  clientId: UUID;
  carePlanIndex: number;  // references CarePlan.index
  index: number;          // 1,2,3... per client. New GFP => index++
  status: 'Väntar' | 'Aktiv' | 'Slutförd';
  dueDate?: string;       // due date (ISO)
  completedDate?: string; // completed
  sentDate?: string;      // sent
  followUps: Array<{     // max 5 st
    key: 'Uppföljning1'|'Uppföljning2'|'Uppföljning3'|'Uppföljning4'|'Uppföljning5';
    done: boolean;
    note?: string;
    date?: string;        // ISO
  }>;
  createdAt: string; 
  updatedAt: string;
}

// ── Veckodokumentation ──────────────────────────────────────────
export interface WeeklyDocumentation {
  id: UUID;
  clientId: UUID;
  year: number;           // e.g. 2025
  week: number;           // ISO week
  days: {
    mon?: DayDoc; tue?: DayDoc; wed?: DayDoc; thu?: DayDoc; fri?: DayDoc; sat?: DayDoc; sun?: DayDoc;
  };
  // aggregated status fields for quick list view
  documented: boolean;        // at least one day marked documented
  qualityApproved: boolean;   // approved quality for week
  onTime: boolean;            // not delayed (see rule)
  delayed: boolean;           // reported after deadline
  comments?: string;
  createdAt: string; 
  updatedAt: string;
}

export interface DayDoc {
  documented: boolean;
  qualityApproved: boolean;
  onTime: boolean;
  delayed: boolean;
  comment?: string;
  authorStaffId?: UUID;
  timestamp?: string; // ISO
}

// ── Derived/stats ──────────────────────────────────────────────
export interface StaffWeeklyStat {
  staffId: UUID;
  year: number;
  week: number;
  documentedCount: number;     // number of client-days marked
  delayedCount: number;
  notApprovedCount: number;    // not qualityApproved
}

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

// Staff table - updated to remove personnummer
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  role: varchar("role"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table - updated to remove personnummer and use displayCode
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayCode: varchar("display_code").notNull(), // e.g. initials (not personnummer)
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly documentation - updated with new day-based structure
export const weeklyDocumentation = pgTable("weekly_documentation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  year: integer("year").notNull(),
  week: integer("week").notNull(),
  days: text("days").notNull().default('{}'), // JSON object with mon, tue, wed, thu, fri, sat, sun
  documented: boolean("documented").default(false).notNull(), // at least one day marked documented
  qualityApproved: boolean("quality_approved").default(false).notNull(), // approved quality for week
  onTime: boolean("on_time").default(true).notNull(), // not delayed (see rule)
  delayed: boolean("delayed").default(false).notNull(), // reported after deadline
  comments: text("comments").default(""),
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

// Care plans - updated with versioning per client
export const carePlans = pgTable("care_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  index: integer("index").notNull(), // 1,2,3... per client. New care plan => index++
  receivedDate: varchar("received_date").notNull(), // ISO date
  enteredToJournalDate: varchar("entered_to_journal_date"), // ISO
  status: varchar("status").notNull().default("Mottagen"), // 'Mottagen' | 'Aktiv' | 'Avslutad'
  assignedStaffId: varchar("assigned_staff_id"), // responsible staff
  content: text("content"), // rich text or JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Implementation plans (GFP) - updated with versioning and follow-ups
export const implementationPlans = pgTable("implementation_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  carePlanIndex: integer("care_plan_index").notNull(), // references CarePlan.index
  index: integer("index").notNull(), // 1,2,3... per client. New GFP => index++
  status: varchar("status").notNull().default("Väntar"), // 'Väntar' | 'Aktiv' | 'Slutförd'
  dueDate: varchar("due_date"), // due date (ISO)
  completedDate: varchar("completed_date"), // completed date
  sentDate: varchar("sent_date"), // sent date
  followUps: text("follow_ups").notNull().default('[]'), // JSON array of follow-ups (max 5)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vimsa time tracking
export const vimsaTime = pgTable("vimsa_time", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  year: integer("year").notNull(),
  week: integer("week").notNull(),
  monday: integer("monday").default(0),
  tuesday: integer("tuesday").default(0),
  wednesday: integer("wednesday").default(0),
  thursday: integer("thursday").default(0),
  friday: integer("friday").default(0),
  saturday: integer("saturday").default(0),
  sunday: integer("sunday").default(0),
  totalHours: integer("total_hours").default(0),
  status: varchar("status").default("not_started"), // not_started, in_progress, completed
  approved: boolean("approved").default(false),
  comments: text("comments").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  matchesDocumentation: boolean("matches_documentation").default(false), // comparison flag
  hoursWorked: integer("hours_worked").default(0), // explicit hours worked (separate from totalHours calc)
});

// Staff weekly statistics for reporting
export const staffWeeklyStats = pgTable("staff_weekly_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(),
  year: integer("year").notNull(),
  week: integer("week").notNull(),
  documentedCount: integer("documented_count").default(0).notNull(), // number of client-days marked
  delayedCount: integer("delayed_count").default(0).notNull(),
  notApprovedCount: integer("not_approved_count").default(0).notNull(), // not qualityApproved
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

export const insertVimsaTimeSchema = createInsertSchema(vimsaTime).omit({
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
export const updateVimsaTimeSchema = insertVimsaTimeSchema.partial();
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

export type VimsaTime = typeof vimsaTime.$inferSelect;
export type InsertVimsaTime = z.infer<typeof insertVimsaTimeSchema>;
export type UpdateVimsaTime = z.infer<typeof updateVimsaTimeSchema>;

export type StaffWeeklyStats = typeof staffWeeklyStats.$inferSelect;
export type InsertStaffWeeklyStats = z.infer<typeof insertStaffWeeklyStatsSchema>;
export type UpdateStaffWeeklyStats = z.infer<typeof updateStaffWeeklyStatsSchema>;