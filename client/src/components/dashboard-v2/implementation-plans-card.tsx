/**
 * Implementation Plans (GFP) Card Component
 * 
 * Displays implementation plans in a card format matching the mockup design.
 * Shows "GFP – kräver åtgärd (X av Y)" format and action buttons.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  User, 
  Calendar, 
  Clock,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

import type { ImplementationPlanItem } from '@/types/dashboard-v2';
import { getStatusColor, getActionButtonText, getActionButtonVariant } from '@/types/dashboard-v2';

interface ImplementationPlansCardProps {
  items: ImplementationPlanItem[];
  showCompleted: boolean;
}

export function ImplementationPlansCard({ items, showCompleted }: ImplementationPlansCardProps) {
  const handleItemClick = (item: ImplementationPlanItem) => {
    // In real implementation, this would navigate to the implementation plan detail view
    console.log('Navigate to implementation plan:', item.id);
  };

  const handleActionClick = (item: ImplementationPlanItem, event: React.MouseEvent) => {
    event.stopPropagation();
    // In real implementation, this would trigger the appropriate action
    console.log('Action clicked:', item.actionType, 'for item:', item.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Väntar';
      case 'active': return 'Aktiv';
      case 'overdue': return 'Försenad';
      case 'completed': return 'Slutförd';
      default: return status;
    }
  };

  // Calculate summary for card title
  const itemsRequiringAction = items.filter(item => item.requiresAction);
  const totalItems = items.length;

  return (
    <Card className="shadow-sm border border-gray-200 min-h-[220px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Genomförandeplaner (GFP)
        </CardTitle>
        <div className="text-sm text-gray-600">
          {itemsRequiringAction.length > 0 && (
            <span className="text-orange-600 font-medium">
              Kräver åtgärd ({itemsRequiringAction.length} av {totalItems})
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {showCompleted ? 'Inga genomförandeplaner hittades' : 'Alla genomförandeplaner är slutförda'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {item.clientInitials}
                    </span>
                    {item.clientName && (
                      <span className="text-gray-600 text-sm">
                        ({item.clientName})
                      </span>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusColor(item.status)}`}
                  >
                    {getStatusText(item.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    <span>GFP #{item.implPlanIndex}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{item.assignedStaff}</span>
                  </div>
                  {item.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.dueDate)}</span>
                    </div>
                  )}
                </div>
                
                {item.planContent && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {item.planContent}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {item.actionType && (
                  <Button
                    size="sm"
                    variant={getActionButtonVariant(item.actionType) as any}
                    onClick={(e) => handleActionClick(item, e)}
                    className="text-xs"
                  >
                    {getActionButtonText(item.actionType)}
                  </Button>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))
        )}
        
        {items.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-gray-600 hover:text-gray-900"
              onClick={() => console.log('View all implementation plans')}
            >
              Visa alla genomförandeplaner ({items.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}