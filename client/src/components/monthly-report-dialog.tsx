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
import { Calendar, Check, X } from "lucide-react";
import type { Staff, Client } from "@shared/schema";
import React from "react";
import * as api from "@/lib/api";

const monthlyReportSchema = z.object({
  clientId: z.string().min(1, "Klient måste väljas"),
  staffId: z.string().min(1, "Personal måste väljas"),
  year: z.number().min(2024, "År krävs"),
  month: z.number().min(1).max(12, "Månad måste vara 1-12"),
  reportContent: z.string().min(1, "Rapportinnehåll krävs"),
  approved: z.boolean().default(false),
  comments: z.string().optional(),
});

type MonthlyReportFormData = z.infer<typeof monthlyReportSchema>;

interface MonthlyReportDialogProps {
  trigger?: React.ReactNode;
  staffId?: string;
}

export function MonthlyReportDialog({
  trigger,
  staffId,
}: MonthlyReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const form = useForm<MonthlyReportFormData>({
    resolver: zodResolver(monthlyReportSchema),
    defaultValues: {
      clientId: "",
      staffId: staffId || "",
      year: currentYear,
      month: currentMonth,
      reportContent: "",
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

  // Create monthly report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: MonthlyReportFormData) => {
      const response = await fetch("/api/monthly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Kunde inte skapa månadsrapport");
      }

      return response.json();
    },
    onSuccess: (report) => {
      // Invalidate queries as specified in requirements
      queryClient.invalidateQueries({
        queryKey: ["/api/clients", report.clientId, "monthly-reports"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/monthly-reports"],
      });

      toast({
        title: "Månadsrapport skapad",
        description: "Månadsrapporten har skapats.",
      });

      form.reset();
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa månadsrapport",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: MonthlyReportFormData) => {
    createReportMutation.mutate(data);
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Skapa Månadsrapport
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Skapa ny månadsrapport
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
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Månad</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj månad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {monthNames.map((monthName, index) => (
                          <SelectItem
                            key={index + 1}
                            value={(index + 1).toString()}
                          >
                            {monthName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reportContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rapportinnehåll</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Månadsrapportens innehåll..."
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
                className="bg-green-600 hover:bg-green-700"
                disabled={createReportMutation.isPending}
              >
                {createReportMutation.isPending ? "Skapar..." : "Spara rapport"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
