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
import { MonthlyReportDialog } from "@/components/monthly-report-dialog";
import { WeeklyDocumentationDialog } from "@/components/weekly-documentation-dialog";
import { VimsaTimeDialog } from "@/components/vimsa-time-dialog";
import { StaffManagement } from "@/components/staff-management";
import { DashboardOverview } from "@/components/dashboard-overview";
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
  Search,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  FileText as FileTextIcon,
  Clock as TimeIcon,
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

  // Mock data for today's focus - in real implementation this would come from API
  const todaysFocus = {
    carePlansToReview: 3,
    weeklyDocsToComplete: 5,
    monthlyReportsDue: 2,
    activeStaffToday: staff.filter(s => s.name.includes("Mirza") || s.name.includes("Anna")).length
  };

  // Mock data for recent work - in real implementation this would come from user activity
  const recentWork = [
    { client: "A.B.", type: "Vårdplan", time: "för 2 timmar sedan" },
    { client: "C.D.", type: "Veckodok", time: "igår 16:45" },
    { client: "E.F.", type: "Månadsrapport", time: "måndag" }
  ];

  return (
    <div className="p-6 fade-in">
      {/* Header Section */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-ungdoms-800 mb-2">
            Dashboard - UNGDOMS Öppenvård
          </h1>
          <p className="text-ungdoms-600 text-lg">
            Öppenvård Administrativt System
          </p>
          <p className="text-ungdoms-500">
            Klienthantering och uppföljning för vårdpersonal
          </p>
        </div>
        
        {/* Primary Action Buttons - NO DUPLICATES */}
        <div className="flex justify-center gap-4 mb-8">
          <CarePlanDialog
            trigger={
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 h-12">
                <FileTextIcon className="h-5 w-5 mr-2" />
                Skapa Vårdplan
              </Button>
            }
          />
          <WeeklyDocumentationDialog
            trigger={
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 h-12">
                <FileTextIcon className="h-5 w-5 mr-2" />
                Veckodokumentation
              </Button>
            }
          />
          <MonthlyReportDialog
            trigger={
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 h-12">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Månadsrapport
              </Button>
            }
          />
          <VimsaTimeDialog
            trigger={
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 h-12">
                <TimeIcon className="h-5 w-5 mr-2" />
                Vimsa Tid
              </Button>
            }
          />
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Staff List */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border border-ungdoms-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-ungdoms-600" />
                PERSONAL ({staff.length})
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök personal..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ungdoms-500 focus:border-transparent"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.slice(0, 6).map((staffMember) => (
                <div key={staffMember.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="h-8 w-8 bg-ungdoms-100 rounded-full flex items-center justify-center">
                    <span className="text-ungdoms-700 font-medium text-sm">
                      {staffMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {staffMember.name}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {staffMember.roll || 'sjuksköterska'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-gray-500">2/5</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    ⋮
                  </Button>
                </div>
              ))}
              {staff.length > 6 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" className="text-ungdoms-600">
                    Visa alla ({staff.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Columns - Focus Panels */}
        <div className="lg:col-span-2">
          <DashboardOverview todaysFocus={todaysFocus} recentWork={recentWork} />
        </div>
      </div>

      {/* Navigation Tabs - Below Main Content */}
      <div className="mt-8">
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
            <div className="py-6">
              <div className="text-center py-12">
                <div className="bg-ungdoms-50 rounded-lg p-8 border border-ungdoms-200 max-w-md mx-auto">
                  <FileText className="h-16 w-16 text-ungdoms-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-ungdoms-800 mb-2">
                    Vårdplaner
                  </h3>
                  <p className="text-ungdoms-600 mb-4">
                    Använd knappen "Skapa Vårdplan" ovan för att komma igång
                  </p>
                  <CarePlanDialog
                    trigger={
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <FileText className="h-4 w-4 mr-2" />
                        Skapa Vårdplan
                      </Button>
                    }
                  />
                </div>
              </div>
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
    </div>
  );
}
