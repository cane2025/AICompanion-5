/**
 * Empty State Component
 * 
 * Displays when there are no items requiring action, showing "Allt i fas 👍"
 * as specified in the requirements.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Plus, 
  Calendar,
  FileText,
  Eye
} from 'lucide-react';

interface EmptyStateProps {
  className?: string;
}

export function EmptyState({ className = '' }: EmptyStateProps) {
  const handleCreateCarePlan = () => {
    // In real implementation, this would open the care plan creation dialog
    console.log('Create new care plan');
  };

  const handleViewAll = () => {
    // In real implementation, this would show all items including completed
    console.log('View all items');
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <Card className="max-w-md w-full shadow-sm border border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Allt i fas 👍
            </h2>
            <p className="text-gray-600">
              Inga poster kräver åtgärd just nu. Alla vårdplaner, genomförandeplaner 
              och dokumentationer är uppdaterade.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleCreateCarePlan}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Skapa ny vårdplan
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleViewAll}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visa alla poster
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Snabbåtgärder:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Veckodokumentation
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Månadsrapport
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}