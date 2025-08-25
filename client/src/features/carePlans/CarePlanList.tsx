import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCarePlans,
  createCarePlan,
  updateCarePlan,
  deleteCarePlan,
} from "./api";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Copy, Archive, Plus } from "lucide-react";
import { useState } from "react";

interface CarePlanListProps {
  clientId: string;
}

export default function CarePlanList({ clientId }: CarePlanListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({
    queryKey: qk.carePlans(clientId),
    queryFn: () => listCarePlans(clientId),
  });

  const createMut = useMutation({
    mutationFn: createCarePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.carePlans(clientId) });
      toast({
        title: "Vårdplan skapad",
        description: "Ny vårdplan har skapats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa vårdplan",
        variant: "destructive",
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, values }: { id: string; values: any }) =>
      updateCarePlan(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.carePlans(clientId) });
      setEditingPlan(null);
      toast({
        title: "Vårdplan uppdaterad",
        description: "Ändringar har sparats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera vårdplan",
        variant: "destructive",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCarePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.carePlans(clientId) });
      toast({
        title: "Vårdplan borttagen",
        description: "Vårdplanen har tagits bort",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort vårdplan",
        variant: "destructive",
      });
    },
  });

  const duplicateMut = useMutation({
    mutationFn: (plan: any) =>
      createCarePlan({
        ...plan,
        title: `${plan.title} (kopia)`,
        id: undefined, // Låt servern generera ny ID
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.carePlans(clientId) });
      toast({ title: "Vårdplan duplicerad", description: "Kopia har skapats" });
    },
  });

  const archiveMut = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      updateCarePlan(id, { status: "archived" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.carePlans(clientId) });
      toast({
        title: "Vårdplan arkiverad",
        description: "Vårdplanen har arkiverats",
      });
    },
  });

  const filteredData = data.filter(
    (plan: any) =>
      plan.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    createMut.mutate({
      clientId,
      title: "Ny vårdplan",
      status: "active",
    });
  };

  const handleCopyAsJson = (plan: any) => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    toast({ title: "Kopierat", description: "Vårdplan kopierad som JSON" });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      active: { label: "Aktiv", variant: "default" },
      paused: { label: "Pausad", variant: "secondary" },
      completed: { label: "Klar", variant: "default" },
      archived: { label: "Arkiverad", variant: "outline" },
    };
    return statusMap[status] || { label: status, variant: "secondary" };
  };

  if (isLoading) {
    return <div className="space-y-3">Laddar vårdplaner...</div>;
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
          Ny vårdplan
        </Button>
        <Input
          placeholder="Sök/filtrera…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <ol className="space-y-2">
        {filteredData.map((plan: any) => {
          const statusInfo = getStatusBadge(plan.status);
          return (
            <li key={plan.id} className="rounded-2xl p-3 shadow border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{plan.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Senast uppdaterad:{" "}
                    {new Date(plan.updatedAt).toLocaleString("sv-SE")}
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                    <Badge variant="outline">v{plan.version || 1}</Badge>
                    {plan.goals && (
                      <Badge variant="secondary">Mål: {plan.goals}</Badge>
                    )}
                  </div>
                  {plan.comment && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {plan.comment}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPlan(plan)}
                    disabled={updateMut.isPending}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyAsJson(plan)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateMut.mutate(plan)}
                    disabled={duplicateMut.isPending}
                  >
                    📋
                  </Button>
                  {plan.status !== "archived" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveMut.mutate({ id: plan.id })}
                      disabled={archiveMut.isPending}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Är du säker på att du vill ta bort denna vårdplan?"
                        )
                      ) {
                        deleteMut.mutate(plan.id);
                      }
                    }}
                    disabled={deleteMut.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Edit Dialog */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Redigera vårdplan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <Input
                  value={editingPlan.title || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingPlan.status || "active"}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, status: e.target.value })
                  }
                  aria-label="Välj status för vårdplan"
                >
                  <option value="active">Aktiv</option>
                  <option value="paused">Pausad</option>
                  <option value="completed">Klar</option>
                  <option value="archived">Arkiverad</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mål</label>
                <Input
                  value={editingPlan.goals || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, goals: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kommentar
                </label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={editingPlan.comment || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, comment: e.target.value })
                  }
                  rows={3}
                  aria-label="Kommentar för vårdplan"
                  placeholder="Lägg till kommentar..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Avbryt
                </Button>
                <Button
                  onClick={() => {
                    updateMut.mutate({
                      id: editingPlan.id,
                      values: editingPlan,
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
