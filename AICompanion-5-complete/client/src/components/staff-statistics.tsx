import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import type { Staff, Client, WeeklyDocumentation, MonthlyReport, VimsaTime } from "@shared/schema";

interface StaffStatisticsProps {
  staff: Staff[];
}

interface StaffPerformance {
  staffId: string;
  staffName: string;
  clientCount: number;
  weeklyDocCompletionRate: number;
  monthlyReportOnTime: number;
  vimsaTimeAccuracy: number;
  overallScore: number;
  missedDeadlines: number;
  lateSubmissions: number;
}

export function StaffStatistics({ staff }: StaffStatisticsProps) {
  // Fetch all relevant data
  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients/all"],
  });

  const { data: weeklyDocs = [] } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/weekly-documentation/all"],
  });

  const { data: monthlyReports = [] } = useQuery<MonthlyReport[]>({
    queryKey: ["/api/monthly-reports/all"],
  });

  const { data: vimsaTime = [] } = useQuery<VimsaTime[]>({
    queryKey: ["/api/vimsa-time/all"],
  });

  // Calculate performance metrics for each staff member
  const calculateStaffPerformance = (): StaffPerformance[] => {
    return staff.map(staffMember => {
      const staffClients = allClients.filter(client => client.staffId === staffMember.id);
      const clientCount = staffClients.length;

      if (clientCount === 0) {
        return {
          staffId: staffMember.id,
          staffName: staffMember.name,
          clientCount: 0,
          weeklyDocCompletionRate: 100,
          monthlyReportOnTime: 100,
          vimsaTimeAccuracy: 100,
          overallScore: 100,
          missedDeadlines: 0,
          lateSubmissions: 0,
        };
      }

      // Calculate weekly documentation completion rate
      const expectedWeeklyDocs = clientCount * 4; // Assume 4 weeks per month
      const actualWeeklyDocs = weeklyDocs.filter(doc => 
        staffClients.some(client => client.id === doc.clientId)
      ).length;
      const weeklyDocCompletionRate = Math.min(100, (actualWeeklyDocs / expectedWeeklyDocs) * 100);

      // Calculate monthly report timeliness
      const expectedMonthlyReports = clientCount; // One per client per month
      const onTimeReports = monthlyReports.filter(report => {
        const client = staffClients.find(c => c.id === report.clientId);
        if (!client || !report.createdAt) return false;
        
        // Consider on-time if submitted within 5 days of month end
        const reportDate = new Date(report.createdAt);
        const monthEnd = new Date(report.year, report.month, 0);
        const daysDifference = Math.ceil((reportDate.getTime() - monthEnd.getTime()) / (1000 * 60 * 60 * 24));
        return daysDifference <= 5;
      }).length;
      const monthlyReportOnTime = expectedMonthlyReports > 0 ? (onTimeReports / expectedMonthlyReports) * 100 : 100;

      // Calculate Vimsa time accuracy (assuming complete entries)
      const expectedVimsaEntries = clientCount * 4; // Assume 4 weeks per month
      const actualVimsaEntries = vimsaTime.filter(time => 
        staffClients.some(client => client.id === time.clientId)
      ).length;
      const vimsaTimeAccuracy = Math.min(100, (actualVimsaEntries / expectedVimsaEntries) * 100);

      // Calculate missed deadlines and late submissions
      const missedDeadlines = expectedWeeklyDocs + expectedMonthlyReports + expectedVimsaEntries - 
                             (actualWeeklyDocs + monthlyReports.length + actualVimsaEntries);
      const lateSubmissions = monthlyReports.length - onTimeReports;

      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        (weeklyDocCompletionRate * 0.4) + 
        (monthlyReportOnTime * 0.35) + 
        (vimsaTimeAccuracy * 0.25)
      );

      return {
        staffId: staffMember.id,
        staffName: staffMember.name,
        clientCount,
        weeklyDocCompletionRate: Math.round(weeklyDocCompletionRate),
        monthlyReportOnTime: Math.round(monthlyReportOnTime),
        vimsaTimeAccuracy: Math.round(vimsaTimeAccuracy),
        overallScore,
        missedDeadlines: Math.max(0, missedDeadlines),
        lateSubmissions: Math.max(0, lateSubmissions),
      };
    });
  };

  const performanceData = calculateStaffPerformance();
  
  // Filter staff with clients for meaningful statistics
  const activeStaff = performanceData.filter(p => p.clientCount > 0);
  
  // Sort by overall score for rankings
  const sortedByPerformance = [...activeStaff].sort((a, b) => b.overallScore - a.overallScore);
  
  // Categorize performance levels
  const excellentPerformers = activeStaff.filter(p => p.overallScore >= 90);
  const goodPerformers = activeStaff.filter(p => p.overallScore >= 75 && p.overallScore < 90);
  const needsImprovementPerformers = activeStaff.filter(p => p.overallScore < 75);

  // Chart data
  const chartData = sortedByPerformance.slice(0, 10); // Top 10 for readability

  const performanceDistribution = [
    { name: 'Utmärkt (90-100%)', value: excellentPerformers.length, color: '#22c55e' },
    { name: 'Bra (75-89%)', value: goodPerformers.length, color: '#eab308' },
    { name: 'Behöver förbättring (<75%)', value: needsImprovementPerformers.length, color: '#ef4444' },
  ];

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Utmärkt</Badge>;
    } else if (score >= 75) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Bra</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Behöver förbättring</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-ungdoms-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ungdoms-700">
              Aktiv Personal
            </CardTitle>
            <Target className="h-4 w-4 text-ungdoms-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ungdoms-800">{activeStaff.length}</div>
            <p className="text-xs text-muted-foreground">
              av {staff.length} totalt med klienter
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Utmärkta Prestationer
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{excellentPerformers.length}</div>
            <p className="text-xs text-green-600">
              90%+ i alla kategorier
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Bra Prestationer
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{goodPerformers.length}</div>
            <p className="text-xs text-yellow-600">
              75-89% genomsnitt
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Behöver Stöd
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{needsImprovementPerformers.length}</div>
            <p className="text-xs text-red-600">
              Under 75% genomsnitt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="charts">Grafer</TabsTrigger>
          <TabsTrigger value="individual">Individuell</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ungdoms-800">
                  <BarChart3 className="h-5 w-5" />
                  Prestationsfördelning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ungdoms-800">
                  <TrendingUp className="h-5 w-5" />
                  Topp Prestationer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedByPerformance.slice(0, 5).map((performer, index) => (
                    <div key={performer.staffId} className="flex items-center justify-between p-3 border border-ungdoms-200 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ungdoms-800">#{index + 1}</span>
                          <span className="text-ungdoms-700">{performer.staffName}</span>
                          {getPerformanceBadge(performer.overallScore)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {performer.clientCount} klienter
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-ungdoms-800">{performer.overallScore}%</div>
                        <Progress value={performer.overallScore} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ungdoms-800">
                  <BarChart3 className="h-5 w-5" />
                  Prestationsdiagram - Topp 10 Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="staffName" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="weeklyDocCompletionRate" fill="#3b82f6" name="Veckodokumentation %" />
                    <Bar dataKey="monthlyReportOnTime" fill="#10b981" name="Månadsrapporter i tid %" />
                    <Bar dataKey="vimsaTimeAccuracy" fill="#f59e0b" name="Vimsa Tid %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="individual">
          <div className="space-y-4">
            {sortedByPerformance.map((performer) => (
              <Card key={performer.staffId} className="border-ungdoms-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-ungdoms-800">{performer.staffName}</CardTitle>
                    {getPerformanceBadge(performer.overallScore)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ungdoms-800">{performer.clientCount}</div>
                      <p className="text-sm text-muted-foreground">Klienter</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{performer.weeklyDocCompletionRate}%</div>
                      <p className="text-sm text-muted-foreground">Veckodokumentation</p>
                      <Progress value={performer.weeklyDocCompletionRate} className="mt-1" />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{performer.monthlyReportOnTime}%</div>
                      <p className="text-sm text-muted-foreground">Månadsrapporter i tid</p>
                      <Progress value={performer.monthlyReportOnTime} className="mt-1" />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{performer.vimsaTimeAccuracy}%</div>
                      <p className="text-sm text-muted-foreground">Vimsa Tid</p>
                      <Progress value={performer.vimsaTimeAccuracy} className="mt-1" />
                    </div>
                  </div>
                  
                  {(performer.missedDeadlines > 0 || performer.lateSubmissions > 0) && (
                    <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Områden för förbättring</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        {performer.missedDeadlines > 0 && `${performer.missedDeadlines} missade deadlines. `}
                        {performer.lateSubmissions > 0 && `${performer.lateSubmissions} sena inlämningar.`}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="space-y-6">
            <Alert className="border-ungdoms-200 bg-ungdoms-50">
              <Target className="h-4 w-4 text-ungdoms-600" />
              <AlertTitle className="text-ungdoms-800">Feedback-guide för chefer</AlertTitle>
              <AlertDescription className="text-ungdoms-700">
                Använd denna data för att ge konstruktiv feedback och stöd till din personal.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Excellent Performers */}
              {excellentPerformers.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      Utmärkta Prestationer ({excellentPerformers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {excellentPerformers.map(performer => (
                        <div key={performer.staffId} className="p-2 bg-white rounded border border-green-200">
                          <div className="font-medium text-green-800">{performer.staffName}</div>
                          <div className="text-sm text-green-600">{performer.overallScore}% genomsnitt</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded">
                      <h4 className="font-medium text-green-800 mb-2">Feedback-förslag:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Erkänn deras utmärkta arbete</li>
                        <li>• Överväg mentorskapsmöjligheter</li>
                        <li>• Be om input för processförbättringar</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Good Performers */}
              {goodPerformers.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                      <Clock className="h-5 w-5" />
                      Bra Prestationer ({goodPerformers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {goodPerformers.map(performer => (
                        <div key={performer.staffId} className="p-2 bg-white rounded border border-yellow-200">
                          <div className="font-medium text-yellow-800">{performer.staffName}</div>
                          <div className="text-sm text-yellow-600">{performer.overallScore}% genomsnitt</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-yellow-100 rounded">
                      <h4 className="font-medium text-yellow-800 mb-2">Feedback-förslag:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Uppmuntra fortsatt gott arbete</li>
                        <li>• Identifiera utvecklingsområden</li>
                        <li>• Sätt mål för förbättring</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Needs Improvement */}
              {needsImprovementPerformers.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      Behöver Stöd ({needsImprovementPerformers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {needsImprovementPerformers.map(performer => (
                        <div key={performer.staffId} className="p-2 bg-white rounded border border-red-200">
                          <div className="font-medium text-red-800">{performer.staffName}</div>
                          <div className="text-sm text-red-600">{performer.overallScore}% genomsnitt</div>
                          <div className="text-xs text-red-500">
                            {performer.missedDeadlines} missade, {performer.lateSubmissions} sena
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-red-100 rounded">
                      <h4 className="font-medium text-red-800 mb-2">Åtgärdsförslag:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Planera utvecklingssamtal</li>
                        <li>• Erbjud extra stöd och utbildning</li>
                        <li>• Sätt upp tydliga förbättringsmål</li>
                        <li>• Överväg arbetsbörda och resurser</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}