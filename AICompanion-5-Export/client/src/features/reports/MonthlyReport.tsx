import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus, Calendar } from "lucide-react";
import { useState } from "react";
import * as api from "@/lib/api";
import type { MonthlyReport as MonthlyReportType } from "@shared/schema";

interface MonthlyReportProps {
  clientId: string;
}

export function MonthlyReport({ clientId }: MonthlyReportProps) {
  const [editingReport, setEditingReport] = useState<MonthlyReportType | null>(
    null
  );
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/monthly-reports", clientId],
    queryFn: () => api.getMonthlyReportsByClient(clientId),
  });

  const createMut = useMutation({
    mutationFn: api.createMonthlyReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/monthly-reports", clientId] });
      toast({
        title: "Månadsrapport skapad",
        description: "Ny månadsrapport har skapats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa månadsrapport",
        variant: "destructive",
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      api.updateMonthlyReport(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/monthly-reports", clientId] });
      setEditingReport(null);
      toast({
        title: "Månadsrapport uppdaterad",
        description: "Ändringar har sparats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera månadsrapport",
        variant: "destructive",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteMonthlyReport(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/monthly-reports", clientId] });
      toast({
        title: "Månadsrapport borttagen",
        description: "Rapporten har tagits bort",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort månadsrapport",
        variant: "destructive",
      });
    },
  });

  const handleCreateNew = () => {
    const currentMonth = new Date().getMonth() + 1;
    createMut.mutate({
      clientId,
      staffId: "current-staff", // TODO: Get from context
      year: 2025,
      month: currentMonth,
      reportContent: "Ny månadsrapport",
      status: "not_started",
      quality: "pending",
      comment: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      completed: { label: "Slutförd", variant: "default" },
      in_progress: { label: "Pågående", variant: "secondary" },
      not_started: { label: "Ej påbörjad", variant: "outline" },
    };
    return statusMap[status] || { label: status, variant: "secondary" };
  };

  const getQualityBadge = (quality: string) => {
    const qualityMap: Record<string, { label: string; variant: any }> = {
      approved: { label: "Godkänd", variant: "default" },
      pending: { label: "Väntande", variant: "secondary" },
      not_approved: { label: "Ej godkänd", variant: "destructive" },
    };
    return qualityMap[quality] || { label: quality, variant: "secondary" };
  };

  const getMonthName = (month: number) => {
    const months = [
      "Januari",
      "Februari",
      "Mars",
      "April",
      "Maj",
      "Juni",
      "Juli",
      "Augusti",
      "September",
      "Oktober",
      "November",
      "December",
    ];
    return months[month - 1] || "Okänd månad";
  };

  if (isLoading) {
    return <div className="space-y-3">Laddar månadsrapporter...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Button
          onClick={handleCreateNew}
          disabled={createMut.isPending}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ny månadsrapport
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inga månadsrapporter än.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map((report: MonthlyReportType) => {
            const statusInfo = getStatusBadge(report.status || "not_started");
            const qualityInfo = getQualityBadge(report.quality || "pending");
            return (
              <Card key={report.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      {getMonthName(report.month)} {report.year}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Skapad:{" "}
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleString("sv-SE")
                        : "N/A"}
                    </div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                      <Badge variant={qualityInfo.variant}>
                        {qualityInfo.label}
                      </Badge>
                    </div>
                    {report.reportContent && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {report.reportContent}
                      </div>
                    )}
                    {report.comment && (
                      <div className="mt-2 text-sm">
                        <strong>Kommentar:</strong> {report.comment}
                      </div>
                    )}
                    {report.submissionDate && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Inlämnad:{" "}
                        {new Date(report.submissionDate).toLocaleString(
                          "sv-SE"
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingReport(report)}
                      disabled={updateMut.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            "Är du säker på att du vill ta bort denna månadsrapport?"
                          )
                        ) {
                          deleteMut.mutate(report.id);
                        }
                      }}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Redigera månadsrapport - {getMonthName(editingReport.month)}{" "}
              {editingReport.year}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Rapportinnehåll
                </label>
                <Textarea
                  value={editingReport.reportContent || ""}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      reportContent: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingReport.status || "not_started"}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="not_started">Ej påbörjad</option>
                  <option value="in_progress">Pågående</option>
                  <option value="completed">Slutförd</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kvalitet
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingReport.quality || "pending"}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      quality: e.target.value,
                    })
                  }
                >
                  <option value="pending">Väntande</option>
                  <option value="approved">Godkänd</option>
                  <option value="not_approved">Ej godkänd</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kommentar
                </label>
                <Textarea
                  value={editingReport.comment || ""}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      comment: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingReport(null)}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={() => {
                    updateMut.mutate({
                      id: editingReport.id,
                      values: editingReport,
                    });
                  }}
                  disabled={updateMut.isPending}
                >
                  Spara
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
