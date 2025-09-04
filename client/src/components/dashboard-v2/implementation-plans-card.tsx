/**
 * Genomförandeplaner (GFP) Card Component - Dashboard V2
 * Feature Flag: UI_DASHBOARD_V2
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, User, AlertCircle } from "lucide-react";
import type { DashboardItem, DashboardCardProps } from "@/types/dashboard-v2";
import { getActionConfig, getStatusConfig } from "@/types/dashboard-v2";

interface ImplementationPlansCardProps extends Omit<DashboardCardProps, 'title'> {
  items: DashboardItem[];
  onItemClick?: (item: DashboardItem) => void;
  onViewAll?: () => void;
}

export function ImplementationPlansCard({ 
  items, 
  isLoading = false, 
  onItemClick, 
  onViewAll,
  className = ""
}: ImplementationPlansCardProps) {
  const actionItemsCount = items.filter(item => item.requiresAction).length;
  const totalCount = items.length;

  if (isLoading) {
    return <ImplementationPlansCardSkeleton />;
  }

  return (
    <Card className={`shadow-sm border border-gray-200 min-h-[220px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg font-semibold">
              GFP – kräver åtgärd ({actionItemsCount} av {totalCount})
            </CardTitle>
          </div>
          {actionItemsCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {actionItemsCount} åtgärder
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {totalCount === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Inga genomförandeplaner att visa</p>
          </div>
        ) : actionItemsCount === 0 ? (
          <div className="text-center py-8 text-green-600">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-medium">Alla GFP är uppdaterade</p>
            <p className="text-sm text-gray-600 mt-1">
              {totalCount} genomförandeplaner i systemet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show only items that require action */}
            {items.filter(item => item.requiresAction).slice(0, 3).map((item) => (
              <ImplementationPlanItem 
                key={item.id} 
                item={item} 
                onClick={() => onItemClick?.(item)}
              />
            ))}
            
            {actionItemsCount > 3 && (
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onViewAll}
                  className="w-full"
                >
                  Visa alla {actionItemsCount} som kräver åtgärd
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ImplementationPlanItemProps {
  item: DashboardItem;
  onClick?: () => void;
}

function ImplementationPlanItem({ item, onClick }: ImplementationPlanItemProps) {
  const actionConfig = getActionConfig(item);
  const statusConfig = getStatusConfig(item.status);
  const isOverdue = item.status === 'overdue';
  
  return (
    <div 
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        isOverdue 
          ? 'border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100' 
          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
            <span className="font-medium text-gray-900">
              {item.clientInitials}
              {item.clientName && item.clientName !== item.clientInitials && (
                <span className="text-gray-600 ml-1">({item.clientName})</span>
              )}
            </span>
            <span className="text-sm text-gray-500">
              – GFP #{item.implPlanIndex}
            </span>
            <Badge className={`text-xs ${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Ansvarig: {item.assignedStaff}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Uppd: {formatDate(item.lastUpdated)}</span>
            </div>
            {item.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <span>Deadline: {formatDate(item.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          variant={actionConfig.variant}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Handle action click
          }}
        >
          {actionConfig.label}
        </Button>
      </div>
    </div>
  );
}

function ImplementationPlansCardSkeleton() {
  return (
    <Card className="shadow-sm border border-gray-200 min-h-[220px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-100">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric'
  });
}