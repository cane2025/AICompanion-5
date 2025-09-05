import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, FileText, Plus, Users, Clock, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Staff, Client } from "@shared/schema";

export function CompleteWorkflowOverview() {
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [newClientInitials, setNewClientInitials] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffInitials, setNewStaffInitials] = useState("");
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const { toast } = useToast();

  // State för alla funktioner
  const [dayStatus, setDayStatus] = useState<{ [key: string]: string }>({});
  const [monthStatus, setMonthStatus] = useState<{ [key: string]: string }>({});
  const [careplanStatus, setCareplanStatus] = useState<{
    [key: string]: { [key: string]: boolean };
  }>({});
  const [implementationStatus, setImplementationStatus] = useState<{
    [key: string]: { [key: string]: boolean };
  }>({});
  const [vimsaStatus, setVimsaStatus] = useState<{
    [key: string]: { [key: string]: boolean };
  }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  // Fetch data
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients/all"],
  });

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: async (data: { name: string; initials: string }) => {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          initials: data.initials,
        }),
      });
      if (!response.ok) throw new Error("Kunde inte skapa personal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Personal skapad",
        description: "Ny personal har lagts till.",
      });
      setNewStaffName("");
      setNewStaffInitials("");
      setShowStaffDialog(false);
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: { initials: string; staffId: string }) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Kunde inte skapa klient");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients/all"] });
      toast({
        title: "Klient skapad",
        description: "Ny klient har lagts till.",
      });
      setNewClientInitials("");
      setShowClientDialog(false);
    },
  });

  // Save data mutations
  const saveWeeklyDocMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/weekly-documentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sparat", description: "Veckodokumentation sparad" });
    },
  });

  const saveMonthlyReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/monthly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sparat", description: "Månadsrapport sparad" });
    },
  });

  const saveCarePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/care-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sparat", description: "Vårdplan sparad" });
    },
  });

  const saveImplementationPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/implementation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sparat", description: "Genomförandeplan sparad" });
    },
  });

  const saveVimsaTimeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/vimsa-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sparat", description: "Vimsa Tid sparad" });
    },
  });

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-500";
      case "reminded":
        return "bg-yellow-500";
      case "not_done":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const toggleDayStatusAndSave = (weekKey: string, day: string) => {
    const key = `${weekKey}-${day}`;
    const currentStatus = dayStatus[key] || "not_done";
    const nextStatus =
      currentStatus === "not_done"
        ? "reminded"
        : currentStatus === "reminded"
        ? "done"
        : "not_done";
    setDayStatus((prev) => ({ ...prev, [key]: nextStatus }));

    // Save to database
    const [clientId, weekPart] = weekKey.split("-week");
    const weekNumber = parseInt(weekPart);

    saveWeeklyDocMutation.mutate({
      clientId,
      staffId: selectedStaff,
      year: 2024,
      week: weekNumber,
      [`${day.toLowerCase()}Documented`]: nextStatus === "done",
      documentation: `${day}: ${nextStatus}`,
      comments: comments[`week-${clientId}-${weekNumber}`] || "",
    });
  };

  const handleMonthStatusChange = (month: number, currentStatus: string) => {
    const newStatus =
      currentStatus === "in_progress" ? "completed" : "in_progress";
    setMonthStatus((prev) => ({ ...prev, [`month-${month}`]: newStatus }));
  };

  const toggleMonthStatusAndSave = (monthKey: string) => {
    const currentStatus = monthStatus[monthKey] || "not_submitted";
    const nextStatus =
      currentStatus === "not_submitted"
        ? "late"
        : currentStatus === "late"
        ? "submitted"
        : "not_submitted";
    setMonthStatus((prev) => ({ ...prev, [monthKey]: nextStatus }));

    const monthNumber = parseInt(monthKey.replace("month-", ""));
    saveMonthlyReportMutation.mutate({
      staffId: selectedStaff,
      year: 2024,
      month: monthNumber,
      status: nextStatus,
      comment: comments[monthKey] || "",
    });
  };

  const updateComment = (key: string, comment: string) => {
    setComments((prev) => ({ ...prev, [key]: comment }));
  };

  // Vårdplan toggle functions
  const toggleCarePlanStatus = (clientId: string, step: string) => {
    const currentStatus = careplanStatus[clientId]?.[step] || false;
    setCareplanStatus((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [step]: !currentStatus,
      },
    }));

    saveCarePlanMutation.mutate({
      clientId,
      staffId: selectedStaff,
      [step]: !currentStatus,
      comments: comments[`careplan-${clientId}`] || "",
    });
  };

  // Genomförandeplan toggle functions
  const toggleImplementationStatus = (clientId: string, step: string) => {
    const currentStatus = implementationStatus[clientId]?.[step] || false;
    setImplementationStatus((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [step]: !currentStatus,
      },
    }));

    saveImplementationPlanMutation.mutate({
      clientId,
      staffId: selectedStaff,
      [step]: !currentStatus,
      comments: comments[`implementation-${clientId}`] || "",
    });
  };

  // Vimsa Tid toggle functions
  const toggleVimsaStatus = (week: number, step: string) => {
    const weekKey = `week-${week}`;
    const currentStatus = vimsaStatus[weekKey]?.[step] || false;
    setVimsaStatus((prev) => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [step]: !currentStatus,
      },
    }));

    saveVimsaTimeMutation.mutate({
      clientId: selectedClient,
      staffId: selectedStaff,
      week,
      year: 2024,
      [step]: !currentStatus,
      comments: comments[`vimsa-${week}`] || "",
    });
  };

  // Data arrays
  const weeks = Array.from({ length: 20 }, (_, i) => i + 33);
  const months = [
    { value: 8, label: "Augusti" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];
  const dayButtons = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  // Filtrera klienter baserat på vald personal
  const filteredClients = selectedStaff
    ? clients.filter((client) => client.staffId === selectedStaff)
    : clients;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ungdoms-800">
          Komplett Vårdflöde
        </h3>

        {/* Personal Selection */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Välj Personal:</label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Välj personal..." />
              </SelectTrigger>
              <SelectContent>
                {staff.map((staffMember) => (
                  <SelectItem key={staffMember.id} value={staffMember.id}>
                    {staffMember.name} ({staffMember.initials})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!selectedStaff && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            Välj först en personal för att se deras klienter och vårdflöde.
          </p>
        </div>
      )}

      {selectedStaff && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-ungdoms-700">
              Klienter för {staff.find((s) => s.id === selectedStaff)?.name} (
              {filteredClients.length} st)
            </h4>
            <div className="flex gap-2">
              <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Users className="h-4 w-4 mr-2" />
                    Personal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hantera Personal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Lägg till ny personal</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Namn..."
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                        />
                        <Input
                          placeholder="Initialer..."
                          value={newStaffInitials}
                          onChange={(e) => setNewStaffInitials(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={() =>
                          createStaffMutation.mutate({
                            name: newStaffName,
                            initials: newStaffInitials,
                          })
                        }
                        disabled={
                          !newStaffName ||
                          !newStaffInitials ||
                          createStaffMutation.isPending
                        }
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Skapa Personal
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={showClientDialog}
                onOpenChange={setShowClientDialog}
              >
                <DialogTrigger asChild>
                  <Button className="bg-ungdoms-600 hover:bg-ungdoms-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Klient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lägg till Klient</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Klientinitialer..."
                      value={newClientInitials}
                      onChange={(e) => setNewClientInitials(e.target.value)}
                    />
                    <Button
                      onClick={() =>
                        createClientMutation.mutate({
                          initials: newClientInitials,
                          staffId: selectedStaff,
                        })
                      }
                      disabled={
                        !newClientInitials || createClientMutation.isPending
                      }
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Skapa Klient
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Client Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Välj Klient:</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Välj klient..." />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.initials}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClient && (
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="weekly">Veckodokumentation</TabsTrigger>
                <TabsTrigger value="monthly">Månadsrapporter</TabsTrigger>
                <TabsTrigger value="careplan">Vårdplan</TabsTrigger>
                <TabsTrigger value="implementation">
                  Genomförandeplan
                </TabsTrigger>
                <TabsTrigger value="vimsa">Vimsa Tid</TabsTrigger>
              </TabsList>

              {/* Veckodokumentation */}
              <TabsContent value="weekly">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Veckodokumentation (Vecka 33-52)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {weeks.map((week) => (
                        <Card key={week} className="border-ungdoms-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Vecka {week}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="grid grid-cols-7 gap-2">
                                {dayButtons.map((day) => {
                                  const dayKey = `${selectedClient}-week${week}-${day}`;
                                  const status =
                                    dayStatus[dayKey] || "not_done";
                                  return (
                                    <div key={day} className="text-center">
                                      <div className="text-xs font-medium mb-1">
                                        {day}
                                      </div>
                                      <Button
                                        size="sm"
                                        className={`w-full h-8 ${getStatusColor(
                                          status
                                        )} hover:opacity-80`}
                                        onClick={() =>
                                          toggleDayStatusAndSave(
                                            `${selectedClient}-week${week}`,
                                            day
                                          )
                                        }
                                      >
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded bg-green-500"></div>
                                  Gjord
                                </span>
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                                  Påmind
                                </span>
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded bg-red-500"></div>
                                  Ej gjord
                                </span>
                              </div>
                              <Textarea
                                placeholder="Kommentarer för vecka..."
                                rows={2}
                                className="text-sm"
                                value={
                                  comments[`week-${selectedClient}-${week}`] ||
                                  ""
                                }
                                onChange={(e) =>
                                  updateComment(
                                    `week-${selectedClient}-${week}`,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Månadsrapporter */}
              <TabsContent value="monthly">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Månadsrapporter (Augusti-December)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {months.map((month) => (
                        <Card key={month.value} className="border-ungdoms-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {month.label} 2024
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    toggleMonthStatusAndSave(
                                      `month-${month.value}`
                                    )
                                  }
                                  className={
                                    monthStatus[`month-${month.value}`] ===
                                    "completed"
                                      ? "bg-green-600 hover:bg-green-700"
                                      : monthStatus[`month-${month.value}`] ===
                                        "in_progress"
                                      ? "bg-yellow-600 hover:bg-yellow-700"
                                      : "bg-red-600 hover:bg-red-700"
                                  }
                                >
                                  {monthStatus[`month-${month.value}`] ===
                                  "completed"
                                    ? "Inlämnad"
                                    : monthStatus[`month-${month.value}`] ===
                                      "in_progress"
                                    ? "Pågående"
                                    : "Ej startad"}
                                </Button>
                              </div>
                              <Textarea
                                placeholder="Kommentarer för månadsrapport..."
                                rows={2}
                                className="text-sm"
                                value={comments[`month-${month.value}`] || ""}
                                onChange={(e) =>
                                  updateComment(
                                    `month-${month.value}`,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vårdplan Tab Content */}
              <TabsContent value="careplan">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Vårdplan Status (Inkommen → Skickad)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Card className="border-ungdoms-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            Vårdplan för{" "}
                            {
                              filteredClients.find(
                                (c) => c.id === selectedClient
                              )?.initials
                            }
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Vårdplan steg */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              {[
                                {
                                  key: "received",
                                  label: "Inkommen",
                                  color: "bg-blue-600",
                                },
                                {
                                  key: "scanned",
                                  label: "Skannad",
                                  color: "bg-purple-600",
                                },
                                {
                                  key: "notified",
                                  label: "Tillsagd",
                                  color: "bg-yellow-600",
                                },
                                {
                                  key: "submitted",
                                  label: "Inlämnad",
                                  color: "bg-orange-600",
                                },
                                {
                                  key: "sent",
                                  label: "Skickad",
                                  color: "bg-green-600",
                                },
                              ].map((step) => {
                                const isCompleted =
                                  careplanStatus[selectedClient]?.[step.key] ||
                                  false;
                                return (
                                  <div key={step.key} className="text-center">
                                    <div className="text-xs font-medium mb-2">
                                      {step.label}
                                    </div>
                                    <Button
                                      size="sm"
                                      className={`w-full h-12 ${
                                        isCompleted
                                          ? step.color + " hover:opacity-80"
                                          : "bg-gray-300 hover:bg-gray-400"
                                      }`}
                                      onClick={() =>
                                        toggleCarePlanStatus(
                                          selectedClient,
                                          step.key
                                        )
                                      }
                                    >
                                      {isCompleted ? (
                                        <div className="flex flex-col items-center">
                                          <div className="w-3 h-3 rounded-full bg-white mb-1"></div>
                                          <span className="text-xs">Klar</span>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center">
                                          <div className="w-3 h-3 rounded-full border-2 border-white mb-1"></div>
                                          <span className="text-xs">
                                            Väntar
                                          </span>
                                        </div>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Progress indikator */}
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Framsteg</span>
                                <span>
                                  {
                                    Object.values(
                                      careplanStatus[selectedClient] || {}
                                    ).filter(Boolean).length
                                  }
                                  /5
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                {(() => {
                                  const completed = Object.values(
                                    careplanStatus[selectedClient] || {}
                                  ).filter(Boolean).length;
                                  const widthClasses = [
                                    "w-0",
                                    "w-1/5",
                                    "w-2/5",
                                    "w-3/5",
                                    "w-4/5",
                                    "w-full",
                                  ] as const;
                                  const widthClass =
                                    widthClasses[
                                      Math.max(0, Math.min(5, completed))
                                    ];
                                  return (
                                    <div
                                      className={`bg-green-600 h-2 rounded-full transition-all duration-300 ${widthClass}`}
                                    ></div>
                                  );
                                })()}
                              </div>
                            </div>

                            <Textarea
                              placeholder="Kommentarer för vårdplan..."
                              rows={3}
                              className="text-sm"
                              value={
                                comments[`careplan-${selectedClient}`] || ""
                              }
                              onChange={(e) =>
                                updateComment(
                                  `careplan-${selectedClient}`,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Genomförandeplan Tab Content */}
              <TabsContent value="implementation">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Genomförandeplan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Card className="border-ungdoms-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            Genomförandeplan för{" "}
                            {
                              filteredClients.find(
                                (c) => c.id === selectedClient
                              )?.initials
                            }
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Implementation steps */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                {
                                  key: "followup1",
                                  label: "Uppföljning 1",
                                  desc: "Första uppföljningsmöte genomfört",
                                },
                                {
                                  key: "followup2",
                                  label: "Uppföljning 2",
                                  desc: "Andra uppföljningsmöte genomfört",
                                },
                              ].map((step) => {
                                const isCompleted =
                                  implementationStatus[selectedClient]?.[
                                    step.key
                                  ] || false;
                                return (
                                  <div
                                    key={step.key}
                                    className="border rounded-lg p-4"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-medium">
                                        {step.label}
                                      </h4>
                                      <Button
                                        size="sm"
                                        className={`${
                                          isCompleted
                                            ? "bg-green-600 hover:bg-green-700"
                                            : "bg-gray-300 hover:bg-gray-400"
                                        }`}
                                        onClick={() =>
                                          toggleImplementationStatus(
                                            selectedClient,
                                            step.key
                                          )
                                        }
                                      >
                                        {isCompleted
                                          ? "Genomförd"
                                          : "Ej genomförd"}
                                      </Button>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {step.desc}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Genomförd datum */}
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium mb-2">Skapad datum</h4>
                              <Input
                                type="date"
                                className="w-full"
                                defaultValue={
                                  new Date().toISOString().split("T")[0]
                                }
                              />
                            </div>

                            <Textarea
                              placeholder="Kommentarer för genomförandeplan..."
                              rows={3}
                              className="text-sm"
                              value={
                                comments[`implementation-${selectedClient}`] ||
                                ""
                              }
                              onChange={(e) =>
                                updateComment(
                                  `implementation-${selectedClient}`,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vimsa Tid Tab Content */}
              <TabsContent value="vimsa">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Vimsa Tid (Vecka 33-52)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Översikt */}
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-blue-800">
                                Tidrapportering Status
                              </h4>
                              <p className="text-sm text-blue-600">
                                Godkända veckor:{" "}
                                {
                                  Object.values(vimsaStatus).filter(
                                    (week) => week.approved
                                  ).length
                                }
                                /{weeks.length}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-800">
                                {Math.round(
                                  (Object.values(vimsaStatus).filter(
                                    (week) => week.approved
                                  ).length /
                                    weeks.length) *
                                    100
                                ) || 0}
                                %
                              </div>
                              <div className="text-xs text-blue-600">
                                Godkänt
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Veckovis lista */}
                      <div className="grid gap-2">
                        {weeks.map((week) => {
                          const weekKey = `week-${week}`;
                          const isApproved =
                            vimsaStatus[weekKey]?.approved || false;
                          return (
                            <Card key={week} className="border-ungdoms-200 p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  Vecka {week}
                                </span>
                                <div className="flex items-center gap-3">
                                  <Button
                                    size="sm"
                                    className={`${
                                      isApproved
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                    }`}
                                    onClick={() =>
                                      toggleVimsaStatus(week, "approved")
                                    }
                                  >
                                    {isApproved ? (
                                      <>
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Godkänd
                                      </>
                                    ) : (
                                      <>
                                        <X className="h-3 w-3 mr-1" />
                                        Ej godkänd
                                      </>
                                    )}
                                  </Button>
                                  <Input
                                    placeholder="Kommentar..."
                                    className="w-32 h-8"
                                    value={comments[`vimsa-${week}`] || ""}
                                    onChange={(e) =>
                                      updateComment(
                                        `vimsa-${week}`,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}

export default CompleteWorkflowOverview;
