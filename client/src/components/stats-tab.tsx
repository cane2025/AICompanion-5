import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface StatsTabProps {
  clientId?: string;
  staffId?: string;
}

interface StaffStat {
  staffId: string;
  year: number;
  week: number;
  documentedCount: number;
  delayedCount: number;
  notApprovedCount: number;
}

interface ClientStat {
  clientId: string;
  year: number;
  week: number;
  documentedCount: number;
  delayedCount: number;
  notApprovedCount: number;
  documented: boolean;
  qualityApproved: boolean;
  onTime: boolean;
  delayed: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function StatsTab({ clientId, staffId }: StatsTabProps) {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [viewType, setViewType] = useState<'staff' | 'client'>('staff');
  const { toast } = useToast();

  // Fetch staff stats
  const { data: staffStats = [], isLoading: staffLoading } = useQuery<StaffStat[]>({
    queryKey: ["/api/stats/staff", dateRange.from, dateRange.to],
    queryFn: async () => {
      const response = await fetch(`/api/stats/staff?from=${dateRange.from}&to=${dateRange.to}`);
      if (!response.ok) throw new Error('Failed to fetch staff stats');
      return response.json();
    },
    enabled: viewType === 'staff',
  });

  // Fetch client stats
  const { data: clientStats = [], isLoading: clientLoading } = useQuery<ClientStat[]>({
    queryKey: ["/api/stats/client", clientId, dateRange.from, dateRange.to],
    queryFn: async () => {
      if (!clientId) return [];
      const response = await fetch(`/api/stats/client/${clientId}?from=${dateRange.from}&to=${dateRange.to}`);
      if (!response.ok) throw new Error('Failed to fetch client stats');
      return response.json();
    },
    enabled: viewType === 'client' && !!clientId,
  });

  const isLoading = staffLoading || clientLoading;

  // Process data for charts
  const processStaffData = () => {
    const weeklyData = new Map<string, any>();
    
    staffStats.forEach(stat => {
      const key = `${stat.year}-${stat.week}`;
      if (!weeklyData.has(key)) {
        weeklyData.set(key, {
          week: `v${stat.week}`,
          documented: 0,
          delayed: 0,
          notApproved: 0,
        });
      }
      const data = weeklyData.get(key);
      data.documented += stat.documentedCount;
      data.delayed += stat.delayedCount;
      data.notApproved += stat.notApprovedCount;
    });

    return Array.from(weeklyData.values()).sort((a, b) => 
      parseInt(a.week.substring(1)) - parseInt(b.week.substring(1))
    );
  };

  const processClientData = () => {
    return clientStats.map(stat => ({
      week: `v${stat.week}`,
      documented: stat.documentedCount,
      delayed: stat.delayedCount,
      notApproved: stat.notApprovedCount,
      qualityApproved: stat.qualityApproved ? 1 : 0,
      onTime: stat.onTime ? 1 : 0,
    })).sort((a, b) => 
      parseInt(a.week.substring(1)) - parseInt(b.week.substring(1))
    );
  };

  const calculateSummaryStats = () => {
    const data = viewType === 'staff' ? staffStats : clientStats;
    const totalDocumented = data.reduce((sum, stat) => sum + stat.documentedCount, 0);
    const totalDelayed = data.reduce((sum, stat) => sum + stat.delayedCount, 0);
    const totalNotApproved = data.reduce((sum, stat) => sum + stat.notApprovedCount, 0);
    
    return {
      totalDocumented,
      totalDelayed,
      totalNotApproved,
      delayedPercentage: totalDocumented > 0 ? (totalDelayed / totalDocumented) * 100 : 0,
      notApprovedPercentage: totalDocumented > 0 ? (totalNotApproved / totalDocumented) * 100 : 0,
    };
  };

  const summaryStats = calculateSummaryStats();
  const chartData = viewType === 'staff' ? processStaffData() : processClientData();

  const handleExport = () => {
    const data = viewType === 'staff' ? staffStats : clientStats;
    const csvContent = [
      ['Vecka', 'Dokumenterade dagar', 'Försenade', 'Ej godkända'].join(','),
      ...data.map(stat => [
        `v${stat.week}`,
        stat.documentedCount,
        stat.delayedCount,
        stat.notApprovedCount,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewType}-stats-${dateRange.from}-${dateRange.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "✅ Export slutförd",
      description: "Statistik exporterad som CSV-fil.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistik & Rapporter</h2>
          <p className="text-gray-600">
            {viewType === 'staff' ? 'Personalstatistik för medarbetarsamtal' : 'Klientstatistik för kvalitetsuppföljning'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportera CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="viewType">Visa</Label>
              <Select value={viewType} onValueChange={(value: 'staff' | 'client') => setViewType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Personal</SelectItem>
                  <SelectItem value="client" disabled={!clientId}>Klient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fromDate">Från datum</Label>
              <Input
                id="fromDate"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="toDate">Till datum</Label>
              <Input
                id="toDate"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Uppdatera
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dokumenterade dagar</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalDocumented}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Försenade</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.totalDelayed}</p>
                <p className="text-xs text-gray-500">
                  {summaryStats.delayedPercentage.toFixed(1)}% av totalt
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ej godkända</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.totalNotApproved}</p>
                <p className="text-xs text-gray-500">
                  {summaryStats.notApprovedPercentage.toFixed(1)}% av totalt
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kvalitetsindex</p>
                <p className="text-2xl font-bold text-green-600">
                  {((100 - summaryStats.delayedPercentage - summaryStats.notApprovedPercentage)).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">Godkänd kvalitet</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Trends over time */}
        <Card>
          <CardHeader>
            <CardTitle>Trend över tid</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="delayed" 
                  stroke="#ef4444" 
                  name="Försenade"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="notApproved" 
                  stroke="#f59e0b" 
                  name="Ej godkända"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Weekly comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Veckovis jämförelse</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="documented" fill="#3b82f6" name="Dokumenterade" />
                <Bar dataKey="delayed" fill="#ef4444" name="Försenade" />
                <Bar dataKey="notApproved" fill="#f59e0b" name="Ej godkända" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Kvalitetsfördelning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-4">Förseningsgrad</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'På tid', value: summaryStats.totalDocumented - summaryStats.totalDelayed },
                      { name: 'Försenade', value: summaryStats.totalDelayed },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Kvalitetsgodkännande</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Godkända', value: summaryStats.totalDocumented - summaryStats.totalNotApproved },
                      { name: 'Ej godkända', value: summaryStats.totalNotApproved },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}