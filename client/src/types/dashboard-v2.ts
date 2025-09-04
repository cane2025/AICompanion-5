/**
 * Dashboard V2 Types
 * Feature Flag: UI_DASHBOARD_V2
 * Date: 2025-09-04
 * Author: cane2025
 */

export type DashboardItemType =
  | 'carePlan'
  | 'implementationPlan'
  | 'weeklyDoc'
  | 'vismaTime';

export interface DashboardItem {
  id: string;
  type: DashboardItemType;
  clientId: string;
  clientInitials: string;   // "A.B."
  clientName?: string;      // visas om policy tillåter
  carePlanIndex?: number;
  implPlanIndex?: number;
  status: 'waiting' | 'active' | 'overdue' | 'completed';
  assignedStaff: string;    // display-name
  dueDate?: string;         // ISO 8601
  lastUpdated: string;      // ISO 8601
  requiresAction: boolean;  // deriveRequiresAction(...)
  actionType?: 'review' | 'update' | 'complete' | 'document';
}

export const deriveRequiresAction = (item: DashboardItem): boolean =>
  item.status === 'waiting' || item.status === 'active' || item.status === 'overdue';

export const filterRequiresAction = (arr: DashboardItem[]): DashboardItem[] =>
  arr.filter(deriveRequiresAction);

export function groupByStaff<T extends { assignedStaff: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    (acc[item.assignedStaff] ??= []).push(item);
    return acc;
  }, {});
}

export type FilterType = 
  | 'senast_skapade'
  | 'senast_uppdaterade' 
  | 'endast_vantande'
  | 'endast_forsenade'
  | 'visa_alla';

export interface DashboardCardProps {
  title: string;
  items: DashboardItem[];
  isLoading?: boolean;
  onItemClick?: (item: DashboardItem) => void;
  onViewAll?: () => void;
  className?: string;
}

export interface PersonalStatistik {
  staffName: string;
  staffId: string;
  dokumenteradeDagar: { count: number; total: number; percentage: number };
  forsenat: { percentage: number; trend: 'up' | 'down' | 'stable' };
  kvalitetGodkand: { percentage: number };
}

export interface TeamStatistik {
  totalStaff: number;
  aggregateStats: {
    dokumenteradeDagar: { count: number; total: number; percentage: number };
    forsenat: { percentage: number; trend: 'up' | 'down' | 'stable' };
    kvalitetGodkand: { percentage: number };
  };
  individualStats: PersonalStatistik[];
}

// Helper functions for status derivation
export const getWeeklyDocMissingThisWeek = (weeklyDocs: any[], currentWeek: number, currentYear: number): boolean => {
  const thisWeekDoc = weeklyDocs.find(doc => doc.week === currentWeek && doc.year === currentYear);
  if (!thisWeekDoc) return true;
  
  return !(
    thisWeekDoc.mondayDocumented ||
    thisWeekDoc.tuesdayDocumented ||
    thisWeekDoc.wednesdayDocumented ||
    thisWeekDoc.thursdayDocumented ||
    thisWeekDoc.fridayDocumented ||
    thisWeekDoc.saturdayDocumented ||
    thisWeekDoc.sundayDocumented
  );
};

export const getNotReportedThisMonth = (vimsaRecords: any[], currentMonth: number, currentYear: number): boolean => {
  return vimsaRecords.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate.getMonth() + 1 === currentMonth && recordDate.getFullYear() === currentYear;
  }).length === 0;
};

// Action button configurations
export const getActionConfig = (item: DashboardItem) => {
  switch (item.type) {
    case 'carePlan':
      switch (item.status) {
        case 'waiting': return { label: 'Granska', variant: 'secondary' as const };
        case 'active': return { label: 'Uppdatera', variant: 'default' as const };
        case 'overdue': return { label: 'Åtgärda', variant: 'destructive' as const };
        default: return { label: 'Visa', variant: 'outline' as const };
      }
    case 'implementationPlan':
      switch (item.status) {
        case 'waiting': return { label: 'Granska', variant: 'secondary' as const };
        case 'active': return { label: 'Uppdatera', variant: 'default' as const };
        case 'overdue': return { label: 'Åtgärda', variant: 'destructive' as const };
        default: return { label: 'Visa', variant: 'outline' as const };
      }
    case 'weeklyDoc':
      return { label: 'Dokumentera', variant: 'default' as const };
    case 'vismaTime':
      return { label: 'Rapportera', variant: 'default' as const };
    default:
      return { label: 'Visa', variant: 'outline' as const };
  }
};

// Status badge configurations
export const getStatusConfig = (status: DashboardItem['status']) => {
  switch (status) {
    case 'waiting': return { label: 'Väntar', className: 'bg-gray-100 text-gray-800' };
    case 'active': return { label: 'Aktiv', className: 'bg-blue-100 text-blue-800' };
    case 'overdue': return { label: 'Försenad', className: 'bg-red-100 text-red-800' };
    case 'completed': return { label: 'Slutförd', className: 'bg-green-100 text-green-800' };
    default: return { label: 'Okänd', className: 'bg-gray-100 text-gray-800' };
  }
};