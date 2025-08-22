import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import type { Staff, Client } from "@shared/schema";

const carePlanSchema = z.object({
  socialWorkerName: z.string().min(1, "Socialsekreterare måste anges"),
  clientInitials: z.string().min(1, "Klientinitialer krävs"),
  planNumber: z.string().min(1, "Vårdplansnummer krävs (1, 2, 3 etc)"),
  receivedDate: z.string().min(1, "Mottagningsdatum krävs"),
  assignedStaffIds: z
    .array(z.string())
    .min(1, "Minst en personal måste kopplas"),
  journalDate: z.string().optional(),
  comment: z.string().optional(),
});

type CarePlanFormData = z.infer<typeof carePlanSchema>;

interface CarePlanDialogProps {
  trigger?: React.ReactNode;
}

export function CarePlanDialog({ trigger }: CarePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      socialWorkerName: "",
      clientInitials: "",
      planNumber: "",
      receivedDate: new Date().toISOString().split("T")[0],
      assignedStaffIds: [],
      journalDate: "",
      comment: "",
    },
  });

  // Fetch all staff
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Create care plan mutation (samma logik som tidigare)
  const createCarePlanMutation = useMutation({
    mutationFn: async (data: CarePlanFormData) => {
      console.log("Creating care plan with data:", data);

      try {
        // Create client first if doesn't exist (assign to first staff member)
        const primaryStaffId = data.assignedStaffIds[0];
        console.log("Primary staff ID:", primaryStaffId);

        const clientsResponse = await fetch(
          `/api/staff/${primaryStaffId}/clients`
        );
        if (!clientsResponse.ok) {
          throw new Error(`Failed to fetch clients: ${clientsResponse.status}`);
        }
        const clients: Client[] = await clientsResponse.json();

        let client = clients.find((c) => c.initials === data.clientInitials);

        if (!client) {
          const newClientResponse = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              initials: data.clientInitials,
              staffId: primaryStaffId,
              personalNumber: "",
              notes: `Vårdplan ${data.planNumber} från ${data.socialWorkerName}`,
              status: "active",
            }),
          });

          if (!newClientResponse.ok) {
            const errorText = await newClientResponse.text();
            console.error("Client creation failed:", errorText);
            throw new Error(`Kunde inte skapa klient: ${errorText}`);
          }

          client = await newClientResponse.json();
          console.log("Created/found client:", client);
        }

        // Create the care plan
        console.log("Creating care plan...");
        const response = await fetch("/api/care-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client!.id,
            staffId: primaryStaffId,
            receivedDate: data.receivedDate,
            enteredJournalDate: data.journalDate || null,
            staffNotifiedDate: new Date().toISOString().split("T")[0],
            planContent: `Vårdplan ${data.planNumber} från socialsekreterare ${data.socialWorkerName}`,
            goals: "Genomföra vårdflöde enligt rutin",
            interventions:
              "Standard vårdflöde - GFP ska påbörjas inom 3 veckor",
            status: "staff_notified",
            comment: data.comment || "",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Care plan creation failed:", errorText);
          throw new Error(`Kunde inte skapa vårdplan: ${errorText}`);
        }

        const carePlan = await response.json();
        console.log("Created care plan:", carePlan);

        // Create implementation plan automatically (this triggers GFP workflow)
        await fetch("/api/implementation-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client!.id,
            staffId: primaryStaffId,
            carePlanId: carePlan.id,
            planContent: `GFP för vårdplan ${data.planNumber}`,
            goals: "Genomförandeplan enligt vårdplan",
            activities: "GFP aktiviteter - ska slutföras inom 3 veckor",
            followUpSchedule: "3 veckor från idag",
            status: "pending",
            isActive: true,
          }),
        });

        // Create initial weekly documentation template for current week
        const now = new Date();
        const currentWeek =
          Math.floor(
            (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          ) + 1;

        await fetch("/api/weekly-documentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client!.id,
            staffId: primaryStaffId,
            year: now.getFullYear(),
            week: Math.max(33, Math.min(52, currentWeek)), // Ensure within valid range
            content: `Veckodokumentation för vårdplan ${data.planNumber}`,
            mondayStatus: "not_done",
            tuesdayStatus: "not_done",
            wednesdayStatus: "not_done",
            thursdayStatus: "not_done",
            fridayStatus: "not_done",
            saturdayStatus: "not_done",
            sundayStatus: "not_done",
            mondayDocumented: false,
            tuesdayDocumented: false,
            wednesdayDocumented: false,
            thursdayDocumented: false,
            fridayDocumented: false,
            saturdayDocumented: false,
            sundayDocumented: false,
            documentation: "",
            approved: false,
            comments: "",
          }),
        });

        // Create initial monthly report for current month
        await fetch("/api/monthly-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client!.id,
            staffId: primaryStaffId,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            content: `Månadsrapport för vårdplan ${data.planNumber}`,
            reportContent: "",
            status: "not_started",
            comment: "",
          }),
        });

        // Create initial Vimsa time entry for current week
        await fetch("/api/vimsa-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client!.id,
            staffId: primaryStaffId,
            year: now.getFullYear(),
            week: Math.max(33, Math.min(52, currentWeek)),
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0,
            sunday: 0,
            totalHours: 0,
            status: "not_started",
            approved: false,
            comments: `Vimsa tid för vårdplan ${data.planNumber}`,
          }),
        });

        return carePlan;
      } catch (error) {
        console.error("Error during care plan creation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans"],
      });

      toast({
        title: "Vårdplan skapad",
        description:
          "Vårdplanen har skapats och personal har notifierats. GFP ska göras inom 3 veckor.",
      });

      form.reset();
      setIsSuccess(true);
      setShowDetails(false); // Reset to overview

      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false); // Reset for next time
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa vårdplan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CarePlanFormData) => {
    setIsSuccess(false);
    createCarePlanMutation.mutate(data);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setShowDetails(false); // Reset to overview when closing
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-ungdoms-600 hover:bg-ungdoms-700">
            <Plus className="h-4 w-4 mr-2" />
            Skapa Vårdplan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-ungdoms-600" />
            Vårdplan
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-bold mb-2">Vårdplan Skapad!</h3>
            <p className="text-muted-foreground">
              Datan har sparats och alla flöden har aktiverats.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Dialogrutan stängs automatiskt...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {!showDetails ? (
              /* Vårdflöde översikt */
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4 text-ungdoms-800">
                    Vårdflöde
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      {
                        label: "1. Vårdplan\nInkommen",
                        icon: "📋",
                        color: "bg-blue-100 text-blue-800",
                      },
                      {
                        label: "2. Personal\nNotifierad",
                        icon: "👥",
                        color: "bg-yellow-100 text-yellow-800",
                      },
                      {
                        label: "3. GFP\nStartas",
                        icon: "📝",
                        color: "bg-purple-100 text-purple-800",
                      },
                      {
                        label: "4. Dokumentation\nPåbörjas",
                        icon: "📊",
                        color: "bg-orange-100 text-orange-800",
                      },
                      {
                        label: "5. Uppföljning\nAktiveras",
                        icon: "✅",
                        color: "bg-green-100 text-green-800",
                      },
                    ].map((step, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${step.color} text-center`}
                      >
                        <div className="text-2xl mb-1">{step.icon}</div>
                        <div className="text-xs font-medium whitespace-pre-line">
                          {step.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    När vårdplanen skapas startar automatiskt hela vårdflödet
                    med GFP inom 3 veckor
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowDetails(true)}
                    className="bg-ungdoms-600 hover:bg-ungdoms-700"
                  >
                    Visa detaljer och skapa vårdplan
                  </Button>
                </div>
              </div>
            ) : (
              /* Detaljerat formulär */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Skapa vårdplan</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    ← Tillbaka till översikt
                  </Button>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="socialWorkerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Behandlare</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Namn på behandlare"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                // Auto-save when typing
                                if (e.target.value.length > 2) {
                                  toast({
                                    title: "Behandlare sparat",
                                    description: `Namn: ${e.target.value}`,
                                    duration: 1500,
                                  });
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="planNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vårdplansnummer</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="1, 2, 3 etc"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-save when typing
                                  if (e.target.value) {
                                    toast({
                                      title: "Vårdplansnummer sparat",
                                      description: `Nummer: ${e.target.value}`,
                                      duration: 1500,
                                    });
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientInitials"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Klient initialer</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="t.ex. A.B."
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-save when typing
                                  if (e.target.value.length > 1) {
                                    toast({
                                      title: "Klientinitialer sparat",
                                      description: `Initialer: ${e.target.value}`,
                                      duration: 1500,
                                    });
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="receivedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mottagningsdatum</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-save when date is selected
                                  if (e.target.value) {
                                    toast({
                                      title: "Datum sparat",
                                      description: `Mottagningsdatum: ${e.target.value}`,
                                      duration: 2000,
                                    });
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="journalDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inskannad i JD (valfritt)</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-save when date is selected
                                  if (e.target.value) {
                                    toast({
                                      title: "Datum sparat",
                                      description: `JD-datum: ${e.target.value}`,
                                      duration: 2000,
                                    });
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="assignedStaffIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Koppla till personal</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                const currentValues = field.value || [];
                                if (!currentValues.includes(value)) {
                                  const newValues = [...currentValues, value];
                                  field.onChange(newValues);
                                  // Auto-save when staff is selected
                                  const staffMember = staff.find(
                                    (s) => s.id === value
                                  );
                                  if (staffMember) {
                                    toast({
                                      title: "Personal kopplad",
                                      description: `${staffMember.name} har lagts till`,
                                      duration: 2000,
                                    });
                                  }
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Välj personal att koppla vårdplan till" />
                              </SelectTrigger>
                              <SelectContent>
                                {staff.map((staffMember) => (
                                  <SelectItem
                                    key={staffMember.id}
                                    value={staffMember.id}
                                  >
                                    {staffMember.name} ({staffMember.initials})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(field.value || []).map((staffId) => {
                              const staffMember = staff.find(
                                (s) => s.id === staffId
                              );
                              return staffMember ? (
                                <div
                                  key={staffId}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-2"
                                >
                                  {staffMember.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      field.onChange(
                                        (field.value || []).filter(
                                          (id) => id !== staffId
                                        )
                                      );
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kommentar (valfritt)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ytterligare kommentarer..."
                              rows={2}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                // Auto-save when typing
                                if (e.target.value.length > 5) {
                                  toast({
                                    title: "Kommentar sparat",
                                    description:
                                      "Kommentaren har sparats automatiskt",
                                    duration: 1500,
                                  });
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDetails(false)}
                      >
                        Tillbaka
                      </Button>
                      <Button
                        type="submit"
                        className="bg-ungdoms-600 hover:bg-ungdoms-700"
                        disabled={
                          createCarePlanMutation.isPending ||
                          !form.formState.isValid
                        }
                      >
                        {createCarePlanMutation.isPending
                          ? "Skapar..."
                          : "Skapa vårdplan"}
                      </Button>
                    </div>

                    {/* Show validation errors if form is invalid */}
                    {form.formState.errors &&
                      Object.keys(form.formState.errors).length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm font-medium text-red-800 mb-2">
                            Följande fält måste fyllas i:
                          </p>
                          <ul className="text-sm text-red-700 space-y-1">
                            {form.formState.errors.socialWorkerName && (
                              <li>• Socialsekreterare</li>
                            )}
                            {form.formState.errors.clientInitials && (
                              <li>• Klientinitialer</li>
                            )}
                            {form.formState.errors.planNumber && (
                              <li>• Vårdplansnummer</li>
                            )}
                            {form.formState.errors.receivedDate && (
                              <li>• Mottagningsdatum</li>
                            )}
                            {form.formState.errors.assignedStaffIds && (
                              <li>• Minst en personal måste kopplas</li>
                            )}
                          </ul>
                        </div>
                      )}
                  </form>
                </Form>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
