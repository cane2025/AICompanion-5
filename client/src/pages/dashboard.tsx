import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardOverview } from "@/components/dashboard-overview";
import { CarePlanDialog } from "@/components/care-plan-dialog";
import { MonthlyReportDialog } from "@/components/monthly-report-dialog";
import { WeeklyDocumentationDialog } from "@/components/weekly-documentation-dialog";
import { VimsaTimeDialog } from "@/components/vimsa-time-dialog";
import { TodayFocus } from "@/components/today-focus";
import { RecentActivity } from "@/components/recent-activity";
import { StaffManagement } from "@/components/staff-management";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { FileText, Calendar, Clock } from "lucide-react";
import type { Staff } from "@shared/schema";

export function Dashboard() {
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

  if (staff.length === 0) {
    return (
      <div className="p-6 text-center text-ungdoms-600">
        <div className="font-bold mb-2">Ingen personal hittades.</div>
        <div className="text-sm mb-4">
          Lägg till personal för att komma igång med systemet.
        </div>
        <div className="text-sm">
          Gå till fliken <strong>"👥 Personal"</strong> för att lägga till ny
          personal.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 fade-in">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ungdoms-800 mb-2">Dashboard - UNGDOMS Öppenvård</h2>
            <p className="text-ungdoms-600">Översikt och snabb åtkomst – inga dubletter</p>
          </div>
          <div className="flex gap-2">
            <CarePlanDialog
              trigger={
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Skapa Vårdplan
                </Button>
              }
            />
            <WeeklyDocumentationDialog
              trigger={
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Veckodokumentation
                </Button>
              }
            />
            <MonthlyReportDialog
              trigger={
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  Månadsrapport
                </Button>
              }
            />
            <VimsaTimeDialog
              trigger={
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Clock className="h-4 w-4 mr-2" />
                  Vimsa Tid
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Overview panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodayFocus />
          <RecentActivity />
        </div>
        <div className="lg:col-span-1">
          <DashboardOverview staff={staff} />
        </div>
      </div>
    </div>
  );
}
