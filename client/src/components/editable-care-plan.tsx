import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { FileText, Save, Trash2, Edit, X, Check } from "lucide-react";
import * as api from "@/lib/api";
import { CarePlan, Staff } from "@shared/schema";
import { useDebounce } from "@/hooks/use-debounce";

const carePlanSchema = z.object({
  planContent: z.string().optional(),
  goals: z.string().optional(),
  interventions: z.string().optional(),
  evaluationCriteria: z.string().optional(),
  receivedDate: z.string().optional(),
  enteredJournalDate: z.string().optional(),
  staffNotifiedDate: z.string().optional(),
  status: z.enum([
    "received",
    "staff_notified",
    "in_progress",
    "completed",
  ]).optional(),
  responsibleId: z.string().optional(),
  comment: z.string().optional(),
});

type CarePlanFormData = z.infer<typeof carePlanSchema>;

interface EditableCarePlanProps {
  clientId: string;
  clientInitials: string;
}

export function EditableCarePlan({ clientId, clientInitials }: EditableCarePlanProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch care plan
  const { data: carePlan, isLoading } = useQuery<CarePlan>({
    queryKey: ["/api/care-plans", clientId],
    queryFn: () => api.getCarePlan(clientId),
    retry: false,
  });

  // Fetch staff for responsible dropdown
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
  });

  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      planContent: "",
      goals: "",
      interventions: "",
      evaluationCriteria: "",
      receivedDate: "",
      enteredJournalDate: "",
      staffNotifiedDate: "",
      status: "received",
      responsibleId: "",
      comment: "",
    },
  });

  // Update form when care plan loads
  useEffect(() => {
    if (carePlan) {
      form.reset({
        planContent: carePlan.planContent || "",
        goals: carePlan.goals || "",
        interventions: carePlan.interventions || "",
        evaluationCriteria: carePlan.evaluationCriteria || "",
        receivedDate: carePlan.receivedDate || "",
        enteredJournalDate: carePlan.enteredJournalDate || "",
        staffNotifiedDate: carePlan.staffNotifiedDate || "",
        status: (carePlan.status || "received") as "received" | "staff_notified" | "completed" | "in_progress",
        responsibleId: carePlan.responsibleId || "",
        comment: carePlan.comment || "",
      });
    }
  }, [carePlan, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CarePlanFormData) =>
      api.createCarePlan({
        ...data,
        clientId,
        staffId: carePlan?.staffId || "unassigned",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans", clientId] });
      toast({
        title: "✅ Vårdplan skapad",
        description: "Vårdplanen har skapats.",
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
    mutationFn: (data: CarePlanFormData) => {
      if (!carePlan?.id) throw new Error("Ingen vårdplan att uppdatera");
      return api.updateCarePlan(carePlan.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans", clientId] });
      toast({
        title: "✅ Vårdplan uppdaterad",
        description: "Ändringar har sparats.",
      });
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!carePlan?.id) throw new Error("Ingen vårdplan att ta bort");
      return api.deleteCarePlan(carePlan.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans", clientId] });
      toast({
        title: "🗑️ Vårdplan borttagen",
        description: "Vårdplanen har tagits bort.",
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
    if (!isEditing || !hasUnsavedChanges || !carePlan) return;

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

  const handleSave = async (data: CarePlanFormData) => {
    if (carePlan) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (carePlan) {
      form.reset({
        planContent: carePlan.planContent || "",
        goals: carePlan.goals || "",
        interventions: carePlan.interventions || "",
        evaluationCriteria: carePlan.evaluationCriteria || "",
        receivedDate: carePlan.receivedDate || "",
        enteredJournalDate: carePlan.enteredJournalDate || "",
        staffNotifiedDate: carePlan.staffNotifiedDate || "",
        status: (carePlan.status || "received") as "received" | "staff_notified" | "completed" | "in_progress",
        responsibleId: carePlan.responsibleId || "",
        comment: carePlan.comment || "",
      });
    }
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-blue-100 text-blue-800";
      case "staff_notified":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "received":
        return "Mottagen";
      case "staff_notified":
        return "Personal tillsagd";
      case "in_progress":
        return "Pågående";
      case "completed":
        return "Slutförd";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Laddar vårdplan...</p>
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
              <FileText className="h-5 w-5" />
              Vårdplan - {clientInitials}
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
                  {carePlan && (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="receivedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mottagen datum</FormLabel>
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
                  name="enteredJournalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inlagd i journal (digitalt)</FormLabel>
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
                  name="staffNotifiedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal tillsagd</FormLabel>
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

              {form.watch("staffNotifiedDate") && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>GFP ska vara inlämnad senast:</strong>{" "}
                    {new Date(
                      new Date(form.watch("staffNotifiedDate") || "").getTime() +
                        21 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("sv-SE")}{" "}
                    (3 veckor från tillsägning)
                  </p>
                </div>
              )}

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
                              <Badge className={getStatusColor(field.value || "received")}>
                                {getStatusLabel(field.value || "received")}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="received">Mottagen</SelectItem>
                          <SelectItem value="staff_notified">Personal tillsagd</SelectItem>
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
                  name="responsibleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ansvarig personal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj ansvarig" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Oassignerad</SelectItem>
                          {staff.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
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
                name="planContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vårdplanens innehåll</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Beskriv vårdplanens innehåll..."
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
                        placeholder="Beskriv målen med vårdplanen..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interventions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insatser</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Beskriv planerade insatser..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluationCriteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utvärderingskriterier</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Beskriv hur vårdplanen ska utvärderas..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kommentar</FormLabel>
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
              Är du säker på att du vill ta bort denna vårdplan?
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