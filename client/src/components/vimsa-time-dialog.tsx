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
  hoursWorked: z.number().min(0, "Arbetade timmar måste vara 0 eller mer"),
  approved: z.boolean().default(false),
  matchesDocumentation: z.boolean().default(false),
  comments: z.string().optional(),
});

type VimsaTimeFormData = z.infer<typeof vimsaTimeSchema>;

interface VimsaTimeDialogProps {
  trigger?: React.ReactNode;
  staffId?: string;
  existingTimeId?: string;
  editMode?: boolean;
}

export function VimsaTimeDialog({ 
  trigger, 
  staffId, 
  existingTimeId, 
  editMode = false 
}: VimsaTimeDialogProps) {
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
      hoursWorked: 0,
      approved: false,
      matchesDocumentation: false,
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

  // Fetch existing Vimsa time if editing
  const { data: existingTime } = useQuery({
    queryKey: ["/api/vimsa-time", existingTimeId],
    queryFn: () => api.getVimsaTimeById(existingTimeId!),
    enabled: !!existingTimeId && isOpen,
  });

  // Update form with existing data when editing
  React.useEffect(() => {
    if (existingTime && editMode) {
      form.reset({
        clientId: existingTime.clientId,
        staffId: existingTime.staffId,
        year: existingTime.year,
        week: existingTime.week,
        hoursWorked: existingTime.hoursWorked || 0,
        approved: existingTime.approved || false,
        matchesDocumentation: existingTime.matchesDocumentation || false,
        comments: existingTime.comments || "",
      });
    }
  }, [existingTime, editMode, form]);

  // Create/Update Vimsa time mutation
  const saveVimsaTimeMutation = useMutation({
    mutationFn: async (data: VimsaTimeFormData) => {
      if (editMode && existingTimeId) {
        return api.updateVimsaTime(existingTimeId, data);
      } else {
        const response = await fetch("/api/vimsa-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Kunde inte skapa Vimsa tid");
        }

        return response.json();
      }
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
        title: editMode ? "Vimsa tid uppdaterad" : "Vimsa tid skapad",
        description: editMode 
          ? "Vimsa tiden har uppdaterats framgångsrikt."
          : "Vimsa tiden har skapats framgångsrikt.",
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

  // Delete Vimsa time mutation
  const deleteVimsaTimeMutation = useMutation({
    mutationFn: () => api.deleteVimsaTime(existingTimeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/vimsa-time"],
      });
      toast({
        title: "Vimsa tid borttagen",
        description: "Vimsa tiden har tagits bort framgångsrikt.",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ta bort Vimsa tid.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: VimsaTimeFormData) => {
    saveVimsaTimeMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm("Är du säker på att du vill ta bort denna Vimsa tid?")) {
      deleteVimsaTimeMutation.mutate();
    }
  };



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

            {/* Administrative fields */}
            <FormField
              control={form.control}
              name="hoursWorked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arbetade timmar</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Antal timmar"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Status</FormLabel>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="approved"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Godkänd</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="matchesDocumentation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Stämmer med dokumentation</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

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

            <div className="flex justify-between pt-4">
              <div>
                {editMode && existingTimeId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteVimsaTimeMutation.isPending}
                  >
                    {deleteVimsaTimeMutation.isPending ? "Tar bort..." : "Ta bort"}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
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
                  disabled={saveVimsaTimeMutation.isPending}
                >
                  {saveVimsaTimeMutation.isPending 
                    ? (editMode ? "Uppdaterar..." : "Skapar...") 
                    : (editMode ? "Uppdatera tid" : "Spara tid")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
