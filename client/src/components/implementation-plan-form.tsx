import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  insertImplementationPlanSchema,
  type InsertImplementationPlan,
  type Client,
} from "@shared/schema";
import * as api from "@/lib/api";
import { FileCheck, Loader2 } from "lucide-react";

interface ImplementationPlanFormProps {
  client: Client;
}

export function ImplementationPlanForm({
  client,
}: ImplementationPlanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing implementation plan for this client
  const { data: existingPlan, isLoading } = useQuery({
    queryKey: ["/api/implementation-plans", client.id],
    queryFn: () => api.getImplementationPlanByClient(client.id),
  });

  const form = useForm<InsertImplementationPlan>({
    resolver: zodResolver(insertImplementationPlanSchema),
    defaultValues: {
      clientId: client.id,
      staffId: client.staffId || "",
      planContent: "",
      goals: "",
      activities: "",
      followUpSchedule: "",
      status: "pending",
      followup1: false,
      followup2: false,
      comments: "",
    },
  });

  // Update form when existing plan loads
  React.useEffect(() => {
    if (existingPlan) {
      form.reset({
        clientId: existingPlan.clientId,
        staffId: existingPlan.staffId,
        planContent: existingPlan.planContent || "",
        goals: existingPlan.goals || "",
        activities: existingPlan.activities || "",
        followUpSchedule: existingPlan.followUpSchedule || "",
        status: existingPlan.status,
        followup1: existingPlan.followup1,
        followup2: existingPlan.followup2,
        comments: existingPlan.comments || "",
      });
    }
  }, [existingPlan, form]);

  const savePlan = useMutation({
    mutationFn: (data: InsertImplementationPlan) => {
      return api.createImplementationPlan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/implementation-plans", client.id],
      });
      toast({
        title: "Genomförandeplan sparad",
        description: "Genomförandeplanen har sparats framgångsrikt.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara genomförandeplan. Försök igen.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertImplementationPlan) => {
    // Ensure required identifiers are always present
    savePlan.mutate({ ...data, clientId: client.id, staffId: client.staffId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Laddar genomförandeplan...
        </CardContent>
      </Card>
    );
  }

  const statusOptions = [
    { value: "pending", label: "Väntande" },
    { value: "in_progress", label: "Pågående" },
    { value: "completed", label: "Klar" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileCheck className="mr-2 h-5 w-5" />
          Genomförandeplan - {client.initials}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="planContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planinnehåll</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beskriv genomförandeplanen..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mål</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ange mål för genomförandet..."
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
                name="activities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktiviteter</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ange planerade aktiviteter..."
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

            <FormField
              control={form.control}
              name="followUpSchedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uppföljningsschema</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beskriv schema för uppföljning..."
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>Uppföljning 1 genomförd</FormLabel>
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
                      <FormLabel>Uppföljning 2 genomförd</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kommentarer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Lägg till kommentarer..."
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={savePlan.isPending}>
              {savePlan.isPending ? "Sparar..." : "Spara genomförandeplan"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
