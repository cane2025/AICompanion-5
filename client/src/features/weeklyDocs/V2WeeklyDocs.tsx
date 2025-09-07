import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Eye, Calendar, CheckCircle, Clock, AlertCircle, FileText } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { sv } from "date-fns/locale";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WeeklyDocumentation {
  id: string;
  clientId: string;
  staffId: string;
  year: number;
  week: number;
  content: string;
  mondayStatus: "not_done" | "done" | "partial";
  tuesdayStatus: "not_done" | "done" | "partial";
  wednesdayStatus: "not_done" | "done" | "partial";
  thursdayStatus: "not_done" | "done" | "partial";
  fridayStatus: "not_done" | "done" | "partial";
  saturdayStatus: "not_done" | "done" | "partial";
  sundayStatus: "not_done" | "done" | "partial";
  mondayDocumented: boolean;
  tuesdayDocumented: boolean;
  wednesdayDocumented: boolean;
  thursdayDocumented: boolean;
  fridayDocumented: boolean;
  saturdayDocumented: boolean;
  sundayDocumented: boolean;
  documentation: string;
  approved: boolean;
  comments: string;
  qualityAssessment: "pending" | "good" | "needs_improvement";
  createdAt: string;
  updatedAt: string;
}

interface V2WeeklyDocsProps {
  clientId: string;
}

const STATUS_COLORS = {
  not_done: "bg-red-100 text-red-800",
  done: "bg-green-100 text-green-800",
  partial: "bg-yellow-100 text-yellow-800",
};

const QUALITY_COLORS = {
  pending: "bg-gray-100 text-gray-800",
  good: "bg-green-100 text-green-800",
  needs_improvement: "bg-red-100 text-red-800",
};

const DAYS = [
  { key: "monday", label: "Måndag" },
  { key: "tuesday", label: "Tisdag" },
  { key: "wednesday", label: "Onsdag" },
  { key: "thursday", label: "Torsdag" },
  { key: "friday", label: "Fredag" },
  { key: "saturday", label: "Lördag" },
  { key: "sunday", label: "Söndag" },
];

export function V2WeeklyDocs({ clientId }: V2WeeklyDocsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<WeeklyDocumentation | null>(null);
  const [formData, setFormData] = useState<{
    year: number;
    week: number;
    content: string;
    documentation: string;
    comments: string;
    approved: boolean;
    qualityAssessment: "pending" | "good" | "needs_improvement";
    mondayStatus: "not_done" | "done" | "partial";
    tuesdayStatus: "not_done" | "done" | "partial";
    wednesdayStatus: "not_done" | "done" | "partial";
    thursdayStatus: "not_done" | "done" | "partial";
    fridayStatus: "not_done" | "done" | "partial";
    saturdayStatus: "not_done" | "done" | "partial";
    sundayStatus: "not_done" | "done" | "partial";
    mondayDocumented: boolean;
    tuesdayDocumented: boolean;
    wednesdayDocumented: boolean;
    thursdayDocumented: boolean;
    fridayDocumented: boolean;
    saturdayDocumented: boolean;
    sundayDocumented: boolean;
  }>({
    year: new Date().getFullYear(),
    week: Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
    content: "",
    documentation: "",
    comments: "",
    approved: false,
    qualityAssessment: "pending",
    mondayStatus: "not_done",
    tuesdayStatus: "not_done",
    wednesdayStatus: "not_done",
    thursdayStatus: "not_done",
    fridayStatus: "not_done",
    saturdayStatus: "not_done",
    sundayStatus: "not_done",
    mondayDocumented: false,
    tuesdayDocumented: false,
    wednesdayDocumented: false,
    thursdayDocumented: false,
    fridayDocumented: false,
    saturdayDocumented: false,
    sundayDocumented: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch weekly documentation for this client
  const { data: weeklyDocs = [], isLoading } = useQuery({
    queryKey: ["/api/weekly-documentation", clientId],
    queryFn: () => api.getWeeklyDocumentationByClient(clientId),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createWeeklyDocumentation({ ...data, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-documentation", clientId] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Veckodokumentation skapad",
        description: "Veckodokumentationen har skapats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid skapande av veckodokumentation.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateWeeklyDocumentation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-documentation", clientId] });
      setIsEditDialogOpen(false);
      setSelectedDoc(null);
      resetForm();
      toast({
        title: "Veckodokumentation uppdaterad",
        description: "Veckodokumentationen har uppdaterats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid uppdatering av veckodokumentation.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteWeeklyDocumentation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-documentation", clientId] });
      toast({
        title: "Veckodokumentation borttagen",
        description: "Veckodokumentationen har borttagits framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid borttagning av veckodokumentation.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    const now = new Date();
    setFormData({
      year: now.getFullYear(),
      week: Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
      content: "",
      documentation: "",
      comments: "",
      approved: false,
      qualityAssessment: "pending",
      mondayStatus: "not_done",
      tuesdayStatus: "not_done",
      wednesdayStatus: "not_done",
      thursdayStatus: "not_done",
      fridayStatus: "not_done",
      saturdayStatus: "not_done",
      sundayStatus: "not_done",
      mondayDocumented: false,
      tuesdayDocumented: false,
      wednesdayDocumented: false,
      thursdayDocumented: false,
      fridayDocumented: false,
      saturdayDocumented: false,
      sundayDocumented: false,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (doc: WeeklyDocumentation) => {
    setSelectedDoc(doc);
    setFormData({
      year: doc.year,
      week: doc.week,
      content: doc.content,
      documentation: doc.documentation,
      comments: doc.comments,
      approved: doc.approved,
      qualityAssessment: doc.qualityAssessment,
      mondayStatus: doc.mondayStatus,
      tuesdayStatus: doc.tuesdayStatus,
      wednesdayStatus: doc.wednesdayStatus,
      thursdayStatus: doc.thursdayStatus,
      fridayStatus: doc.fridayStatus,
      saturdayStatus: doc.saturdayStatus,
      sundayStatus: doc.sundayStatus,
      mondayDocumented: doc.mondayDocumented,
      tuesdayDocumented: doc.tuesdayDocumented,
      wednesdayDocumented: doc.wednesdayDocumented,
      thursdayDocumented: doc.thursdayDocumented,
      fridayDocumented: doc.fridayDocumented,
      saturdayDocumented: doc.saturdayDocumented,
      sundayDocumented: doc.sundayDocumented,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedDoc) {
      updateMutation.mutate({ id: selectedDoc.id, data: formData });
    }
  };

  const handleView = (doc: WeeklyDocumentation) => {
    setSelectedDoc(doc);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_done": return "Inte gjort";
      case "done": return "Gjort";
      case "partial": return "Delvis";
      default: return status;
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case "pending": return "Väntar";
      case "good": return "Bra";
      case "needs_improvement": return "Behöver förbättras";
      default: return quality;
    }
  };

  const getWeekDates = (year: number, week: number) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const firstMonday = startOfWeek(firstDayOfYear, { weekStartsOn: 1 });
    const targetWeek = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekStart = startOfWeek(targetWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 1 });
    return { weekStart, weekEnd };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Veckodokumentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Laddar veckodokumentation...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Veckodokumentation
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ny veckodokumentation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Skapa ny veckodokumentation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">År</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="week">Vecka</Label>
                    <Input
                      id="week"
                      type="number"
                      min="1"
                      max="53"
                      value={formData.week}
                      onChange={(e) => setFormData({ ...formData, week: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Veckans dagar</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {DAYS.map((day) => (
                      <div key={day.key} className="space-y-1">
                        <Label className="text-xs">{day.label}</Label>
                        <Select
                          value={formData[`${day.key}Status` as keyof typeof formData] as string}
                          onValueChange={(value: any) => setFormData({ ...formData, [`${day.key}Status`]: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_done">Inte gjort</SelectItem>
                            <SelectItem value="done">Gjort</SelectItem>
                            <SelectItem value="partial">Delvis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Innehåll</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Beskriv veckans aktiviteter..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="documentation">Dokumentation</Label>
                  <Textarea
                    id="documentation"
                    value={formData.documentation}
                    onChange={(e) => setFormData({ ...formData, documentation: e.target.value })}
                    placeholder="Detaljerad dokumentation av veckans arbete..."
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="comments">Kommentarer</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Ytterligare kommentarer..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Skapar..." : "Skapa dokumentation"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {weeklyDocs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen veckodokumentation än</p>
            <p className="text-sm">Skapa din första veckodokumentation för att komma igång</p>
          </div>
        ) : (
          <div className="space-y-4">
            {weeklyDocs.map((doc: WeeklyDocumentation) => {
              const { weekStart, weekEnd } = getWeekDates(doc.year, doc.week);
              return (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        Vecka {doc.week}, {doc.year}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({format(weekStart, "d MMM", { locale: sv })} - {format(weekEnd, "d MMM", { locale: sv })})
                      </span>
                      <Badge className={QUALITY_COLORS[doc.qualityAssessment]}>
                        {getQualityLabel(doc.qualityAssessment)}
                      </Badge>
                      {doc.approved && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Godkänd
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort veckodokumentation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Är du säker på att du vill ta bort denna veckodokumentation? Denna åtgärd kan inte ångras.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(doc.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Ta bort
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2 mb-3">
                    {DAYS.map((day) => {
                      const status = doc[`${day.key}Status` as keyof WeeklyDocumentation] as string;
                      return (
                        <div key={day.key} className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">{day.label}</div>
                          <Badge className={`text-xs ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}>
                            {getStatusLabel(status)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {doc.content && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {doc.content.length > 100 
                        ? `${doc.content.substring(0, 100)}...` 
                        : doc.content
                      }
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Skapad: {format(new Date(doc.createdAt), "PPP", { locale: sv })}
                    {doc.updatedAt !== doc.createdAt && (
                      <span> • Uppdaterad: {format(new Date(doc.updatedAt), "PPP", { locale: sv })}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Redigera veckodokumentation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-year">År</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-week">Vecka</Label>
                  <Input
                    id="edit-week"
                    type="number"
                    min="1"
                    max="53"
                    value={formData.week}
                    onChange={(e) => setFormData({ ...formData, week: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Veckans dagar</Label>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {DAYS.map((day) => (
                    <div key={day.key} className="space-y-1">
                      <Label className="text-xs">{day.label}</Label>
                      <Select
                        value={formData[`${day.key}Status` as keyof typeof formData] as string}
                        onValueChange={(value: any) => setFormData({ ...formData, [`${day.key}Status`]: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_done">Inte gjort</SelectItem>
                          <SelectItem value="done">Gjort</SelectItem>
                          <SelectItem value="partial">Delvis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-quality">Kvalitetsbedömning</Label>
                <Select value={formData.qualityAssessment} onValueChange={(value: any) => setFormData({ ...formData, qualityAssessment: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Väntar</SelectItem>
                    <SelectItem value="good">Bra</SelectItem>
                    <SelectItem value="needs_improvement">Behöver förbättras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-content">Innehåll</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-documentation">Dokumentation</Label>
                <Textarea
                  id="edit-documentation"
                  value={formData.documentation}
                  onChange={(e) => setFormData({ ...formData, documentation: e.target.value })}
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="edit-comments">Kommentarer</Label>
                <Textarea
                  id="edit-comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Uppdaterar..." : "Uppdatera dokumentation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Veckodokumentation - Vecka {selectedDoc?.week}, {selectedDoc?.year}
              </DialogTitle>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge className={QUALITY_COLORS[selectedDoc.qualityAssessment]}>
                    {getQualityLabel(selectedDoc.qualityAssessment)}
                  </Badge>
                  {selectedDoc.approved && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Godkänd
                    </Badge>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Veckans dagar</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day) => {
                      const status = selectedDoc[`${day.key}Status` as keyof WeeklyDocumentation] as string;
                      return (
                        <div key={day.key} className="text-center">
                          <div className="text-sm font-medium mb-1">{day.label}</div>
                          <Badge className={STATUS_COLORS[status as keyof typeof STATUS_COLORS]}>
                            {getStatusLabel(status)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedDoc.content && (
                  <div>
                    <h4 className="font-medium mb-2">Innehåll</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedDoc.content}</p>
                  </div>
                )}
                {selectedDoc.documentation && (
                  <div>
                    <h4 className="font-medium mb-2">Dokumentation</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedDoc.documentation}</p>
                  </div>
                )}
                {selectedDoc.comments && (
                  <div>
                    <h4 className="font-medium mb-2">Kommentarer</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedDoc.comments}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  <p>Skapad: {format(new Date(selectedDoc.createdAt), "PPP 'kl' p", { locale: sv })}</p>
                  {selectedDoc.updatedAt !== selectedDoc.createdAt && (
                    <p>Uppdaterad: {format(new Date(selectedDoc.updatedAt), "PPP 'kl' p", { locale: sv })}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}