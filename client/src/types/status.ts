// Status type constants for the application

export const CARE_PLAN_STATUSES = {
  RECEIVED: "received",
  STAFF_NOTIFIED: "staff_notified", 
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
} as const;

export const IMPLEMENTATION_PLAN_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
} as const;

export const CLIENT_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

export const MONTHLY_REPORT_STATUSES = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress", 
  COMPLETED: "completed"
} as const;

export const VIMSA_TIME_STATUSES = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
} as const;

export const WEEKLY_DOCUMENTATION_STATUSES = {
  NOT_DONE: "not_done",
  DONE: "done",
  PARTIALLY_DONE: "partially_done"
} as const;

// Type definitions
export type CarePlanStatus = typeof CARE_PLAN_STATUSES[keyof typeof CARE_PLAN_STATUSES];
export type ImplementationPlanStatus = typeof IMPLEMENTATION_PLAN_STATUSES[keyof typeof IMPLEMENTATION_PLAN_STATUSES];
export type ClientStatus = typeof CLIENT_STATUSES[keyof typeof CLIENT_STATUSES];
export type MonthlyReportStatus = typeof MONTHLY_REPORT_STATUSES[keyof typeof MONTHLY_REPORT_STATUSES];
export type VimsaTimeStatus = typeof VIMSA_TIME_STATUSES[keyof typeof VIMSA_TIME_STATUSES];
export type WeeklyDocumentationStatus = typeof WEEKLY_DOCUMENTATION_STATUSES[keyof typeof WEEKLY_DOCUMENTATION_STATUSES];