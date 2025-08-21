import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";

import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck, Plus } from "lucide-react";
import * as api from "@/lib/api";
import type { Client, CarePlan } from "@shared/schema";

const implementationPlanSchema = z.object({
  carePlanId: z.string().min(1, "Vårdplan måste väljas"),
  clientId: z.string().min(1, "Klient måste väljas"),
  completedAt: z.string().optional(),
  sentAt: z.string().optional(),
  followup1: z.boolean().default(false),
  followup2: z.boolean().default(false),
  followup3: z.boolean().default(false),
  followup4: z.boolean().default(false),
  followup5: z.boolean().default(false),
  followup6: z.boolean().default(false),
});

type ImplementationPlanFormData = z.infer<typeof implementationPlanSchema>;

interface ImplementationPlanDialogProps {
  trigger?: React.ReactNode;
  client?: Client;
  existingPlanId?: string;
  staffId?: string;
}

export function ImplementationPlanDialog({
  trigger,
  client,
  existingPlanId,
  staffId,
}: ImplementationPlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ImplementationPlanFormData>({
    resolver: zodResolver(implementationPlanSchema),
    defaultValues: {
      carePlanId: "",
      clientId: client?.id || "",
      completedAt: "",
      sentAt: "",
      followup1: false,
      followup2: false,
      followup3: false,
      followup4: false,
      followup5: false,
      followup6: false,
    },
  });

  // Fetch care plans for the selected client
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans", client?.id],
    queryFn: () =>
      api.getCarePlanByClient(client!.id).then((plan) => (plan ? [plan] : [])),
    enabled: !!client?.id && isOpen,
  });

  // Fetch existing plan if editing
  const { data: existingPlan, isLoading } = useQuery({
    queryKey: ["/api/implementation-plans", existingPlanId],
    queryFn: () => api.getImplementationPlanById(existingPlanId!),
    enabled: !!existingPlanId && isOpen,
  });

  // Update form when existing plan loads
  React.useEffect(() => {
    if (existingPlan && isOpen) {
      form.reset({
        carePlanId: existingPlan.carePlanId || "",
        clientId: existingPlan.clientId,
        completedAt: existingPlan.completedAt
          ? new Date(existingPlan.completedAt).toISOString().split("T")[0]
          : "",
        sentAt: existingPlan.sentAt
          ? new Date(existingPlan.sentAt).toISOString().split("T")[0]
          : "",
        followup1: existingPlan.followup1 || false,
        followup2: existingPlan.followup2 || false,
        followup3: existingPlan.followup3 || false,
        followup4: existingPlan.followup4 || false,
        followup5: existingPlan.followup5 || false,
        followup6: existingPlan.followup6 || false,
      });
    }
  }, [existingPlan, form, isOpen]);

  // Create/Update implementation plan mutation
  const savePlanMutation = useMutation({
    mutationFn: async (data: ImplementationPlanFormData) => {
      if (existingPlanId) {
        // Update existing plan - use POST with plan ID in body since PUT doesn't work
        const response = await fetch(`/api/implementation-plans`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Dev-Token": localStorage.getItem("devToken") || "",
          },
          credentials: "include",
          body: JSON.stringify({
            ...data,
            id: existingPlanId, // Include ID to indicate update
            staffId: staffId || "",
            planContent: "Administrativ genomförandeplan",
            goals: "",
            activities: "",
            followUpSchedule: "",
            status: "pending",
            isActive: true,
          }),
        });
        if (!response.ok) {
          throw new Error("Kunde inte uppdatera genomförandeplan");
        }
        return response.json();
      } else {
        // Create new plan
        return api.createImplementationPlan({
          ...data,
          staffId: staffId || "",
          planContent: "Administrativ genomförandeplan",
          goals: "",
          activities: "",
          followUpSchedule: "",
          status: "pending",
          isActive: true,
        });
      }
    },
    onSuccess: (plan) => {
      // Invalidate queries as specified in requirements
      queryClient.invalidateQueries({
        queryKey: ["/api/clients", plan.clientId, "implementation-plans"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans/staff", staffId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans"],
      });

      toast({
        title: existingPlanId
          ? "Genomförandeplan uppdaterad"
          : "Genomförandeplan skapad",
        description: "Genomförandeplanen har sparats framgångsrikt.",
      });
      form.reset();
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara genomförandeplan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ImplementationPlanFormData) => {
    // Ensure required identifiers are always present
    const payload = {
      ...data,
      clientId: client?.id || data.clientId,
      staffId: staffId || "",
    };
    savePlanMutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <FileCheck className="h-4 w-4 mr-2" />
            {existingPlanId ? "Redigera GFP" : "Skapa GFP"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            {existingPlanId
              ? "Redigera genomförandeplan"
              : "Skapa genomförandeplan"}
            {client && ` - ${client.initials}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Laddar genomförandeplan...</span>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <Controller
                name="carePlanId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vårdplan *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj vårdplan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {carePlans.map((carePlan) => (
                          <SelectItem key={carePlan.id} value={carePlan.id}>
                            Vårdplan {carePlan.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                name="clientId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klient *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj klient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {client && (
                          <SelectItem key={client.id} value={client.id}>
                            {client.initials}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="completedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum klar</FormLabel>
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
                  name="sentAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum skickad</FormLabel>
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

              <div className="space-y-3">
                <FormLabel>Uppföljning</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="followup1"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(v) => field.onChange(v === true)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Uppföljning 1</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followup2"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(v) => field.onChange(v === true)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Uppföljning 2</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followup3"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(v) => field.onChange(v === true)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Uppföljning 3</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followup4"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(v) => field.onChange(v === true)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Uppföljning 4</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followup5"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(v) => field.onChange(v === true)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Uppföljning 5</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followup6"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(v) => field.onChange(v === true)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Uppföljning 6</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

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
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={savePlanMutation.isPending}
                >
                  {savePlanMutation.isPending
                    ? "Sparar..."
                    : existingPlanId
                    ? "Uppdatera"
                    : "Skapa genomförandeplan"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Enkel administrativ genomförandeplan Dialog
export function SimpleImplementationPlanDialog({
  clientId,
}: {
  clientId: string;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      clientId,
      planRef: "",
      sentDate: "",
      completedDate: "",
      followup1: false,
      followup2: false,
      followup3: false,
      followup4: false,
      followup5: false,
      followup6: false,
      comments: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/implementation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  const onSubmit = async (data: any) => {
    const followups = [
      data.followup1,
      data.followup2,
      data.followup3,
      data.followup4,
      data.followup5,
      data.followup6,
    ];
    const payload = {
      ...data,
      followups,
      sentDate: data.sentDate || null,
      completedDate: data.completedDate || null,
    };
    await mutation.mutateAsync(payload);
    setOpen(false);
    queryClient.invalidateQueries();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Ny genomförandeplan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny administrativ genomförandeplan</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label>Genomförandeplan</Label>
              <Input {...form.register("planRef")} placeholder="Vilken plan" />
            </div>
            <div>
              <Label>Klient</Label>
              <Input {...form.register("clientId")} />
            </div>
            <div>
              <Label>Skickad datum</Label>
              <Input {...form.register("sentDate")} type="date" />
            </div>
            <div>
              <Label>Klar datum</Label>
              <Input {...form.register("completedDate")} type="date" />
            </div>
            <div className="space-y-2">
              <Label>Uppföljningar</Label>
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup1")} /> 1
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup2")} /> 2
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup3")} /> 3
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup4")} /> 4
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup5")} /> 5
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup6")} /> 6
                </label>
              </div>
            </div>
            <div>
              <Label>Kommentarer</Label>
              <Textarea {...form.register("comments")} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit">Spara</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Ny aktivitet Dialog komponent
export function NewActivityDialog({ clientId }: { clientId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const session = { user: { id: "s_demo" } }; // Placeholder for session

  const form = useForm({
    defaultValues: {
      activity: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Placeholder mutation - implement actual API call
      return Promise.resolve(data);
    },
    onSuccess: async () => {
      toast({ title: "Framgång", description: "Aktivitet skapad!" });
      setDialogOpen(false);
      const sid = session?.user?.id;
      if (clientId) {
        await queryClient.invalidateQueries({
          queryKey: ["/api/implementation-plans", clientId],
        });
      }
      if (sid) {
        await queryClient.invalidateQueries({
          queryKey: ["/api/implementation-plans/staff", sid],
        });
      }
    },
  });

  const onSubmit = async (data: any) => {
    await mutation.mutateAsync(data);
    setDialogOpen(false);
    const sid = session?.user?.id;
    if (clientId) {
      await queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans", clientId],
      });
    }
    if (sid) {
      await queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans/staff", sid],
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ny aktivitet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny aktivitet</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label>Aktivitet</Label>
              <Input
                {...form.register("activity")}
                placeholder="Beskriv aktiviteten..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit">Spara</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
