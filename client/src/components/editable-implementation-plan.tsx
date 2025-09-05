import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Save, Trash2, Edit, X, Check, AlertTriangle } from "lucide-react";
import * as api from "@/lib/api";
import { ImplementationPlan, Staff } from "@shared/schema";
import { useDebounce } from "@/hooks/use-debounce";

const implementationPlanSchema = z.object({
  planContent: z.string().optional(),
  goals: z.string().optional(),
  activities: z.string().optional(),
  followUpSchedule: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  followup1: z.boolean().optional(),
  followup2: z.boolean().optional(),
  dueDate: z.string().optional(),
  completedDate: z.string().optional(),
  sentDate: z.string().optional(),
  comments: z.string().optional(),
});

type ImplementationPlanFormData = z.infer<typeof implementationPlanSchema>;

interface EditableImplementationPlanProps {
  clientId: string;
  clientInitials: string;
  carePlanDate?: string;
}

export function EditableImplementationPlan({ 
  clientId, 
  clientInitials,
  carePlanDate 
}: EditableImplementationPlanProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch implementation plan
  const { data: implementationPlan, isLoading } = useQuery<ImplementationPlan>({
    queryKey: ["/api/implementation-plans", clientId],
    queryFn: () => api.getImplementationPlanByClient(clientId),
    retry: false,
  });

  const form = useForm<ImplementationPlanFormData>({
    resolver: zodResolver(implementationPlanSchema),
    defaultValues: {
      planContent: "",
      goals: "",
      activities: "",
      followUpSchedule: "",
      status: "pending",
      followup1: false,
      followup2: false,
      dueDate: "",
      completedDate: "",
      sentDate: "",
      comments: "",
    },
  });

  // Update form when implementation plan loads
  useEffect(() => {
    if (implementationPlan) {
      form.reset({
        planContent: implementationPlan.planContent || "",
        goals: implementationPlan.goals || "",
        activities: implementationPlan.activities || "",
        followUpSchedule: implementationPlan.followUpSchedule || "",
        status: (implementationPlan.status as any) || "pending",
        followup1: implementationPlan.followup1 || false,
        followup2: implementationPlan.followup2 || false,
        dueDate:
          typeof (implementationPlan as any).dueDate === "string"
            ? ((implementationPlan as any).dueDate as string)
            : (implementationPlan as any).dueDate
            ? new Date((implementationPlan as any).dueDate).toISOString().slice(0, 10)
            : "",
        completedDate:
          typeof (implementationPlan as any).completedDate === "string"
            ? ((implementationPlan as any).completedDate as string)
            : (implementationPlan as any).completedDate
            ? new Date((implementationPlan as any).completedDate).toISOString().slice(0, 10)
            : "",
        sentDate:
          typeof (implementationPlan as any).sentDate === "string"
            ? ((implementationPlan as any).sentDate as string)
            : (implementationPlan as any).sentDate
            ? new Date((implementationPlan as any).sentDate).toISOString().slice(0, 10)
            : "",
        comments: implementationPlan.comments || "",
      });
    }
  }, [implementationPlan, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ImplementationPlanFormData) =>
      api.createImplementationPlan({
        ...data,
        clientId,
        staffId: implementationPlan?.staffId || "unassigned",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", clientId] });
      toast({
        title: "✅ GFP skapad",
        description: "Genomförandeplanen har skapats.",
      });
      setIsEditing(false);
      setHasUnsavedChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ImplementationPlanFormData) => {
      if (!implementationPlan?.id) {
        // If no existing plan, create a new one instead of throwing error
        return api.createImplementationPlan({
          ...data,
          clientId,
          staffId: "unassigned",
        });
      }
      return api.updateImplementationPlan(implementationPlan.id, data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", clientId] });
      const isNewPlan = !implementationPlan?.id;
      toast({
        title: isNewPlan ? "✅ GFP skapad" : "✅ GFP uppdaterad",
        description: isNewPlan ? "Genomförandeplanen har skapats." : "Ändringar har sparats.",
      });
      setHasUnsavedChanges(false);
      if (isNewPlan) {
        setIsEditing(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!implementationPlan?.id) throw new Error("Ingen GFP att ta bort");
      return api.deleteImplementationPlan(implementationPlan.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", clientId] });
      toast({
        title: "🗑️ GFP borttagen",
        description: "Genomförandeplanen har tagits bort.",
      });
      setDeleteDialogOpen(false);
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Watch form changes for autosave
  const formValues = form.watch();
  const debouncedFormValues = useDebounce(formValues, 800);

  // Autosave
  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) return;

    const autosave = async () => {
      try {
        await updateMutation.mutateAsync(debouncedFormValues);
        toast({
          title: "💾 Autosparad",
          description: "Ändringar sparade automatiskt",
          duration: 2000,
        });
      } catch (error) {
        // Error handled by mutation
      }
    };

    autosave();
  }, [debouncedFormValues, isEditing, hasUnsavedChanges]);

  // Track changes
  useEffect(() => {
    if (isEditing) {
      setHasUnsavedChanges(true);
    }
  }, [formValues, isEditing]);

  const handleSave = async (data: ImplementationPlanFormData) => {
    // Always use updateMutation as it now handles both create and update cases
    await updateMutation.mutateAsync(data);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (implementationPlan) {
      form.reset({
        planContent: implementationPlan.planContent || "",
        goals: implementationPlan.goals || "",
        activities: implementationPlan.activities || "",
        followUpSchedule: implementationPlan.followUpSchedule || "",
        status: (implementationPlan.status as any) || "pending",
        followup1: implementationPlan.followup1 || false,
        followup2: implementationPlan.followup2 || false,
        dueDate:
          typeof (implementationPlan as any).dueDate === "string"
            ? ((implementationPlan as any).dueDate as string)
            : (implementationPlan as any).dueDate
            ? new Date((implementationPlan as any).dueDate).toISOString().slice(0, 10)
            : "",
        completedDate:
          typeof (implementationPlan as any).completedDate === "string"
            ? ((implementationPlan as any).completedDate as string)
            : (implementationPlan as any).completedDate
            ? new Date((implementationPlan as any).completedDate).toISOString().slice(0, 10)
            : "",
        sentDate:
          typeof (implementationPlan as any).sentDate === "string"
            ? ((implementationPlan as any).sentDate as string)
            : (implementationPlan as any).sentDate
            ? new Date((implementationPlan as any).sentDate).toISOString().slice(0, 10)
            : "",
        comments: implementationPlan.comments || "",
      });
    }
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Väntar";
      case "in_progress":
        return "Pågående";
      case "completed":
        return "Slutförd";
      default:
        return status;
    }
  };

  const isGfpOverdue = () => {
    if (!carePlanDate) return false;
    const dueDate = new Date(carePlanDate);
    dueDate.setDate(dueDate.getDate() + 21); // 3 weeks
    return !implementationPlan && new Date() > dueDate;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Laddar genomförandeplan...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Genomförandeplan (GFP) - {clientInitials}
              {isGfpOverdue() && (
                <Badge className="bg-red-100 text-red-800 border-red-200 ml-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  FÖRSENAD
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Avbryt
                  </Button>
                  <Button
                    size="sm"
                    onClick={form.handleSubmit(handleSave)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Spara
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Redigera
                  </Button>
                  {implementationPlan && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Ta bort
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Förfallodatum</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="completedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slutförd datum</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              <Badge className={getStatusColor(field.value || "pending")}>
                                {getStatusLabel(field.value || "pending")}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Väntar</SelectItem>
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
                  name="sentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skickad datum</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="followup1"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Uppföljning 1</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followup2"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Uppföljning 2</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="planContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planens innehåll</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Beskriv genomförandeplanens innehåll..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mål</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Beskriv målen..."
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
                        {...field}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Beskriv planerade aktiviteter..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="followUpSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uppföljningsschema</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Beskriv uppföljningsschema..."
                      />
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
                    <FormLabel>Kommentarer</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={2}
                        placeholder="Övriga kommentarer..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasUnsavedChanges && isEditing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" />
                  <span>Ändringar sparas automatiskt</span>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bekräfta borttagning</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort denna genomförandeplan?
              Detta kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}