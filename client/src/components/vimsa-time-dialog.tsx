import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Clock, FileText } from "lucide-react";
import type { Staff, Client } from "@shared/schema";
import React from "react";
import * as api from "@/lib/api";

const vimsaTimeSchema = z.object({
  clientId: z.string().min(1, "Klient måste väljas"),
  staffId: z.string().min(1, "Personal måste väljas"),
  year: z.number().min(2024, "År krävs"),
  week: z.number().min(1).max(53, "Vecka måste vara 1-53"),
  monday: z.number().min(0).max(24, "Måndag måste vara 0-24 timmar"),
  tuesday: z.number().min(0).max(24, "Tisdag måste vara 0-24 timmar"),
  wednesday: z.number().min(0).max(24, "Onsdag måste vara 0-24 timmar"),
  thursday: z.number().min(0).max(24, "Torsdag måste vara 0-24 timmar"),
  friday: z.number().min(0).max(24, "Fredag måste vara 0-24 timmar"),
  saturday: z.number().min(0).max(24, "Lördag måste vara 0-24 timmar"),
  sunday: z.number().min(0).max(24, "Söndag måste vara 0-24 timmar"),
  status: z
    .enum(["not_started", "in_progress", "completed"])
    .default("not_started"),
  approved: z.boolean().default(false),
  comments: z.string().optional(),
});

type VimsaTimeFormData = z.infer<typeof vimsaTimeSchema>;

interface VimsaTimeDialogProps {
  trigger?: React.ReactNode;
  staffId?: string;
}

export function VimsaTimeDialog({ trigger, staffId }: VimsaTimeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentWeek = Math.ceil(
    (currentDate.getTime() - new Date(currentYear, 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );

  const form = useForm<VimsaTimeFormData>({
    resolver: zodResolver(vimsaTimeSchema),
    defaultValues: {
      clientId: "",
      staffId: staffId || "",
      year: currentYear,
      week: currentWeek,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
      status: "not_started",
      approved: false,
      comments: "",
    },
  });

  // Update form when staffId changes
  React.useEffect(() => {
    if (staffId) {
      form.setValue("staffId", staffId);
    }
  }, [staffId, form]);

  // Fetch all staff
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch clients for selected staff
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", staffId],
    queryFn: () => api.getClientsByStaff(staffId || ""),
    enabled: !!staffId,
  });

  // Create Vimsa time mutation
  const createVimsaTimeMutation = useMutation({
    mutationFn: async (data: VimsaTimeFormData) => {
      const response = await fetch("/api/vimsa-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          totalHours:
            data.monday +
            data.tuesday +
            data.wednesday +
            data.thursday +
            data.friday +
            data.saturday +
            data.sunday,
        }),
      });

      if (!response.ok) {
        throw new Error("Kunde inte skapa Vimsa tid");
      }

      return response.json();
    },
    onSuccess: (timeEntry) => {
      // Invalidate queries as specified in requirements
      queryClient.invalidateQueries({
        queryKey: ["/api/clients", timeEntry.clientId, "vimsa-time"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/vimsa-time"],
      });

      toast({
        title: "Vimsa tid skapad",
        description: "Vimsa tiden har skapats.",
      });

      form.reset();
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa Vimsa tid",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: VimsaTimeFormData) => {
    createVimsaTimeMutation.mutate(data);
  };

  const totalHours =
    form.watch("monday") +
    form.watch("tuesday") +
    form.watch("wednesday") +
    form.watch("thursday") +
    form.watch("friday") +
    form.watch("saturday") +
    form.watch("sunday");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Clock className="h-4 w-4 mr-2" />
            Registrera Vimsa Tid
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Registrera Vimsa tid
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="staffId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Välj personal *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj personal" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                name="clientId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Välj klient *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj klient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.initials}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>År</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vecka</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="53"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Weekly hours input */}
            <div className="space-y-3">
              <FormLabel>Timmar per dag</FormLabel>
              <Card className="p-4 border-purple-200">
                <div className="grid grid-cols-7 gap-3">
                  <FormField
                    control={form.control}
                    name="monday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Måndag</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tuesday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Tisdag</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="wednesday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Onsdag</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="thursday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Torsdag</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="friday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Fredag</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saturday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Lördag</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sunday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Söndag</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-3 p-2 bg-purple-50 rounded">
                  <p className="text-sm font-medium text-purple-800">
                    Totalt: {totalHours} timmar denna vecka
                  </p>
                </div>
              </Card>
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="not_started">Ej startad</SelectItem>
                      <SelectItem value="in_progress">Pågående</SelectItem>
                      <SelectItem value="completed">Slutförd</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kommentarer (valfritt)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kommentarer om Vimsa tid..."
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
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createVimsaTimeMutation.isPending}
              >
                {createVimsaTimeMutation.isPending ? "Skapar..." : "Spara tid"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
