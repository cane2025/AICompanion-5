import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ImplementationPlanDialog } from "./implementation-plan-dialog";
import { WeeklyDocumentationDialog } from "./weekly-documentation-dialog";
import { MonthlyReportDialog } from "./monthly-report-dialog";
import { VimsaTimeDialog } from "./vimsa-time-dialog";
import * as api from "@/lib/api";
import type {
  Client,
  CarePlan,
  ImplementationPlan,
  WeeklyDocumentation,
  MonthlyReport,
  VimsaTime,
  Staff,
} from "@shared/schema";

interface ClientDetailViewProps {
  client: Client;
  staffId: string;
}

export function ClientDetailView({ client, staffId }: ClientDetailViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch staff list to resolve responsible staff name
  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });
  const responsibleStaff = staffList.find((s) => s.id === client.staffId);

  // Fetch all client-related data
  const { data: carePlan } = useQuery<CarePlan>({
    queryKey: ["/api/care-plans", client.id],
  });

  const { data: implementationPlan } = useQuery<ImplementationPlan>({
    queryKey: ["/api/implementation-plans", client.id],
  });

  const { data: weeklyDocs = [] } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/weekly-documentation", client.id],
  });

  const { data: monthlyReports = [] } = useQuery<MonthlyReport[]>({
    queryKey: ["/api/monthly-reports", client.id],
  });

  const { data: vimsaTimeData = [] } = useQuery<VimsaTime[]>({
    queryKey: ["/api/vimsa-time", client.id],
  });

  // Mutation to update client's responsible staff
  const updateClientStaffMutation = useMutation({
    mutationFn: async (newStaffId: string) => {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: newStaffId }),
      });
      if (!response.ok) throw new Error("Failed to update client");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Ansvarig personal uppdaterad" });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/care-plans", client.id],
      });
    },
    onError: () => {
      toast({ title: "Fel vid uppdatering", variant: "destructive" });
    },
  });

  // Status helpers
  const getStatusColor = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return "bg-red-100 text-red-800 border-red-200";
    switch (status) {
      case "completed":
      case "sent":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "approved":
      case "ok":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "sådär":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "not_approved":
      case "ej_godkänt":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Check if GFP is overdue (3 weeks from staff notified date)
  const isGfpOverdue = () => {
    if (
      !carePlan?.staffNotifiedDate ||
      implementationPlan?.status === "completed"
    )
      return false;
    const notifiedDate = new Date(carePlan.staffNotifiedDate);
    const dueDate = new Date(notifiedDate);
    dueDate.setDate(dueDate.getDate() + 21); // 3 weeks
    return new Date() > dueDate;
  };

  // Generate weeks from week 34 to end of 2025
  const generateWeeks = () => {
    const weeks = [];
    const year = 2025;
    for (let week = 34; week <= 52; week++) {
      weeks.push({ year, week });
    }
    return weeks;
  };

  // Generate months from August to December 2025
  const generateMonths = () => {
    const months = [];
    const year = 2025;
    const monthNames = [
      "Augusti",
      "September",
      "Oktober",
      "November",
      "December",
    ];
    for (let month = 8; month <= 12; month++) {
      months.push({ year, month, name: monthNames[month - 8] });
    }
    return months;
  };

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <Card className="border-ungdoms-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-ungdoms-800">
            <User className="h-5 w-5" />
            Klient: {client.initials}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Initialer</p>
              <p className="font-medium">{client.initials}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ansvarig personal</p>
              <p className="font-medium">
                {responsibleStaff?.name ||
                  responsibleStaff?.initials ||
                  client.staffId}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusColor(client.status || "active")}>
                {client.status === "active" ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsible Staff Selection */}
      <Card className="border-ungdoms-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-ungdoms-800">
            <User className="h-5 w-5" />
            Ansvarig personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={client.staffId}
            onValueChange={(value) => updateClientStaffMutation.mutate(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Välj ansvarig personal" />
            </SelectTrigger>
            <SelectContent>
              {staffList.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name} - {staff.roll || "Personal"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="careplan" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {" "}
          {/* reduced from 6 */}
          <TabsTrigger value="careplan">Vårdplan</TabsTrigger>
          <TabsTrigger value="gfp">GFP</TabsTrigger>
          {/* Removed followup tab */}
          <TabsTrigger value="documentation">Dokumentation</TabsTrigger>
          <TabsTrigger value="monthly">Månadsrapporter</TabsTrigger>
          <TabsTrigger value="vimsa">Vimsa Tid</TabsTrigger>
        </TabsList>

        {/* Vårdplan Tab */}
        <TabsContent value="careplan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Vårdplan - {client.initials}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Mottagen datum
                    </label>
                    <Input
                      type="date"
                      value={
                        carePlan?.receivedDate
                          ? new Date(carePlan.receivedDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Inlagd i journal (digitalt)
                    </label>
                    <Input
                      type="date"
                      value={
                        carePlan?.enteredJournalDate
                          ? new Date(carePlan.enteredJournalDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Personal tillsagd
                    </label>
                    <Input
                      type="date"
                      value={
                        carePlan?.staffNotifiedDate
                          ? new Date(carePlan.staffNotifiedDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                {carePlan?.staffNotifiedDate && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>GFP ska vara inlämnad senast:</strong>{" "}
                      {new Date(
                        new Date(carePlan.staffNotifiedDate).getTime() +
                          21 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString("sv-SE")}{" "}
                      (3 veckor från tillsägning)
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge
                    className={`mt-1 ${getStatusColor(
                      carePlan?.status || "received"
                    )}`}
                  >
                    {carePlan?.status === "received" && "Mottagen"}
                    {carePlan?.status === "entered_journal" &&
                      "Inlagd i journal"}
                    {carePlan?.status === "staff_notified" &&
                      "Personal tillsagd"}
                    {carePlan?.status === "gfp_pending" && "Väntar på GFP"}
                    {carePlan?.status === "completed" && "Slutförd"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GFP Tab */}
        <TabsContent value="gfp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Genomförandeplan (GFP) - {client.initials}
                  {isGfpOverdue() && (
                    <Badge className="bg-red-100 text-red-800 border-red-200 ml-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      FÖRSENAD
                    </Badge>
                  )}
                </CardTitle>
                <ImplementationPlanDialog
                  trigger={
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      {implementationPlan ? "Redigera GFP" : "Skapa GFP"}
                    </Button>
                  }
                  client={client}
                  existingPlanId={implementationPlan?.id}
                  selectedStaffId={staffId}
                />
              </div>
            </CardHeader>
            <CardContent>
              {implementationPlan ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Förfallodatum
                      </label>
                      <Input
                        type="date"
                        value={
                          implementationPlan?.dueDate
                            ? new Date(implementationPlan.dueDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        className="mt-1"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Slutförd datum
                      </label>
                      <Input
                        type="date"
                        value={
                          implementationPlan?.completedDate
                            ? new Date(implementationPlan.completedDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        className="mt-1"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Badge
                      className={`mt-1 ${getStatusColor(
                        implementationPlan?.status || "pending",
                        isGfpOverdue()
                      )}`}
                    >
                      {isGfpOverdue() &&
                        implementationPlan?.status !== "completed" &&
                        "FÖRSENAD - "}
                      {implementationPlan?.status === "pending" && "Väntande"}
                      {implementationPlan?.status === "in_progress" &&
                        "Pågående"}
                      {implementationPlan?.status === "completed" && "Slutförd"}
                      {implementationPlan?.status === "sent" && "Skickad"}
                    </Badge>
                  </div>

                  {implementationPlan?.planContent && (
                    <div>
                      <label className="text-sm font-medium">
                        Planinnehåll
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        <p className="text-sm">
                          {implementationPlan.planContent}
                        </p>
                      </div>
                    </div>
                  )}

                  {implementationPlan?.goals && (
                    <div>
                      <label className="text-sm font-medium">Mål</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        <p className="text-sm">{implementationPlan.goals}</p>
                      </div>
                    </div>
                  )}

                  {implementationPlan?.activities && (
                    <div>
                      <label className="text-sm font-medium">Aktiviteter</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        <p className="text-sm">
                          {implementationPlan.activities}
                        </p>
                      </div>
                    </div>
                  )}

                  {implementationPlan?.completedDate && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        GFP slutförd och godkänd
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Ingen genomförandeplan skapad än
                  </p>
                  <ImplementationPlanDialog
                    trigger={
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Skapa genomförandeplan
                      </Button>
                    }
                    client={client}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dokumentation Tab */}
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Veckodokumentation 2025 - {client.initials}
                </CardTitle>
                <WeeklyDocumentationDialog
                  trigger={
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Lägg till dokumentation
                    </Button>
                  }
                  selectedStaffId={staffId}
                />
              </div>
            </CardHeader>
            <CardContent>
              {weeklyDocs.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Vecka 34 - 52, 2025. Grön = Godkänd kvalitet, Ingen färg =
                    Dokumenterad, Röd = Saknas
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generateWeeks().map(({ year, week }) => {
                      const doc = weeklyDocs.find(
                        (d) => d.year === year && d.week === week
                      );
                      return (
                        <div
                          key={`${year}-${week}`}
                          className="p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Vecka {week}</span>
                            <Badge
                              className={
                                !doc
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : doc.qualityAssessment === "approved"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }
                            >
                              {!doc
                                ? "Saknas"
                                : doc.qualityAssessment === "approved"
                                ? "Godkänd"
                                : "Dokumenterad"}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={!!doc} />
                              <span className="text-sm">Dokumenterad</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={doc?.qualityAssessment === "approved"}
                              />
                              <span className="text-sm">Kvalitet godkänd</span>
                            </div>
                          </div>

                          {doc?.comments && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">
                                Kommentar:
                              </p>
                              <p className="text-xs">{doc.comments}</p>
                            </div>
                          )}

                          {doc && (
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Redigera
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-600"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Ta bort
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Ingen veckodokumentation skapad än
                  </p>
                  <WeeklyDocumentationDialog
                    trigger={
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Skapa veckodokumentation
                      </Button>
                    }
                    selectedStaffId={staffId}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Månadsrapporter Tab */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Månadsrapporter 2025 - {client.initials}
                </CardTitle>
                <MonthlyReportDialog
                  trigger={
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Lägg till månadsrapport
                    </Button>
                  }
                  selectedStaffId={staffId}
                />
              </div>
            </CardHeader>
            <CardContent>
              {monthlyReports.length > 0 ? (
                <div className="space-y-4">
                  {generateMonths().map(({ year, month, name }) => {
                    const report = monthlyReports.find(
                      (r) => r.year === year && r.month === month
                    );
                    return (
                      <div
                        key={`${year}-${month}`}
                        className="p-4 border border-ungdoms-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">
                            {name} {year}
                          </h4>
                          <div className="flex gap-2">
                            <Badge
                              className={getStatusColor(
                                report?.status || "not_started"
                              )}
                            >
                              {report?.status === "completed" && "Slutförd"}
                              {report?.status === "in_progress" && "Pågående"}
                              {report?.status === "not_started" &&
                                "Ej påbörjad"}
                              {!report && "Ej påbörjad"}
                            </Badge>
                            {report?.quality && (
                              <Badge
                                className={getQualityColor(report.quality)}
                              >
                                {report.quality === "approved" && "Godkänd"}
                                {report.quality === "pending" && "Sådär"}
                                {report.quality === "not_approved" &&
                                  "Ej godkänd"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {report && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={report?.status === "completed"}
                                />
                                <span className="text-sm">Slutförd</span>
                              </div>
                              <div>
                                <Select value={report?.status || "not_started"}>
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not_started">
                                      Ej påbörjad
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                      Pågående
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      Slutförd
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Select value={report?.quality || "pending"}>
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Kvalitet" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">
                                      Sådär
                                    </SelectItem>
                                    <SelectItem value="approved">OK</SelectItem>
                                    <SelectItem value="not_approved">
                                      Ej godkänt
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {report?.submissionDate && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                  Inlämnad:{" "}
                                  {new Date(
                                    report.submissionDate
                                  ).toLocaleDateString("sv-SE")}
                                </p>
                              </div>
                            )}

                            {report?.reportContent && (
                              <div className="mt-3">
                                <p className="text-sm font-medium">
                                  Rapportinnehåll:
                                </p>
                                <div className="mt-1 p-2 bg-gray-50 rounded border">
                                  <p className="text-sm">
                                    {report.reportContent}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Redigera
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-600"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Ta bort
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Ingen månadsrapport skapad än
                  </p>
                  <MonthlyReportDialog
                    trigger={
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Skapa månadsrapport
                      </Button>
                    }
                    selectedStaffId={staffId}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vimsa Tid Tab */}
        <TabsContent value="vimsa">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Vimsa Tid - {client.initials}
                </CardTitle>
                <VimsaTimeDialog
                  trigger={
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrera tid
                    </Button>
                  }
                  selectedStaffId={staffId}
                />
              </div>
            </CardHeader>
            <CardContent>
              {vimsaTimeData.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Grön = Stämmer med dokumentation, Röd = Stämmer inte
                  </p>

                  {generateWeeks().map(({ year, week }) => {
                    const timeData = vimsaTimeData.find(
                      (v) => v.year === year && v.week === week
                    );
                    return (
                      <div
                        key={`${year}-${week}`}
                        className="p-4 border border-ungdoms-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">
                            Vecka {week}, {year}
                          </h4>
                          <Badge
                            className={
                              timeData?.matchesDocumentation
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {timeData?.matchesDocumentation
                              ? "Stämmer"
                              : "Stämmer inte"}
                          </Badge>
                        </div>

                        {timeData ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Timmar arbetade
                                </label>
                                <Input
                                  type="number"
                                  value={timeData?.hoursWorked || 0}
                                  className="mt-1"
                                  disabled
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Stämmer med dokumentation
                                </label>
                                <Select
                                  value={
                                    timeData?.matchesDocumentation
                                      ? "yes"
                                      : "no"
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Ja</SelectItem>
                                    <SelectItem value="no">Nej</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Status
                                </label>
                                <Badge
                                  className={getStatusColor(
                                    timeData?.status || "not_started"
                                  )}
                                >
                                  {timeData?.status === "completed" &&
                                    "Slutförd"}
                                  {timeData?.status === "in_progress" &&
                                    "Pågående"}
                                  {timeData?.status === "not_started" &&
                                    "Ej startad"}
                                </Badge>
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="text-sm font-medium">
                                Kommentarer
                              </label>
                              <Textarea
                                placeholder="Kommentarer om Vimsa tid..."
                                value={timeData?.comments || ""}
                                className="mt-1 h-20"
                                disabled
                              />
                            </div>

                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Redigera
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-600"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Ta bort
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">
                              Ingen tid registrerad för denna vecka
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Ingen Vimsa tid registrerad än
                  </p>
                  <VimsaTimeDialog
                    trigger={
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrera Vimsa tid
                      </Button>
                    }
                    selectedStaffId={staffId}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
