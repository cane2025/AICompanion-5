import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  FileText,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { CarePlan, Staff } from "@shared/schema";

interface CarePlansTabProps {
  clientId: string;
  staff: Staff[];
}

const carePlanSchema = z.object({
  receivedDate: z.string().min(1, "Mottagningsdatum krävs"),
  enteredToJournalDate: z.string().optional(),
  status: z.enum(["Mottagen", "Aktiv", "Avslutad"]),
  assignedStaffId: z.string().optional(),
  content: z.string().optional(),
});

type CarePlanFormData = z.infer<typeof carePlanSchema>;

export function CarePlansTab({ clientId, staff }: CarePlansTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      receivedDate: new Date().toISOString().split('T')[0],
      status: "Mottagen",
    },
  });

  // Fetch care plans for this client
  const { data: carePlans = [], isLoading } = useQuery<CarePlan[]>({
    queryKey: ["/api/clients", clientId, "care-plans"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/care-plans`);
      if (!response.ok) throw new Error('Failed to fetch care plans');
      return response.json();
    },
  });

  // Create care plan mutation
  const createCarePlanMutation = useMutation({
    mutationFn: async (data: CarePlanFormData) => {
      const response = await fetch(`/api/clients/${clientId}/care-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create care plan');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "care-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "implementation-plans"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "✅ Vårdplan skapad",
        description: result.message,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Fel vid skapande",
        description: `Kunde inte skapa vårdplan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update care plan mutation
  const updateCarePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CarePlanFormData> }) => {
      const response = await fetch(`/api/care-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update care plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "care-plans"] });
      toast({
        title: "✅ Vårdplan uppdaterad",
        description: "Vårdplanen har uppdaterats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Fel vid uppdatering",
        description: `Kunde inte uppdatera vårdplan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CarePlanFormData) => {
    createCarePlanMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Mottagen": return "bg-gray-100 text-gray-800";
      case "Aktiv": return "bg-blue-100 text-blue-800";
      case "Avslutad": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Mottagen": return <Clock className="h-4 w-4" />;
      case "Aktiv": return <CheckCircle className="h-4 w-4" />;
      case "Avslutad": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vårdplaner</h2>
          <p className="text-gray-600">Versionsbara vårdplaner per klient</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Ny vårdplan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Skapa ny vårdplan</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="receivedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mottagningsdatum</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enteredToJournalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inrapporterad till journal</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full p-2 border rounded-md">
                            <option value="Mottagen">Mottagen</option>
                            <option value="Aktiv">Aktiv</option>
                            <option value="Avslutad">Avslutad</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assignedStaffId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ansvarig personal</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full p-2 border rounded-md">
                            <option value="">Välj personal</option>
                            {staff.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Innehåll</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className="w-full p-2 border rounded-md h-24"
                          placeholder="Beskriv vårdplanens innehåll..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCarePlanMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createCarePlanMutation.isPending ? "Skapar..." : "Skapa vårdplan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Care Plans List */}
      <div className="grid gap-4">
        {carePlans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inga vårdplaner</h3>
              <p className="text-gray-600">Skapa din första vårdplan för att komma igång.</p>
            </CardContent>
          </Card>
        ) : (
          carePlans.map((plan) => {
            const assignedStaff = staff.find(s => s.id === plan.assignedStaffId);
            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          #{(plan as any).index}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">Vårdplan #{(plan as any).index}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Mottagen: {plan.receivedDate}</span>
                          {plan.enteredToJournalDate && (
                            <>
                              <span>•</span>
                              <span>Journal: {plan.enteredToJournalDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(plan.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(plan.status)}
                        {plan.status}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignedStaff && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Ansvarig: {assignedStaff.name}</span>
                      </div>
                    )}
                    {plan.content && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        {plan.content}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Skapad: {new Date(plan.createdAt).toLocaleDateString('sv-SE')}</span>
                      <span>Uppdaterad: {new Date(plan.updatedAt).toLocaleDateString('sv-SE')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}