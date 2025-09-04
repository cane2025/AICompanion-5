/**
 * Mock Data for Dashboard V2
 * 
 * This file contains mock data that matches the Dashboard V2 specifications
 * and can be used for development and testing.
 */

import type { 
  MockDashboardData, 
  CarePlanItem, 
  ImplementationPlanItem, 
  WeeklyDocItem, 
  VismaTimeItem, 
  StaffStatistics,
  DashboardStats 
} from '@/types/dashboard-v2';

// Mock care plans
const mockCarePlans: CarePlanItem[] = [
  {
    id: 'cp-1',
    type: 'carePlan',
    clientId: 'client-1',
    clientInitials: 'A.B.',
    clientName: 'Anna Berg',
    carePlanIndex: 1,
    status: 'active',
    assignedStaff: 'Mirza C',
    responsibleStaff: 'Mirza C',
    dueDate: '2025-09-15',
    lastUpdated: '2025-09-04T10:30:00Z',
    requiresAction: true,
    actionType: 'update',
    planContent: 'Vårdplan för Anna Berg - fokus på ångesthantering',
    goals: 'Minska ångestnivåer, förbättra sömnkvalitet'
  },
  {
    id: 'cp-2',
    type: 'carePlan',
    clientId: 'client-2',
    clientInitials: 'E.L.',
    clientName: 'Erik Larsson',
    carePlanIndex: 2,
    status: 'waiting',
    assignedStaff: 'Sofia M',
    responsibleStaff: 'Sofia M',
    dueDate: '2025-09-20',
    lastUpdated: '2025-09-03T14:15:00Z',
    requiresAction: true,
    actionType: 'review',
    planContent: 'Vårdplan för Erik Larsson - sociala färdigheter',
    goals: 'Förbättra sociala interaktioner, bygga självförtroende'
  },
  {
    id: 'cp-3',
    type: 'carePlan',
    clientId: 'client-3',
    clientInitials: 'M.K.',
    clientName: 'Maria Karlsson',
    carePlanIndex: 3,
    status: 'overdue',
    assignedStaff: 'Lars P',
    responsibleStaff: 'Lars P',
    dueDate: '2025-08-30',
    lastUpdated: '2025-08-25T09:45:00Z',
    requiresAction: true,
    actionType: 'complete',
    planContent: 'Vårdplan för Maria Karlsson - skolrelaterade utmaningar',
    goals: 'Förbättra skolprestationer, hantera stress'
  }
];

// Mock implementation plans (GFP)
const mockImplementationPlans: ImplementationPlanItem[] = [
  {
    id: 'gfp-1',
    type: 'implementationPlan',
    clientId: 'client-1',
    clientInitials: 'A.B.',
    clientName: 'Anna Berg',
    implPlanIndex: 1,
    carePlanId: 'cp-1',
    status: 'waiting',
    assignedStaff: 'Mirza C',
    dueDate: '2025-09-10',
    lastUpdated: '2025-09-02T16:20:00Z',
    requiresAction: true,
    actionType: 'review',
    planContent: 'GFP för ångesthantering - vecka 1',
    activities: 'Andningsövningar, mindfulness, dagbok'
  },
  {
    id: 'gfp-2',
    type: 'implementationPlan',
    clientId: 'client-2',
    clientInitials: 'E.L.',
    clientName: 'Erik Larsson',
    implPlanIndex: 2,
    carePlanId: 'cp-2',
    status: 'active',
    assignedStaff: 'Sofia M',
    dueDate: '2025-09-12',
    lastUpdated: '2025-09-04T11:30:00Z',
    requiresAction: true,
    actionType: 'update',
    planContent: 'GFP för sociala färdigheter - vecka 2',
    activities: 'Rollspel, gruppaktiviteter, feedback'
  },
  {
    id: 'gfp-3',
    type: 'implementationPlan',
    clientId: 'client-3',
    clientInitials: 'M.K.',
    clientName: 'Maria Karlsson',
    implPlanIndex: 3,
    carePlanId: 'cp-3',
    status: 'overdue',
    assignedStaff: 'Lars P',
    dueDate: '2025-08-28',
    lastUpdated: '2025-08-20T13:15:00Z',
    requiresAction: true,
    actionType: 'complete',
    planContent: 'GFP för skolprestationer - vecka 3',
    activities: 'Studieteknik, tidsplanering, stresshantering'
  }
];

// Mock weekly documentation
const mockWeeklyDocs: WeeklyDocItem[] = [
  {
    id: 'wd-1',
    type: 'weeklyDoc',
    clientId: 'client-1',
    clientInitials: 'A.B.',
    clientName: 'Anna Berg',
    status: 'overdue',
    assignedStaff: 'Mirza C',
    week: 36,
    year: 2025,
    missingDays: ['monday', 'tuesday'],
    documentedDays: 3,
    totalDays: 5,
    dueDate: '2025-09-08',
    lastUpdated: '2025-09-01T08:00:00Z',
    requiresAction: true,
    actionType: 'document'
  },
  {
    id: 'wd-2',
    type: 'weeklyDoc',
    clientId: 'client-2',
    clientInitials: 'E.L.',
    clientName: 'Erik Larsson',
    status: 'active',
    assignedStaff: 'Sofia M',
    week: 36,
    year: 2025,
    missingDays: ['wednesday'],
    documentedDays: 4,
    totalDays: 5,
    dueDate: '2025-09-08',
    lastUpdated: '2025-09-03T14:30:00Z',
    requiresAction: true,
    actionType: 'document'
  },
  {
    id: 'wd-3',
    type: 'weeklyDoc',
    clientId: 'client-3',
    clientInitials: 'M.K.',
    clientName: 'Maria Karlsson',
    status: 'waiting',
    assignedStaff: 'Lars P',
    week: 36,
    year: 2025,
    missingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    documentedDays: 0,
    totalDays: 5,
    dueDate: '2025-09-08',
    lastUpdated: '2025-08-30T10:15:00Z',
    requiresAction: true,
    actionType: 'document'
  }
];

// Mock Visma time tracking
const mockVismaTime: VismaTimeItem[] = [
  {
    id: 'vt-1',
    type: 'vismaTime',
    clientId: 'client-1',
    clientInitials: 'A.B.',
    clientName: 'Anna Berg',
    status: 'overdue',
    assignedStaff: 'Mirza C',
    month: 9,
    year: 2025,
    hoursWorked: 0,
    hoursRequired: 160,
    reported: false,
    dueDate: '2025-09-30',
    lastUpdated: '2025-09-01T09:00:00Z',
    requiresAction: true,
    actionType: 'document'
  },
  {
    id: 'vt-2',
    type: 'vismaTime',
    clientId: 'client-2',
    clientInitials: 'E.L.',
    clientName: 'Erik Larsson',
    status: 'active',
    assignedStaff: 'Sofia M',
    month: 9,
    year: 2025,
    hoursWorked: 80,
    hoursRequired: 160,
    reported: false,
    dueDate: '2025-09-30',
    lastUpdated: '2025-09-04T15:45:00Z',
    requiresAction: true,
    actionType: 'document'
  }
];

// Mock staff statistics
const mockStaffStats: StaffStatistics[] = [
  {
    staffId: 'staff-1',
    staffName: 'Mirza C',
    documentedDays: 46,
    totalDays: 55,
    overdueCount: 1,
    qualityApproved: 38,
    qualityTotal: 46,
    trend: 'up',
    trendPercentage: 14
  },
  {
    staffId: 'staff-2',
    staffName: 'Sofia M',
    documentedDays: 42,
    totalDays: 50,
    overdueCount: 2,
    qualityApproved: 40,
    qualityTotal: 42,
    trend: 'stable',
    trendPercentage: 0
  },
  {
    staffId: 'staff-3',
    staffName: 'Lars P',
    documentedDays: 38,
    totalDays: 45,
    overdueCount: 3,
    qualityApproved: 35,
    qualityTotal: 38,
    trend: 'down',
    trendPercentage: -8
  }
];

// Mock dashboard statistics
const mockDashboardStats: DashboardStats = {
  totalStaff: 33,
  totalClients: 127,
  activeCarePlans: 45,
  pendingActions: 23,
  overdueItems: 8,
  qualityScore: 83
};

// Combined mock data
export const mockDashboardData: MockDashboardData = {
  carePlans: mockCarePlans,
  implementationPlans: mockImplementationPlans,
  weeklyDocs: mockWeeklyDocs,
  vismaTime: mockVismaTime,
  staffStats: mockStaffStats,
  dashboardStats: mockDashboardStats
};

// Helper functions for mock data
export const getMockItemsByType = (type: string) => {
  switch (type) {
    case 'carePlan':
      return mockCarePlans;
    case 'implementationPlan':
      return mockImplementationPlans;
    case 'weeklyDoc':
      return mockWeeklyDocs;
    case 'vismaTime':
      return mockVismaTime;
    default:
      return [];
  }
};

export const getMockItemsRequiringAction = () => {
  return [
    ...mockCarePlans,
    ...mockImplementationPlans,
    ...mockWeeklyDocs,
    ...mockVismaTime
  ].filter(item => item.requiresAction);
};