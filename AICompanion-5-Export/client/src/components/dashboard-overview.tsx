import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp
} from "lucide-react";
import type { Staff, CarePlan, WeeklyDocumentation, MonthlyReport, ImplementationPlan } from "@shared/schema";

interface DashboardOverviewProps {
  staff: Staff[];
}

export function DashboardOverview({ staff }: DashboardOverviewProps) {
  // Fetch overview data
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans/all"],
  });

  const { data: weeklyDocs = [] } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/weekly-documentation/all"],
  });

  const { data: monthlyReports = [] } = useQuery<MonthlyReport[]>({
    queryKey: ["/api/monthly-reports/all"],
  });

  // Added: implementation plans (GFP)
  const { data: implementationPlans = [] } = useQuery<ImplementationPlan[]>({
    queryKey: ["/api/implementation-plans/all"],
  });

  // Calculate statistics
  const totalCarePlans = carePlans.length;
  const completedCarePlans = carePlans.filter(cp => cp.status === "completed").length;
  const pendingCarePlans = carePlans.filter(cp => cp.status !== "completed").length;

  // GFP stats (implementation plans)
  const totalGfp = implementationPlans.length;
  const completedGfp = implementationPlans.filter(p => p.status === "completed").length;
  const overdueGfp = implementationPlans.filter(p => {
    if (!p.dueDate) return false;
    // p.dueDate may be Date or string; normalize
    const due = new Date(p.dueDate as any);
    if (isNaN(due.getTime())) return false;
    return p.status !== "completed" && due < new Date();
  }).length;
  const gfpCompletion = totalGfp > 0 ? (completedGfp / totalGfp) * 100 : 0;

  const currentWeek = Math.ceil((new Date().getTime() - new Date(2025, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const expectedWeeklyDocs = staff.length * Math.max(0, currentWeek - 33); // From week 34
  const actualWeeklyDocs = weeklyDocs.length;
  const weeklyDocCompletion = expectedWeeklyDocs > 0 ? (actualWeeklyDocs / expectedWeeklyDocs) * 100 : 100;

  const currentMonth = new Date().getMonth() + 1;
  const expectedMonthlyReports = staff.length * Math.max(0, currentMonth - 7); // From August (month 8)
  const submittedMonthlyReports = monthlyReports.filter(mr => mr.status === "completed").length;
  const monthlyReportCompletion = expectedMonthlyReports > 0 ? (submittedMonthlyReports / expectedMonthlyReports) * 100 : 100;

  const careplanCompletion = totalCarePlans > 0 ? (completedCarePlans / totalCarePlans) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-ungdoms-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ungdoms-700">
              Vårdplaner
            </CardTitle>
            <FileText className="h-4 w-4 text-ungdoms-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ungdoms-800">{totalCarePlans}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={careplanCompletion} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">{Math.round(careplanCompletion)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCarePlans} slutförda, {pendingCarePlans} pågående
            </p>
          </CardContent>
        </Card>

        <Card className="border-ungdoms-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ungdoms-700">
              Genomförandeplaner (GFP)
            </CardTitle>
            <Calendar className="h-4 w-4 text-ungdoms-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ungdoms-800">{totalGfp}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={gfpCompletion} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">{Math.round(gfpCompletion)}%</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {overdueGfp > 0 && (
                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {overdueGfp} försenade
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {completedGfp} slutförda
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-ungdoms-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ungdoms-700">
              Aktiv Personal
            </CardTitle>
            <Users className="h-4 w-4 text-ungdoms-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ungdoms-800">{staff.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Registrerade vårdpersonal i systemet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-ungdoms-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ungdoms-800">
              <FileText className="h-5 w-5" />
              Veckodokumentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fullföljd dokumentation</span>
                <span className="text-sm text-muted-foreground">
                  {actualWeeklyDocs} / {expectedWeeklyDocs}
                </span>
              </div>
              <Progress value={weeklyDocCompletion} className="h-3" />
              <div className="flex items-center gap-2">
                <Badge className={
                  weeklyDocCompletion >= 90 ? "bg-green-100 text-green-800 border-green-200" :
                  weeklyDocCompletion >= 75 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                  "bg-red-100 text-red-800 border-red-200"
                }>
                  {Math.round(weeklyDocCompletion)}% slutfört
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Vecka 34 - nuvarande vecka
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-ungdoms-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ungdoms-800">
              <Calendar className="h-5 w-5" />
              Månadsrapporter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inlämnade rapporter</span>
                <span className="text-sm text-muted-foreground">
                  {submittedMonthlyReports} / {expectedMonthlyReports}
                </span>
              </div>
              <Progress value={monthlyReportCompletion} className="h-3" />
              <div className="flex items-center gap-2">
                <Badge className={
                  monthlyReportCompletion >= 90 ? "bg-green-100 text-green-800 border-green-200" :
                  monthlyReportCompletion >= 75 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                  "bg-red-100 text-red-800 border-red-200"
                }>
                  {Math.round(monthlyReportCompletion)}% inlämnade
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Augusti - nuvarande månad
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card className="border-ungdoms-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-ungdoms-800">
            <TrendingUp className="h-5 w-5" />
            Färgkodning och Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-ungdoms-700">Statusfärger</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Grön - Slutförd/Godkänd/OK</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Gul - Pågående/Sådär/Väntande</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">Röd - Försenad/Ej godkänd/Problem</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <span className="text-sm">Grå - Ingen färg/Neutral</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-ungdoms-700">Viktiga Deadlines</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ungdoms-500" />
                  <span>GFP: 3 veckor från personal tillsagd</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-ungdoms-500" />
                  <span>Veckodokumentation: Löpande vecka 34-52</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-ungdoms-500" />
                  <span>Månadsrapporter: Augusti-December</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-ungdoms-700">Automatiska Markeringar</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>GFP blir automatiskt röd om försenad</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Status blir grön vid slutförande</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>Påminnelser för kommande deadlines</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}