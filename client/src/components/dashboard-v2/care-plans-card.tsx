/**
 * Care Plans Card Component
 * 
 * Displays care plans in a card format matching the mockup design.
 * Shows client initials, names (if policy allows), status, and action buttons.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  User, 
  Calendar, 
  Clock,
  ChevronRight
} from 'lucide-react';

import type { CarePlanItem } from '@/types/dashboard-v2';
import { getStatusColor, getActionButtonText, getActionButtonVariant } from '@/types/dashboard-v2';

interface CarePlansCardProps {
  items: CarePlanItem[];
  showCompleted: boolean;
}

export function CarePlansCard({ items, showCompleted }: CarePlansCardProps) {
  const handleItemClick = (item: CarePlanItem) => {
    // In real implementation, this would navigate to the care plan detail view
    console.log('Navigate to care plan:', item.id);
  };

  const handleActionClick = (item: CarePlanItem, event: React.MouseEvent) => {
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

  return (
    <Card className="shadow-sm border border-gray-200 min-h-[220px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Vårdplaner
        </CardTitle>
        <Button 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => console.log('Create new care plan')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Ny vårdplan
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {showCompleted ? 'Inga vårdplaner hittades' : 'Alla vårdplaner är slutförda'}
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
                    <FileText className="h-3 w-3" />
                    <span>Vårdplan #{item.carePlanIndex}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{item.responsibleStaff}</span>
                  </div>
                  {item.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.dueDate)}</span>
                    </div>
                  )}
                </div>
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
              onClick={() => console.log('View all care plans')}
            >
              Visa alla vårdplaner ({items.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}