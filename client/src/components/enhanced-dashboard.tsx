import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Mail,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  getDashboardStats,
  getDashboardOverview,
  getDashboardTrends,
  getDashboardQuality,
  getDashboardAlerts,
  getStaffPerformance,
  getWorkloadAnalysis,
  sendMonthlyReportReminders
} from '../lib/api-enhanced';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface StatCard {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

export function EnhancedDashboard() {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [timeRange, setTimeRange] = useState('12'); // months

  // Fetch dashboard data
  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: getDashboardOverview,
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard-trends', timeRange],
    queryFn: getDashboardTrends,
    refetchInterval: 10 * 60 * 1000 // Refresh every 10 minutes
  });

  const { data: qualityData, isLoading: qualityLoading } = useQuery({
    queryKey: ['dashboard-quality'],
    queryFn: getDashboardQuality,
    refetchInterval: 15 * 60 * 1000 // Refresh every 15 minutes
  });

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: getDashboardAlerts,
    refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['staff-performance', selectedStaffId],
    queryFn: () => getStaffPerformance(selectedStaffId || undefined),
    refetchInterval: 10 * 60 * 1000
  });

  const { data: workloadData, isLoading: workloadLoading } = useQuery({
    queryKey: ['workload-analysis'],
    queryFn: getWorkloadAnalysis,
    refetchInterval: 15 * 60 * 1000
  });

  const isLoading = overviewLoading || trendsLoading || qualityLoading || alertsLoading;

  const handleSendReminders = async () => {
    try {
      const currentDate = new Date();
      await sendMonthlyReportReminders(currentDate.getFullYear(), currentDate.getMonth() + 1);
      alert('Påminnelser skickade!');
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Fel vid skickning av påminnelser');
    }
  };

  const statCards: StatCard[] = overviewData ? [
    {
      title: 'Totalt antal klienter',
      value: overviewData.totalClients,
      change: 5, // Could be calculated from trends
      icon: <Users className="h-6 w-6" />,
      color: 'text-blue-600'
    },
    {
      title: 'Aktiva klienter',
      value: overviewData.activeClients,
      change: 2,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-600'
    },
    {
      title: 'Total personal',
      value: overviewData.totalStaff,
      change: 0,
      icon: <Users className="h-6 w-6" />,
      color: 'text-purple-600'
    },
    {
      title: 'Väntande rapporter',
      value: overviewData.pendingReports,
      change: -3,
      icon: <Clock className="h-6 w-6" />,
      color: 'text-orange-600'
    },
    {
      title: 'Försenade rapporter',
      value: overviewData.overdueReports,
      change: -1,
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'text-red-600'
    },
    {
      title: 'Aktiva vårdplaner',
      value: overviewData.activeCarePlans,
      change: 4,
      icon: <FileText className="h-6 w-6" />,
      color: 'text-indigo-600'
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Översikt och statistik för vårdplaneringssystemet
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => refetchOverview()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSendReminders}
          >
            <Mail className="h-4 w-4 mr-2" />
            Skicka påminnelser
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.change !== undefined && (
                    <div className="flex items-center mt-1">
                      {stat.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      ) : stat.change < 0 ? (
                        <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                      ) : null}
                      <span className={`text-xs ${
                        stat.change > 0 ? 'text-green-600' : 
                        stat.change < 0 ? 'text-red-600' : 
                        'text-muted-foreground'
                      }`}>
                        {stat.change > 0 ? '+' : ''}{stat.change}
                      </span>
                    </div>
                  )}
                </div>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="trends">Trender</TabsTrigger>
          <TabsTrigger value="quality">Kvalitet</TabsTrigger>
          <TabsTrigger value="performance">Prestanda</TabsTrigger>
          <TabsTrigger value="alerts">Varningar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Klientfördelning</CardTitle>
              </CardHeader>
              <CardContent>
                {overviewData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Aktiva', value: overviewData.activeClients, color: '#00C49F' },
                          { name: 'Inaktiva', value: overviewData.totalClients - overviewData.activeClients, color: '#FF8042' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Aktiva', value: overviewData.activeClients, color: '#00C49F' },
                          { name: 'Inaktiva', value: overviewData.totalClients - overviewData.activeClients, color: '#FF8042' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Senaste aktivitet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertsData?.overdueReports?.slice(0, 5).map((alert: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Försenad rapport - {alert.clientInitials}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.daysOverdue} dagar försenad
                        </p>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">Ingen aktivitet att visa</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Growth Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Klienttillväxt</CardTitle>
              </CardHeader>
              <CardContent>
                {trendsData?.clientGrowth && (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendsData.clientGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Report Completion Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Rapportslutförande</CardTitle>
              </CardHeader>
              <CardContent>
                {trendsData?.reportCompletion && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendsData.reportCompletion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completed" stroke="#00C49F" name="Slutförda" />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" name="Totalt" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Kvalitetsfördelning</CardTitle>
              </CardHeader>
              <CardContent>
                {qualityData?.distribution && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={qualityData.distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quality" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Quality Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Kvalitetstrend</CardTitle>
              </CardHeader>
              <CardContent>
                {qualityData?.trends && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={qualityData.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[1, 5]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgQuality" stroke="#00C49F" name="Genomsnittlig kvalitet" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="mb-4">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Välj personal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All personal</SelectItem>
                {performanceData?.map((staff: any) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Personalstatistik</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="clientCount" fill="#8884d8" name="Klienter" />
                      <Bar dataKey="completedReports" fill="#00C49F" name="Slutförda rapporter" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Workload Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Arbetsbelastning</CardTitle>
              </CardHeader>
              <CardContent>
                {workloadData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workloadData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="staffName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="workloadScore" fill="#FFBB28" name="Arbetsbelastning" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Details */}
          {performanceData && (
            <Card>
              <CardHeader>
                <CardTitle>Detaljerad prestanda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Personal</th>
                        <th className="text-left p-2">Klienter</th>
                        <th className="text-left p-2">Rapporter</th>
                        <th className="text-left p-2">Slutförande (%)</th>
                        <th className="text-left p-2">Kvalitet</th>
                        <th className="text-left p-2">Effektivitet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((staff: any) => (
                        <tr key={staff.id} className="border-b">
                          <td className="p-2 font-medium">{staff.name}</td>
                          <td className="p-2">{staff.clientCount}</td>
                          <td className="p-2">{staff.completedReports}/{staff.totalReports}</td>
                          <td className="p-2">
                            <Badge variant={staff.completionRate > 80 ? 'default' : staff.completionRate > 60 ? 'secondary' : 'destructive'}>
                              {staff.completionRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant={staff.avgQuality > 4 ? 'default' : staff.avgQuality > 3 ? 'secondary' : 'destructive'}>
                              {staff.avgQuality.toFixed(1)}/5
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant={staff.efficiency > 80 ? 'default' : staff.efficiency > 60 ? 'secondary' : 'destructive'}>
                              {staff.efficiency.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overdue Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                  Försenade rapporter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertsData?.overdueReports?.slice(0, 5).map((alert: any, index: number) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="font-medium text-sm">{alert.clientInitials}</p>
                      <p className="text-xs text-muted-foreground">{alert.staffName}</p>
                      <Badge variant="destructive" className="mt-1">
                        {alert.daysOverdue} dagar
                      </Badge>
                    </div>
                  )) || <p className="text-muted-foreground text-sm">Inga försenade rapporter</p>}
                </div>
              </CardContent>
            </Card>

            {/* Missing Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                  Saknad dokumentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertsData?.missingDocumentation?.slice(0, 5).map((alert: any, index: number) => (
                    <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="font-medium text-sm">{alert.clientInitials}</p>
                      <p className="text-xs text-muted-foreground">
                        Vecka {alert.week}, {alert.year}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {alert.daysOverdue} dagar
                      </Badge>
                    </div>
                  )) || <p className="text-muted-foreground text-sm">Ingen saknad dokumentation</p>}
                </div>
              </CardContent>
            </Card>

            {/* Quality Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Kvalitetsproblem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertsData?.qualityIssues?.slice(0, 5).map((alert: any, index: number) => (
                    <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="font-medium text-sm">{alert.clientInitials}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.month}/{alert.year}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {alert.quality}
                      </Badge>
                    </div>
                  )) || <p className="text-muted-foreground text-sm">Inga kvalitetsproblem</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar dashboard-data...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedDashboard;
