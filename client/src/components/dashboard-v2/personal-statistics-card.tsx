/**
 * Personal Statistics Card Component - Dashboard V2
 * Feature Flag: UI_DASHBOARD_V2
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TeamStatistik } from "@/types/dashboard-v2";

interface PersonalStatisticsCardProps {
  teamStats: TeamStatistik;
  onViewAll?: () => void;
  className?: string;
}

export function PersonalStatisticsCard({ 
  teamStats, 
  onViewAll,
  className = ""
}: PersonalStatisticsCardProps) {
  const { totalStaff, aggregateStats } = teamStats;

  return (
    <Card className={`shadow-sm border border-gray-200 min-h-[220px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg font-semibold">
              Statistik – Personal
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
            hela teamet ({totalStaff})
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Aggregate Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dokumenterade dagar</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {aggregateStats.dokumenteradeDagar.count} / {aggregateStats.dokumenteradeDagar.total}
                </span>
                <Badge className="bg-gray-100 text-gray-800 text-xs">
                  {aggregateStats.dokumenteradeDagar.percentage}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Försenat</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600">
                  {aggregateStats.forsenat.percentage}%
                </span>
                <TrendIcon trend={aggregateStats.forsenat.trend} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Kvalitet godkänd</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {aggregateStats.kvalitetGodkand.percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Visual Elements - matching mockup */}
          <div className="flex items-center justify-between pt-4 border-t">
            {/* Line Chart Placeholder */}
            <div className="flex-1 mr-4">
              <div className="h-16 relative">
                <svg viewBox="0 0 120 40" className="w-full h-full">
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    points="0,30 20,25 40,20 60,15 80,18 100,12 120,10"
                  />
                  <circle cx="120" cy="10" r="3" fill="#3B82F6" />
                </svg>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>23</span>
                <span>25</span>
                <span>25</span>
                <span>25</span>
                <span>25</span>
                <span>32</span>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <DonutChart percentage={aggregateStats.kvalitetGodkand.percentage} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {aggregateStats.kvalitetGodkand.percentage}%
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-600 mt-1">Kvalitet godkänd</span>
            </div>
          </div>

          {/* Weekly Stats */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                📊 vecek
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">14%</span>
                <span className="text-sm text-gray-500">Ej godkänt 17%</span>
              </div>
            </div>
            
            {/* Mini line chart */}
            <div className="h-8 mb-2">
              <svg viewBox="0 0 80 20" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  points="0,15 15,12 30,10 45,8 60,11 75,6"
                />
              </svg>
            </div>
          </div>

          {/* View All Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewAll}
            className="w-full mt-4"
          >
            Visa detaljerad personalstatistik
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface TrendIconProps {
  trend: 'up' | 'down' | 'stable';
}

function TrendIcon({ trend }: TrendIconProps) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    case 'stable':
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
}

interface DonutChartProps {
  percentage: number;
}

function DonutChart({ percentage }: DonutChartProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
      {/* Background circle */}
      <circle
        cx="32"
        cy="32"
        r={radius}
        stroke="#E5E7EB"
        strokeWidth="6"
        fill="none"
      />
      {/* Progress circle */}
      <circle
        cx="32"
        cy="32"
        r={radius}
        stroke="#3B82F6"
        strokeWidth="6"
        fill="none"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="transition-all duration-300 ease-in-out"
      />
    </svg>
  );
}

function PersonalStatisticsCardSkeleton() {
  return (
    <Card className="shadow-sm border border-gray-200 min-h-[220px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="h-16 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>
          
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse mt-4" />
        </div>
      </CardContent>
    </Card>
  );
}