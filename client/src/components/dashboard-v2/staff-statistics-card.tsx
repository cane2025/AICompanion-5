/**
 * Staff Statistics Card Component
 * 
 * Displays staff statistics in a card format matching the mockup design.
 * Shows charts, metrics, and drill-down functionality.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Download,
  ChevronRight
} from 'lucide-react';

import type { StaffStatistics, DashboardStats } from '@/types/dashboard-v2';

interface StaffStatisticsCardProps {
  stats: StaffStatistics[];
  dashboardStats: DashboardStats;
}

export function StaffStatisticsCard({ stats, dashboardStats }: StaffStatisticsCardProps) {
  const handleDrillDown = () => {
    // In real implementation, this would navigate to detailed staff statistics
    console.log('Navigate to detailed staff statistics');
  };

  const handleExport = () => {
    // In real implementation, this would export staff statistics
    console.log('Export staff statistics');
  };

  // Calculate aggregate statistics
  const totalDocumentedDays = stats.reduce((sum, stat) => sum + stat.documentedDays, 0);
  const totalDays = stats.reduce((sum, stat) => sum + stat.totalDays, 0);
  const totalOverdue = stats.reduce((sum, stat) => sum + stat.overdueCount, 0);
  const totalQualityApproved = stats.reduce((sum, stat) => sum + stat.qualityApproved, 0);
  const totalQualityTotal = stats.reduce((sum, stat) => sum + stat.qualityTotal, 0);

  const documentedPercentage = totalDays > 0 ? Math.round((totalDocumentedDays / totalDays) * 100) : 0;
  const overduePercentage = totalDays > 0 ? Math.round((totalOverdue / totalDays) * 100) : 0;
  const qualityPercentage = totalQualityTotal > 0 ? Math.round((totalQualityApproved / totalQualityTotal) * 100) : 0;

  // Calculate trend (simplified - in real implementation this would be more sophisticated)
  const avgTrend = stats.length > 0 
    ? stats.reduce((sum, stat) => sum + stat.trendPercentage, 0) / stats.length 
    : 0;

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="shadow-sm border border-gray-200 min-h-[220px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Statistik – Personalgrupp
        </CardTitle>
        <div className="text-sm text-gray-600">
          Hela teamet ({dashboardStats.totalStaff})
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Dokumenterade dagar</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalDocumentedDays} / {totalDays}
            </div>
            <div className="text-sm text-gray-500">
              {documentedPercentage}% ({100 - documentedPercentage}% ej godkänt)
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Försenat</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-gray-900">
                {totalOverdue}
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(avgTrend)}
                <span className={`text-sm ${getTrendColor(avgTrend)}`}>
                  {Math.abs(avgTrend)}%
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {overduePercentage}% av totalt
            </div>
          </div>
        </div>

        {/* Quality Chart Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Kvalitet godkänd</div>
            <div className="text-lg font-bold text-gray-900">
              {qualityPercentage}%
            </div>
          </div>
          
          {/* Simple donut chart representation */}
          <div className="flex items-center justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${qualityPercentage}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">
                  {qualityPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDrillDown}
            className="flex-1"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Detaljerad vy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="pt-2 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div className="text-center">
              <div className="font-medium text-gray-900">{dashboardStats.activeCarePlans}</div>
              <div>Aktiva vårdplaner</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{dashboardStats.pendingActions}</div>
              <div>Väntande åtgärder</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{dashboardStats.overdueItems}</div>
              <div>Försenade poster</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}