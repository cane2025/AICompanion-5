import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Download } from "lucide-react";
import type { WeeklyDocumentation, Client, DayDoc } from "@shared/schema";

interface VersionedWeeklyDocsProps {
  clientId: string;
  client: Client;
}

const DAYS = [
  { key: 'mon', label: 'Måndag' },
  { key: 'tue', label: 'Tisdag' },
  { key: 'wed', label: 'Onsdag' },
  { key: 'thu', label: 'Torsdag' },
  { key: 'fri', label: 'Fredag' },
  { key: 'sat', label: 'Lördag' },
  { key: 'sun', label: 'Söndag' },
] as const;

export function VersionedWeeklyDocs({ clientId, client }: VersionedWeeklyDocsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<WeeklyDocumentation | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);
  const [showNotApprovedOnly, setShowNotApprovedOnly] = useState(false);

  // Fetch weekly docs for this client and year
  const { data: weeklyDocs = [], isLoading } = useQuery<WeeklyDocumentation[]>({
    queryKey: [`/api/clients/${clientId}/weekly-docs`, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/weekly-docs?year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch weekly docs');
      return response.json();
    },
  });

  // Update weekly doc mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      clientId: string;
      year: number;
      week: number;
      days: any;
      documented: boolean;
      qualityApproved: boolean;
      onTime: boolean;
      delayed: boolean;
      comments?: string;
    }) => {
      const response = await fetch(`/api/clients/${clientId}/weekly-docs/${data.year}/${data.week}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update weekly doc');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/weekly-docs`, selectedYear] });
      setIsEditOpen(false);
      setSelectedWeek(null);
      toast({
        title: "Veckodokumentation sparad",
        description: "Veckodokumentationen har uppdaterats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara veckodokumentation",
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWeek) return;

    const formData = new FormData(e.currentTarget);
    
    // Build days object
    const days: any = {};
    let anyDocumented = false;
    let allDocumentedAreApproved = true;
    let anyDelayed = false;

    DAYS.forEach(({ key }) => {
      const documented = formData.get(`${key}-documented`) === 'on';
      const qualityApproved = formData.get(`${key}-qualityApproved`) === 'on';
      const delayed = formData.get(`${key}-delayed`) === 'on';
      const comment = formData.get(`${key}-comment`) as string || undefined;

      if (documented || qualityApproved || delayed || comment) {
        days[key] = {
          documented,
          qualityApproved,
          onTime: !delayed,
          delayed,
          comment,
          timestamp: new Date().toISOString(),
        };

        if (documented) {
          anyDocumented = true;
          if (!qualityApproved) {
            allDocumentedAreApproved = false;
          }
        }

        if (delayed) {
          anyDelayed = true;
        }
      }
    });

    updateMutation.mutate({
      clientId,
      year: selectedWeek.year,
      week: selectedWeek.week,
      days,
      documented: anyDocumented,
      qualityApproved: anyDocumented && allDocumentedAreApproved,
      onTime: !anyDelayed,
      delayed: anyDelayed,
      comments: formData.get('comments') as string || undefined,
    });
  };

  const openWeekEdit = (week: WeeklyDocumentation) => {
    setSelectedWeek(week);
    setIsEditOpen(true);
  };

  const createNewWeek = (weekNumber: number) => {
    const newWeek: WeeklyDocumentation = {
      id: '',
      clientId,
      year: selectedYear,
      week: weekNumber,
      days: {},
      documented: false,
      qualityApproved: false,
      onTime: true,
      delayed: false,
      createdAt: '',
      updatedAt: '',
    };
    setSelectedWeek(newWeek);
    setIsEditOpen(true);
  };

  const parseDays = (daysJson: string): Record<string, DayDoc> => {
    try {
      return JSON.parse(daysJson || '{}');
    } catch {
      return {};
    }
  };

  const exportToCsv = () => {
    const csvContent = [
      ['Vecka', 'Dokumenterad', 'Kvalitet godkänd', 'I tid', 'Försenad', 'Kommentarer'].join(','),
      ...weeklyDocs.map(doc => [
        `v${doc.week}`,
        doc.documented ? 'Ja' : 'Nej',
        doc.qualityApproved ? 'Ja' : 'Nej',
        doc.onTime ? 'Ja' : 'Nej',
        doc.delayed ? 'Ja' : 'Nej',
        `"${doc.comments || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veckodokumentation-${client.displayCode}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate weeks for the year (1-52)
  const allWeeks = Array.from({ length: 52 }, (_, i) => i + 1);
  const existingWeeks = new Set(weeklyDocs.map(doc => doc.week));

  // Filter weeks based on criteria
  const filteredWeeks = weeklyDocs.filter(doc => {
    if (showDelayedOnly && !doc.delayed) return false;
    if (showNotApprovedOnly && doc.qualityApproved) return false;
    return true;
  });

  if (isLoading) {
    return <div className="animate-pulse">Laddar veckodokumentation...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Veckodokumentation för {client.displayCode}
        </h3>
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportToCsv}>
            <Download className="h-4 w-4 mr-2" />
            Exportera CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showDelayed"
            checked={showDelayedOnly}
            onCheckedChange={setShowDelayedOnly}
          />
          <Label htmlFor="showDelayed">Visa endast försenade</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showNotApproved"
            checked={showNotApprovedOnly}
            onCheckedChange={setShowNotApprovedOnly}
          />
          <Label htmlFor="showNotApproved">Visa ej godkända</Label>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allWeeks.map(weekNum => {
          const existingDoc = weeklyDocs.find(doc => doc.week === weekNum);
          const shouldShow = !showDelayedOnly && !showNotApprovedOnly ? true : 
                            existingDoc ? filteredWeeks.includes(existingDoc) : false;

          if (!shouldShow && existingDoc) return null;

          return (
            <Card
              key={weekNum}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                existingDoc?.delayed ? 'border-red-200 bg-red-50' : 
                existingDoc?.documented ? 'border-green-200 bg-green-50' : 
                'border-gray-200'
              }`}
              onClick={() => existingDoc ? openWeekEdit(existingDoc) : createNewWeek(weekNum)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Vecka {weekNum}</span>
                  {existingDoc && (
                    <div className="flex gap-1">
                      {existingDoc.documented && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {existingDoc.delayed && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {existingDoc ? (
                    <>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant={existingDoc.documented ? "default" : "secondary"}
                          className={existingDoc.documented ? "bg-green-100 text-green-800" : ""}
                        >
                          {existingDoc.documented ? "Dokumenterad" : "Ej dokumenterad"}
                        </Badge>
                        <Badge
                          variant={existingDoc.qualityApproved ? "default" : "secondary"}
                          className={existingDoc.qualityApproved ? "bg-blue-100 text-blue-800" : ""}
                        >
                          {existingDoc.qualityApproved ? "Kvalitet godkänd" : "Ej godkänd"}
                        </Badge>
                        <Badge
                          variant={existingDoc.delayed ? "destructive" : "secondary"}
                        >
                          {existingDoc.delayed ? "Försenad" : "I tid"}
                        </Badge>
                      </div>
                      {existingDoc.comments && (
                        <p className="text-xs text-gray-600 truncate">
                          {existingDoc.comments}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Vecka {selectedWeek?.week}, {selectedWeek?.year} - {client.displayCode}
            </DialogTitle>
          </DialogHeader>
          {selectedWeek && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Days */}
              <div className="space-y-4">
                <h4 className="font-medium">Dagar</h4>
                {DAYS.map(({ key, label }) => {
                  const days = parseDays(selectedWeek.days as any);
                  const dayDoc = days[key];

                  return (
                    <Card key={key} className="p-4">
                      <div className="space-y-3">
                        <h5 className="font-medium">{label}</h5>
                        
                        <div className="grid grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${key}-documented`}
                              name={`${key}-documented`}
                              defaultChecked={dayDoc?.documented || false}
                            />
                            <Label htmlFor={`${key}-documented`}>Dokumenterad</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${key}-qualityApproved`}
                              name={`${key}-qualityApproved`}
                              defaultChecked={dayDoc?.qualityApproved || false}
                            />
                            <Label htmlFor={`${key}-qualityApproved`}>Kvalitet godkänd</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${key}-delayed`}
                              name={`${key}-delayed`}
                              defaultChecked={dayDoc?.delayed || false}
                            />
                            <Label htmlFor={`${key}-delayed`}>Försenad</Label>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`${key}-comment`}>Kommentar</Label>
                          <Textarea
                            id={`${key}-comment`}
                            name={`${key}-comment`}
                            defaultValue={dayDoc?.comment || ''}
                            rows={2}
                            placeholder="Valfri kommentar för denna dag..."
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Week comments */}
              <div>
                <Label htmlFor="comments">Veckokommentar</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  defaultValue={selectedWeek.comments || ''}
                  rows={3}
                  placeholder="Kommentar för hela veckan..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Sparar..." : "Spara"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}