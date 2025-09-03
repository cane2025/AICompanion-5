// Centralized status utilities for consistent UI across components

export type StatusVariant = "default" | "secondary" | "destructive" | "outline";

export interface StatusInfo {
  label: string;
  variant: StatusVariant;
  color?: string;
}

// Care Plan Status Mappings
export const carePlanStatusMap: Record<string, StatusInfo> = {
  received: { label: "Mottagen", variant: "secondary" },
  staff_notified: { label: "Personal meddelad", variant: "default" },
  in_progress: { label: "Pågående", variant: "default" },
  completed: { label: "Klar", variant: "default" },
  pending: { label: "Väntar", variant: "secondary" },
  active: { label: "Aktiv", variant: "default" },
  archived: { label: "Arkiverad", variant: "outline" },
};

// Implementation Plan Status Mappings
export const implementationStatusMap: Record<string, StatusInfo> = {
  pending: { label: "Väntar", variant: "secondary" },
  in_progress: { label: "Pågående", variant: "default" },
  completed: { label: "Klar", variant: "default" },
  active: { label: "Aktiv", variant: "default" },
  inactive: { label: "Inaktiv", variant: "outline" },
};

// Weekly Documentation Status Mappings
export const weeklyDocStatusMap: Record<string, StatusInfo> = {
  not_done: { label: "Ej gjord", variant: "destructive" },
  reminded: { label: "Påminnt", variant: "secondary" },
  done: { label: "Gjord", variant: "default" },
  pending: { label: "Väntar", variant: "secondary" },
};

// Monthly Report Status Mappings
export const monthlyReportStatusMap: Record<string, StatusInfo> = {
  not_started: { label: "Ej påbörjad", variant: "secondary" },
  in_progress: { label: "Pågående", variant: "default" },
  completed: { label: "Klar", variant: "default" },
  submitted: { label: "Inlämnad", variant: "default" },
  late: { label: "Försenad", variant: "destructive" },
  not_submitted: { label: "Ej inlämnad", variant: "secondary" },
};

// Vimsa Time Status Mappings
export const vimsaTimeStatusMap: Record<string, StatusInfo> = {
  not_started: { label: "Ej påbörjad", variant: "secondary" },
  in_progress: { label: "Pågående", variant: "default" },
  completed: { label: "Klar", variant: "default" },
  approved: { label: "Godkänd", variant: "default" },
  rejected: { label: "Avvisad", variant: "destructive" },
};

// Generic status getter with fallback
export function getStatusInfo(
  status: string,
  statusMap: Record<string, StatusInfo>
): StatusInfo {
  return (
    statusMap[status] || {
      label: status,
      variant: "secondary",
    }
  );
}

// Specific status getters for each type
export function getCarePlanStatus(status: string): StatusInfo {
  return getStatusInfo(status, carePlanStatusMap);
}

export function getImplementationStatus(status: string): StatusInfo {
  return getStatusInfo(status, implementationStatusMap);
}

export function getWeeklyDocStatus(status: string): StatusInfo {
  return getStatusInfo(status, weeklyDocStatusMap);
}

export function getMonthlyReportStatus(status: string): StatusInfo {
  return getStatusInfo(status, monthlyReportStatusMap);
}

export function getVimsaTimeStatus(status: string): StatusInfo {
  return getStatusInfo(status, vimsaTimeStatusMap);
}

// Status color utilities for legacy components
export function getStatusColor(
  status: string,
  type: "weekly" | "monthly" | "vimsa" = "weekly"
): string {
  switch (type) {
    case "weekly":
      return getWeeklyDocStatus(status).variant === "destructive"
        ? "bg-red-500"
        : getWeeklyDocStatus(status).variant === "default"
        ? "bg-green-500"
        : "bg-yellow-500";
    case "monthly":
      return getMonthlyReportStatus(status).variant === "destructive"
        ? "bg-red-500"
        : getMonthlyReportStatus(status).variant === "default"
        ? "bg-green-500"
        : "bg-yellow-500";
    case "vimsa":
      return getVimsaTimeStatus(status).variant === "destructive"
        ? "bg-red-500"
        : getVimsaTimeStatus(status).variant === "default"
        ? "bg-green-500"
        : "bg-yellow-500";
    default:
      return "bg-gray-300";
  }
}
