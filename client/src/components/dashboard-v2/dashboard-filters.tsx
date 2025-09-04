/**
 * Dashboard Filters Component
 * 
 * Provides filtering controls for the dashboard including:
 * - Latest created/updated
 * - Waiting only
 * - Overdue only
 * - Show all
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Calendar,
  TrendingUp
} from 'lucide-react';

import type { DashboardFilters as FilterType } from '@/types/dashboard-v2';

interface DashboardFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: Partial<FilterType>) => void;
  totalItems: number;
  itemsRequiringAction: number;
}

export function DashboardFilters({ 
  filters, 
  onFiltersChange, 
  totalItems, 
  itemsRequiringAction 
}: DashboardFiltersProps) {
  const filterOptions = [
    {
      key: 'latestUpdated' as const,
      label: 'Senast uppdaterade',
      icon: TrendingUp,
      description: 'Sortera efter senaste uppdatering'
    },
    {
      key: 'latestCreated' as const,
      label: 'Senast skapade',
      icon: Calendar,
      description: 'Sortera efter skapandedatum'
    },
    {
      key: 'waitingOnly' as const,
      label: 'Endast väntande',
      icon: Clock,
      description: 'Visa endast poster som väntar på åtgärd'
    },
    {
      key: 'overdueOnly' as const,
      label: 'Endast försenade',
      icon: AlertTriangle,
      description: 'Visa endast försenade poster'
    },
    {
      key: 'showAll' as const,
      label: 'Visa alla',
      icon: Eye,
      description: 'Visa alla poster inklusive slutförda'
    }
  ];

  const handleFilterChange = (filterType: FilterType['type']) => {
    onFiltersChange({ type: filterType });
  };

  const getFilterIcon = (filterType: FilterType['type']) => {
    const option = filterOptions.find(opt => opt.key === filterType);
    return option ? option.icon : Filter;
  };

  const getFilterLabel = (filterType: FilterType['type']) => {
    const option = filterOptions.find(opt => opt.key === filterType);
    return option ? option.label : filterType;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filter & Sortering</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            {itemsRequiringAction} kräver åtgärd
          </Badge>
          <Badge variant="secondary" className="text-gray-700">
            {totalItems} totalt
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const isActive = filters.type === option.key;
          
          return (
            <Button
              key={option.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(option.key)}
              className={`flex items-center gap-2 ${
                isActive 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'hover:bg-gray-100'
              }`}
              title={option.description}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Active Filter Display */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Aktivt filter:</span>
          <Badge variant="secondary" className="flex items-center gap-1">
            {React.createElement(getFilterIcon(filters.type), { className: "h-3 w-3" })}
            {getFilterLabel(filters.type)}
          </Badge>
          {filters.showCompleted && (
            <Badge variant="outline" className="text-green-700 border-green-300">
              Inkluderar slutförda
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}