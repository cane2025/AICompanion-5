/**
 * Veckodokumentation Card Component - Dashboard V2
 * Feature Flag: UI_DASHBOARD_V2
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";
import type { DashboardItem, DashboardCardProps } from "@/types/dashboard-v2";

interface WeeklyDocumentationCardProps extends Omit<DashboardCardProps, 'title'> {
  items: DashboardItem[];
  onItemClick?: (item: DashboardItem) => void;
  onViewAll?: () => void;
}

export function WeeklyDocumentationCard({ 
  items, 
  isLoading = false, 
  onItemClick, 
  onViewAll,
  className = ""
}: WeeklyDocumentationCardProps) {
  const missingDocsCount = items.length;

  if (isLoading) {
    return <WeeklyDocumentationCardSkeleton />;
  }

  return (
    <Card className={`shadow-sm border border-gray-200 min-h-[220px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold">Veckodokumentation</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              Visa endast försende
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {missingDocsCount === 0 ? (
          <div className="text-center py-8 text-green-600">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">Dokumenterade dagar</p>
            <p className="text-sm text-gray-600 mt-1">46</p>
            <Badge className="bg-green-100 text-green-800 mt-2">Ej godkänt 17%</Badge>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Dokumenterade</Badge>
                <Badge className="bg-red-100 text-red-800">Saknas</Badge>
              </div>
              <div className="text-sm text-gray-600">
                Försenat <span className="text-green-600">1 14 %</span>
              </div>
            </div>

            {/* Show missing documentation items */}
            {items.slice(0, 3).map((item) => (
              <WeeklyDocItem 
                key={item.id} 
                item={item} 
                onClick={() => onItemClick?.(item)}
              />
            ))}
            
            {missingDocsCount > 3 && (
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onViewAll}
                  className="w-full"
                >
                  Visa alla {missingDocsCount} klienter med saknad dokumentation
                </Button>
              </div>
            )}

            {/* Weekly overview chart placeholder */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-end h-16 px-2">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">23</div>
                  <div className="w-6 bg-blue-200 rounded-t" style={{height: '20px'}}></div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">25</div>
                  <div className="w-6 bg-blue-300 rounded-t" style={{height: '35px'}}></div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">25</div>
                  <div className="w-6 bg-blue-400 rounded-t" style={{height: '30px'}}></div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">25</div>
                  <div className="w-6 bg-blue-500 rounded-t" style={{height: '40px'}}></div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">25</div>
                  <div className="w-6 bg-blue-600 rounded-t" style={{height: '45px'}}></div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">32</div>
                  <div className="w-6 bg-blue-700 rounded-t" style={{height: '50px'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface WeeklyDocItemProps {
  item: DashboardItem;
  onClick?: () => void;
}

function WeeklyDocItem({ item, onClick }: WeeklyDocItemProps) {
  // Mock missing days data - in real implementation, this would come from the item
  const missingDays = ['mån', 'tis']; // Example missing days
  
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
            </span>
            <span className="text-sm text-gray-500">
              – Saknas {missingDays.join(', ')}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{item.assignedStaff}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Deadline: {getCurrentWeekEnd()}</span>
            </div>
          </div>
        </div>
        
        <Button 
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Handle document action
          }}
        >
          Dokumentera →
        </Button>
      </div>
    </div>
  );
}

function WeeklyDocumentationCardSkeleton() {
  return (
    <Card className="shadow-sm border border-gray-200 min-h-[220px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-100">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-end h-16">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-6 bg-gray-200 rounded-t animate-pulse" style={{height: `${20 + i * 5}px`}}></div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getCurrentWeekEnd(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + daysUntilSunday);
  
  return weekEnd.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric'
  });
}