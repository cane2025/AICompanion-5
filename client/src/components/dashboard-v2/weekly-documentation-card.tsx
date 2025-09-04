/**
 * Weekly Documentation Card Component
 * 
 * Displays weekly documentation items in a card format matching the mockup design.
 * Shows missing documentation days and action buttons.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

import type { WeeklyDocItem } from '@/types/dashboard-v2';
import { getStatusColor, getActionButtonText, getActionButtonVariant } from '@/types/dashboard-v2';

interface WeeklyDocumentationCardProps {
  items: WeeklyDocItem[];
  showCompleted: boolean;
}

export function WeeklyDocumentationCard({ items, showCompleted }: WeeklyDocumentationCardProps) {
  const [showOnlyOverdue, setShowOnlyOverdue] = React.useState(false);

  const handleItemClick = (item: WeeklyDocItem) => {
    // In real implementation, this would navigate to the weekly documentation view
    console.log('Navigate to weekly documentation:', item.id);
  };

  const handleActionClick = (item: WeeklyDocItem, event: React.MouseEvent) => {
    event.stopPropagation();
    // In real implementation, this would trigger the documentation action
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

  const getDayName = (day: string) => {
    const dayMap: Record<string, string> = {
      'monday': 'Mån',
      'tuesday': 'Tis',
      'wednesday': 'Ons',
      'thursday': 'Tor',
      'friday': 'Fre',
      'saturday': 'Lör',
      'sunday': 'Sön'
    };
    return dayMap[day] || day;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'active':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Filter items based on overdue filter
  const filteredItems = showOnlyOverdue 
    ? items.filter(item => item.status === 'overdue')
    : items;

  return (
    <Card className="shadow-sm border border-gray-200 min-h-[220px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Veckodokumentation
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-overdue"
            checked={showOnlyOverdue}
            onCheckedChange={(checked) => setShowOnlyOverdue(checked === true)}
          />
          <label
            htmlFor="show-overdue"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Visa endast försenade
          </label>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {showOnlyOverdue 
                ? 'Inga försenade dokumentationer' 
                : showCompleted 
                  ? 'Inga veckodokumentationer hittades' 
                  : 'Alla veckodokumentationer är slutförda'
              }
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
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
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Vecka {item.week}, {item.year}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{item.assignedStaff}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  {item.missingDays.length > 0 ? (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-3 w-3" />
                      <span>Saknas: {item.missingDays.map(getDayName).join(', ')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Komplett ({item.documentedDays}/{item.totalDays} dagar)</span>
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
        
        {filteredItems.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-gray-600 hover:text-gray-900"
              onClick={() => console.log('View all weekly documentation')}
            >
              Visa alla veckodokumentationer ({filteredItems.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}