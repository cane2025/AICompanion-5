import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CarePlanDialog } from "@/components/care-plan-dialog";
import { useToast } from "@/hooks/use-toast";
import { updateCarePlan, deleteCarePlan } from "@/lib/api";
import type { CarePlan, Client } from "@shared/schema";
import {
  Calendar,
  FileText,
  Plus,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";

interface CarePlanListProps {
  clients: Client[];
}

export function CarePlanList({ clients }: CarePlanListProps) {
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [editingPlan, setEditingPlan] = React.useState<CarePlan | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: carePlans = [],
    isLoading,
    isError,
  } = useQuery<CarePlan[]>({
    queryKey: ["care-plans", "all"],
    queryFn: () => fetch("/api/care-plans/all").then((res) => res.json()),
  });

  const updateCarePlanMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) =>
      updateCarePlan(data.id, data.updates),
    onSuccess: () => {
      toast({
        title: "Framgång",
        description: "Vårdplan uppdaterad!",
      });
      queryClient.invalidateQueries({ queryKey: ["care-plans"] });
      setEditingPlan(null);
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera vårdplanen",
        variant: "destructive",
      });
    },
  });

  const deleteCarePlanMutation = useMutation({
    mutationFn: (id: string) => deleteCarePlan(id),
    onSuccess: () => {
      toast({
        title: "Framgång",
        description: "Vårdplan borttagen!",
      });
      queryClient.invalidateQueries({ queryKey: ["care-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort vårdplanen",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (plan: CarePlan) => {
    if (confirm("Är du säker på att du vill ta bort denna vårdplan?")) {
      deleteCarePlanMutation.mutate(plan.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      received: { label: "Mottagen", variant: "secondary" as const },
      staff_notified: {
        label: "Personal meddelad",
        variant: "default" as const,
      },
      in_progress: { label: "Pågående", variant: "default" as const },
      completed: { label: "Klar", variant: "default" as const },
    };

    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        variant: "secondary" as const,
      }
    );
  };

  const getClientInitials = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.initials || "Okänd klient";
  };

  if (isError) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Kunde inte ladda vårdplaner. Försök igen senare.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Vårdplaner</h2>
        <Button
          onClick={() => setSelectedClient(clients[0] || null)}
          disabled={clients.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ny vårdplan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : carePlans.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Inga vårdplaner finns ännu. Skapa en ny för att komma igång.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {carePlans.map((plan) => {
            const statusInfo = getStatusBadge(plan.status || "received");

            return (
              <Card
                key={plan.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      {getClientInitials(plan.clientId)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlan(plan);
                        }}
                        disabled={deleteCarePlanMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(plan);
                        }}
                        disabled={deleteCarePlanMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  {plan.receivedDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      Mottagen: {plan.receivedDate}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {plan.goals && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Mål:</strong>{" "}
                      {(plan.goals || "").substring(0, 100)}
                      {(plan.goals || "").length > 100 && "..."}
                    </p>
                  )}
                  {plan.planContent && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Innehåll:</strong>{" "}
                      {plan.planContent.substring(0, 150)}
                      {plan.planContent.length > 150 && "..."}
                    </p>
                  )}
                  {plan.comment && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {plan.comment}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog - Simple inline edit */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Redigera vårdplan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingPlan.status || "received"}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, status: e.target.value })
                  }
                  aria-label="Välj status för vårdplan"
                >
                  <option value="received">Mottagen</option>
                  <option value="staff_notified">Personal meddelad</option>
                  <option value="in_progress">Pågående</option>
                  <option value="completed">Klar</option>
                </select>
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
                    updateCarePlanMutation.mutate({
                      id: editingPlan.id,
                      updates: {
                        status: editingPlan.status,
                        comment: editingPlan.comment,
                      },
                    });
                  }}
                  disabled={updateCarePlanMutation.isPending}
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
