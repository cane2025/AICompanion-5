import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientForm } from "@/components/client-form";
import { CarePlanList } from "@/components/care-plan-list";
import { ImplementationPlanForm } from "@/components/implementation-plan-form";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Client } from "@shared/schema";

export function EnhancedDashboard() {
  // Enable real-time synchronization across all components
  useRealtimeSync();

  const {
    data: clients = [],
    isLoading: clientsLoading,
    isError: clientsError,
  } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => fetch("/api/clients/all").then(res => res.json()),
  });

  if (clientsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Kunde inte ladda data. Försök igen senare.
          </p>
        </div>
      </div>
    );
  }

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Laddar dashboard...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">UNGDOMS Öppenvård</h1>
        <p className="text-muted-foreground">
          Hantera klienter, vårdplaner och genomförandeplaner med realtidsuppdateringar
        </p>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">Klienter</TabsTrigger>
          <TabsTrigger value="care-plans">Vårdplaner</TabsTrigger>
          <TabsTrigger value="implementation">Genomförandeplaner</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <ClientForm />
          
          <div className="grid gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Registrerade klienter</h2>
            {clients.length === 0 ? (
              <p className="text-muted-foreground">
                Inga klienter registrerade ännu. Lägg till en ny klient för att komma igång.
              </p>
            ) : (
              <div className="grid gap-4">
                {clients.map((client) => (
                  <div key={client.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{client.initials}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {client.id}
                        </p>
                        {client.personalNumber && (
                          <p className="text-sm text-muted-foreground">
                            Personnummer: {client.personalNumber}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          client.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {client.status === "active" ? "Aktiv" : "Inaktiv"}
                        </span>
                      </div>
                    </div>
                    {client.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {client.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="care-plans" className="space-y-4">
          <CarePlanList clients={clients} />
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Genomförandeplaner</h2>
            
            {clients.length === 0 ? (
              <p className="text-muted-foreground">
                Inga klienter registrerade. Lägg till klienter först för att skapa genomförandeplaner.
              </p>
            ) : (
              <div className="space-y-6">
                {clients.map((client) => (
                  <ImplementationPlanForm key={client.id} client={client} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}