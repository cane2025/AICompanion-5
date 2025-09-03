import { useState } from "react";
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
import React from "react";

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  
  // New state for editing care plans and implementation plans
  const [editingCarePlan, setEditingCarePlan] = useState(false);
  const [editingImplementationPlan, setEditingImplementationPlan] = useState(false);
  const [carePlanForm, setCarePlanForm] = useState({
    receivedDate: "",
    enteredJournalDate: "",
    staffNotifiedDate: "",
    status: "received"
  });
  const [implementationPlanForm, setImplementationPlanForm] = useState({
    dueDate: "",
    completedDate: "",
    status: "pending",
    planContent: "",
    goals: "",
    activities: ""
  });

  // State for autosave indicators
  const [carePlanAutosaved, setCarePlanAutosaved] = useState(false);
  const [implementationPlanAutosaved, setImplementationPlanAutosaved] = useState(false);

  // Debounced values for autosave
  const debouncedCarePlanForm = useDebounce(carePlanForm, 800);
  const debouncedImplementationPlanForm = useDebounce(implementationPlanForm, 800);

  // Autosave effect for care plan
  React.useEffect(() => {
    if (editingCarePlan && carePlan && debouncedCarePlanForm !== carePlanForm) {
      // Only autosave if we have changes and are in edit mode
      const hasChanges = Object.keys(debouncedCarePlanForm).some(
        key => debouncedCarePlanForm[key as keyof typeof debouncedCarePlanForm] !== 
                carePlanForm[key as keyof typeof carePlanForm]
      );
      
      if (hasChanges) {
        const updates: any = {};
        if (debouncedCarePlanForm.receivedDate) updates.receivedDate = new Date(debouncedCarePlanForm.receivedDate).toISOString();
        if (debouncedCarePlanForm.enteredJournalDate) updates.enteredJournalDate = new Date(debouncedCarePlanForm.enteredJournalDate).toISOString();
        if (debouncedCarePlanForm.staffNotifiedDate) updates.staffNotifiedDate = new Date(debouncedCarePlanForm.staffNotifiedDate).toISOString();
        if (debouncedCarePlanForm.status) updates.status = debouncedCarePlanForm.status;
        
        if (Object.keys(updates).length > 0) {
          updateCarePlanMutation.mutate(updates);
          setCarePlanAutosaved(true);
          setTimeout(() => setCarePlanAutosaved(false), 3000); // Hide after 3 seconds
        }
      }
    }
  }, [debouncedCarePlanForm, editingCarePlan, carePlan]);

  // Autosave effect for implementation plan
  React.useEffect(() => {
    if (editingImplementationPlan && implementationPlan && debouncedImplementationPlanForm !== implementationPlanForm) {
      // Only autosave if we have changes and are in edit mode
      const hasChanges = Object.keys(debouncedImplementationPlanForm).some(
        key => debouncedImplementationPlanForm[key as keyof typeof debouncedImplementationPlanForm] !== 
                implementationPlanForm[key as keyof typeof implementationPlanForm]
      );
      
      if (hasChanges) {
        const updates: any = {};
        if (debouncedImplementationPlanForm.dueDate) updates.dueDate = new Date(debouncedImplementationPlanForm.dueDate).toISOString();
        if (debouncedImplementationPlanForm.completedDate) updates.completedDate = new Date(debouncedImplementationPlanForm.completedDate).toISOString();
        if (debouncedImplementationPlanForm.status) updates.status = debouncedImplementationPlanForm.status;
        if (debouncedImplementationPlanForm.planContent) updates.planContent = debouncedImplementationPlanForm.planContent;
        if (debouncedImplementationPlanForm.goals) updates.goals = debouncedImplementationPlanForm.goals;
        if (debouncedImplementationPlanForm.activities) updates.activities = debouncedImplementationPlanForm.activities;
        
        if (Object.keys(updates).length > 0) {
          updateImplementationPlanMutation.mutate(updates);
          setImplementationPlanAutosaved(true);
          setTimeout(() => setImplementationPlanAutosaved(false), 3000); // Hide after 3 seconds
        }
      }
    }
  }, [debouncedImplementationPlanForm, editingImplementationPlan, implementationPlan]);

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

  // Mutation to update care plan
  const updateCarePlanMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!carePlan) throw new Error("Ingen vårdplan att uppdatera");
      
      const response = await fetch(`/api/care-plans/${carePlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Kunde inte uppdatera vårdplan");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Vårdplan uppdaterad" });
      queryClient.invalidateQueries({
        queryKey: ["/api/care-plans", client.id],
      });
      setEditingCarePlan(false);
    },
    onError: () => {
      toast({ title: "Fel vid uppdatering av vårdplan", variant: "destructive" });
    },
  });

  // Mutation to update implementation plan
  const updateImplementationPlanMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!implementationPlan) throw new Error("Ingen genomförandeplan att uppdatera");
      
      const response = await fetch(`/api/implementation-plans/${implementationPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Kunde inte uppdatera genomförandeplan");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Genomförandeplan uppdaterad" });
      queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans", client.id],
      });
      setEditingImplementationPlan(false);
    },
    onError: () => {
      toast({ title: "Fel vid uppdatering av genomförandeplan", variant: "destructive" });
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

  // Handlers for care plan editing
  const startEditCarePlan = () => {
    if (carePlan) {
      setCarePlanForm({
        receivedDate: carePlan.receivedDate ? new Date(carePlan.receivedDate).toISOString().split('T')[0] : "",
        enteredJournalDate: carePlan.enteredJournalDate ? new Date(carePlan.enteredJournalDate).toISOString().split('T')[0] : "",
        staffNotifiedDate: carePlan.staffNotifiedDate ? new Date(carePlan.staffNotifiedDate).toISOString().split('T')[0] : "",
        status: carePlan.status || "received"
      });
    }
    setEditingCarePlan(true);
  };

  const saveCarePlan = () => {
    const updates: any = {};
    if (carePlanForm.receivedDate) updates.receivedDate = new Date(carePlanForm.receivedDate).toISOString();
    if (carePlanForm.enteredJournalDate) updates.enteredJournalDate = new Date(carePlanForm.enteredJournalDate).toISOString();
    if (carePlanForm.staffNotifiedDate) updates.staffNotifiedDate = new Date(carePlanForm.staffNotifiedDate).toISOString();
    if (carePlanForm.status) updates.status = carePlanForm.status;
    
    updateCarePlanMutation.mutate(updates);
  };

  // Handlers for implementation plan editing
  const startEditImplementationPlan = () => {
    if (implementationPlan) {
      setImplementationPlanForm({
        dueDate: implementationPlan.dueDate ? new Date(implementationPlan.dueDate).toISOString().split('T')[0] : "",
        completedDate: implementationPlan.completedDate ? new Date(implementationPlan.completedDate).toISOString().split('T')[0] : "",
        status: implementationPlan.status || "pending",
        planContent: implementationPlan.planContent || "",
        goals: implementationPlan.goals || "",
        activities: implementationPlan.activities || ""
      });
    }
    setEditingImplementationPlan(true);
  };

  const saveImplementationPlan = () => {
    const updates: any = {};
    if (implementationPlanForm.dueDate) updates.dueDate = new Date(implementationPlanForm.dueDate).toISOString();
    if (implementationPlanForm.completedDate) updates.completedDate = new Date(implementationPlanForm.completedDate).toISOString();
    if (implementationPlanForm.status) updates.status = implementationPlanForm.status;
    if (implementationPlanForm.planContent) updates.planContent = implementationPlanForm.planContent;
    if (implementationPlanForm.goals) updates.goals = implementationPlanForm.goals;
    if (implementationPlanForm.activities) updates.activities = implementationPlanForm.activities;
    
    updateImplementationPlanMutation.mutate(updates);
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
                {!editingCarePlan && (
                  <Button
                    variant="outline"
                    onClick={startEditCarePlan}
                    className="border-ungdoms-200 text-ungdoms-700 hover:bg-ungdoms-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Redigera
                  </Button>
                )}
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
                      value={editingCarePlan ? carePlanForm.receivedDate : (carePlan?.receivedDate ? new Date(carePlan.receivedDate).toISOString().split("T")[0] : "")}
                      onChange={(e) => editingCarePlan && setCarePlanForm(prev => ({ ...prev, receivedDate: e.target.value }))}
                      className="mt-1"
                      disabled={!editingCarePlan}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Inlagd i journal (digitalt)
                    </label>
                    <Input
                      type="date"
                      value={editingCarePlan ? carePlanForm.enteredJournalDate : (carePlan?.enteredJournalDate ? new Date(carePlan.enteredJournalDate).toISOString().split("T")[0] : "")}
                      onChange={(e) => editingCarePlan && setCarePlanForm(prev => ({ ...prev, enteredJournalDate: e.target.value }))}
                      className="mt-1"
                      disabled={!editingCarePlan}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Personal tillsagd
                    </label>
                    <Input
                      type="date"
                      value={editingCarePlan ? carePlanForm.staffNotifiedDate : (carePlan?.staffNotifiedDate ? new Date(carePlan.staffNotifiedDate).toISOString().split("T")[0] : "")}
                      onChange={(e) => editingCarePlan && setCarePlanForm(prev => ({ ...prev, staffNotifiedDate: e.target.value }))}
                      className="mt-1"
                      disabled={!editingCarePlan}
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
                  {editingCarePlan ? (
                    <Select
                      value={carePlanForm.status}
                      onValueChange={(value) => setCarePlanForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">Mottagen</SelectItem>
                        <SelectItem value="entered_journal">Inlagd i journal</SelectItem>
                        <SelectItem value="staff_notified">Personal tillsagd</SelectItem>
                        <SelectItem value="gfp_pending">Väntar på GFP</SelectItem>
                        <SelectItem value="completed">Slutförd</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
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
                  )}
                </div>

                {editingCarePlan && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={saveCarePlan}
                      disabled={updateCarePlanMutation.isPending}
                      className="bg-ungdoms-600 hover:bg-ungdoms-700 text-white"
                    >
                      {updateCarePlanMutation.isPending ? "Sparar..." : "Spara"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingCarePlan(false)}
                      disabled={updateCarePlanMutation.isPending}
                    >
                      Avbryt
                    </Button>
                    {carePlanAutosaved && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Autosparad
                      </div>
                    )}
                  </div>
                )}
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
                  {!editingImplementationPlan && (
                    <Button
                      variant="outline"
                      onClick={startEditImplementationPlan}
                      className="border-ungdoms-200 text-ungdoms-700 hover:bg-ungdoms-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Redigera
                    </Button>
                  )}
                  <SimpleImplementationPlanDialog clientId={client.id} />
                </div>
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
                        value={editingImplementationPlan ? implementationPlanForm.dueDate : (implementationPlan?.dueDate ? new Date(implementationPlan.dueDate).toISOString().split("T")[0] : "")}
                        onChange={(e) => editingImplementationPlan && setImplementationPlanForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="mt-1"
                        disabled={!editingImplementationPlan}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Slutförd datum
                      </label>
                      <Input
                        type="date"
                        value={editingImplementationPlan ? implementationPlanForm.completedDate : (implementationPlan?.completedDate ? new Date(implementationPlan.completedDate).toISOString().split("T")[0] : "")}
                        onChange={(e) => editingImplementationPlan && setImplementationPlanForm(prev => ({ ...prev, completedDate: e.target.value }))}
                        className="mt-1"
                        disabled={!editingImplementationPlan}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status</label>
                    {editingImplementationPlan ? (
                      <Select
                        value={implementationPlanForm.status}
                        onValueChange={(value) => setImplementationPlanForm(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Väntande</SelectItem>
                          <SelectItem value="in_progress">Pågående</SelectItem>
                          <SelectItem value="completed">Slutförd</SelectItem>
                          <SelectItem value="sent">Skickad</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
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
                    )}
                  </div>

                  {editingImplementationPlan ? (
                    <>
                      <div>
                        <label className="text-sm font-medium">Planinnehåll</label>
                        <Textarea
                          value={implementationPlanForm.planContent}
                          onChange={(e) => setImplementationPlanForm(prev => ({ ...prev, planContent: e.target.value }))}
                          className="mt-1"
                          placeholder="Beskriv planinnehållet..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Mål</label>
                        <Textarea
                          value={implementationPlanForm.goals}
                          onChange={(e) => setImplementationPlanForm(prev => ({ ...prev, goals: e.target.value }))}
                          className="mt-1"
                          placeholder="Beskriv målen..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Aktiviteter</label>
                        <Textarea
                          value={implementationPlanForm.activities}
                          onChange={(e) => setImplementationPlanForm(prev => ({ ...prev, activities: e.target.value }))}
                          className="mt-1"
                          placeholder="Beskriv aktiviteterna..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}

                  {implementationPlan?.completedDate && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        GFP slutförd och godkänd
                      </p>
                    </div>
                  )}

                  {editingImplementationPlan && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={saveImplementationPlan}
                        disabled={updateImplementationPlanMutation.isPending}
                        className="bg-ungdoms-600 hover:bg-ungdoms-700 text-white"
                      >
                        {updateImplementationPlanMutation.isPending ? "Sparar..." : "Spara"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingImplementationPlan(false)}
                        disabled={updateImplementationPlanMutation.isPending}
                      >
                        Avbryt
                      </Button>
                      {implementationPlanAutosaved && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Autosparad
                        </div>
                      )}
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
