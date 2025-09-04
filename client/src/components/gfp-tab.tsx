import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Save,
  X,
} from "lucide-react";
import type { ImplementationPlan, CarePlan } from "@shared/schema";

interface GFPTabProps {
  clientId: string;
  carePlans: CarePlan[];
}

const gfpUpdateSchema = z.object({
  status: z.enum(["Väntar", "Aktiv", "Slutförd"]),
  dueDate: z.string().optional(),
  completedDate: z.string().optional(),
  sentDate: z.string().optional(),
  followUps: z.array(z.object({
    key: z.string(),
    done: z.boolean(),
    note: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
});

type GFPUpdateFormData = z.infer<typeof gfpUpdateSchema>;

export function GFPTab({ clientId, carePlans }: GFPTabProps) {
  const [editingGFP, setEditingGFP] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GFPUpdateFormData>({
    resolver: zodResolver(gfpUpdateSchema),
  });

  // Fetch GFP plans for this client
  const { data: gfpPlans = [], isLoading } = useQuery<ImplementationPlan[]>({
    queryKey: ["/api/clients", clientId, "implementation-plans"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/implementation-plans`);
      if (!response.ok) throw new Error('Failed to fetch GFP plans');
      return response.json();
    },
  });

  // Update GFP mutation
  const updateGFPMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GFPUpdateFormData> }) => {
      const response = await fetch(`/api/implementation-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update GFP');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "implementation-plans"] });
      setEditingGFP(null);
      form.reset();
      toast({
        title: "✅ GFP uppdaterad",
        description: "Genomförandeplanen har uppdaterats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Fel vid uppdatering",
        description: `Kunde inte uppdatera GFP: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Väntar": return "bg-gray-100 text-gray-800";
      case "Aktiv": return "bg-blue-100 text-blue-800";
      case "Slutförd": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Väntar": return <Clock className="h-4 w-4" />;
      case "Aktiv": return <CheckCircle className="h-4 w-4" />;
      case "Slutförd": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleEditGFP = (gfp: ImplementationPlan) => {
    const followUps = JSON.parse(gfp.followUps || '[]');
    form.reset({
      status: gfp.status as any,
      dueDate: gfp.dueDate || '',
      completedDate: gfp.completedDate || '',
      sentDate: gfp.sentDate || '',
      followUps: followUps,
    });
    setEditingGFP(gfp.id);
  };

  const handleSaveGFP = (data: GFPUpdateFormData) => {
    if (!editingGFP) return;
    updateGFPMutation.mutate({ id: editingGFP, data });
  };

  const handleFollowUpChange = (index: number, field: string, value: any) => {
    const currentFollowUps = form.getValues('followUps') || [];
    const updatedFollowUps = [...currentFollowUps];
    updatedFollowUps[index] = { ...updatedFollowUps[index], [field]: value };
    form.setValue('followUps', updatedFollowUps);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Genomförandeplaner (GFP)</h2>
        <p className="text-gray-600">Autogenererade från vårdplaner med uppföljningar</p>
      </div>

      {/* GFP Plans List */}
      <div className="grid gap-4">
        {gfpPlans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inga GFP</h3>
              <p className="text-gray-600">GFP skapas automatiskt när vårdplaner skapas.</p>
            </CardContent>
          </Card>
        ) : (
          gfpPlans.map((gfp) => {
            const linkedCarePlan = carePlans.find(cp => (cp as any).index === (gfp as any).carePlanIndex);
            const followUps = JSON.parse(gfp.followUps || '[]');
            const isEditing = editingGFP === gfp.id;
            
            return (
              <Card key={gfp.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">
                          #{(gfp as any).index}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">GFP #{(gfp as any).index}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Kopplad till vårdplan #{(gfp as any).carePlanIndex}</span>
                          {linkedCarePlan && (
                            <>
                              <span>•</span>
                              <span>Status: {linkedCarePlan.status}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(gfp.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(gfp.status)}
                          {gfp.status}
                        </div>
                      </Badge>
                      {!isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditGFP(gfp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSaveGFP)} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <FormControl>
                                  <select {...field} className="w-full p-2 border rounded-md">
                                    <option value="Väntar">Väntar</option>
                                    <option value="Aktiv">Aktiv</option>
                                    <option value="Slutförd">Slutförd</option>
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Förfallodatum</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
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
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="completedDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slutförd datum</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Follow-ups */}
                        <div>
                          <Label className="text-sm font-medium">Uppföljningar</Label>
                          <div className="mt-2 space-y-2">
                            {followUps.map((followUp: any, index: number) => (
                              <div key={followUp.key} className="flex items-center gap-3 p-3 border rounded-md">
                                <Checkbox
                                  checked={followUp.done}
                                  onCheckedChange={(checked) => 
                                    handleFollowUpChange(index, 'done', checked)
                                  }
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{followUp.key}</div>
                                  <Input
                                    placeholder="Anteckning..."
                                    value={followUp.note || ''}
                                    onChange={(e) => 
                                      handleFollowUpChange(index, 'note', e.target.value)
                                    }
                                    className="mt-1"
                                  />
                                </div>
                                <Input
                                  type="date"
                                  value={followUp.date || ''}
                                  onChange={(e) => 
                                    handleFollowUpChange(index, 'date', e.target.value)
                                  }
                                  className="w-40"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingGFP(null)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Avbryt
                          </Button>
                          <Button
                            type="submit"
                            disabled={updateGFPMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {updateGFPMutation.isPending ? "Sparar..." : "Spara"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-3">
                      {/* Dates */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {gfp.dueDate && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Förfallo: {gfp.dueDate}</span>
                          </div>
                        )}
                        {gfp.sentDate && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Skickad: {gfp.sentDate}</span>
                          </div>
                        )}
                        {gfp.completedDate && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Slutförd: {gfp.completedDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Follow-ups */}
                      <div>
                        <Label className="text-sm font-medium">Uppföljningar</Label>
                        <div className="mt-2 space-y-2">
                          {followUps.map((followUp: any) => (
                            <div key={followUp.key} className="flex items-center gap-3 p-2 border rounded-md">
                              <Checkbox checked={followUp.done} disabled />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{followUp.key}</div>
                                {followUp.note && (
                                  <div className="text-sm text-gray-600">{followUp.note}</div>
                                )}
                              </div>
                              {followUp.date && (
                                <div className="text-sm text-gray-500">{followUp.date}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Skapad: {new Date(gfp.createdAt).toLocaleDateString('sv-SE')}</span>
                        <span>Uppdaterad: {new Date(gfp.updatedAt).toLocaleDateString('sv-SE')}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}