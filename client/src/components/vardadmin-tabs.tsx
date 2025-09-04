import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarePlansTab } from "./care-plans-tab";
import { GFPTab } from "./gfp-tab";
import { WeeklyDocsTab } from "./weekly-docs-tab";
import { StatsTab } from "./stats-tab";
import {
  FileText,
  CheckSquare,
  Calendar,
  BarChart3,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { Client, CarePlan, ImplementationPlan, Staff } from "@shared/schema";

interface VardadminTabsProps {
  client: Client;
  staff: Staff[];
}

export function VardadminTabs({ client, staff }: VardadminTabsProps) {
  const [activeTab, setActiveTab] = useState("care-plans");

  // Fetch care plans for this client
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/clients", client.id, "care-plans"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${client.id}/care-plans`);
      if (!response.ok) throw new Error('Failed to fetch care plans');
      return response.json();
    },
  });

  // Fetch implementation plans for this client
  const { data: gfpPlans = [] } = useQuery<ImplementationPlan[]>({
    queryKey: ["/api/clients", client.id, "implementation-plans"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${client.id}/implementation-plans`);
      if (!response.ok) throw new Error('Failed to fetch GFP plans');
      return response.json();
    },
  });

  // Calculate summary stats
  const activeCarePlans = carePlans.filter(plan => plan.status === 'Aktiv').length;
  const activeGFPs = gfpPlans.filter(plan => plan.status === 'Aktiv').length;
  const completedGFPs = gfpPlans.filter(plan => plan.status === 'Slutförd').length;

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{client.displayCode}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Klient-ID: {client.id.slice(0, 8)}...</span>
                  <Badge variant={client.active ? "default" : "secondary"}>
                    {client.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{activeCarePlans}</div>
                <div className="text-sm text-gray-600">Aktiva vårdplaner</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{activeGFPs}</div>
                <div className="text-sm text-gray-600">Aktiva GFP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{completedGFPs}</div>
                <div className="text-sm text-gray-600">Slutförda GFP</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="care-plans" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Vårdplaner
          </TabsTrigger>
          <TabsTrigger value="gfp" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            GFP
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dokumentation
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="care-plans" className="mt-6">
          <CarePlansTab clientId={client.id} staff={staff} />
        </TabsContent>

        <TabsContent value="gfp" className="mt-6">
          <GFPTab clientId={client.id} carePlans={carePlans} />
        </TabsContent>

        <TabsContent value="documentation" className="mt-6">
          <WeeklyDocsTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <StatsTab clientId={client.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}