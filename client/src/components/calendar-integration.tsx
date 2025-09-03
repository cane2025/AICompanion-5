import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  getCalendarEvents,
  getMonthlyCalendar,
  getUpcomingEvents,
  getOverdueEvents,
  exportCalendar,
  downloadFile
} from '../lib/api-enhanced';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { sv } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'care-plan-due' | 'monthly-report-due' | 'weekly-doc-due' | 'follow-up' | 'meeting';
  clientId?: string;
  staffId?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  metadata?: any;
}

export function CalendarIntegration() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Fetch calendar data
  const { data: monthlyCalendarData, isLoading: monthlyLoading, refetch: refetchMonthly } = useQuery({
    queryKey: ['monthly-calendar', currentYear, currentMonth, selectedStaffId],
    queryFn: () => getMonthlyCalendar(currentYear, currentMonth, selectedStaffId || undefined),
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  const { data: upcomingEvents, isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcoming-events', selectedStaffId],
    queryFn: () => getUpcomingEvents(30, selectedStaffId || undefined),
    refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  });

  const { data: overdueEvents, isLoading: overdueLoading } = useQuery({
    queryKey: ['overdue-events', selectedStaffId],
    queryFn: () => getOverdueEvents(selectedStaffId || undefined),
    refetchInterval: 2 * 60 * 1000
  });

  const isLoading = monthlyLoading || upcomingLoading || overdueLoading;

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    if (!monthlyCalendarData?.events) return [];
    
    return monthlyCalendarData.events.filter((event: CalendarEvent) =>
      isSameDay(new Date(event.start), date)
    );
  };

  const getEventTypeColor = (type: string, status: string) => {
    if (status === 'overdue') return 'bg-red-500';
    if (status === 'completed') return 'bg-green-500';
    
    switch (type) {
      case 'care-plan-due':
        return 'bg-blue-500';
      case 'monthly-report-due':
        return 'bg-purple-500';
      case 'weekly-doc-due':
        return 'bg-orange-500';
      case 'follow-up':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'care-plan-due':
        return 'Vårdplan';
      case 'monthly-report-due':
        return 'Månadsrapport';
      case 'weekly-doc-due':
        return 'Veckodok';
      case 'follow-up':
        return 'Uppföljning';
      default:
        return type;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'medium':
        return <Clock className="h-3 w-3 text-orange-500" />;
      case 'low':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  const handleExportCalendar = async () => {
    try {
      const startDate = startOfMonth(currentDate).toISOString();
      const endDate = endOfMonth(currentDate).toISOString();
      
      const blob = await exportCalendar({
        startDate,
        endDate,
        staffId: selectedStaffId || undefined
      });
      
      downloadFile(blob, `kalender-${format(currentDate, 'yyyy-MM', { locale: sv })}.ics`);
    } catch (error) {
      console.error('Calendar export error:', error);
      alert('Fel vid kalenderexport');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kalender</h1>
          <p className="text-muted-foreground">
            Översikt över deadlines och viktiga datum
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => refetchMonthly()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportCalendar}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Personal</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All personal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All personal</SelectItem>
                  {/* Staff options would be populated from staff data */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Händelsetyp</label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Alla typer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alla typer</SelectItem>
                  <SelectItem value="care-plan-due">Vårdplaner</SelectItem>
                  <SelectItem value="monthly-report-due">Månadsrapporter</SelectItem>
                  <SelectItem value="weekly-doc-due">Veckodokumentation</SelectItem>
                  <SelectItem value="follow-up">Uppföljningar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Vy</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Månad</SelectItem>
                  <SelectItem value="week">Vecka</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="month">Månadsvy</TabsTrigger>
          <TabsTrigger value="list">Listvy</TabsTrigger>
          <TabsTrigger value="alerts">Varningar</TabsTrigger>
        </TabsList>

        {/* Month View */}
        <TabsContent value="month">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {format(currentDate, 'MMMM yyyy', { locale: sv })}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Idag
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map(day => {
                  const events = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        min-h-[100px] p-1 border border-border rounded-lg
                        ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        hover:bg-muted/50 transition-colors
                      `}
                    >
                      <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? '' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {events.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`
                              text-xs p-1 rounded text-white truncate cursor-pointer
                              ${getEventTypeColor(event.type, event.status)}
                            `}
                            title={`${event.title} - ${event.description || ''}`}
                          >
                            <div className="flex items-center space-x-1">
                              {getPriorityIcon(event.priority)}
                              <span className="truncate">{getEventTypeLabel(event.type)}</span>
                            </div>
                          </div>
                        ))}
                        
                        {events.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{events.length - 3} fler
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Summary */}
              {monthlyCalendarData?.summary && (
                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{monthlyCalendarData.summary.total}</p>
                    <p className="text-sm text-muted-foreground">Totalt</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{monthlyCalendarData.summary.pending}</p>
                    <p className="text-sm text-muted-foreground">Väntande</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{monthlyCalendarData.summary.overdue}</p>
                    <p className="text-sm text-muted-foreground">Försenade</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{monthlyCalendarData.summary.completed}</p>
                    <p className="text-sm text-muted-foreground">Slutförda</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  Kommande händelser (30 dagar)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingEvents?.slice(0, 10).map((event: CalendarEvent) => (
                    <div key={event.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getPriorityIcon(event.priority)}
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            {format(new Date(event.start), 'dd MMM yyyy', { locale: sv })}
                          </p>
                          
                          {event.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {event.description}
                            </p>
                          )}
                        </div>
                        
                        <Badge 
                          variant={
                            event.status === 'completed' ? 'default' :
                            event.status === 'overdue' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground text-sm">Inga kommande händelser</p>}
                </div>
              </CardContent>
            </Card>

            {/* Event Types Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Händelsetyper denna månad</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyCalendarData?.events && (
                  <div className="space-y-3">
                    {Object.entries(
                      monthlyCalendarData.events.reduce((acc: any, event: CalendarEvent) => {
                        acc[event.type] = (acc[event.type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{getEventTypeLabel(type)}</span>
                        <Badge variant="secondary">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Försenade händelser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {overdueEvents?.map((event: CalendarEvent) => (
                    <div key={event.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-red-900">{event.title}</h4>
                          <p className="text-xs text-red-700 mb-1">
                            Förfallodatum: {format(new Date(event.start), 'dd MMM yyyy', { locale: sv })}
                          </p>
                          {event.description && (
                            <p className="text-xs text-red-600">{event.description}</p>
                          )}
                        </div>
                        <Badge variant="destructive">
                          {Math.floor((new Date().getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60 * 24))} dagar
                        </Badge>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground text-sm">Inga försenade händelser</p>}
                </div>
              </CardContent>
            </Card>

            {/* Priority Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Hög prioritet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingEvents?.filter((event: CalendarEvent) => event.priority === 'high').map((event: CalendarEvent) => (
                    <div key={event.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-orange-900">{event.title}</h4>
                          <p className="text-xs text-orange-700 mb-1">
                            {format(new Date(event.start), 'dd MMM yyyy', { locale: sv })}
                          </p>
                          {event.description && (
                            <p className="text-xs text-orange-600">{event.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="border-orange-300">
                          Hög prioritet
                        </Badge>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground text-sm">Inga högprioriterade händelser</p>}
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
            <p className="text-muted-foreground">Laddar kalenderdata...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarIntegration;
