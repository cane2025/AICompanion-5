import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CarePlanDialog } from "@/components/care-plan-dialog";
import type { Client } from "@shared/schema";
import { getCarePlansForClient, createCarePlan } from "@/lib/api";
import { Calendar, FileText, Plus, AlertCircle } from "lucide-react";

interface CarePlanListProps {
  clients: Client[];
}

export function CarePlanList({ clients }: CarePlanListProps) {
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );

  const {
    data: carePlans = [],
    isLoading,
    isError,
  } = useQuery<any[]>({
    queryKey: ["/api/care-plans", selectedClient?.id],
    queryFn: () =>
      selectedClient?.id ? getCarePlansForClient(selectedClient.id) : Promise.resolve([]),
  });

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
          aria-label="Ny vårdplan"
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
                      {getClientInitials(plan.clientId)} #{plan.index}
                    </span>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </CardTitle>
                  {plan.receivedDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      Mottagen: {plan.receivedDate}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {plan.content && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Innehåll:</strong>{" "}
                      {String(plan.content).substring(0, 150)}
                      {String(plan.content).length > 150 && "..."}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
