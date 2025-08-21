import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientDetailView } from "./client-detail-view";
import { CarePlanDialog } from "./care-plan-dialog";
import { WeeklyDocumentationDialog } from "./weekly-documentation-dialog";
import { MonthlyReportDialog } from "./monthly-report-dialog";
import { VimsaTimeDialog } from "./vimsa-time-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Users,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Calendar,
  Clock as ClockIcon,
} from "lucide-react";
import type {
  Staff,
  Client,
  CarePlan,
  ImplementationPlan,
} from "@shared/schema";

interface StaffClientManagementProps {
  staff: Staff;
}

const clientSchema = z.object({
  initials: z.string().min(1, "Initialer krävs").max(10, "Max 10 tecken"),
  personalNumber: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export function StaffClientManagement({ staff }: StaffClientManagementProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // detail view client
  const [menuClientId, setMenuClientId] = useState<string | null>(null); // kebab menu state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      initials: "",
      personalNumber: "",
      notes: "",
    },
  });

  // Fetch clients for this staff member
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/staff", staff.id, "clients"],
  });

  // Fetch care plans for status overview
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans/staff", staff.id],
  });

  // Fetch implementation plans for status overview
  const { data: implementationPlans = [] } = useQuery<ImplementationPlan[]>({
    queryKey: ["/api/implementation-plans/staff", staff.id],
  });

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          staffId: staff.id,
          status: "active",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Kunde inte lägga till klient");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Framgång",
        description: "Klient tillagd framgångsrikt",
      });
      form.reset();
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["/api/staff", staff.id, "clients"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Kunde inte ta bort klient");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Framgång",
        description: "Klient borttagen framgångsrikt",
      });
      setSelectedClient(null);
      setMenuClientId(null);
      queryClient.invalidateQueries({
        queryKey: ["/api/staff", staff.id, "clients"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddClient = (data: ClientFormData) => {
    addClientMutation.mutate(data);
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("Är du säker på att du vill ta bort denna klient?")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  // Helper functions for status calculation
  const getClientCarePlan = (clientId: string) => {
    return carePlans.find((cp) => cp.clientId === clientId);
  };

  const getClientImplementationPlan = (clientId: string) => {
    return implementationPlans.find((ip) => ip.clientId === clientId);
  };

  const getClientStatusBadge = (client: Client) => {
    const carePlan = getClientCarePlan(client.id);
    const implementationPlan = getClientImplementationPlan(client.id);

    if (!carePlan) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          Ingen vårdplan
        </Badge>
      );
    }

    if (carePlan.status === "completed") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Slutförd
        </Badge>
      );
    }

    if (implementationPlan) {
      const due = implementationPlan.dueDate
        ? new Date(implementationPlan.dueDate)
        : null;
      const isOverdue = due ? new Date() > due : false;
      if (isOverdue && implementationPlan.status !== "completed") {
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            GFP Försenad
          </Badge>
        );
      }
      if (implementationPlan.status === "completed") {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            GFP Klar
          </Badge>
        );
      }
    }

    if (carePlan.status === "staff_notified") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Väntar GFP
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <FileText className="h-3 w-3 mr-1" />
        Pågående
      </Badge>
    );
  };

  if (selectedClient) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedClient(null)}
            className="border-ungdoms-200 text-ungdoms-700 hover:bg-ungdoms-50"
          >
            ← Tillbaka till klientlista
          </Button>
          <h2 className="text-xl font-semibold text-ungdoms-800">
            {staff.name} - Klient: {selectedClient.initials}
          </h2>
        </div>
        <ClientDetailView client={selectedClient} staffId={staff.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Header */}
      <Card className="border-ungdoms-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-ungdoms-800">
              <User className="h-5 w-5" />
              {staff.name} - Klienthantering
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/")}
              className="border-ungdoms-200 text-ungdoms-700 hover:bg-ungdoms-50"
            >
              ← Tillbaka till Dashboard
            </Button>
            <div className="flex gap-2">
              <CarePlanDialog
                trigger={
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Skapa Vårdplan
                  </Button>
                }
                selectedStaffId={staff.id}
              />
              <WeeklyDocumentationDialog
                trigger={
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Veckodokumentation
                  </Button>
                }
                selectedStaffId={staff.id}
              />
              <MonthlyReportDialog
                trigger={
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Månadsrapport
                  </Button>
                }
                selectedStaffId={staff.id}
              />
              <VimsaTimeDialog
                trigger={
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Vimsa Tid
                  </Button>
                }
                selectedStaffId={staff.id}
              />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till klient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lägg till ny klient</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleAddClient)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="initials"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Initialer (GDPR-säker identifiering)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="t.ex. A.B."
                                {...field}
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personalNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personnummer (frivilligt)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="YYYYMMDD-XXXX"
                                {...field}
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Anteckningar</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ytterligare information..."
                                {...field}
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(false)}
                        >
                          Avbryt
                        </Button>
                        <Button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={addClientMutation.isPending}
                        >
                          {addClientMutation.isPending
                            ? "Lägger till..."
                            : "Lägg till"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Personal</p>
              <p className="font-medium">{staff.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avdelning</p>
              <p className="font-medium">{staff.avdelning}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Antal klienter</p>
              <p className="font-medium">{clients.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card className="border-ungdoms-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-ungdoms-800">
            <Users className="h-5 w-5" />
            Klienter ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ungdoms-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laddar klienter...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Inga klienter registrerade än
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Klicka på "Lägg till klient" för att komma igång
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <Card
                  key={client.id}
                  className="border-gray-200 hover:border-ungdoms-300 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {client.initials}
                      </CardTitle>
                      {getClientStatusBadge(client)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {client.notes && (
                        <p className="text-sm text-muted-foreground">
                          {client.notes}
                        </p>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Skapad:{" "}
                        {client.createdAt
                          ? new Date(client.createdAt).toLocaleDateString(
                              "sv-SE"
                            )
                          : "Okänt datum"}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedClient(client)}
                          className="flex-1 border-ungdoms-200 text-ungdoms-700 hover:bg-ungdoms-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visa detaljer
                        </Button>
                        <div className="relative">
                          <Button
                            size="icon"
                            variant="outline"
                            className="text-gray-500 hover:bg-gray-100"
                            onClick={() =>
                              setMenuClientId((prev) =>
                                prev === client.id ? null : client.id
                              )
                            }
                            title="Alternativ"
                          >
                            <span className="text-[1.5em] leading-none">⋮</span>
                          </Button>
                          {menuClientId === client.id && (
                            <div className="absolute right-0 z-10 mt-2 w-32 bg-white border rounded shadow-lg">
                              <Button
                                variant="ghost"
                                className="w-full text-red-600 justify-start"
                                onClick={() => handleDeleteClient(client.id)}
                                disabled={deleteClientMutation.isPending}
                              >
                                Ta bort
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Status Overview */}
      {clients.length > 0 && (
        <Card className="border-ungdoms-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ungdoms-800">
              <FileText className="h-5 w-5" />
              Snabb statusöversikt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    clients.filter((c) => {
                      const cp = getClientCarePlan(c.id);
                      return cp?.status === "completed";
                    }).length
                  }
                </div>
                <p className="text-sm text-muted-foreground">
                  Slutförda vårdplaner
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    clients.filter((c) => {
                      const cp = getClientCarePlan(c.id);
                      return cp?.status === "staff_notified";
                    }).length
                  }
                </div>
                <p className="text-sm text-muted-foreground">Väntar på GFP</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {
                    clients.filter((c) => {
                      const ip = getClientImplementationPlan(c.id);
                      const due = ip?.dueDate ? new Date(ip.dueDate) : null;
                      return (
                        due &&
                        new Date() > due &&
                        ip &&
                        ip.status !== "completed"
                      );
                    }).length
                  }
                </div>
                <p className="text-sm text-muted-foreground">Försenade GFP</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    clients.filter((c) => {
                      const ip = getClientImplementationPlan(c.id);
                      return ip?.status === "completed";
                    }).length
                  }
                </div>
                <p className="text-sm text-muted-foreground">Klara GFP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GDPR Information */}
      <Alert className="border-ungdoms-200 bg-ungdoms-50">
        <AlertTriangle className="h-4 w-4 text-ungdoms-600" />
        <AlertDescription className="text-ungdoms-700">
          <strong>GDPR-säkerhet:</strong> Systemet använder endast initialer för
          klientidentifiering. Personnummer sparas krypterat och är frivilligt.
          All data hanteras enligt GDPR-bestämmelser.
        </AlertDescription>
      </Alert>
    </div>
  );
}
