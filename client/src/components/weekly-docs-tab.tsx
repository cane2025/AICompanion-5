import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Save,
  X,
  Download,
  Filter,
} from "lucide-react";
import type { WeeklyDocumentation, DayDoc } from "@shared/schema";

interface WeeklyDocsTabProps {
  clientId: string;
}

const weeklyDocSchema = z.object({
  days: z.object({
    mon: z.object({
      documented: z.boolean(),
      qualityApproved: z.boolean(),
      onTime: z.boolean(),
      delayed: z.boolean(),
      comment: z.string().optional(),
      authorStaffId: z.string().optional(),
      timestamp: z.string().optional(),
    }).optional(),
    tue: z.object({
      documented: z.boolean(),
      qualityApproved: z.boolean(),
      onTime: z.boolean(),
      delayed: z.boolean(),
      comment: z.string().optional(),
      authorStaffId: z.string().optional(),
      timestamp: z.string().optional(),
    }).optional(),
    wed: z.object({
      documented: z.boolean(),
      qualityApproved: z.boolean(),
      onTime: z.boolean(),
      delayed: z.boolean(),
      comment: z.string().optional(),
      authorStaffId: z.string().optional(),
      timestamp: z.string().optional(),
    }).optional(),
    thu: z.object({
      documented: z.boolean(),
      qualityApproved: z.boolean(),
      onTime: z.boolean(),
      delayed: z.boolean(),
      comment: z.string().optional(),
      authorStaffId: z.string().optional(),
      timestamp: z.string().optional(),
    }).optional(),
    fri: z.object({
      documented: z.boolean(),
      qualityApproved: z.boolean(),
      onTime: z.boolean(),
      delayed: z.boolean(),
      comment: z.string().optional(),
      authorStaffId: z.string().optional(),
      timestamp: z.string().optional(),
    }).optional(),
    sat: z.object({
      documented: z.boolean(),
      qualityApproved: z.boolean(),
      onTime: z.boolean(),
      delayed: z.boolean(),
      comment: z.string().optional(),
      authorStaffId: z.string().optional(),
      timestamp: z.string().optional(),
    }).optional(),
    sun: z.object({
      documented: z.boolean(),
      qualityApproved: z.boolean(),
      onTime: z.boolean(),
      delayed: z.boolean(),
      comment: z.string().optional(),
      authorStaffId: z.string().optional(),
      timestamp: z.string().optional(),
    }).optional(),
  }),
  comments: z.string().optional(),
});

type WeeklyDocFormData = z.infer<typeof weeklyDocSchema>;

const DAYS = [
  { key: 'mon', label: 'Måndag', short: 'Mån' },
  { key: 'tue', label: 'Tisdag', short: 'Tis' },
  { key: 'wed', label: 'Onsdag', short: 'Ons' },
  { key: 'thu', label: 'Torsdag', short: 'Tor' },
  { key: 'fri', label: 'Fredag', short: 'Fre' },
  { key: 'sat', label: 'Lördag', short: 'Lör' },
  { key: 'sun', label: 'Söndag', short: 'Sön' },
];

export function WeeklyDocsTab({ clientId }: WeeklyDocsTabProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingWeek, setEditingWeek] = useState<{ year: number; week: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyDelayed, setShowOnlyDelayed] = useState(false);
  const [showOnlyNotApproved, setShowOnlyNotApproved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WeeklyDocFormData>({
    resolver: zodResolver(weeklyDocSchema),
  });

  // Fetch weekly docs for this client and year
  const { data: weeklyDocs = [], isLoading } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/clients", clientId, "weekly-docs", selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/weekly-docs?year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch weekly docs');
      return response.json();
    },
  });

  // Update weekly doc mutation
  const updateWeeklyDocMutation = useMutation({
    mutationFn: async ({ year, week, data }: { year: number; week: number; data: WeeklyDocFormData }) => {
      const response = await fetch(`/api/clients/${clientId}/weekly-docs/${year}/${week}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update weekly doc');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "weekly-docs", selectedYear] });
      setEditingWeek(null);
      form.reset();
      toast({
        title: "✅ Veckodokumentation sparad",
        description: "Veckodokumentationen har sparats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Fel vid sparande",
        description: `Kunde inte spara veckodokumentation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEditWeek = (year: number, week: number) => {
    const existingDoc = weeklyDocs.find(doc => doc.year === year && doc.week === week);
    const days = existingDoc ? JSON.parse(existingDoc.days || '{}') : {};
    
    // Initialize days with default values
    const initializedDays = DAYS.reduce((acc, day) => {
      acc[day.key as keyof typeof acc] = {
        documented: false,
        qualityApproved: false,
        onTime: true,
        delayed: false,
        comment: '',
        authorStaffId: '',
        timestamp: '',
        ...days[day.key]
      };
      return acc;
    }, {} as any);

    form.reset({
      days: initializedDays,
      comments: existingDoc?.comments || '',
    });
    setEditingWeek({ year, week });
  };

  const handleSaveWeek = (data: WeeklyDocFormData) => {
    if (!editingWeek) return;
    updateWeeklyDocMutation.mutate({ 
      year: editingWeek.year, 
      week: editingWeek.week, 
      data 
    });
  };

  const handleDayChange = (dayKey: string, field: string, value: any) => {
    const currentDays = form.getValues('days');
    const updatedDays = {
      ...currentDays,
      [dayKey]: {
        ...currentDays[dayKey as keyof typeof currentDays],
        [field]: value,
        // Auto-set timestamp when documented
        ...(field === 'documented' && value ? { timestamp: new Date().toISOString() } : {}),
      }
    };
    form.setValue('days', updatedDays);
  };

  const getWeekStatus = (doc: WeeklyDocumentation) => {
    if (doc.delayed) return { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Försenad" };
    if (!doc.qualityApproved) return { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Ej godkänd" };
    if (doc.documented) return { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Dokumenterad" };
    return { color: "bg-gray-100 text-gray-800", icon: Clock, label: "Saknas" };
  };

  const filteredDocs = weeklyDocs.filter(doc => {
    if (showOnlyDelayed && !doc.delayed) return false;
    if (showOnlyNotApproved && doc.qualityApproved) return false;
    return true;
  });

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
          <h2 className="text-2xl font-bold text-gray-900">Veckodokumentation</h2>
          <p className="text-gray-600">Dagvy med Mån-Sön togglar och kvalitetskontroll</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showOnlyDelayed"
                  checked={showOnlyDelayed}
                  onCheckedChange={setShowOnlyDelayed}
                />
                <Label htmlFor="showOnlyDelayed">Visa endast försenade</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showOnlyNotApproved"
                  checked={showOnlyNotApproved}
                  onCheckedChange={setShowOnlyNotApproved}
                />
                <Label htmlFor="showOnlyNotApproved">Visa ej godkända</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="year">År:</Label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="p-2 border rounded-md"
                >
                  {[2023, 2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen veckodokumentation</h3>
              <p className="text-gray-600">Klicka på en vecka för att börja dokumentera.</p>
            </CardContent>
          </Card>
        ) : (
          filteredDocs.map((doc) => {
            const status = getWeekStatus(doc);
            const StatusIcon = status.icon;
            
            return (
              <Card key={`${doc.year}-${doc.week}`} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Vecka {doc.week}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{doc.year}</span>
                      </div>
                    </div>
                    <Badge className={status.color}>
                      <div className="flex items-center gap-1">
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Dokumenterad:</span>
                      <span className={doc.documented ? "text-green-600" : "text-gray-400"}>
                        {doc.documented ? "Ja" : "Nej"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Kvalitet godkänd:</span>
                      <span className={doc.qualityApproved ? "text-green-600" : "text-gray-400"}>
                        {doc.qualityApproved ? "Ja" : "Nej"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>På tid:</span>
                      <span className={doc.onTime ? "text-green-600" : "text-red-600"}>
                        {doc.onTime ? "Ja" : "Nej"}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => handleEditWeek(doc.year, doc.week)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Redigera
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Week Dialog */}
      {editingWeek && (
        <Dialog open={!!editingWeek} onOpenChange={() => setEditingWeek(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Redigera vecka {editingWeek.week} - {editingWeek.year}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveWeek)} className="space-y-6">
                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-4">
                  {DAYS.map((day) => {
                    const dayData = form.watch(`days.${day.key}`) || {};
                    return (
                      <Card key={day.key} className="p-4">
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="font-medium">{day.short}</h3>
                            <p className="text-sm text-gray-600">{day.label}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={dayData.documented || false}
                                onCheckedChange={(checked) => 
                                  handleDayChange(day.key, 'documented', checked)
                                }
                              />
                              <Label className="text-sm">Dokumenterad</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={dayData.qualityApproved || false}
                                onCheckedChange={(checked) => 
                                  handleDayChange(day.key, 'qualityApproved', checked)
                                }
                                disabled={!dayData.documented}
                              />
                              <Label className="text-sm">Kvalitet godkänd</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={dayData.delayed || false}
                                onCheckedChange={(checked) => 
                                  handleDayChange(day.key, 'delayed', checked)
                                }
                              />
                              <Label className="text-sm">Försenad</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={dayData.onTime || false}
                                onCheckedChange={(checked) => 
                                  handleDayChange(day.key, 'onTime', checked)
                                }
                              />
                              <Label className="text-sm">På tid</Label>
                            </div>
                          </div>
                          
                          <Textarea
                            placeholder="Kommentar..."
                            value={dayData.comment || ''}
                            onChange={(e) => 
                              handleDayChange(day.key, 'comment', e.target.value)
                            }
                            className="text-sm h-16"
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Week Comments */}
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veckokommentar</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Allmänna kommentarer för veckan..."
                          className="h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingWeek(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateWeeklyDocMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateWeeklyDocMutation.isPending ? "Sparar..." : "Spara"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}