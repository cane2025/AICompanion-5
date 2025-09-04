import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VersionedCarePlan } from "./versioned-care-plan";
import { VersionedGFP } from "./versioned-gfp";
import { VersionedWeeklyDocs } from "./versioned-weekly-docs";
import { VersionedStatistics } from "./versioned-statistics";
import { User, FileText, Target, Calendar, BarChart3 } from "lucide-react";
import type { Client } from "@shared/schema";

export function VersionedClientWorkflow() {
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Fetch all clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients/all"],
    queryFn: async () => {
      const response = await fetch('/api/clients/all');
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  if (isLoading) {
    return <div className="animate-pulse p-6">Laddar klienter...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vårdadministration</h2>
          <p className="text-gray-600">
            Hantera vårdplaner, genomförandeplaner och veckodokumentation
          </p>
        </div>
      </div>

      {/* Client selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Välj klient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Välj en klient för att börja" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.displayCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {clients.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Inga klienter tillgängliga. Lägg till klienter i personalhanteringen först.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedClient ? (
        <Tabs defaultValue="vardplan" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vardplan" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vårdplan
            </TabsTrigger>
            <TabsTrigger value="gfp" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              GFP
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dokumentation
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vardplan" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Vårdplaner
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Hantera vårdplaner för {selectedClient.displayCode}. 
                  Varje ny vårdplan får automatiskt ett versionsnummer och genererar en GFP.
                </p>
              </CardHeader>
              <CardContent>
                <VersionedCarePlan clientId={selectedClientId} client={selectedClient} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gfp" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Genomförandeplaner (GFP)
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Hantera genomförandeplaner för {selectedClient.displayCode}. 
                  GFP skapas automatiskt när en vårdplan sparas och innehåller 5 uppföljningspunkter.
                </p>
              </CardHeader>
              <CardContent>
                <VersionedGFP clientId={selectedClientId} client={selectedClient} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Veckodokumentation
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Hantera veckodokumentation för {selectedClient.displayCode}. 
                  Dokumentera dag för dag med kvalitetsbedömning och tidrapportering.
                </p>
              </CardHeader>
              <CardContent>
                <VersionedWeeklyDocs clientId={selectedClientId} client={selectedClient} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistik och rapporter
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Visa statistik för personalens följsamhet och kvalitet. 
                  Använd för medarbetarsamtal och kvalitetsuppföljning.
                </p>
              </CardHeader>
              <CardContent>
                <VersionedStatistics />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Välj en klient för att komma igång
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              Välj en klient från listan ovan för att hantera vårdplaner, 
              genomförandeplaner och veckodokumentation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}