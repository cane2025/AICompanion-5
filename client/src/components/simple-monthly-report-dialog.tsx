import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
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
import { Plus, FileBarChart, Check, X } from "lucide-react";

const monthlyReportSchema = z.object({
  clientId: z.string().min(1, "Klient måste väljas"),
  staffId: z.string().min(1, "Personal måste väljas"),
  year: z.number().min(2024, "År krävs"),
  month: z.number().min(1).max(12, "Månad måste vara 1-12"),
  reportContent: z.string().min(1, "Rapportinnehåll krävs"),
  approved: z.boolean().default(false),
  quality: z.string().optional(),
});

type MonthlyReportFormData = z.infer<typeof monthlyReportSchema>;

interface SimpleMonthlyReportDialogProps {
  trigger?: React.ReactNode;
  clientId?: string;
  staffId?: string;
  existingReport?: any;
  onSuccess?: () => void;
}

export function SimpleMonthlyReportDialog({
  trigger,
  clientId,
  staffId,
  existingReport,
  onSuccess,
}: SimpleMonthlyReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const form = useForm<MonthlyReportFormData>({
    resolver: zodResolver(monthlyReportSchema),
    defaultValues: {
      clientId: existingReport?.clientId || clientId || "",
      staffId: existingReport?.staffId || staffId || "",
      year: existingReport?.year || currentYear,
      month: existingReport?.month || currentMonth,
      reportContent: existingReport?.reportContent || "",
      approved: existingReport?.approved || false,
      quality: existingReport?.quality || "pending",
    },
  });

  // Fetch clients for selected staff
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", staffId],
    queryFn: () => api.getClientsByStaff(staffId || ""),
    enabled: !!staffId,
  });

  // Create/Update monthly report mutation
  const saveReportMutation = useMutation({
    mutationFn: async (data: MonthlyReportFormData) => {
      const payload = {
        clientId: data.clientId,
        staffId: data.staffId,
        year: data.year,
        month: data.month,
        reportContent: data.reportContent,
        approved: data.approved,
        status: data.approved ? "approved" : "not_started",
        quality: data.approved ? "approved" : "pending",
      };

      if (existingReport) {
        return api.updateMonthlyReport(existingReport.id, payload);
      } else {
        return api.createMonthlyReport(payload);
      }
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", result.clientId, "monthly-reports"] });

      toast({
        title: existingReport ? "Månadsrapport uppdaterad" : "Månadsrapport skapad",
        description: `Rapporten har ${existingReport ? "uppdaterats" : "skapats"}.`,
      });

      form.reset();
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara månadsrapport",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: MonthlyReportFormData) => {
    saveReportMutation.mutate(data);
  };

  const monthNames = [
    "Januari", "Februari", "Mars", "April", "Maj", "Juni",
    "Juli", "Augusti", "September", "Oktober", "November", "December"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            {existingReport ? "Redigera Rapport" : "Skapa Månadsrapport"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-purple-600" />
            Månadsrapport
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>År *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="2024"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormLabel>Månad *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Välj månad" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthNames.map((name, index) => (
                            <SelectItem key={index + 1} value={(index + 1).toString()}>
                              {name}
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

            {!clientId && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klient *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
            )}

            <FormField
              control={form.control}
              name="reportContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rapportinnehåll *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Skriv månadsrapportens innehåll..."
                      rows={6}
                      {...field}
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
                  <FormLabel>Status</FormLabel>
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
                        Godkänt
                      </Button>
                      <Button
                        type="button"
                        variant={
                          field.value === false ? "destructive" : "outline"
                        }
                        onClick={() => field.onChange(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Ej godkänt
                      </Button>
                    </div>
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
                disabled={saveReportMutation.isPending}
              >
                {saveReportMutation.isPending
                  ? "Sparar..."
                  : existingReport
                  ? "Uppdatera"
                  : "Spara"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
