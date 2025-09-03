import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CarePlanDialog } from "@/components/care-plan-dialog";
import { WeeklyDocumentationDialog } from "@/components/weekly-documentation-dialog";
import { MonthlyReportDialog } from "@/components/monthly-report-dialog";
import { VimsaTimeDialog } from "@/components/vimsa-time-dialog";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { TodaysFocus } from "@/components/todays-focus";
import { RecentWork } from "@/components/recent-work";
import { SmartStaffList } from "@/components/smart-staff-list";
import { DashboardQuickStats } from "@/components/dashboard-quick-stats";
import {
  FileText,
  BarChart3,
  Clock,
} from "lucide-react";
import type { Staff } from "@shared/schema";

export function ModernDashboard() {
  // Enable real-time synchronization
  useRealtimeSync();

  const {
    data: staff = [],
    isLoading: staffLoading,
    isError: staffError,
    error,
  } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  if (staffLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (staffError) {
    return (
      <div className="p-6 text-red-600">
        <div className="font-bold mb-2">Kunde inte ladda personaldata.</div>
        <div className="text-sm">
          {error instanceof Error ? error.message : "Något gick fel."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          UNGDOMS Öppenvård – Dashboard
        </h1>
        <p className="text-gray-600">
          Klienthantering och uppföljning för vårdpersonal
        </p>
      </div>

      {/* Primary Actions - Top Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <CarePlanDialog
          trigger={
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Skapa Vårdplan</span>
            </Button>
          }
        />
        <WeeklyDocumentationDialog
          trigger={
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Veckodokumentation</span>
            </Button>
          }
        />
        <MonthlyReportDialog
          trigger={
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12 flex items-center justify-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Månadsrapport</span>
            </Button>
          }
        />
        <VimsaTimeDialog
          trigger={
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Vimsa Tid</span>
            </Button>
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Staff List */}
        <div className="lg:col-span-3">
          <SmartStaffList staff={staff} />
        </div>

        {/* Center Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Today's Focus and Recent Work */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TodaysFocus />
            <RecentWork />
          </div>

          {/* Quick Stats */}
          <DashboardQuickStats />
        </div>
      </div>
    </div>
  );
}