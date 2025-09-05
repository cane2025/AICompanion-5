import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus, Clock } from "lucide-react";
import { useState } from "react";
import * as api from "@/lib/api";
import type { VimsaTime } from "@shared/schema";

interface VimsaIntegrationProps {
  clientId: string;
}

export function VimsaIntegration({ clientId }: VimsaIntegrationProps) {
  const [editingVimsa, setEditingVimsa] = useState<VimsaTime | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/vimsa-time", clientId],
    queryFn: () => api.getVimsaTimeByClient(clientId),
  });

  const createMut = useMutation({
    mutationFn: api.createVimsaTime,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/vimsa-time", clientId] });
      toast({
        title: "Vimsa tid skapad",
        description: "Ny Vimsa tid har registrerats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa Vimsa tid",
        variant: "destructive",
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      api.updateVimsaTime(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/vimsa-time", clientId] });
      setEditingVimsa(null);
      toast({
        title: "Vimsa tid uppdaterad",
        description: "Ändringar har sparats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera Vimsa tid",
        variant: "destructive",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteVimsaTime(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/vimsa-time", clientId] });
      toast({
        title: "Vimsa tid borttagen",
        description: "Tiden har tagits bort",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort Vimsa tid",
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
      hoursWorked: 0,
      status: "not_started",
      approved: false,
      matchesDocumentation: false,
      comments: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      completed: { label: "Slutförd", variant: "default" },
      in_progress: { label: "Pågående", variant: "secondary" },
      not_started: { label: "Ej startad", variant: "outline" },
    };
    return statusMap[status] || { label: status, variant: "secondary" };
  };

  if (isLoading) {
    return <div className="space-y-3">Laddar Vimsa tid...</div>;
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
          Registrera Vimsa tid
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Ingen Vimsa tid registrerad än.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map((vimsa: VimsaTime) => {
            const statusInfo = getStatusBadge(vimsa.status || "not_started");
            return (
              <Card key={vimsa.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      Vecka {vimsa.week}, {vimsa.year}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Registrerad:{" "}
                      {vimsa.createdAt
                        ? new Date(vimsa.createdAt).toLocaleString("sv-SE")
                        : "N/A"}
                    </div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                      <Badge variant={vimsa.approved ? "default" : "secondary"}>
                        {vimsa.approved ? "Godkänd" : "Ej godkänd"}
                      </Badge>
                      <Badge
                        variant={
                          vimsa.matchesDocumentation ? "default" : "destructive"
                        }
                      >
                        {vimsa.matchesDocumentation
                          ? "Stämmer med dok."
                          : "Stämmer ej"}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      <strong>Timmar:</strong> {vimsa.hoursWorked || 0}h
                    </div>
                    {vimsa.comments && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Kommentar:</strong> {vimsa.comments}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingVimsa(vimsa)}
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
                            "Är du säker på att du vill ta bort denna Vimsa tid?"
                          )
                        ) {
                          deleteMut.mutate(vimsa.id);
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
      {editingVimsa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Redigera Vimsa tid - Vecka {editingVimsa.week},{" "}
              {editingVimsa.year}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Timmar arbetade
                </label>
                <Input
                  type="number"
                  value={editingVimsa.hoursWorked || 0}
                  onChange={(e) =>
                    setEditingVimsa({
                      ...editingVimsa,
                      hoursWorked: Number(e.target.value),
                    })
                  }
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingVimsa.status || "not_started"}
                  onChange={(e) =>
                    setEditingVimsa({ ...editingVimsa, status: e.target.value })
                  }
                >
                  <option value="not_started">Ej startad</option>
                  <option value="in_progress">Pågående</option>
                  <option value="completed">Slutförd</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="approved"
                  checked={editingVimsa.approved || false}
                  onChange={(e) =>
                    setEditingVimsa({
                      ...editingVimsa,
                      approved: e.target.checked,
                    })
                  }
                />
                <label htmlFor="approved" className="text-sm font-medium">
                  Godkänd
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="matches"
                  checked={editingVimsa.matchesDocumentation || false}
                  onChange={(e) =>
                    setEditingVimsa({
                      ...editingVimsa,
                      matchesDocumentation: e.target.checked,
                    })
                  }
                />
                <label htmlFor="matches" className="text-sm font-medium">
                  Stämmer med dokumentation
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kommentarer
                </label>
                <Textarea
                  value={editingVimsa.comments || ""}
                  onChange={(e) =>
                    setEditingVimsa({
                      ...editingVimsa,
                      comments: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingVimsa(null)}>
                  Avbryt
                </Button>
                <Button
                  onClick={() => {
                    updateMut.mutate({
                      id: editingVimsa.id,
                      values: editingVimsa,
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
