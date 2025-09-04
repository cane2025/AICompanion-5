import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import type { Staff, Client } from "@shared/schema";

export function VersionedStatistics() {
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('2025-12-31');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Fetch staff and clients for dropdowns
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients/all"],
  });

  // Fetch staff statistics
  const { data: staffStats = [], isLoading: staffStatsLoading } = useQuery({
    queryKey: ["/api/stats/staff", dateFrom, dateTo],
    queryFn: async () => {
      const response = await fetch(`/api/stats/staff?from=${dateFrom}&to=${dateTo}`);
      if (!response.ok) throw new Error('Failed to fetch staff stats');
      return response.json();
    },
  });

  // Fetch client statistics
  const { data: clientStats, isLoading: clientStatsLoading } = useQuery({
    queryKey: ["/api/stats/client", selectedClientId, dateFrom, dateTo],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const response = await fetch(`/api/stats/client/${selectedClientId}?from=${dateFrom}&to=${dateTo}`);
      if (!response.ok) throw new Error('Failed to fetch client stats');
      return response.json();
    },
    enabled: !!selectedClientId,
  });

  // Prepare chart data
  const staffChartData = staffStats.map((stat: any) => ({
    name: stat.staffName,
    dokumenterade: stat.documentedCount,
    försenade: stat.delayedCount,
    ejGodkända: stat.notApprovedCount,
    följsamhet: Math.round(((stat.documentedCount - stat.delayedCount) / stat.documentedCount) * 100) || 0,
    kvalitet: Math.round(((stat.documentedCount - stat.notApprovedCount) / stat.documentedCount) * 100) || 0,
  }));

  // Pie chart data for overall quality
  const qualityPieData = staffStats.length > 0 ? [
    {
      name: 'Godkända',
      value: staffStats.reduce((sum: number, stat: any) => sum + (stat.documentedCount - stat.notApprovedCount), 0),
      fill: '#10b981',
    },
    {
      name: 'Ej godkända',
      value: staffStats.reduce((sum: number, stat: any) => sum + stat.notApprovedCount, 0),
      fill: '#ef4444',
    },
  ] : [];

  // Time series data (mock for demonstration)
  const timeSeriesData = [
    { vecka: 'v34', följsamhet: 85, kvalitet: 92 },
    { vecka: 'v35', följsamhet: 88, kvalitet: 89 },
    { vecka: 'v36', följsamhet: 82, kvalitet: 95 },
    { vecka: 'v37', följsamhet: 90, kvalitet: 87 },
    { vecka: 'v38', följsamhet: 87, kvalitet: 93 },
    { vecka: 'v39', följsamhet: 91, kvalitet: 88 },
    { vecka: 'v40', följsamhet: 85, kvalitet: 91 },
  ];

  const exportStaffStats = () => {
    const csvContent = [
      ['Personal', 'Dokumenterade dagar', 'Försenade', 'Ej godkända', 'Följsamhet %', 'Kvalitet %'].join(','),
      ...staffChartData.map(stat => [
        stat.name,
        stat.dokumenterade,
        stat.försenade,
        stat.ejGodkända,
        stat.följsamhet,
        stat.kvalitet,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personalstatistik-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Statistik och rapporter</h3>
        <Button variant="outline" onClick={exportStaffStats}>
          <Download className="h-4 w-4 mr-2" />
          Exportera
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Från datum</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Till datum</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="staffSelect">Personal (valfritt)</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj personal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alla</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="clientSelect">Klient (valfritt)</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj klient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ingen vald</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.displayCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList>
          <TabsTrigger value="staff">👥 Personalstatistik</TabsTrigger>
          <TabsTrigger value="client">📊 Klientstatistik</TabsTrigger>
          <TabsTrigger value="trends">📈 Trender</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total personal</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffStats.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dokumenterade dagar</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staffStats.reduce((sum: number, stat: any) => sum + stat.documentedCount, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Försenade</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staffStats.reduce((sum: number, stat: any) => sum + stat.delayedCount, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ej godkända</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staffStats.reduce((sum: number, stat: any) => sum + stat.notApprovedCount, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dokumenterade dagar per personal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={staffChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="dokumenterade" fill="#3b82f6" name="Dokumenterade" />
                    <Bar dataKey="försenade" fill="#ef4444" name="Försenade" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kvalitetsfördelning</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={qualityPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {qualityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Staff table */}
          <Card>
            <CardHeader>
              <CardTitle>Detaljerad personalstatistik</CardTitle>
            </CardHeader>
            <CardContent>
              {staffStatsLoading ? (
                <div className="animate-pulse">Laddar statistik...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Personal</th>
                        <th className="text-right p-2">Dokumenterade</th>
                        <th className="text-right p-2">Försenade</th>
                        <th className="text-right p-2">Ej godkända</th>
                        <th className="text-right p-2">Följsamhet %</th>
                        <th className="text-right p-2">Kvalitet %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffChartData.map((stat, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{stat.name}</td>
                          <td className="p-2 text-right">{stat.dokumenterade}</td>
                          <td className="p-2 text-right text-red-600">{stat.försenade}</td>
                          <td className="p-2 text-right text-orange-600">{stat.ejGodkända}</td>
                          <td className="p-2 text-right">
                            <span className={stat.följsamhet >= 90 ? 'text-green-600' : stat.följsamhet >= 75 ? 'text-yellow-600' : 'text-red-600'}>
                              {stat.följsamhet}%
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <span className={stat.kvalitet >= 90 ? 'text-green-600' : stat.kvalitet >= 75 ? 'text-yellow-600' : 'text-red-600'}>
                              {stat.kvalitet}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client" className="space-y-6">
          {selectedClientId ? (
            clientStatsLoading ? (
              <div className="animate-pulse">Laddar klientstatistik...</div>
            ) : clientStats ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistik för {clientStats.clientDisplayCode}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{clientStats.documentedWeeks}</div>
                        <div className="text-sm text-gray-600">Dokumenterade veckor</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{clientStats.delayedWeeks}</div>
                        <div className="text-sm text-gray-600">Försenade veckor</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{clientStats.notApprovedWeeks}</div>
                        <div className="text-sm text-gray-600">Ej godkända veckor</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((clientStats.documentedWeeks / clientStats.totalWeeks) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Dokumentationsgrad</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Ingen data tillgänglig för vald klient
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              Välj en klient för att se statistik
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trender över tid</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vecka" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="följsamhet" stroke="#3b82f6" name="Följsamhet %" />
                  <Line type="monotone" dataKey="kvalitet" stroke="#10b981" name="Kvalitet %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}