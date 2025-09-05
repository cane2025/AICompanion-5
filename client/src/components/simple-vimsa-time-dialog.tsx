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
import { Plus, Clock, Check, X } from "lucide-react";

const vimsaTimeSchema = z.object({
  clientId: z.string().min(1, "Klient måste väljas"),
  staffId: z.string().min(1, "Personal måste väljas"),
  year: z.number().min(2024, "År krävs"),
  week: z.number().min(1).max(53, "Vecka måste vara 1-53"),
  hoursWorked: z.number().min(0, "Timmar måste vara 0 eller mer"),
  approved: z.boolean().default(false),
  matchesDocumentation: z.boolean().default(false),
  comments: z.string().optional(),
});

type VimsaTimeFormData = z.infer<typeof vimsaTimeSchema>;

interface SimpleVimsaTimeDialogProps {
  trigger?: React.ReactNode;
  clientId?: string;
  staffId?: string;
  existingEntry?: any;
  onSuccess?: () => void;
}

export function SimpleVimsaTimeDialog({
  trigger,
  clientId,
  staffId,
  existingEntry,
  onSuccess,
}: SimpleVimsaTimeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentWeek = Math.ceil(
    (currentDate.getTime() - new Date(currentYear, 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );

  const form = useForm<VimsaTimeFormData>({
    resolver: zodResolver(vimsaTimeSchema),
    defaultValues: {
      clientId: existingEntry?.clientId || clientId || "",
      staffId: existingEntry?.staffId || staffId || "",
      year: existingEntry?.year || currentYear,
      week: existingEntry?.week || Math.max(33, Math.min(52, currentWeek)),
      hoursWorked: existingEntry?.hoursWorked || 0,
      approved: existingEntry?.approved || false,
      matchesDocumentation: existingEntry?.matchesDocumentation || false,
      comments: existingEntry?.comments || "",
    },
  });

  // Fetch clients for selected staff
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", staffId],
    queryFn: () => api.getClientsByStaff(staffId || ""),
    enabled: !!staffId,
  });

  // Create/Update Vimsa time mutation
  const saveTimeMutation = useMutation({
    mutationFn: async (data: VimsaTimeFormData) => {
      const payload = {
        clientId: data.clientId,
        staffId: data.staffId,
        year: data.year,
        week: data.week,
        hoursWorked: data.hoursWorked,
        approved: data.approved,
        matchesDocumentation: data.matchesDocumentation,
        comments: data.comments || "",
      };

      if (existingEntry) {
        return api.updateVimsaTime(existingEntry.id, payload);
      } else {
        return api.createVimsaTime(payload);
      }
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/vimsa-time"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/clients", result.clientId, "vimsa-time"],
      });

      toast({
        title: existingEntry ? "Vimsa Tid uppdaterad" : "Vimsa Tid skapad",
        description: `Tidrapporteringen har ${
          existingEntry ? "uppdaterats" : "skapats"
        }.`,
      });

      form.reset();
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara Vimsa Tid",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: VimsaTimeFormData) => {
    saveTimeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            {existingEntry ? "Redigera Vimsa Tid" : "Skapa Vimsa Tid"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Vimsa Tid
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
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
                    <FormLabel>Vecka *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="53"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
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
              name="hoursWorked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arbetade timmar *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matchesDocumentation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stämmer med dokumentation</FormLabel>
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
                        Ja
                      </Button>
                      <Button
                        type="button"
                        variant={
                          field.value === false ? "destructive" : "outline"
                        }
                        onClick={() => field.onChange(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Nej
                      </Button>
                    </div>
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

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kommentarer (valfritt)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ytterligare kommentarer..."
                      rows={3}
                      {...field}
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
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={saveTimeMutation.isPending}
              >
                {saveTimeMutation.isPending
                  ? "Sparar..."
                  : existingEntry
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
