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
import { Plus, Edit, Trash2, Eye, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MonthlyReport {
  id: string;
  clientId: string;
  staffId: string;
  year: number;
  month: number;
  content: string;
  reportContent: string;
  status: "not_started" | "in_progress" | "completed";
  comment: string;
  quality: "pending" | "good" | "needs_improvement";
  createdAt: string;
  updatedAt: string;
  submissionDate?: string;
}

interface MonthlyReportProps {
  clientId: string;
}

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Mars" },
  { value: 4, label: "April" },
  { value: 5, label: "Maj" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Augusti" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const STATUS_COLORS = {
  not_started: "bg-gray-100 text-gray-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

const QUALITY_COLORS = {
  pending: "bg-gray-100 text-gray-800",
  good: "bg-green-100 text-green-800",
  needs_improvement: "bg-red-100 text-red-800",
};

export function MonthlyReport({ clientId }: MonthlyReportProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [formData, setFormData] = useState<{
    year: number;
    month: number;
    content: string;
    reportContent: string;
    status: "not_started" | "in_progress" | "completed";
    comment: string;
    quality: "pending" | "good" | "needs_improvement";
  }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    content: "",
    reportContent: "",
    status: "not_started",
    comment: "",
    quality: "pending",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch monthly reports for this client
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/monthly-reports", clientId],
    queryFn: () => api.getMonthlyReportsByClient(clientId),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createMonthlyReport({ ...data, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports", clientId] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Månadsrapport skapad",
        description: "Månadsrapporten har skapats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid skapande av månadsrapport.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMonthlyReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports", clientId] });
      setIsEditDialogOpen(false);
      setSelectedReport(null);
      resetForm();
      toast({
        title: "Månadsrapport uppdaterad",
        description: "Månadsrapporten har uppdaterats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid uppdatering av månadsrapport.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMonthlyReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports", clientId] });
      toast({
        title: "Månadsrapport borttagen",
        description: "Månadsrapporten har borttagits framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid borttagning av månadsrapport.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      content: "",
      reportContent: "",
      status: "not_started",
      comment: "",
      quality: "pending",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (report: MonthlyReport) => {
    setSelectedReport(report);
    setFormData({
      year: report.year,
      month: report.month,
      content: report.content,
      reportContent: report.reportContent,
      status: report.status,
      comment: report.comment,
      quality: report.quality,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedReport) {
      updateMutation.mutate({ id: selectedReport.id, data: formData });
    }
  };

  const handleView = (report: MonthlyReport) => {
    setSelectedReport(report);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getMonthName = (month: number) => {
    return MONTHS.find(m => m.value === month)?.label || "";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Månadsrapporter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Laddar månadsrapporter...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Månadsrapporter
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ny månadsrapport
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Skapa ny månadsrapport</DialogTitle>
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
                    <Label htmlFor="month">Månad</Label>
                    <Select value={formData.month.toString()} onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="content">Innehåll</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Beskriv månadens aktiviteter och utveckling..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="reportContent">Rapportinnehåll</Label>
                  <Textarea
                    id="reportContent"
                    value={formData.reportContent}
                    onChange={(e) => setFormData({ ...formData, reportContent: e.target.value })}
                    placeholder="Detaljerad rapport om månadens arbete..."
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="comment">Kommentarer</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Ytterligare kommentarer..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Skapar..." : "Skapa rapport"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Inga månadsrapporter än</p>
            <p className="text-sm">Skapa din första månadsrapport för att komma igång</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report: MonthlyReport) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {getMonthName(report.month)} {report.year}
                    </span>
                    <Badge className={STATUS_COLORS[report.status]}>
                      {report.status === "not_started" && "Inte påbörjad"}
                      {report.status === "in_progress" && "Pågår"}
                      {report.status === "completed" && "Slutförd"}
                    </Badge>
                    <Badge className={QUALITY_COLORS[report.quality]}>
                      {report.quality === "pending" && "Väntar"}
                      {report.quality === "good" && "Bra"}
                      {report.quality === "needs_improvement" && "Behöver förbättras"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(report)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(report)}
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
                          <AlertDialogTitle>Ta bort månadsrapport</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill ta bort denna månadsrapport? Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(report.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Ta bort
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {report.content && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {report.content.length > 100 
                      ? `${report.content.substring(0, 100)}...` 
                      : report.content
                    }
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Skapad: {format(new Date(report.createdAt), "PPP", { locale: sv })}
                  {report.updatedAt !== report.createdAt && (
                    <span> • Uppdaterad: {format(new Date(report.updatedAt), "PPP", { locale: sv })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Redigera månadsrapport</DialogTitle>
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
                  <Label htmlFor="edit-month">Månad</Label>
                  <Select value={formData.month.toString()} onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Inte påbörjad</SelectItem>
                    <SelectItem value="in_progress">Pågår</SelectItem>
                    <SelectItem value="completed">Slutförd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-quality">Kvalitet</Label>
                <Select value={formData.quality} onValueChange={(value: any) => setFormData({ ...formData, quality: value })}>
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
                <Label htmlFor="edit-reportContent">Rapportinnehåll</Label>
                <Textarea
                  id="edit-reportContent"
                  value={formData.reportContent}
                  onChange={(e) => setFormData({ ...formData, reportContent: e.target.value })}
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="edit-comment">Kommentarer</Label>
                <Textarea
                  id="edit-comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Uppdaterar..." : "Uppdatera rapport"}
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
                Månadsrapport - {selectedReport && getMonthName(selectedReport.month)} {selectedReport?.year}
              </DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge className={STATUS_COLORS[selectedReport.status]}>
                    {selectedReport.status === "not_started" && "Inte påbörjad"}
                    {selectedReport.status === "in_progress" && "Pågår"}
                    {selectedReport.status === "completed" && "Slutförd"}
                  </Badge>
                  <Badge className={QUALITY_COLORS[selectedReport.quality]}>
                    {selectedReport.quality === "pending" && "Väntar"}
                    {selectedReport.quality === "good" && "Bra"}
                    {selectedReport.quality === "needs_improvement" && "Behöver förbättras"}
                  </Badge>
                </div>
                {selectedReport.content && (
                  <div>
                    <h4 className="font-medium mb-2">Innehåll</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedReport.content}</p>
                  </div>
                )}
                {selectedReport.reportContent && (
                  <div>
                    <h4 className="font-medium mb-2">Rapportinnehåll</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedReport.reportContent}</p>
                  </div>
                )}
                {selectedReport.comment && (
                  <div>
                    <h4 className="font-medium mb-2">Kommentarer</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedReport.comment}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  <p>Skapad: {format(new Date(selectedReport.createdAt), "PPP 'kl' p", { locale: sv })}</p>
                  {selectedReport.updatedAt !== selectedReport.createdAt && (
                    <p>Uppdaterad: {format(new Date(selectedReport.updatedAt), "PPP 'kl' p", { locale: sv })}</p>
                  )}
                  {selectedReport.submissionDate && (
                    <p>Inlämnad: {format(new Date(selectedReport.submissionDate), "PPP 'kl' p", { locale: sv })}</p>
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