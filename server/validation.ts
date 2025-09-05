import { z } from "zod";

// Care Plan validation
export const carePlanSchema = z.object({
  title: z.string().min(1, "Titel krävs").max(255, "Titel för lång"),
  goals: z.array(z.string().min(1, "Mål krävs")),
  interventions: z.string().max(1000, "Interventioner för långa"),
  status: z.enum(["draft", "active", "completed"]),
  clientId: z.string().uuid("Ogiltigt klient-ID"),
  staffId: z.string().uuid("Ogiltigt personal-ID"),
});

// Implementation Plan validation
export const implementationPlanSchema = z.object({
  carePlanId: z.string().uuid("Ogiltigt vårdplans-ID"),
  clientId: z.string().uuid("Ogiltigt klient-ID"),
  status: z.enum(["sent", "completed"]),
  followUp1: z.boolean().optional(),
  followUp2: z.boolean().optional(),
  followUp3: z.boolean().optional(),
  followUp4: z.boolean().optional(),
  followUp5: z.boolean().optional(),
  followUp6: z.boolean().optional(),
});

// Weekly Documentation validation
export const weeklyDocSchema = z.object({
  clientId: z.string().uuid("Ogiltigt klient-ID"),
  weekStartISO: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datum format"),
  entries: z.array(
    z.object({
      dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datum format"),
      activities: z.string().min(1, "Aktiviteter krävs"),
      hours: z
        .number()
        .min(0, "Timmar måste vara positivt")
        .max(24, "Max 24 timmar per dag"),
    })
  ),
});

// Monthly Report validation
export const monthlyReportSchema = z.object({
  clientId: z.string().uuid("Ogiltigt klient-ID"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Ogiltigt månadsformat (YYYY-MM)"),
  content: z.string().min(1, "Innehåll krävs"),
  status: z.enum(["approved", "not_approved"]),
});

// Vimsa Time validation
export const vimsaTimeSchema = z.object({
  clientId: z.string().uuid("Ogiltigt klient-ID"),
  weekStartISO: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datum format"),
  hoursPerDay: z.record(z.string(), z.number().min(0).max(24)),
  matchesDocumentation: z.boolean(),
});

// Login validation
export const loginSchema = z.object({
  username: z.string().min(1, "Användarnamn krävs"),
  password: z.string().min(1, "Lösenord krävs"),
});

// Validation functions
export const validateCarePlan = (data: any) => {
  return carePlanSchema.parse(data);
};

export const validateImplementationPlan = (data: any) => {
  return implementationPlanSchema.parse(data);
};

export const validateWeeklyDoc = (data: any) => {
  return weeklyDocSchema.parse(data);
};

export const validateMonthlyReport = (data: any) => {
  return monthlyReportSchema.parse(data);
};

export const validateVimsaTime = (data: any) => {
  return vimsaTimeSchema.parse(data);
};

export const validateLogin = (data: any) => {
  return loginSchema.parse(data);
};
