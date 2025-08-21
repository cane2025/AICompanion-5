import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Heart,
  Clipboard,
  FileText,
  Calendar,
  Clock,
  Plus,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  insertCarePlanSchema,
  insertImplementationPlanSchema,
  insertWeeklyDocumentationSchema,
  insertMonthlyReportSchema,
  insertVimsaTimeSchema,
  insertClientSchema,
  type InsertCarePlan,
  type InsertImplementationPlan,
  type InsertWeeklyDocumentation,
  type InsertMonthlyReport,
  type InsertVimsaTime,
  type InsertClient,
  type Staff,
  type Client,
} from "@shared/schema";

interface ClientWorkflowProps {
  staff: Staff;
}

export function ClientWorkflow({ staff }: ClientWorkflowProps) {
  const [activeTab, setActiveTab] = useState("careplan");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hämta klienter för denna anställd
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
  } = useQuery<Client[]>({
    queryKey: ["/api/staff", staff.id, "clients"],
    queryFn: async () =>
      (await apiRequest("GET", `/api/staff/${staff.id}/clients`)).json(),
    staleTime: 30_000,
  });

  // Current week/month helpers
  const getCurrentWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return { year, week };
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  };

  const { year: currentYear, week: currentWeek } = getCurrentWeek();
  const { month: currentMonth } = getCurrentMonth();

  // Formulär för att skapa ny klient
  const newClientForm = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      staffId: staff.id,
      initials: "",
      personalNumber: "",
      notes: "",
      status: "active",
    },
  });

  // Vårdplan formulär
  const carePlanForm = useForm<InsertCarePlan>({
    resolver: zodResolver(insertCarePlanSchema),
    defaultValues: {
      clientId: selectedClientId,
      staffId: staff.id,
      planContent: "",
      goals: "",
      interventions: "",
      evaluationCriteria: "",
      isActive: true,
      status: "received",
      comment: "",
    },
  });

  // Genomförandeplan formulär
  const implementationForm = useForm<InsertImplementationPlan>({
    resolver: zodResolver(insertImplementationPlanSchema),
    defaultValues: {
      clientId: selectedClientId,
      staffId: staff.id,
      planContent: "",
      goals: "",
      activities: "",
      followUpSchedule: "",
      status: "pending",
      isActive: true,
      followup1: false,
      followup2: false,
      comments: "",
      planType: "care", // updated from "1"
    },
  });

  // Veckodokumentation formulär
  const weeklyDocForm = useForm<InsertWeeklyDocumentation>({
    resolver: zodResolver(insertWeeklyDocumentationSchema),
    defaultValues: {
      clientId: selectedClientId,
      staffId: staff.id,
      year: currentYear,
      week: currentWeek,
      documentation: "",
      qualityAssessment: "pending",
      comments: "",
    },
  });

  // Månadsrapport formulär
  const monthlyReportForm = useForm<InsertMonthlyReport>({
    resolver: zodResolver(insertMonthlyReportSchema),
    defaultValues: {
      clientId: selectedClientId,
      staffId: staff.id,
      year: currentYear,
      month: currentMonth,
      reportContent: "",
      status: "not_started",
      quality: "pending",
      comment: "",
    },
  });

  // Vimsa Tid formulär
  const vimsaTimeForm = useForm<InsertVimsaTime>({
    resolver: zodResolver(insertVimsaTimeSchema),
    defaultValues: {
      clientId: selectedClientId,
      staffId: staff.id,
      year: currentYear,
      week: currentWeek,
      status: "not_started",
      approved: false,
      comments: "",
      hoursWorked: 0,
      matchesDocumentation: false,
    },
  });

  // Mutationer
  const createClientEndpoint = "/api/clients" as const;
  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      const res = await apiRequest("POST", createClientEndpoint, data);
      const text = await res.text();
      if (!res.ok) {
        const err: any = new Error(text || `${res.status} ${res.statusText}`);
        err.status = res.status;
        err.responseBody = text;
        err.endpoint = createClientEndpoint;
        err.payload = data;
        throw err;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text as any;
      }
    },
    onSuccess: (newClient) => {
      toast({ title: "Framgång", description: "Klient skapad!" });
      newClientForm.reset();
      setSelectedClientId(newClient.id);
      queryClient.invalidateQueries({
        queryKey: ["/api/staff", staff.id, "clients"],
      });
    },
    onError: (error: any) => {
      const description = error?.message || error?.responseBody || "Okänt fel";
      toast({ title: "Sparning misslyckades", description });
      console.log({
        endpoint: error?.endpoint ?? createClientEndpoint,
        status: error?.status,
        payload: error?.payload,
        responseBody: error?.responseBody,
      });
    },
  });

  const createCarePlanEndpoint = "/api/care-plans" as const;
  const createCarePlanMutation = useMutation({
    mutationFn: async (data: InsertCarePlan) => {
      const res = await apiRequest("POST", createCarePlanEndpoint, data);
      const text = await res.text();
      if (!res.ok) {
        const err: any = new Error(text || `${res.status} ${res.statusText}`);
        err.status = res.status;
        err.responseBody = text;
        err.endpoint = createCarePlanEndpoint;
        err.payload = data;
        throw err;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text as any;
      }
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Framgång", description: "Vårdplan sparad!" });
      // Invalidate client-scoped and staff-scoped queries
      const cid = (variables as InsertCarePlan)?.clientId ?? selectedClientId;
      if (cid) {
        queryClient.invalidateQueries({ queryKey: ["/api/care-plans", cid] });
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/care-plans/staff", staff.id],
      });
      setActiveTab("implementation");
    },
    onError: (error: any) => {
      const description = error?.message || error?.responseBody || "Okänt fel";
      toast({ title: "Sparning misslyckades", description });
      console.log({
        endpoint: error?.endpoint ?? createCarePlanEndpoint,
        status: error?.status,
        payload: error?.payload,
        responseBody: error?.responseBody,
      });
    },
  });

  const createImplementationEndpoint = "/api/implementation-plans" as const;
  const createImplementationMutation = useMutation({
    mutationFn: async (data: InsertImplementationPlan) => {
      const res = await apiRequest("POST", createImplementationEndpoint, data);
      const text = await res.text();
      if (!res.ok) {
        const err: any = new Error(text || `${res.status} ${res.statusText}`);
        err.status = res.status;
        err.responseBody = text;
        err.endpoint = createImplementationEndpoint;
        err.payload = data;
        throw err;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text as any;
      }
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Framgång", description: "Genomförandeplan sparad!" });
      // Invalidate client-scoped and staff-scoped queries
      const cid = (variables as InsertImplementationPlan)?.clientId ?? selectedClientId;
      if (cid) {
        queryClient.invalidateQueries({
          queryKey: ["/api/implementation-plans", cid],
        });
        // Care plan status may reflect GFP progression; refresh care plan too
        queryClient.invalidateQueries({ queryKey: ["/api/care-plans", cid] });
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans/staff", staff.id],
      });
      setActiveTab("documentation");
    },
    onError: (error: any) => {
      const description = error?.message || error?.responseBody || "Okänt fel";
      toast({ title: "Sparning misslyckades", description });
      console.log({
        endpoint: error?.endpoint ?? createImplementationEndpoint,
        status: error?.status,
        payload: error?.payload,
        responseBody: error?.responseBody,
      });
    },
  });

  const createWeeklyDocEndpoint = "/api/weekly-documentation" as const;
  const createWeeklyDocMutation = useMutation({
    mutationFn: async (data: InsertWeeklyDocumentation) => {
      const res = await apiRequest("POST", createWeeklyDocEndpoint, data);
      const text = await res.text();
      if (!res.ok) {
        const err: any = new Error(text || `${res.status} ${res.statusText}`);
        err.status = res.status;
        err.responseBody = text;
        err.endpoint = createWeeklyDocEndpoint;
        err.payload = data;
        throw err;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text as any;
      }
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Framgång", description: "Veckodokumentation sparad!" });
      const cid = (variables as InsertWeeklyDocumentation)?.clientId ?? selectedClientId;
      if (cid) {
        queryClient.invalidateQueries({
          queryKey: ["/api/weekly-documentation", cid],
        });
      }
      setActiveTab("monthly");
    },
    onError: (error: any) => {
      const description = error?.message || error?.responseBody || "Okänt fel";
      toast({ title: "Sparning misslyckades", description });
      console.log({
        endpoint: error?.endpoint ?? createWeeklyDocEndpoint,
        status: error?.status,
        payload: error?.payload,
        responseBody: error?.responseBody,
      });
    },
  });

  const createMonthlyReportEndpoint = "/api/monthly-reports" as const;
  const createMonthlyReportMutation = useMutation({
    mutationFn: async (data: InsertMonthlyReport) => {
      const res = await apiRequest("POST", createMonthlyReportEndpoint, data);
      const text = await res.text();
      if (!res.ok) {
        const err: any = new Error(text || `${res.status} ${res.statusText}`);
        err.status = res.status;
        err.responseBody = text;
        err.endpoint = createMonthlyReportEndpoint;
        err.payload = data;
        throw err;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text as any;
      }
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Framgång", description: "Månadsrapport sparad!" });
      const cid = (variables as InsertMonthlyReport)?.clientId ?? selectedClientId;
      if (cid) {
        queryClient.invalidateQueries({
          queryKey: ["/api/monthly-reports", cid],
        });
      }
      setActiveTab("vimsa");
    },
    onError: (error: any) => {
      const description = error?.message || error?.responseBody || "Okänt fel";
      toast({ title: "Sparning misslyckades", description });
      console.log({
        endpoint: error?.endpoint ?? createMonthlyReportEndpoint,
        status: error?.status,
        payload: error?.payload,
        responseBody: error?.responseBody,
      });
    },
  });

  const createVimsaTimeEndpoint = "/api/vimsa-time" as const;
  const createVimsaTimeMutation = useMutation({
    mutationFn: async (data: InsertVimsaTime) => {
      const res = await apiRequest("POST", createVimsaTimeEndpoint, data);
      const text = await res.text();
      if (!res.ok) {
        const err: any = new Error(text || `${res.status} ${res.statusText}`);
        err.status = res.status;
        err.responseBody = text;
        err.endpoint = createVimsaTimeEndpoint;
        err.payload = data;
        throw err;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text as any;
      }
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Framgång",
        description: "Vimsa Tid sparad! Klient komplett!",
      });
      const cid = (variables as InsertVimsaTime)?.clientId ?? selectedClientId;
      if (cid) {
        queryClient.invalidateQueries({ queryKey: ["/api/vimsa-time", cid] });
      }
    },
    onError: (error: any) => {
      const description = error?.message || error?.responseBody || "Okänt fel";
      toast({ title: "Sparning misslyckades", description });
      console.log({
        endpoint: error?.endpoint ?? createVimsaTimeEndpoint,
        status: error?.status,
        payload: error?.payload,
        responseBody: error?.responseBody,
      });
    },
  });

  // Common guard: kräver vald klient innan submit
  function requireClientId(): string | null {
    if (!selectedClientId) {
      toast({
        title: "Välj klient först",
        description: "Du måste välja/skapa en klient innan du kan spara.",
        variant: "destructive",
      });
      return null;
    }
    return selectedClientId;
  }

  if (clientsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ungdoms-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Laddar klientdata...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Klientväljare */}
      <Card className="border-ungdoms-600">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="mr-2 h-5 w-5 text-ungdoms-400" />
            Klient för {staff.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="client-select">Välj befintlig klient</Label>
              <Select
                value={selectedClientId ?? undefined}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj klient..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.initials}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-muted-foreground text-sm">ELLER</div>

            <div className="flex gap-2">
              <Input
                placeholder="Initialer (t.ex. AB)"
                value={newClientForm.watch("initials") ?? ""}
                onChange={(e) =>
                  newClientForm.setValue(
                    "initials",
                    e.target.value.toUpperCase()
                  )
                }
                className="w-20"
                maxLength={3}
              />
              <Button
                onClick={() =>
                  createClientMutation.mutate(newClientForm.getValues())
                }
                disabled={createClientMutation.isPending}
                className="bg-ungdoms-500 hover:bg-ungdoms-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                Skapa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Huvudflöde med tabbar */}
      {selectedClientId && (
        <Card className="border-ungdoms-600">
          <CardHeader>
            <CardTitle>
              Klientflöde för{" "}
              {clients.find((c) => c.id === selectedClientId)?.initials}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger
                  value="careplan"
                  className="flex items-center gap-1"
                >
                  <Heart className="h-4 w-4" />
                  1. Vårdplan
                </TabsTrigger>
                <TabsTrigger
                  value="implementation"
                  className="flex items-center gap-1"
                >
                  <Clipboard className="h-4 w-4" />
                  2. Genomförandeplan
                </TabsTrigger>
                <TabsTrigger
                  value="documentation"
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  3. Dokumentation
                </TabsTrigger>
                <TabsTrigger
                  value="monthly"
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  4. Månadsrapport
                </TabsTrigger>
                <TabsTrigger value="vimsa" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  5. Vimsa Tid
                </TabsTrigger>
              </TabsList>

              {/* VÅRDPLAN */}
              <TabsContent value="careplan" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="mr-2 h-5 w-5 text-ungdoms-400" />
                      Steg 1: Vårdplan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...carePlanForm}>
                      <form
                        onSubmit={carePlanForm.handleSubmit((data) => {
                          const cid = requireClientId();
                          if (!cid) return;
                          console.log("submit payload", data);
                          createCarePlanMutation.mutate({
                            ...data,
                            clientId: cid,
                            staffId: staff.id,
                          });
                        })}
                        className="space-y-4"
                      >
                        <FormField
                          control={carePlanForm.control}
                          name="planContent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vårdplanens innehåll</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Beskrivning av vårdplanen..."
                                  rows={6}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={carePlanForm.control}
                            name="goals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mål</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Vårdmål och delmål..."
                                    rows={4}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={carePlanForm.control}
                            name="interventions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Interventioner</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Planerade interventioner..."
                                    rows={4}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={carePlanForm.control}
                          name="evaluationCriteria"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Utvärderingskriterier</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Kriterier för utvärdering..."
                                  rows={3}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={createCarePlanMutation.isPending}
                          className="bg-ungdoms-500 hover:bg-ungdoms-600"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Spara och gå till Genomförandeplan
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GENOMFÖRANDEPLAN */}
              <TabsContent value="implementation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clipboard className="mr-2 h-5 w-5 text-ungdoms-400" />
                      Steg 2: Genomförandeplan (GFP)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...implementationForm}>
                      <form
                        onSubmit={implementationForm.handleSubmit((data) => {
                          const cid = requireClientId();
                          if (!cid) return;
                          console.log("submit payload", data);
                          createImplementationMutation.mutate({
                            ...data,
                            clientId: cid,
                            staffId: staff.id,
                          });
                        })}
                        className="space-y-4"
                      >
                        <FormField
                          control={implementationForm.control}
                          name="planContent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Planinnehåll</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Genomförandeplanens innehåll..."
                                  rows={6}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={implementationForm.control}
                            name="goals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mål</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Specifika mål för genomförande..."
                                    rows={4}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={implementationForm.control}
                            name="activities"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Aktiviteter</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Planerade aktiviteter..."
                                    rows={4}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={createImplementationMutation.isPending}
                          className="bg-ungdoms-500 hover:bg-ungdoms-600"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Spara och gå till Dokumentation
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* VECKODOKUMENTATION */}
              <TabsContent value="documentation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-ungdoms-400" />
                      Steg 3: Veckodokumentation - Vecka {currentWeek},{" "}
                      {currentYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...weeklyDocForm}>
                      <form
                        onSubmit={weeklyDocForm.handleSubmit((data) => {
                          const cid = requireClientId();
                          if (!cid) return;
                          console.log("submit payload", data);
                          createWeeklyDocMutation.mutate({
                            ...data,
                            clientId: cid,
                            staffId: staff.id,
                            year: data.year ?? currentYear,
                            week: data.week ?? currentWeek,
                          });
                        })}
                        className="space-y-4"
                      >
                        {/* Simplified weekly form: removed deprecated status field */}
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={weeklyDocForm.control}
                            name="qualityAssessment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kvalitetsbedömning</FormLabel>
                                <Select
                                  value={field.value ?? undefined}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="approved">
                                      Godkänd
                                    </SelectItem>
                                    <SelectItem value="not_approved">
                                      Ej godkänd
                                    </SelectItem>
                                    <SelectItem value="pending">
                                      Väntar
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={weeklyDocForm.control}
                          name="documentation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dokumentation</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Veckans dokumentation..."
                                  rows={6}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={weeklyDocForm.control}
                          name="comments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kommentarer</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Övriga kommentarer..."
                                  rows={3}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={createWeeklyDocMutation.isPending}
                          className="bg-ungdoms-500 hover:bg-ungdoms-600"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Spara och gå till Månadsrapport
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MÅNADSRAPPORT */}
              <TabsContent value="monthly" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-ungdoms-400" />
                      Steg 4: Månadsrapport - {currentMonth}/{currentYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...monthlyReportForm}>
                      <form
                        onSubmit={monthlyReportForm.handleSubmit((data) => {
                          const cid = requireClientId();
                          if (!cid) return;
                          console.log("submit payload", data);
                          createMonthlyReportMutation.mutate({
                            ...data,
                            clientId: cid,
                            staffId: staff.id,
                            year: data.year ?? currentYear,
                            month: data.month ?? currentMonth,
                          });
                        })}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={monthlyReportForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rapport Status</FormLabel>
                                <Select
                                  value={field.value ?? undefined}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="not_started">
                                      Ej startad
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                      Pågående
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      Slutförd
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={monthlyReportForm.control}
                            name="quality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kvalitet</FormLabel>
                                <Select
                                  value={field.value ?? undefined}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pending">
                                      Väntar
                                    </SelectItem>
                                    <SelectItem value="approved">
                                      Godkänd
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                      Avvisad
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={monthlyReportForm.control}
                          name="reportContent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rapportinnehåll</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Månadsrapportens innehåll..."
                                  rows={8}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={createMonthlyReportMutation.isPending}
                          className="bg-ungdoms-500 hover:bg-ungdoms-600"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Spara och gå till Vimsa Tid
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* VIMSA TID */}
              <TabsContent value="vimsa" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-ungdoms-400" />
                      Steg 5: Vimsa Tid - Vecka {currentWeek}, {currentYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...vimsaTimeForm}>
                      <form
                        onSubmit={vimsaTimeForm.handleSubmit((data) => {
                          const cid = requireClientId();
                          if (!cid) return;
                          console.log("submit payload", data);
                          createVimsaTimeMutation.mutate({
                            ...data,
                            clientId: cid,
                            staffId: staff.id,
                            year: data.year ?? currentYear,
                            week: data.week ?? currentWeek,
                            hoursWorked: data.hoursWorked ?? 0,
                          });
                        })}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={vimsaTimeForm.control}
                            name="hoursWorked"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Arbetade timmar</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      const num = v === "" ? null : Number(v);
                                      field.onChange(
                                        Number.isNaN(num as number) ? null : num
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={vimsaTimeForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                  value={field.value ?? undefined}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="not_started">
                                      Ej startad
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                      Pågående
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      Slutförd
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={vimsaTimeForm.control}
                          name="comments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kommentarer</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Övriga kommentarer..."
                                  rows={3}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={createVimsaTimeMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Slutför klientflödet!
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
