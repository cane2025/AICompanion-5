import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/dashboard-stats";
import { CareOverview } from "@/components/care-overview";
import { StaffStatistics } from "@/components/staff-statistics";
import { DataOverview } from "@/components/data-overview";
import { CompleteWorkflowOverview } from "@/components/complete-workflow-overview";
import { CarePlanDialog } from "@/components/care-plan-dialog";
import { SimpleWorkingCarePlan } from "@/components/simple-working-care-plan";
import { MonthlyReportDialog } from "@/components/monthly-report-dialog";
import { WeeklyDocumentationDialog } from "@/components/weekly-documentation-dialog";
import { VimsaTimeDialog } from "@/components/vimsa-time-dialog";
import { StaffManagement } from "@/components/staff-management";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  BarChart3,
  Heart,
  Clock,
  Plus,
} from "lucide-react";
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
            <h2 className="text-2xl font-bold text-ungdoms-800 mb-2">
              Dashboard - UNGDOMS Öppenvård
            </h2>
            <p className="text-ungdoms-600">
              Överskådlig sammanfattning av vårdplaner, genomförandeplaner och
              personalstatistik
            </p>
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

      <Tabs defaultValue="vardplan" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="vardplan">📋 Vårdplan</TabsTrigger>
          <TabsTrigger value="workflow">🔄 Vårdflöde</TabsTrigger>
          <TabsTrigger value="overview">📊 Översikt</TabsTrigger>
          <TabsTrigger value="care-plans">📁 Vårdplaner & GFP</TabsTrigger>
          <TabsTrigger value="statistics">👥 Personal</TabsTrigger>
          <TabsTrigger value="data-overview">💾 Sparad Data</TabsTrigger>
        </TabsList>

        <TabsContent value="vardplan">
          <div className="py-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-ungdoms-800 mb-4">
                Vårdplan - Snabbstart
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CarePlanDialog
                  trigger={
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-20 flex flex-col items-center justify-center">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm">Skapa Vårdplan</span>
                    </Button>
                  }
                />
                <WeeklyDocumentationDialog
                  trigger={
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white h-20 flex flex-col items-center justify-center">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm">Veckodokumentation</span>
                    </Button>
                  }
                />
                <MonthlyReportDialog
                  trigger={
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-20 flex flex-col items-center justify-center">
                      <Calendar className="h-6 w-6 mb-2" />
                      <span className="text-sm">Månadsrapport</span>
                    </Button>
                  }
                />
                <VimsaTimeDialog
                  trigger={
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white h-20 flex flex-col items-center justify-center">
                      <Clock className="h-6 w-6 mb-2" />
                      <span className="text-sm">Vimsa Tid</span>
                    </Button>
                  }
                />
              </div>
            </div>
            <SimpleWorkingCarePlan />
          </div>
        </TabsContent>

        <TabsContent value="workflow">
          <CompleteWorkflowOverview />
        </TabsContent>

        <TabsContent value="overview">
          <DashboardStats staff={staff} />

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card className="shadow-sm border border-ungdoms-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-ungdoms-700">
                  Aktiv Personal
                </CardTitle>
                <Users className="h-4 w-4 text-ungdoms-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-ungdoms-800">
                  {staff.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  registrerade vårdpersonal
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-ungdoms-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-ungdoms-700">
                  Vårdprocesser
                </CardTitle>
                <Heart className="h-4 w-4 text-ungdoms-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-ungdoms-800">5</div>
                <p className="text-xs text-muted-foreground">
                  steg i vårdprocessen
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-ungdoms-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-ungdoms-700">
                  Statistik & Grafer
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-ungdoms-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-ungdoms-800">📊</div>
                <p className="text-xs text-muted-foreground">
                  detaljerad prestationsanalys
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="care-plans">
          <CareOverview staff={staff} />
        </TabsContent>

        <TabsContent value="statistics">
          <div className="space-y-6">
            <StaffManagement />
            <StaffStatistics staff={staff} />
          </div>
        </TabsContent>

        <TabsContent value="data-overview">
          <DataOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
