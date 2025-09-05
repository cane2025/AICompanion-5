import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Check, X } from "lucide-react";
import type { Staff, Client } from "@shared/schema";
import React from "react"; // Added missing import
import * as api from "@/lib/api"; // Added missing import

const weeklyDocSchema = z.object({
  clientId: z.string().min(1, "Klient måste väljas"),
  staffId: z.string().min(1, "Personal måste väljas"),
  year: z.number().min(2024, "År krävs"),
  week: z.number().min(1).max(53, "Vecka måste vara 1-53"),
  mondayDocumented: z.boolean().default(false),
  tuesdayDocumented: z.boolean().default(false),
  wednesdayDocumented: z.boolean().default(false),
  thursdayDocumented: z.boolean().default(false),
  fridayDocumented: z.boolean().default(false),
  saturdayDocumented: z.boolean().default(false),
  sundayDocumented: z.boolean().default(false),
  documentation: z.string().min(1, "Dokumentation krävs"),
  approved: z.boolean().default(false),
  comments: z.string().optional(),
});

type WeeklyDocFormData = z.infer<typeof weeklyDocSchema>;

interface WeeklyDocumentationDialogProps {
  trigger?: React.ReactNode;
  staffId?: string;
}

export function WeeklyDocumentationDialog({
  trigger,
  staffId,
}: WeeklyDocumentationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentWeek = Math.ceil(
    (currentDate.getTime() - new Date(currentYear, 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );

  const form = useForm<WeeklyDocFormData>({
    resolver: zodResolver(weeklyDocSchema),
    defaultValues: {
      clientId: "",
      staffId: staffId || "",
      year: currentYear,
      week: currentWeek,
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

  // Create weekly documentation mutation
  const createDocMutation = useMutation({
    mutationFn: async (data: WeeklyDocFormData) => {
      const response = await fetch("/api/weekly-documentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Kunde inte skapa veckodokumentation");
      }

      return response.json();
    },
    onSuccess: (doc) => {
      // Invalidate queries as specified in requirements
      queryClient.invalidateQueries({
        queryKey: ["/api/clients", doc.clientId, "weekly-documentation"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/weekly-documentation"],
      });

      toast({
        title: "Veckodokumentation skapad",
        description: "Veckodokumentationen har skapats.",
      });

      form.reset();
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa veckodokumentation",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: WeeklyDocFormData) => {
    // Map the individual day fields to the days object expected by backend
    const mappedData = {
      ...data,
      days: {
        mon: data.mondayDocumented,
        tue: data.tuesdayDocumented,
        wed: data.wednesdayDocumented,
        thu: data.thursdayDocumented,
        fri: data.fridayDocumented,
        sat: data.saturdayDocumented,
        sun: data.sundayDocumented,
      },
    };
    createDocMutation.mutate(mappedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            <FileText className="h-4 w-4 mr-2" />
            Skapa Veckodokumentation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            Skapa ny veckodokumentation
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Hidden staffId field */}
            <input type="hidden" {...form.register("staffId")} />

            <FormField
              name="clientId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Klient *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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

            {/* Days of the week checkboxes */}
            <div className="space-y-3">
              <FormLabel>Dokumenterade dagar</FormLabel>
              <Card className="p-4 border-ungdoms-200">
                <div className="grid grid-cols-5 gap-3">
                  <FormField
                    control={form.control}
                    name="mondayDocumented"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className={
                              field.value
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex flex-col items-center">
                              {field.value ? (
                                <Check className="h-4 w-4 mb-1" />
                              ) : (
                                <X className="h-4 w-4 mb-1 text-gray-400" />
                              )}
                              <span className="text-xs">Måndag</span>
                            </div>
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tuesdayDocumented"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className={
                              field.value
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex flex-col items-center">
                              {field.value ? (
                                <Check className="h-4 w-4 mb-1" />
                              ) : (
                                <X className="h-4 w-4 mb-1 text-gray-400" />
                              )}
                              <span className="text-xs">Tisdag</span>
                            </div>
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="wednesdayDocumented"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className={
                              field.value
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex flex-col items-center">
                              {field.value ? (
                                <Check className="h-4 w-4 mb-1" />
                              ) : (
                                <X className="h-4 w-4 mb-1 text-gray-400" />
                              )}
                              <span className="text-xs">Onsdag</span>
                            </div>
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="thursdayDocumented"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className={
                              field.value
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex flex-col items-center">
                              {field.value ? (
                                <Check className="h-4 w-4 mb-1" />
                              ) : (
                                <X className="h-4 w-4 mb-1 text-gray-400" />
                              )}
                              <span className="text-xs">Torsdag</span>
                            </div>
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fridayDocumented"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className={
                              field.value
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex flex-col items-center">
                              {field.value ? (
                                <Check className="h-4 w-4 mb-1" />
                              ) : (
                                <X className="h-4 w-4 mb-1 text-gray-400" />
                              )}
                              <span className="text-xs">Fredag</span>
                            </div>
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saturdayDocumented"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className={
                              field.value
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex flex-col items-center">
                              {field.value ? (
                                <Check className="h-4 w-4 mb-1" />
                              ) : (
                                <X className="h-4 w-4 mb-1 text-gray-400" />
                              )}
                              <span className="text-xs">Lördag</span>
                            </div>
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sundayDocumented"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            className={
                              field.value
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex flex-col items-center">
                              {field.value ? (
                                <Check className="h-4 w-4 mb-1" />
                              ) : (
                                <X className="h-4 w-4 mb-1 text-gray-400" />
                              )}
                              <span className="text-xs">Söndag</span>
                            </div>
                          </Button>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </div>

            <FormField
              control={form.control}
              name="documentation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumentation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Veckodokumentationens innehåll..."
                      rows={5}
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
              name="approved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Godkänd / Ej godkänd</FormLabel>
                  <FormControl>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={field.value === true ? "default" : "outline"}
                        className={
                          field.value === true
                            ? "bg-green-600 hover:bg-green-700"
                            : ""
                        }
                        onClick={() => field.onChange(true)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Godkänd
                      </Button>
                      <Button
                        type="button"
                        variant={
                          field.value === false ? "destructive" : "outline"
                        }
                        className={
                          field.value === false
                            ? "bg-red-600 hover:bg-red-700"
                            : ""
                        }
                        onClick={() => field.onChange(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Ej godkänd
                      </Button>
                    </div>
                  </FormControl>
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
                className="bg-orange-600 hover:bg-orange-700"
                disabled={createDocMutation.isPending}
              >
                {createDocMutation.isPending
                  ? "Skapar..."
                  : "Spara dokumentation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
