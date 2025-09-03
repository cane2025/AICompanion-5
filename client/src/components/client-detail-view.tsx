import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormLabel } from "@/components/ui/form";
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
import {
  ImplementationPlanDialog,
  SimpleImplementationPlanDialog,
} from "./implementation-plan-dialog";
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
  const [editReport, setEditReport] = useState<MonthlyReport | null>(null);
  const [newQuality, setNewQuality] = useState<string>("pending");
  const [markCompleted, setMarkCompleted] = useState<boolean>(false);
  
  // Care plan form state
  const [carePlanForm, setCarePlanForm] = useState({
    receivedDate: "",
    enteredJournalDate: "",
    staffNotifiedDate: "",
    planContent: "",
    goals: "",
    interventions: "",
    comment: "",
    status: "received",
  });
  
  // GFP form state
  const [gfpForm, setGfpForm] = useState({
    planContent: "",
    goals: "",
    activities: "",
    followUpSchedule: "",
    status: "pending",
    planType: "1",
    comments: "",
    completedDate: "",
    sentDate: "",
  });
  
  const [hasCarePlanChanges, setHasCarePlanChanges] = useState(false);
  const [hasGfpChanges, setHasGfpChanges] = useState(false);

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

  // Mutation to delete monthly report
  const deleteMonthlyReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/monthly-reports/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Kunde inte ta bort månadsrapport");
    },
    onSuccess: () => {
      toast({ title: "Månadsrapport raderad" });
      queryClient.invalidateQueries({
        queryKey: ["/api/monthly-reports", client.id],
      });
    },
    onError: () => {
      toast({ title: "Fel vid radering", variant: "destructive" });
    },
  });

  // Mutation to update monthly report
  const updateMonthlyReportMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/monthly-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Kunde inte uppdatera månadsrapport");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Månadsrapport uppdaterad" });
      queryClient.invalidateQueries({
        queryKey: ["/api/monthly-reports", client.id],
      });
      setEditReport(null);
    },
    onError: () => {
      toast({ title: "Fel vid uppdatering", variant: "destructive" });
    },
  });

  // Mutation to update vimsa time
  const updateVimsaTimeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/vimsa-time/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Kunde inte uppdatera vimsa tid");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Vimsa tid uppdaterad" });
      queryClient.invalidateQueries({
        queryKey: ["/api/vimsa-time", client.id],
      });
    },
    onError: () => {
      toast({ title: "Fel vid uppdatering", variant: "destructive" });
    },
  });

  // Mutation to delete vimsa time
  const deleteVimsaTimeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/vimsa-time/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Kunde inte ta bort vimsa tid");
    },
    onSuccess: () => {
      toast({ title: "Vimsa tid raderad" });
      queryClient.invalidateQueries({
        queryKey: ["/api/vimsa-time", client.id],
      });
    },
    onError: () => {
      toast({ title: "Fel vid radering", variant: "destructive" });
    },
  });

  // Care plan mutations
  const saveCarePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      if (carePlan?.id) {
        return api.updateCarePlan(carePlan.id, data);
      } else {
        return api.createCarePlan({ ...data, clientId: client.id, staffId: client.staffId });
      }
    },
    onSuccess: () => {
      toast({ title: "✅ Vårdplan sparad", description: "Vårdplanen har uppdaterats framgångsrikt." });
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans", client.id] });
      setHasCarePlanChanges(false);
    },
    onError: (error) => {
      toast({ title: "❌ Fel vid sparning", description: `Kunde inte spara vårdplan: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteCarePlanMutation = useMutation({
    mutationFn: (id: string) => api.deleteCarePlan(id),
    onSuccess: () => {
      toast({ title: "🗑️ Vårdplan raderad", description: "Vårdplanen har raderats framgångsrikt." });
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans", client.id] });
    },
    onError: (error) => {
      toast({ title: "❌ Fel vid radering", description: `Kunde inte radera vårdplan: ${error.message}`, variant: "destructive" });
    },
  });

  // GFP mutations
  const saveGfpMutation = useMutation({
    mutationFn: async (data: any) => {
      if (implementationPlan?.id) {
        return api.updateImplementationPlan(implementationPlan.id, data);
      } else {
        return api.createImplementationPlan({ ...data, clientId: client.id, staffId: client.staffId });
      }
    },
    onSuccess: () => {
      toast({ title: "✅ GFP sparad", description: "Genomförandeplanen har uppdaterats framgångsrikt." });
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", client.id] });
      setHasGfpChanges(false);
    },
    onError: (error) => {
      toast({ title: "❌ Fel vid sparning", description: `Kunde inte spara GFP: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteGfpMutation = useMutation({
    mutationFn: (id: string) => api.deleteImplementationPlan(id),
    onSuccess: () => {
      toast({ title: "🗑️ GFP raderad", description: "Genomförandeplanen har raderats framgångsrikt." });
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", client.id] });
    },
    onError: (error) => {
      toast({ title: "❌ Fel vid radering", description: `Kunde inte radera GFP: ${error.message}`, variant: "destructive" });
    },
  });

  // Initialize forms when data loads
  useEffect(() => {
    if (carePlan) {
      setCarePlanForm({
        receivedDate: carePlan.receivedDate ? new Date(carePlan.receivedDate).toISOString().split("T")[0] : "",
        enteredJournalDate: carePlan.enteredJournalDate ? new Date(carePlan.enteredJournalDate).toISOString().split("T")[0] : "",
        staffNotifiedDate: carePlan.staffNotifiedDate ? new Date(carePlan.staffNotifiedDate).toISOString().split("T")[0] : "",
        planContent: carePlan.planContent || "",
        goals: carePlan.goals || "",
        interventions: carePlan.interventions || "",
        comment: carePlan.comment || "",
        status: carePlan.status || "received",
      });
      setHasCarePlanChanges(false);
    }
  }, [carePlan]);

  useEffect(() => {
    if (implementationPlan) {
      setGfpForm({
        planContent: implementationPlan.planContent || "",
        goals: implementationPlan.goals || "",
        activities: implementationPlan.activities || "",
        followUpSchedule: implementationPlan.followUpSchedule || "",
        status: implementationPlan.status || "pending",
        planType: implementationPlan.planType || "1",
        comments: implementationPlan.comments || "",
        completedDate: implementationPlan.completedDate ? new Date(implementationPlan.completedDate).toISOString().split("T")[0] : "",
        sentDate: implementationPlan.sentDate ? new Date(implementationPlan.sentDate).toISOString().split("T")[0] : "",
      });
      setHasGfpChanges(false);
    }
  }, [implementationPlan]);

  // Track changes in care plan form
  useEffect(() => {
    if (carePlan) {
      const original = {
        receivedDate: carePlan.receivedDate ? new Date(carePlan.receivedDate).toISOString().split("T")[0] : "",
        enteredJournalDate: carePlan.enteredJournalDate ? new Date(carePlan.enteredJournalDate).toISOString().split("T")[0] : "",
        staffNotifiedDate: carePlan.staffNotifiedDate ? new Date(carePlan.staffNotifiedDate).toISOString().split("T")[0] : "",
        planContent: carePlan.planContent || "",
        goals: carePlan.goals || "",
        interventions: carePlan.interventions || "",
        comment: carePlan.comment || "",
        status: carePlan.status || "received",
      };
      setHasCarePlanChanges(JSON.stringify(carePlanForm) !== JSON.stringify(original));
    }
  }, [carePlanForm, carePlan]);

  // Track changes in GFP form
  useEffect(() => {
    if (implementationPlan) {
      const original = {
        planContent: implementationPlan.planContent || "",
        goals: implementationPlan.goals || "",
        activities: implementationPlan.activities || "",
        followUpSchedule: implementationPlan.followUpSchedule || "",
        status: implementationPlan.status || "pending",
        planType: implementationPlan.planType || "1",
        comments: implementationPlan.comments || "",
        completedDate: implementationPlan.completedDate ? new Date(implementationPlan.completedDate).toISOString().split("T")[0] : "",
        sentDate: implementationPlan.sentDate ? new Date(implementationPlan.sentDate).toISOString().split("T")[0] : "",
      };
      setHasGfpChanges(JSON.stringify(gfpForm) !== JSON.stringify(original));
    }
  }, [gfpForm, implementationPlan]);

  // Handlers for care plan operations
  const handleSaveCarePlan = () => {
    const dataToSave = { ...carePlanForm };
    saveCarePlanMutation.mutate(dataToSave);
  };

  const handleDeleteCarePlan = (id: string) => {
    if (!window.confirm("Är du säker på att du vill ta bort vårdplanen?")) return;
    deleteCarePlanMutation.mutate(id);
  };

  // Handlers for GFP operations
  const handleSaveGfp = () => {
    const dataToSave = { 
      ...gfpForm,
      completedDate: gfpForm.completedDate ? new Date(gfpForm.completedDate) : null,
      sentDate: gfpForm.sentDate ? new Date(gfpForm.sentDate) : null,
    };
    saveGfpMutation.mutate(dataToSave);
  };

  const handleDeleteGfp = (id: string) => {
    if (!window.confirm("Är du säker på att du vill ta bort genomförandeplanen?")) return;
    deleteGfpMutation.mutate(id);
  };

  // Handlers for monthly report operations
  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("Är du säker på att du vill ta bort månadsrapporten?"))
      return;
    deleteMonthlyReportMutation.mutate(id);
  };

  const startEdit = (report: MonthlyReport) => {
    setEditReport(report);
    setNewQuality(report.quality || "pending");
    setMarkCompleted(report.status === "completed");
  };

  const saveReportUpdates = async () => {
    if (!editReport) return;
    const updates: any = { quality: newQuality };
    if (editReport.status !== "completed" && markCompleted) {
      updates.status = "completed";
    }
    updateMonthlyReportMutation.mutate({ id: editReport.id, updates });
  };

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

  // Helper function to get month name
  const getMonthName = (month: number) => {
    const monthNames = [
      "Januari",
      "Februari",
      "Mars",
      "April",
      "Maj",
      "Juni",
      "Juli",
      "Augusti",
      "September",
      "Oktober",
      "November",
      "December",
    ];
    return monthNames[month - 1] || "Okänd månad";
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Vårdplan - {client.initials}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveCarePlan()}
                    disabled={saveCarePlanMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saveCarePlanMutation.isPending ? "Sparar..." : "Spara"}
                  </Button>
                  {carePlan && (
                    <Button
                      onClick={() => handleDeleteCarePlan(carePlan.id)}
                      disabled={deleteCarePlanMutation.isPending}
                      variant="destructive"
                    >
                      {deleteCarePlanMutation.isPending ? "Raderar..." : "Radera"}
                    </Button>
                  )}
                </div>
              </div>
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
                      value={carePlanForm.receivedDate}
                      onChange={(e) => setCarePlanForm(prev => ({
                        ...prev,
                        receivedDate: e.target.value
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Inlagd i journal (digitalt)
                    </label>
                    <Input
                      type="date"
                      value={carePlanForm.enteredJournalDate}
                      onChange={(e) => setCarePlanForm(prev => ({
                        ...prev,
                        enteredJournalDate: e.target.value
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Personal tillsagd
                    </label>
                    <Input
                      type="date"
                      value={carePlanForm.staffNotifiedDate}
                      onChange={(e) => setCarePlanForm(prev => ({
                        ...prev,
                        staffNotifiedDate: e.target.value
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Planinnehåll</label>
                    <Textarea
                      value={carePlanForm.planContent}
                      onChange={(e) => setCarePlanForm(prev => ({
                        ...prev,
                        planContent: e.target.value
                      }))}
                      className="mt-1"
                      placeholder="Beskriv vårdplanen..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mål</label>
                    <Textarea
                      value={carePlanForm.goals}
                      onChange={(e) => setCarePlanForm(prev => ({
                        ...prev,
                        goals: e.target.value
                      }))}
                      className="mt-1"
                      placeholder="Ange mål för vårdplanen..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Interventioner</label>
                  <Textarea
                    value={carePlanForm.interventions}
                    onChange={(e) => setCarePlanForm(prev => ({
                      ...prev,
                      interventions: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Beskriv planerade interventioner..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Kommentarer</label>
                  <Textarea
                    value={carePlanForm.comment}
                    onChange={(e) => setCarePlanForm(prev => ({
                      ...prev,
                      comment: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Ytterligare kommentarer..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={carePlanForm.status}
                    onValueChange={(value) => setCarePlanForm(prev => ({
                      ...prev,
                      status: value
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Välj status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Mottagen</SelectItem>
                      <SelectItem value="entered_journal">Inlagd i journal</SelectItem>
                      <SelectItem value="staff_notified">Personal tillsagd</SelectItem>
                      <SelectItem value="gfp_pending">Väntar på GFP</SelectItem>
                      <SelectItem value="completed">Slutförd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {carePlanForm.staffNotifiedDate && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>GFP ska vara inlämnad senast:</strong>{" "}
                      {new Date(
                        new Date(carePlanForm.staffNotifiedDate).getTime() +
                          21 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString("sv-SE")}{" "}
                      (3 veckor från tillsägning)
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Badge className={getStatusColor(carePlanForm.status)}>
                    {carePlanForm.status === "received" && "Mottagen"}
                    {carePlanForm.status === "entered_journal" && "Inlagd i journal"}
                    {carePlanForm.status === "staff_notified" && "Personal tillsagd"}
                    {carePlanForm.status === "gfp_pending" && "Väntar på GFP"}
                    {carePlanForm.status === "completed" && "Slutförd"}
                  </Badge>
                  {hasCarePlanChanges && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      Osparade ändringar
                    </Badge>
                  )}
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
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveGfp()}
                    disabled={saveGfpMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saveGfpMutation.isPending ? "Sparar..." : "Spara"}
                  </Button>
                  {implementationPlan && (
                    <Button
                      onClick={() => handleDeleteGfp(implementationPlan.id)}
                      disabled={deleteGfpMutation.isPending}
                      variant="destructive"
                    >
                      {deleteGfpMutation.isPending ? "Raderar..." : "Radera"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Planinnehåll</label>
                    <Textarea
                      value={gfpForm.planContent}
                      onChange={(e) => setGfpForm(prev => ({
                        ...prev,
                        planContent: e.target.value
                      }))}
                      className="mt-1"
                      placeholder="Beskriv genomförandeplanen..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mål</label>
                    <Textarea
                      value={gfpForm.goals}
                      onChange={(e) => setGfpForm(prev => ({
                        ...prev,
                        goals: e.target.value
                      }))}
                      className="mt-1"
                      placeholder="Ange mål för genomförandet..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Aktiviteter</label>
                  <Textarea
                    value={gfpForm.activities}
                    onChange={(e) => setGfpForm(prev => ({
                      ...prev,
                      activities: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Ange planerade aktiviteter..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Uppföljningsschema</label>
                  <Textarea
                    value={gfpForm.followUpSchedule}
                    onChange={(e) => setGfpForm(prev => ({
                      ...prev,
                      followUpSchedule: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Beskriv schema för uppföljning..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={gfpForm.status}
                      onValueChange={(value) => setGfpForm(prev => ({
                        ...prev,
                        status: value
                      }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Välj status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Väntande</SelectItem>
                        <SelectItem value="in_progress">Pågående</SelectItem>
                        <SelectItem value="completed">Slutförd</SelectItem>
                        <SelectItem value="sent">Skickad</SelectItem>
                        <SelectItem value="overdue">Försenad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slutförd datum</label>
                    <Input
                      type="date"
                      value={gfpForm.completedDate}
                      onChange={(e) => setGfpForm(prev => ({
                        ...prev,
                        completedDate: e.target.value
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Skickad datum</label>
                    <Input
                      type="date"
                      value={gfpForm.sentDate}
                      onChange={(e) => setGfpForm(prev => ({
                        ...prev,
                        sentDate: e.target.value
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Kommentarer</label>
                  <Textarea
                    value={gfpForm.comments}
                    onChange={(e) => setGfpForm(prev => ({
                      ...prev,
                      comments: e.target.value
                    }))}
                    className="mt-1"
                    placeholder="Lägg till kommentarer..."
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Badge className={getStatusColor(gfpForm.status, isGfpOverdue())}>
                    {isGfpOverdue() && gfpForm.status !== "completed" && "FÖRSENAD - "}
                    {gfpForm.status === "pending" && "Väntande"}
                    {gfpForm.status === "in_progress" && "Pågående"}
                    {gfpForm.status === "completed" && "Slutförd"}
                    {gfpForm.status === "sent" && "Skickad"}
                    {gfpForm.status === "overdue" && "Försenad"}
                  </Badge>
                  {hasGfpChanges && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      Osparade ändringar
                    </Badge>
                  )}
                </div>

                {gfpForm.status === "completed" && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      GFP slutförd och godkänd
                    </p>
                  </div>
                )}
              </div>
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
                  staffId={staffId}
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
                    staffId={staffId}
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
                  staffId={staffId}
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
                                  onCheckedChange={(checked) => {
                                    updateMonthlyReportMutation.mutate({
                                      id: report.id,
                                      updates: {
                                        status: checked
                                          ? "completed"
                                          : "in_progress",
                                      },
                                    });
                                  }}
                                />
                                <span className="text-sm">Slutförd</span>
                              </div>
                              <div>
                                <Select
                                  value={report?.status || "not_started"}
                                  onValueChange={(value) => {
                                    updateMonthlyReportMutation.mutate({
                                      id: report.id,
                                      updates: { status: value },
                                    });
                                  }}
                                >
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
                                <Select
                                  value={report?.quality || "pending"}
                                  onValueChange={(value) => {
                                    updateMonthlyReportMutation.mutate({
                                      id: report.id,
                                      updates: { quality: value },
                                    });
                                  }}
                                >
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
                                onClick={() => startEdit(report)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Redigera
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-600"
                                onClick={() => handleDeleteReport(report.id)}
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
                    staffId={staffId}
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
                  staffId={staffId}
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
                                  onValueChange={(value) => {
                                    updateVimsaTimeMutation.mutate({
                                      id: timeData.id,
                                      updates: {
                                        matchesDocumentation: value === "yes",
                                      },
                                    });
                                  }}
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
                                onClick={() => {
                                  // TODO: Implement edit functionality
                                  toast({
                                    title: "Redigera funktion kommer snart",
                                  });
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Redigera
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-600"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Är du säker på att du vill ta bort vimsa tiden?"
                                    )
                                  ) {
                                    deleteVimsaTimeMutation.mutate(timeData.id);
                                  }
                                }}
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
                    staffId={staffId}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Monthly Report Dialog */}
      {editReport && (
        <Dialog open onOpenChange={() => setEditReport(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Redigera månadsrapport – {getMonthName(editReport.month)}{" "}
                {editReport.year}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Quality dropdown */}
              <div>
                <FormLabel>Kvalitet</FormLabel>
                <Select value={newQuality} onValueChange={setNewQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Godkänd</SelectItem>
                    <SelectItem value="pending">Sådär</SelectItem>
                    <SelectItem value="not_approved">Ej godkänd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Completed checkbox (show only if not already completed) */}
              {editReport.status !== "completed" && (
                <div className="flex items-center">
                  <Checkbox
                    id="completed"
                    checked={markCompleted}
                    onCheckedChange={(v) => setMarkCompleted(!!v)}
                  />
                  <FormLabel htmlFor="completed" className="ml-2">
                    Markera som slutförd
                  </FormLabel>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditReport(null)}>
                  Avbryt
                </Button>
                <Button
                  onClick={saveReportUpdates}
                  className="bg-ungdoms-600 text-white"
                >
                  Spara
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
