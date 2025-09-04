/**
 * Dashboard V2 Types and Interfaces
 * 
 * This file contains all TypeScript types and interfaces for the new Dashboard V2
 * implementation, following the specifications in the requirements document.
 */

export type DashboardItemType =
  | 'carePlan'
  | 'implementationPlan'
  | 'weeklyDoc'
  | 'vismaTime';

export type DashboardItemStatus = 'waiting' | 'active' | 'overdue' | 'completed';

export type ActionType = 'review' | 'update' | 'complete' | 'document';

export interface DashboardItem {
  id: string;
  type: DashboardItemType;
  clientId: string;
  clientInitials: string;   // "A.B."
  clientName?: string;      // visas om policy tillåter
  carePlanIndex?: number;
  implPlanIndex?: number;
  status: DashboardItemStatus;
  assignedStaff: string;    // display-name
  dueDate?: string;         // ISO 8601
  lastUpdated: string;      // ISO 8601
  requiresAction: boolean;  // deriveRequiresAction(...)
  actionType?: ActionType;
}

export interface CarePlanItem extends DashboardItem {
  type: 'carePlan';
  carePlanIndex: number;
  responsibleStaff: string;
  planContent?: string;
  goals?: string;
}

export interface ImplementationPlanItem extends DashboardItem {
  type: 'implementationPlan';
  implPlanIndex: number;
  carePlanId?: string;
  planContent?: string;
  activities?: string;
}

export interface WeeklyDocItem extends DashboardItem {
  type: 'weeklyDoc';
  week: number;
  year: number;
  missingDays: string[]; // ['monday', 'tuesday', etc.]
  documentedDays: number;
  totalDays: number;
}

export interface VismaTimeItem extends DashboardItem {
  type: 'vismaTime';
  month: number;
  year: number;
  hoursWorked: number;
  hoursRequired: number;
  reported: boolean;
}

export type FilterType = 
  | 'latestCreated'
  | 'latestUpdated' 
  | 'waitingOnly'
  | 'overdueOnly'
  | 'showAll';

export interface DashboardFilters {
  type: FilterType;
  showCompleted: boolean;
  staffFilter?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface StaffStatistics {
  staffId: string;
  staffName: string;
  documentedDays: number;
  totalDays: number;
  overdueCount: number;
  qualityApproved: number;
  qualityTotal: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface DashboardStats {
  totalStaff: number;
  totalClients: number;
  activeCarePlans: number;
  pendingActions: number;
  overdueItems: number;
  qualityScore: number;
}

// Utility functions
export const deriveRequiresAction = (item: DashboardItem): boolean =>
  item.status === 'waiting' || item.status === 'active' || item.status === 'overdue';

export const filterRequiresAction = (items: DashboardItem[]): DashboardItem[] =>
  items.filter(deriveRequiresAction);

export function groupByStaff<T extends { assignedStaff: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    (acc[item.assignedStaff] ??= []).push(item);
    return acc;
  }, {});
}

export const getStatusColor = (status: DashboardItemStatus): string => {
  switch (status) {
    case 'waiting': return 'bg-gray-100 text-gray-800';
    case 'active': return 'bg-blue-100 text-blue-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    case 'completed': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getActionButtonText = (actionType: ActionType): string => {
  switch (actionType) {
    case 'review': return 'Granska';
    case 'update': return 'Uppdatera';
    case 'complete': return 'Slutför';
    case 'document': return 'Dokumentera';
    default: return 'Åtgärda';
  }
};

export const getActionButtonVariant = (actionType: ActionType): string => {
  switch (actionType) {
    case 'review': return 'default';
    case 'update': return 'secondary';
    case 'complete': return 'destructive';
    case 'document': return 'default';
    default: return 'outline';
  }
};

// Feature flag type
export interface FeatureFlags {
  UI_DASHBOARD_V2: boolean;
}

// Mock data interfaces for development
export interface MockDashboardData {
  carePlans: CarePlanItem[];
  implementationPlans: ImplementationPlanItem[];
  weeklyDocs: WeeklyDocItem[];
  vismaTime: VismaTimeItem[];
  staffStats: StaffStatistics[];
  dashboardStats: DashboardStats;
}