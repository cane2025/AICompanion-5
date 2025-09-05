export type DashboardItemType =
  | "carePlan"
  | "implementationPlan"
  | "weeklyDoc"
  | "vismaTime";

export interface DashboardItem {
  id: string;
  type: DashboardItemType;
  clientId: string;
  clientInitials: string;
  clientName?: string;
  carePlanIndex?: number;
  implPlanIndex?: number;
  status: "waiting" | "active" | "overdue" | "completed";
  assignedStaff: string; // display-name
  dueDate?: string; // ISO 8601
  lastUpdated: string; // ISO 8601
  requiresAction: boolean; // deriveRequiresAction(...)
  actionType?: "review" | "update" | "complete" | "document";
}

export const deriveRequiresAction = (it: DashboardItem) =>
  it.status === "waiting" || it.status === "active" || it.status === "overdue";

export const filterRequiresAction = (arr: DashboardItem[]) =>
  arr.filter(deriveRequiresAction);

export function groupByStaff<T extends { assignedStaff: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, it) => {
    (acc[it.assignedStaff] ??= []).push(it);
    return acc;
  }, {});
}
