/**
 * Dashboard V2 - Handlingsfokuserad GDPR-säker dashboard
 * Feature Flag: UI_DASHBOARD_V2
 * Date: 2025-09-04
 * Author: cane2025
 * 
 * Layout matchar mockup: tvåkols-grid med kort
 * Vänster kolumn (60%): Vårdplaner, GFP
 * Höger kolumn (40%): Veckodokumentation, Statistik
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { Plus, Filter, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { 
  DashboardItem, 
  FilterType, 
  DashboardCardProps,
  TeamStatistik 
} from "@/types/dashboard-v2";
import { 
  deriveRequiresAction, 
  filterRequiresAction, 
  getActionConfig, 
  getStatusConfig,
  getWeeklyDocMissingThisWeek,
  getNotReportedThisMonth
} from "@/types/dashboard-v2";
import type { 
  Staff, 
  Client, 
  CarePlan, 
  ImplementationPlan, 
  WeeklyDocumentation, 
  VimsaTime 
} from "@shared/schema";

// Sub-komponenter för korten
import { CarePlansCard } from "@/components/dashboard-v2/care-plans-card";
import { ImplementationPlansCard } from "@/components/dashboard-v2/implementation-plans-card";
import { WeeklyDocumentationCard } from "@/components/dashboard-v2/weekly-documentation-card";
import { PersonalStatisticsCard } from "@/components/dashboard-v2/personal-statistics-card";

interface DashboardV2Props {
  onSwitchToV1?: () => void;
}

export function DashboardV2({ onSwitchToV1 }: DashboardV2Props) {
  // Enable real-time synchronization
  useRealtimeSync();

  const [activeFilter, setActiveFilter] = useState<FilterType>('senast_uppdaterade');
  const [showAll, setShowAll] = useState(false);

  // Data queries
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: carePlans = [], isLoading: carePlansLoading } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans"],
  });

  const { data: implementationPlans = [], isLoading: implPlansLoading } = useQuery<ImplementationPlan[]>({
    queryKey: ["/api/implementation-plans"],
  });

  const { data: weeklyDocs = [], isLoading: weeklyDocsLoading } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/weekly-documentation"],
  });

  const { data: vimsaTime = [], isLoading: vimsaTimeLoading } = useQuery<VimsaTime[]>({
    queryKey: ["/api/vimsa-time"],
  });

  const isLoading = staffLoading || clientsLoading || carePlansLoading || 
                   implPlansLoading || weeklyDocsLoading || vimsaTimeLoading;

  // Transform data to DashboardItems
  const dashboardItems = useMemo(() => {
    if (isLoading) return [];

    const items: DashboardItem[] = [];
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Create lookup maps
    const clientMap = new Map(clients.map(c => [c.id, c]));
    const staffMap = new Map(staff.map(s => [s.id, s]));

    // Transform care plans
    carePlans.forEach((plan, index) => {
      const client = clientMap.get(plan.clientId);
      const assignedStaff = staffMap.get(plan.staffId);
      if (!client || !assignedStaff) return;

      items.push({
        id: plan.id,
        type: 'carePlan',
        clientId: client.id,
        clientInitials: client.initials,
        clientName: client.initials, // GDPR: visa endast initialer som default
        carePlanIndex: index + 1,
        status: mapCarePlanStatus(plan.status),
        assignedStaff: assignedStaff.name,
        dueDate: plan.updatedAt,
        lastUpdated: plan.updatedAt,
        requiresAction: deriveRequiresAction({
          status: mapCarePlanStatus(plan.status)
        } as DashboardItem),
        actionType: getCarePlanActionType(plan.status)
      });
    });

    // Transform implementation plans
    implementationPlans.forEach((plan, index) => {
      const client = clientMap.get(plan.clientId);
      const assignedStaff = staffMap.get(plan.staffId);
      if (!client || !assignedStaff) return;

      items.push({
        id: plan.id,
        type: 'implementationPlan',
        clientId: client.id,
        clientInitials: client.initials,
        clientName: client.initials,
        implPlanIndex: index + 1,
        status: mapImplPlanStatus(plan.status),
        assignedStaff: assignedStaff.name,
        dueDate: plan.dueDate,
        lastUpdated: plan.updatedAt,
        requiresAction: deriveRequiresAction({
          status: mapImplPlanStatus(plan.status)
        } as DashboardItem),
        actionType: getImplPlanActionType(plan.status)
      });
    });

    // Transform weekly documentation (missing docs)
    clients.forEach(client => {
      const assignedStaff = staffMap.get(client.staffId);
      if (!assignedStaff) return;

      const clientWeeklyDocs = weeklyDocs.filter(doc => doc.clientId === client.id);
      const isMissing = getWeeklyDocMissingThisWeek(clientWeeklyDocs, currentWeek, currentYear);

      if (isMissing) {
        items.push({
          id: `weekly-${client.id}`,
          type: 'weeklyDoc',
          clientId: client.id,
          clientInitials: client.initials,
          clientName: client.initials,
          status: 'active',
          assignedStaff: assignedStaff.name,
          lastUpdated: new Date().toISOString(),
          requiresAction: true,
          actionType: 'document'
        });
      }
    });

    // Transform Vimsa time (missing reports)
    staff.forEach(staffMember => {
      const staffVimsaRecords = vimsaTime.filter(record => record.staffId === staffMember.id);
      const notReported = getNotReportedThisMonth(staffVimsaRecords, currentMonth, currentYear);

      if (notReported) {
        items.push({
          id: `vimsa-${staffMember.id}`,
          type: 'vismaTime',
          clientId: '', // Not client-specific
          clientInitials: staffMember.initials,
          clientName: staffMember.name,
          status: 'active',
          assignedStaff: staffMember.name,
          lastUpdated: new Date().toISOString(),
          requiresAction: true,
          actionType: 'complete'
        });
      }
    });

    return items;
  }, [staff, clients, carePlans, implementationPlans, weeklyDocs, vimsaTime, isLoading]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = showAll ? dashboardItems : filterRequiresAction(dashboardItems);

    // Apply additional filters
    switch (activeFilter) {
      case 'endast_vantande':
        filtered = filtered.filter(item => item.status === 'waiting');
        break;
      case 'endast_forsenade':
        filtered = filtered.filter(item => item.status === 'overdue');
        break;
      case 'senast_skapade':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
        break;
      case 'senast_uppdaterade':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
        break;
    }

    return filtered;
  }, [dashboardItems, activeFilter, showAll]);

  // Group items by type
  const itemsByType = useMemo(() => {
    return {
      carePlans: filteredItems.filter(item => item.type === 'carePlan'),
      implementationPlans: filteredItems.filter(item => item.type === 'implementationPlan'),
      weeklyDocs: filteredItems.filter(item => item.type === 'weeklyDoc'),
      vismaTime: filteredItems.filter(item => item.type === 'vismaTime')
    };
  }, [filteredItems]);

  // Generate team statistics
  const teamStats = useMemo((): TeamStatistik => {
    const totalStaff = staff.length;
    
    // Calculate aggregate statistics (mock data for now)
    const aggregateStats = {
      dokumenteradeDagar: { count: 46, total: 60, percentage: 77 },
      forsenat: { percentage: 14, trend: 'up' as const },
      kvalitetGodkand: { percentage: 83 }
    };

    const individualStats = staff.map(staffMember => ({
      staffName: staffMember.name,
      staffId: staffMember.id,
      dokumenteradeDagar: { count: Math.floor(Math.random() * 20) + 10, total: 30, percentage: Math.floor(Math.random() * 40) + 60 },
      forsenat: { percentage: Math.floor(Math.random() * 30), trend: Math.random() > 0.5 ? 'up' as const : 'down' as const },
      kvalitetGodkand: { percentage: Math.floor(Math.random() * 40) + 60 }
    }));

    return {
      totalStaff,
      aggregateStats,
      individualStats
    };
  }, [staff]);

  // Handle item clicks (drill-down)
  const handleItemClick = (item: DashboardItem) => {
    // TODO: Navigate to detailed view with filter preserved
    console.log('Navigate to detailed view for:', item);
  };

  // Handle view all clicks
  const handleViewAll = (type: string) => {
    // TODO: Navigate to list view with same filter
    console.log('View all for type:', type);
  };

  if (isLoading) {
    return <DashboardV2Skeleton />;
  }

  // Empty state
  const hasActionItems = filterRequiresAction(dashboardItems).length > 0;
  if (!hasActionItems && !showAll) {
    return (
      <div className="p-6 fade-in">
        <DashboardV2Header 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          showAll={showAll}
          onToggleShowAll={setShowAll}
          onSwitchToV1={onSwitchToV1}
        />
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="text-6xl mb-4">👍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Allt i fas</h3>
          <p className="text-gray-600 max-w-md">
            Inga vårdplaner, genomförandeplaner eller dokumentation kräver åtgärd just nu.
          </p>
          <Button 
            onClick={() => setShowAll(true)}
            variant="outline" 
            className="mt-4"
          >
            Visa alla poster
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 fade-in">
      <DashboardV2Header 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showAll={showAll}
        onToggleShowAll={setShowAll}
        onSwitchToV1={onSwitchToV1}
      />

      {/* Main Grid Layout - matches mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        {/* Left Column (60% - 3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Vårdplaner Card */}
          <CarePlansCard 
            items={itemsByType.carePlans}
            onItemClick={handleItemClick}
            onViewAll={() => handleViewAll('carePlans')}
          />

          {/* GFP Card */}
          <ImplementationPlansCard 
            items={itemsByType.implementationPlans}
            onItemClick={handleItemClick}
            onViewAll={() => handleViewAll('implementationPlans')}
          />
        </div>

        {/* Right Column (40% - 2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Veckodokumentation Card */}
          <WeeklyDocumentationCard 
            items={itemsByType.weeklyDocs}
            onItemClick={handleItemClick}
            onViewAll={() => handleViewAll('weeklyDocs')}
          />

          {/* Personal Statistics Card */}
          <PersonalStatisticsCard 
            teamStats={teamStats}
            onViewAll={() => handleViewAll('personalStats')}
          />
        </div>
      </div>
    </div>
  );
}

// Header component with filters
interface DashboardV2HeaderProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  showAll: boolean;
  onToggleShowAll: (show: boolean) => void;
  onSwitchToV1?: () => void;
}

function DashboardV2Header({ 
  activeFilter, 
  onFilterChange, 
  showAll, 
  onToggleShowAll,
  onSwitchToV1 
}: DashboardV2HeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Vårdadmin – Dashboard
          </h1>
          <p className="text-gray-600">
            Handlingsfokuserad översikt av vårdprocesser
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Ny vårdplan
          </Button>
          {onSwitchToV1 && (
            <Button variant="outline" onClick={onSwitchToV1}>
              Tillbaka till V1
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterButton
          active={activeFilter === 'senast_skapade'}
          onClick={() => onFilterChange('senast_skapade')}
        >
          Senast skapade
        </FilterButton>
        <FilterButton
          active={activeFilter === 'senast_uppdaterade'}
          onClick={() => onFilterChange('senast_uppdaterade')}
        >
          Senast uppdaterade
        </FilterButton>
        <FilterButton
          active={activeFilter === 'endast_vantande'}
          onClick={() => onFilterChange('endast_vantande')}
        >
          Endast väntande
        </FilterButton>
        <FilterButton
          active={activeFilter === 'endast_forsenade'}
          onClick={() => onFilterChange('endast_forsenade')}
        >
          Endast försenade
        </FilterButton>
        <FilterButton
          active={showAll}
          onClick={() => onToggleShowAll(!showAll)}
        >
          Visa alla
        </FilterButton>
      </div>
    </div>
  );
}

// Filter button component
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={active ? "bg-blue-600 hover:bg-blue-700" : ""}
    >
      {children}
    </Button>
  );
}

// Skeleton loader
function DashboardV2Skeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function mapCarePlanStatus(status: string): DashboardItem['status'] {
  switch (status) {
    case 'received': return 'waiting';
    case 'staff_notified': return 'waiting';
    case 'in_progress': return 'active';
    case 'completed': return 'completed';
    default: return 'active';
  }
}

function mapImplPlanStatus(status: string): DashboardItem['status'] {
  switch (status) {
    case 'pending': return 'waiting';
    case 'in_progress': return 'active';
    case 'completed': return 'completed';
    default: return 'active';
  }
}

function getCarePlanActionType(status: string): DashboardItem['actionType'] {
  switch (status) {
    case 'received': return 'review';
    case 'staff_notified': return 'review';
    case 'in_progress': return 'update';
    default: return 'update';
  }
}

function getImplPlanActionType(status: string): DashboardItem['actionType'] {
  switch (status) {
    case 'pending': return 'review';
    case 'in_progress': return 'update';
    default: return 'update';
  }
}