import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileText, Target, Calendar, FileCheck, Activity } from "lucide-react";
import { CarePlanList } from "@/features/carePlans/CarePlanList";
import { ImplementationPlanList } from "@/features/implementationPlans/ImplementationPlanList";
import { WeeklyDocumentation } from "@/features/weeklyDocs/WeeklyDocumentation";
import { MonthlyReport } from "@/features/reports/MonthlyReport";
import { VimsaIntegration } from "@/features/vimsa/VimsaIntegration";

interface ClientDetailViewProps {
  clientId: string;
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  if (!clientId) return <div>Klient-ID saknas</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Klientöversikt</h1>

        <Tabs defaultValue="care-plans" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="care-plans" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vårdplaner
            </TabsTrigger>
            <TabsTrigger
              value="implementation-plans"
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Genomförandeplaner
            </TabsTrigger>
            <TabsTrigger
              value="weekly-docs"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Veckodokumentation
            </TabsTrigger>
            <TabsTrigger
              value="monthly-reports"
              className="flex items-center gap-2"
            >
              <FileCheck className="h-4 w-4" />
              Månadsrapporter
            </TabsTrigger>
            <TabsTrigger value="vimsa" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Vimsa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="care-plans" className="mt-6">
            <CarePlanList clientId={clientId} />
          </TabsContent>
          <TabsContent value="implementation-plans" className="mt-6">
            <ImplementationPlanList clientId={clientId} />
          </TabsContent>
          <TabsContent value="weekly-docs" className="mt-6">
            <WeeklyDocumentation clientId={clientId} />
          </TabsContent>
          <TabsContent value="monthly-reports" className="mt-6">
            <MonthlyReport clientId={clientId} />
          </TabsContent>
          <TabsContent value="vimsa" className="mt-6">
            <VimsaIntegration clientId={clientId} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
