import { z } from 'zod';

export const clientSchema = z.object({
  id: z.string(),
  initials: z.string().min(1, 'Initialer krävs').max(10, 'Max 10 tecken'),
  staffId: z.string().min(1),
  personalNumber: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export const carePlanSchema = z.object({
  id: z.string(),
  clientId: z.string().min(1),
  staffId: z.string().min(1),
  planContent: z.string().optional().default(''),
  goals: z.string().optional().default(''),
  interventions: z.string().optional().default(''),
  evaluationCriteria: z.string().optional(),
  status: z.enum(['received', 'staff_notified', 'in_progress', 'completed']).default('received'),
  isActive: z.boolean().default(true),
  comment: z.string().optional().default(''),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export const implementationPlanSchema = z.object({
  id: z.string(),
  clientId: z.string().min(1),
  staffId: z.string().min(1),
  planContent: z.string().optional().default(''),
  goals: z.string().optional().default(''),
  activities: z.string().optional().default(''),
  followUpSchedule: z.string().optional().default(''),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  isActive: z.boolean().default(true),
  followup1: z.boolean().default(false),
  followup2: z.boolean().default(false),
  comments: z.string().optional().default(''),
  planType: z.string().default('care'),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export const weeklyDocumentationSchema = z.object({
  id: z.string(),
  clientId: z.string().min(1),
  staffId: z.string().min(1),
  year: z.number().min(2000).max(2100),
  week: z.number().min(1).max(53),
  documentation: z.string().optional().default(''),
  qualityAssessment: z.enum(['pending', 'approved', 'not_approved']).default('pending'),
  comments: z.string().optional().default(''),
  matchesDocumentation: z.boolean().default(false),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export const monthlyReportSchema = z.object({
  id: z.string(),
  clientId: z.string().min(1),
  staffId: z.string().min(1),
  year: z.number().min(2000).max(2100),
  month: z.number().min(1).max(12),
  reportContent: z.string().optional().default(''),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
  quality: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  comment: z.string().optional().default(''),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export const vimsaTimeSchema = z.object({
  id: z.string(),
  clientId: z.string().min(1),
  staffId: z.string().min(1),
  year: z.number().min(2000).max(2100),
  week: z.number().min(1).max(53),
  hoursWorked: z.number().min(0).max(168), // max hours in a week
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
  approved: z.boolean().default(false),
  comments: z.string().optional().default(''),
  matchesDocumentation: z.boolean().default(false),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

// Types
export type Client = z.infer<typeof clientSchema>;
export type CarePlan = z.infer<typeof carePlanSchema>;
export type ImplementationPlan = z.infer<typeof implementationPlanSchema>;
export type WeeklyDocumentation = z.infer<typeof weeklyDocumentationSchema>;
export type MonthlyReport = z.infer<typeof monthlyReportSchema>;
export type VimsaTime = z.infer<typeof vimsaTimeSchema>;

// Input schemas (for POST/PUT requests)
export const createClientInput = clientSchema.omit({ id: true });
export const createCarePlanInput = carePlanSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const createImplementationPlanInput = implementationPlanSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const createWeeklyDocumentationInput = weeklyDocumentationSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const createMonthlyReportInput = monthlyReportSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const createVimsaTimeInput = vimsaTimeSchema.omit({ id: true, createdAt: true, updatedAt: true });
