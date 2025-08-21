import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
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
import React from "react"; // Added missing import

const carePlanSchema = z.object({
  staffId: z.string().min(1, "Ansvarig behandlare måste väljas"),
  clientId: z.string().min(1, "Klient måste väljas"),
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
  staffId?: string;
}

export function CarePlanDialog({ trigger, staffId }: CarePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      staffId: staffId || "", // Default to selected staff from left panel
      clientId: "",
      planNumber: "",
      receivedDate: new Date().toISOString().split("T")[0],
      assignedStaffIds: staffId ? [staffId] : [], // Auto-assign selected staff
      journalDate: "",
      comment: "",
    },
  });

  // Fetch all staff
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
  });

  // Fetch clients for selected staff
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", staffId],
    queryFn: () => api.getClientsByStaff(staffId || ""),
    enabled: !!staffId,
  });

  // Update form when staffId changes
  React.useEffect(() => {
    if (staffId) {
      form.setValue("staffId", staffId);
      form.setValue("assignedStaffIds", [staffId]);
    }
  }, [staffId, form]);

  // Create care plan mutation
  const createCarePlanMutation = useMutation({
    mutationFn: async (data: CarePlanFormData) => {
      console.log("Creating care plan with data:", data);

      try {
        // Get client by ID
        const primaryStaffId = data.assignedStaffIds[0];
        console.log("Primary staff ID:", primaryStaffId);

        const clients = await api.getClientsByStaff(primaryStaffId);
        const client = clients.find((c) => c.id === data.clientId);

        if (!client) {
          throw new Error("Vald klient hittades inte");
        }

        // Create the care plan
        console.log("Creating care plan...");
        const carePlan = await api.createCarePlan({
          clientId: client!.id,
          staffId: primaryStaffId,
          responsibleId: data.staffId, // Use staffId instead of socialWorkerName
          receivedDate: data.receivedDate,
          enteredJournalDate: data.journalDate || null,
          staffNotifiedDate: new Date().toISOString().split("T")[0],
          planContent: `Vårdplan ${data.planNumber}`,
          goals: "Genomföra vårdflöde enligt rutin",
          interventions: "Standard vårdflöde - GFP ska påbörjas inom 3 veckor",
          status: "staff_notified",
          comment: data.comment || "",
        });
        console.log("Created care plan:", carePlan);

        // Create implementation plan automatically (this triggers GFP workflow)
        await api.createImplementationPlan({
          clientId: client!.id,
          staffId: primaryStaffId,
          carePlanId: carePlan.id,
          planContent: `GFP för vårdplan ${data.planNumber}`,
          goals: "Genomförandeplan enligt vårdplan",
          activities: "GFP aktiviteter - ska slutföras inom 3 veckor",
          followUpSchedule: "3 veckor från idag",
          status: "pending",
          isActive: true,
        });

        // Create initial weekly documentation template for current week
        const now = new Date();
        const currentWeek =
          Math.floor(
            (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          ) + 1;

        await api.createWeeklyDocumentation({
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
        });

        // Create initial monthly report for current month
        await api.createMonthlyReport({
          clientId: client!.id,
          staffId: primaryStaffId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          content: `Månadsrapport för vårdplan ${data.planNumber}`,
          reportContent: "",
          status: "not_started",
          comment: "",
        });

        // Create initial Vimsa time entry for current week
        await api.createVimsaTime({
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
        });

        return carePlan;
      } catch (error) {
        console.error("Error during care plan creation:", error);
        throw error;
      }
    },
    onSuccess: (carePlan) => {
      // Invalidate queries as specified in requirements
      queryClient.invalidateQueries({
        queryKey: ["/api/staff", carePlan.staffId, "clients"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/clients", carePlan.clientId, "care-plans"],
      });
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            className="bg-ungdoms-600 hover:bg-ungdoms-700"
            data-testid="open-care-plan"
          >
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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* Hidden staffId field */}
              <input type="hidden" {...form.register("staffId")} />

              {/* Show selected staff when staffId is provided */}
              {staffId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Ansvarig behandlare:</strong>{" "}
                    {staff.find((s) => s.id === staffId)?.name || staffId}
                  </p>
                </div>
              )}

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
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Klient *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Välj klient" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.initials}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  name="journalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inskannad i JD (valfritt)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Only show staff assignment if no staffId is provided */}
              {!staffId && (
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
              )}

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
                        value={field.value ?? ""}
                        onChange={field.onChange}
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
                  onClick={() => setIsOpen(false)}
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  className="bg-ungdoms-600 hover:bg-ungdoms-700"
                  disabled={createCarePlanMutation.isPending}
                >
                  {createCarePlanMutation.isPending
                    ? "Skapar..."
                    : "Spara vårdplan"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
