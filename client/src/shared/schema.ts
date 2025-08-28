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

// Staff table
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  initials: varchar("initials").notNull(),
  personnummer: varchar("personnummer").default(""),
  telefon: varchar("telefon").default(""),
  epost: varchar("epost").default(""),
  adress: varchar("adress").default(""),
  anställningsdatum: varchar("anställningsdatum").default(""),
  roll: varchar("roll").default(""),
  avdelning: varchar("avdelning").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // added for soft delete support
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  initials: varchar("initials").notNull(),
  staffId: varchar("staff_id").notNull(),
  personalNumber: varchar("personal_number").default(""),
  notes: text("notes").default(""),
  status: varchar("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // added for soft delete support
});

// Weekly documentation
export const weeklyDocumentation = pgTable("weekly_documentation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  year: integer("year").notNull(),
  week: integer("week").notNull(),
  content: text("content").default(""),
  mondayStatus: varchar("monday_status").default("not_done"),
  tuesdayStatus: varchar("tuesday_status").default("not_done"),
  wednesdayStatus: varchar("wednesday_status").default("not_done"),
  thursdayStatus: varchar("thursday_status").default("not_done"),
  fridayStatus: varchar("friday_status").default("not_done"),
  saturdayStatus: varchar("saturday_status").default("not_done"),
  sundayStatus: varchar("sunday_status").default("not_done"),
  mondayDocumented: boolean("monday_documented").default(false).notNull(),
  tuesdayDocumented: boolean("tuesday_documented").default(false).notNull(),
  wednesdayDocumented: boolean("wednesday_documented").default(false).notNull(),
  thursdayDocumented: boolean("thursday_documented").default(false).notNull(),
  fridayDocumented: boolean("friday_documented").default(false).notNull(),
  saturdayDocumented: boolean("saturday_documented").default(false).notNull(),
  sundayDocumented: boolean("sunday_documented").default(false).notNull(),
  documentation: text("documentation").default(""),
  approved: boolean("approved").default(false).notNull(),
  comments: text("comments").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  qualityAssessment: varchar("quality_assessment").default("pending"), // for quality status badges
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

// Care plans
export const carePlans = pgTable("care_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  responsibleId: varchar("responsible_id"), // optional responsible staff separate from creator
  planContent: text("plan_content").default(""),
  goals: text("goals").default(""),
  interventions: text("interventions").default(""),
  evaluationCriteria: text("evaluation_criteria"),
  receivedDate: varchar("received_date"),
  enteredJournalDate: varchar("entered_journal_date"),
  staffNotifiedDate: varchar("staff_notified_date"),
  status: varchar("status").default("received"), // received, staff_notified, in_progress, completed
  isActive: boolean("is_active").default(true),
  comment: text("comment").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Implementation plans (GFP)
export const implementationPlans = pgTable("implementation_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  carePlanId: varchar("care_plan_id"),
  planContent: text("plan_content").default(""),
  goals: text("goals").default(""),
  activities: text("activities").default(""),
  followUpSchedule: text("follow_up_schedule").default(""),
  status: varchar("status").default("pending"), // pending, in_progress, completed
  isActive: boolean("is_active").default(true),
  followup1: boolean("followup1").default(false),
  followup2: boolean("followup2").default(false),
  createdDate: timestamp("created_date").defaultNow(),
  comments: text("comments").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Newly added optional fields referenced in UI
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  sentDate: timestamp("sent_date"),
  planType: varchar("plan_type").default("1"),
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

// Update schemas
export const updateStaffSchema = insertStaffSchema.partial();
export const updateClientSchema = insertClientSchema.partial();
export const updateWeeklyDocumentationSchema = insertWeeklyDocumentationSchema.partial();
export const updateMonthlyReportSchema = insertMonthlyReportSchema.partial();
export const updateCarePlanSchema = insertCarePlanSchema.partial();
export const updateImplementationPlanSchema = insertImplementationPlanSchema.partial();
export const updateVimsaTimeSchema = insertVimsaTimeSchema.partial();

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