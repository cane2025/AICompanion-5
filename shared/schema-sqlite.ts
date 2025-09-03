import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff"), // admin, staff, viewer
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
});

// Staff table
export const staff = sqliteTable("staff", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  personnummer: text("personnummer").default(""),
  telefon: text("telefon").default(""),
  epost: text("epost").default(""),
  adress: text("adress").default(""),
  anställningsdatum: text("anställningsdatum").default(""),
  roll: text("roll").default(""),
  avdelning: text("avdelning").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  deletedAt: integer("deleted_at", { mode: "timestamp" }), // added for soft delete support
});

// Clients table
export const clients = sqliteTable("clients", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  initials: text("initials").notNull(),
  staffId: text("staff_id").notNull(),
  personalNumber: text("personal_number").default(""),
  notes: text("notes").default(""),
  status: text("status").default("active"), // active, inactive
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  deletedAt: integer("deleted_at", { mode: "timestamp" }), // added for soft delete support
});

// Weekly documentation
export const weeklyDocumentation = sqliteTable("weekly_documentation", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  clientId: text("client_id").notNull(),
  staffId: text("staff_id").notNull(),
  year: integer("year").notNull(),
  week: integer("week").notNull(),
  content: text("content").default(""),
  mondayStatus: text("monday_status").default("not_done"),
  tuesdayStatus: text("tuesday_status").default("not_done"),
  wednesdayStatus: text("wednesday_status").default("not_done"),
  thursdayStatus: text("thursday_status").default("not_done"),
  fridayStatus: text("friday_status").default("not_done"),
  saturdayStatus: text("saturday_status").default("not_done"),
  sundayStatus: text("sunday_status").default("not_done"),
  mondayDocumented: integer("monday_documented", { mode: "boolean" })
    .default(false)
    .notNull(),
  tuesdayDocumented: integer("tuesday_documented", { mode: "boolean" })
    .default(false)
    .notNull(),
  wednesdayDocumented: integer("wednesday_documented", { mode: "boolean" })
    .default(false)
    .notNull(),
  thursdayDocumented: integer("thursday_documented", { mode: "boolean" })
    .default(false)
    .notNull(),
  fridayDocumented: integer("friday_documented", { mode: "boolean" })
    .default(false)
    .notNull(),
  saturdayDocumented: integer("saturday_documented", { mode: "boolean" })
    .default(false)
    .notNull(),
  sundayDocumented: integer("sunday_documented", { mode: "boolean" })
    .default(false)
    .notNull(),
  documentation: text("documentation").default(""),
  approved: integer("approved", { mode: "boolean" }).default(false).notNull(),
  comments: text("comments").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  qualityAssessment: text("quality_assessment").default("pending"), // for quality status badges
});

// Monthly reports
export const monthlyReports = sqliteTable("monthly_reports", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  clientId: text("client_id").notNull(),
  staffId: text("staff_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  content: text("content").default(""),
  reportContent: text("report_content").default(""),
  status: text("status").default("not_started"), // not_started, in_progress, completed
  comment: text("comment").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  quality: text("quality").default("pending"), // quality evaluation
  submissionDate: integer("submission_date", { mode: "timestamp" }), // date of submission
});

// Care plans
export const carePlans = sqliteTable("care_plans", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  clientId: text("client_id").notNull(),
  staffId: text("staff_id").notNull(),
  responsibleId: text("responsible_id"), // optional responsible staff separate from creator
  planContent: text("plan_content").default(""),
  goals: text("goals").default(""),
  interventions: text("interventions").default(""),
  evaluationCriteria: text("evaluation_criteria"),
  receivedDate: text("received_date"),
  enteredJournalDate: text("entered_journal_date"),
  staffNotifiedDate: text("staff_notified_date"),
  status: text("status").default("received"), // received, staff_notified, in_progress, completed
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  comment: text("comment").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
});

// Implementation plans (GFP)
export const implementationPlans = sqliteTable("implementation_plans", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  clientId: text("client_id").notNull(),
  staffId: text("staff_id").notNull(),
  carePlanId: text("care_plan_id"),
  planContent: text("plan_content").default(""),
  goals: text("goals").default(""),
  activities: text("activities").default(""),
  followUpSchedule: text("follow_up_schedule").default(""),
  status: text("status").default("pending"), // pending, in_progress, completed
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  followup1: integer("followup1", { mode: "boolean" }).default(false),
  followup2: integer("followup2", { mode: "boolean" }).default(false),
  createdDate: integer("created_date", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  comments: text("comments").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  // Newly added optional fields referenced in UI
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  sentDate: integer("sent_date", { mode: "timestamp" }),
  planType: text("plan_type").default("1"),
});

// Vimsa time tracking
export const vimsaTime = sqliteTable("vimsa_time", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  clientId: text("client_id").notNull(),
  staffId: text("staff_id").notNull(),
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
  status: text("status").default("not_started"), // not_started, in_progress, completed
  approved: integer("approved", { mode: "boolean" }).default(false),
  comments: text("comments").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  matchesDocumentation: integer("matches_documentation", {
    mode: "boolean",
  }).default(false), // comparison flag
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

export const insertWeeklyDocumentationSchema = createInsertSchema(
  weeklyDocumentation
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyReportSchema = createInsertSchema(
  monthlyReports
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCarePlanSchema = createInsertSchema(carePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImplementationPlanSchema = createInsertSchema(
  implementationPlans
).omit({
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
export const updateWeeklyDocumentationSchema =
  insertWeeklyDocumentationSchema.partial();
export const updateMonthlyReportSchema = insertMonthlyReportSchema.partial();
export const updateCarePlanSchema = insertCarePlanSchema.partial();
export const updateImplementationPlanSchema =
  insertImplementationPlanSchema.partial();
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
export type InsertWeeklyDocumentation = z.infer<
  typeof insertWeeklyDocumentationSchema
>;
export type UpdateWeeklyDocumentation = z.infer<
  typeof updateWeeklyDocumentationSchema
>;

export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
export type UpdateMonthlyReport = z.infer<typeof updateMonthlyReportSchema>;

export type CarePlan = typeof carePlans.$inferSelect;
export type InsertCarePlan = z.infer<typeof insertCarePlanSchema>;
export type UpdateCarePlan = z.infer<typeof updateCarePlanSchema>;

export type ImplementationPlan = typeof implementationPlans.$inferSelect;
export type InsertImplementationPlan = z.infer<
  typeof insertImplementationPlanSchema
>;
export type UpdateImplementationPlan = z.infer<
  typeof updateImplementationPlanSchema
>;

export type VimsaTime = typeof vimsaTime.$inferSelect;
export type InsertVimsaTime = z.infer<typeof insertVimsaTimeSchema>;
export type UpdateVimsaTime = z.infer<typeof updateVimsaTimeSchema>;
