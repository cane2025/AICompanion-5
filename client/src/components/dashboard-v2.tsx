/**
 * Dashboard V2 - Main Component
 * 
 * This is the main Dashboard V2 component that implements the two-column grid layout
 * as specified in the requirements. It matches the mockup design and includes
 * all the required functionality.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Filter, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown,
  Users,
  FileText,
  Calendar,
  Clock
} from 'lucide-react';

import { CarePlansCard } from './dashboard-v2/care-plans-card';
import { ImplementationPlansCard } from './dashboard-v2/implementation-plans-card';
import { WeeklyDocumentationCard } from './dashboard-v2/weekly-documentation-card';
import { StaffStatisticsCard } from './dashboard-v2/staff-statistics-card';
import { DashboardFilters } from './dashboard-v2/dashboard-filters';
import { EmptyState } from './dashboard-v2/empty-state';

import type { 
  DashboardFilters as FilterType, 
  DashboardItem,
  CarePlanItem,
  ImplementationPlanItem,
  WeeklyDocItem,
  StaffStatistics,
  DashboardStats 
} from '@/types/dashboard-v2';
import { mockDashboardData } from '@/data/dashboard-v2-mock';

interface DashboardV2Props {
  className?: string;
}

export function DashboardV2({ className = '' }: DashboardV2Props) {
  const [filters, setFilters] = useState<FilterType>({
    type: 'latestUpdated',
    showCompleted: false
  });

  // Get mock data (in real implementation, this would come from API)
  const {
    carePlans,
    implementationPlans,
    weeklyDocs,
    vismaTime,
    staffStats,
    dashboardStats
  } = mockDashboardData;

  // Filter items based on current filters
  const filteredItems = useMemo(() => {
    let items: DashboardItem[] = [
      ...carePlans,
      ...implementationPlans,
      ...weeklyDocs,
      ...vismaTime
    ];

    // Apply status filter
    if (!filters.showCompleted) {
      items = items.filter(item => item.requiresAction);
    }

    // Apply type filter
    switch (filters.type) {
      case 'waitingOnly':
        items = items.filter(item => item.status === 'waiting');
        break;
      case 'overdueOnly':
        items = items.filter(item => item.status === 'overdue');
        break;
      case 'latestCreated':
        // Sort by creation date (using lastUpdated as proxy)
        items.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      case 'latestUpdated':
      default:
        // Sort by last updated
        items.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
    }

    return items;
  }, [carePlans, implementationPlans, weeklyDocs, vismaTime, filters]);

  // Get items requiring action for summary
  const itemsRequiringAction = useMemo(() => {
    return filteredItems.filter(item => item.requiresAction);
  }, [filteredItems]);

  // Check if we have any items requiring action
  const hasItemsRequiringAction = itemsRequiringAction.length > 0;

  const handleFilterChange = (newFilters: Partial<FilterType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleShowAllToggle = () => {
    setFilters(prev => ({ ...prev, showCompleted: !prev.showCompleted }));
  };

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vårdadmin – Dashboard
          </h1>
          <p className="text-gray-600">
            Handlingsfokuserad översikt av vårdplaner och personalstatistik
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShowAllToggle}
            className="flex items-center gap-2"
          >
            {filters.showCompleted ? (
              <>
                <EyeOff className="h-4 w-4" />
                Dölj slutförda
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Visa alla
              </>
            )}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Ny vårdplan
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilters 
        filters={filters}
        onFiltersChange={handleFilterChange}
        totalItems={filteredItems.length}
        itemsRequiringAction={itemsRequiringAction.length}
      />

      {/* Main Content */}
      {!hasItemsRequiringAction && !filters.showCompleted ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 60% width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Care Plans Card */}
            <CarePlansCard 
              items={filteredItems.filter(item => item.type === 'carePlan') as CarePlanItem[]}
              showCompleted={filters.showCompleted}
            />

            {/* Implementation Plans Card */}
            <ImplementationPlansCard 
              items={filteredItems.filter(item => item.type === 'implementationPlan') as ImplementationPlanItem[]}
              showCompleted={filters.showCompleted}
            />
          </div>

          {/* Right Column - 40% width */}
          <div className="space-y-6">
            {/* Weekly Documentation Card */}
            <WeeklyDocumentationCard 
              items={filteredItems.filter(item => item.type === 'weeklyDoc') as WeeklyDocItem[]}
              showCompleted={filters.showCompleted}
            />

            {/* Staff Statistics Card */}
            <StaffStatisticsCard 
              stats={staffStats}
              dashboardStats={dashboardStats}
            />
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {hasItemsRequiringAction && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {itemsRequiringAction.length} poster kräver åtgärd
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-green-700">
                  {dashboardStats.totalStaff} personalmedlemmar
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                Kvalitet: {dashboardStats.qualityScore}%
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}