import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus, FileText } from "lucide-react";
import { useState } from "react";
import * as api from "@/lib/api";
import type { WeeklyDocumentation as WeeklyDocType } from "@shared/schema";

interface WeeklyDocumentationProps {
  clientId: string;
}

export function WeeklyDocumentation({ clientId }: WeeklyDocumentationProps) {
  const [editingDoc, setEditingDoc] = useState<WeeklyDocType | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/weekly-documentation", clientId],
    queryFn: () => api.getWeeklyDocumentationByClient(clientId),
  });

  const createMut = useMutation({
    mutationFn: api.createWeeklyDocumentation,
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/weekly-documentation", clientId],
      });
      toast({
        title: "Veckodokumentation skapad",
        description: "Ny veckodokumentation har skapats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa veckodokumentation",
        variant: "destructive",
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      api.updateWeeklyDocumentation(id, values),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/weekly-documentation", clientId],
      });
      setEditingDoc(null);
      toast({
        title: "Veckodokumentation uppdaterad",
        description: "Ändringar har sparats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera veckodokumentation",
        variant: "destructive",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteWeeklyDocumentation(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/weekly-documentation", clientId],
      });
      toast({
        title: "Veckodokumentation borttagen",
        description: "Dokumentationen har tagits bort",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort veckodokumentation",
        variant: "destructive",
      });
    },
  });

  const handleCreateNew = () => {
    const currentWeek =
      Math.ceil(
        (Date.now() - new Date(2025, 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      ) + 1;
    createMut.mutate({
      clientId,
      staffId: "current-staff", // TODO: Get from context
      year: 2025,
      week: currentWeek,
      documentation: "Ny veckodokumentation",
      qualityAssessment: "pending",
      comments: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      approved: { label: "Godkänd", variant: "default" },
      pending: { label: "Väntande", variant: "secondary" },
      rejected: { label: "Nekad", variant: "destructive" },
    };
    return statusMap[status] || { label: status, variant: "secondary" };
  };

  if (isLoading) {
    return <div className="space-y-3">Laddar veckodokumentation...</div>;
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
          Ny veckodokumentation
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Ingen veckodokumentation än.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map((doc: WeeklyDocType) => {
            const statusInfo = getStatusBadge(
              doc.qualityAssessment || "pending"
            );
            return (
              <Card key={doc.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      Vecka {doc.week}, {doc.year}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Skapad:{" "}
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleString("sv-SE")
                        : "N/A"}
                    </div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    {doc.documentation && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {doc.documentation}
                      </div>
                    )}
                    {doc.comments && (
                      <div className="mt-2 text-sm">
                        <strong>Kommentar:</strong> {doc.comments}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingDoc(doc)}
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
                            "Är du säker på att du vill ta bort denna veckodokumentation?"
                          )
                        ) {
                          deleteMut.mutate(doc.id);
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
      {editingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Redigera veckodokumentation
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Dokumentation
                </label>
                <Textarea
                  value={editingDoc.documentation || ""}
                  onChange={(e) =>
                    setEditingDoc({
                      ...editingDoc,
                      documentation: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kvalitetsbedömning
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingDoc.qualityAssessment || "pending"}
                  onChange={(e) =>
                    setEditingDoc({
                      ...editingDoc,
                      qualityAssessment: e.target.value,
                    })
                  }
                >
                  <option value="pending">Väntande</option>
                  <option value="approved">Godkänd</option>
                  <option value="rejected">Nekad</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kommentarer
                </label>
                <Textarea
                  value={editingDoc.comments || ""}
                  onChange={(e) =>
                    setEditingDoc({ ...editingDoc, comments: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingDoc(null)}>
                  Avbryt
                </Button>
                <Button
                  onClick={() => {
                    updateMut.mutate({
                      id: editingDoc.id,
                      values: editingDoc,
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
