/**
 * Vårdplaner Card Component - Dashboard V2
 * Feature Flag: UI_DASHBOARD_V2
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, User } from "lucide-react";
import type { DashboardItem, DashboardCardProps } from "@/types/dashboard-v2";
import { getActionConfig, getStatusConfig } from "@/types/dashboard-v2";

interface CarePlansCardProps extends Omit<DashboardCardProps, 'title'> {
  items: DashboardItem[];
  onItemClick?: (item: DashboardItem) => void;
  onViewAll?: () => void;
}

export function CarePlansCard({ 
  items, 
  isLoading = false, 
  onItemClick, 
  onViewAll,
  className = ""
}: CarePlansCardProps) {
  const actionItemsCount = items.filter(item => item.requiresAction).length;
  const totalCount = items.length;

  if (isLoading) {
    return <CarePlansCardSkeleton />;
  }

  return (
    <Card className={`shadow-sm border border-gray-200 min-h-[220px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">Vårdplaner</CardTitle>
          </div>
          {totalCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {actionItemsCount > 0 ? `${actionItemsCount} kräver åtgärd` : `${totalCount} totalt`}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {totalCount === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Inga vårdplaner att visa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show max 3 items, paginate rest */}
            {items.slice(0, 3).map((item) => (
              <CarePlanItem 
                key={item.id} 
                item={item} 
                onClick={() => onItemClick?.(item)}
              />
            ))}
            
            {totalCount > 3 && (
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onViewAll}
                  className="w-full"
                >
                  Visa alla {totalCount} vårdplaner
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CarePlanItemProps {
  item: DashboardItem;
  onClick?: () => void;
}

function CarePlanItem({ item, onClick }: CarePlanItemProps) {
  const actionConfig = getActionConfig(item);
  const statusConfig = getStatusConfig(item.status);
  
  return (
    <div 
      className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {item.clientInitials}
              {item.clientName && item.clientName !== item.clientInitials && (
                <span className="text-gray-600 ml-1">({item.clientName})</span>
              )}
            </span>
            <span className="text-sm text-gray-500">
              – Vårdplan #{item.carePlanIndex}
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

function CarePlansCardSkeleton() {
  return (
    <Card className="shadow-sm border border-gray-200 min-h-[220px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
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