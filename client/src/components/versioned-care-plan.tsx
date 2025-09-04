import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Calendar, User, FileText } from "lucide-react";
import type { CarePlan, Staff, Client } from "@shared/schema";

interface VersionedCarePlanProps {
  clientId: string;
  client: Client;
}

export function VersionedCarePlan({ clientId, client }: VersionedCarePlanProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CarePlan | null>(null);

  // Fetch care plans for this client
  const { data: carePlans = [], isLoading } = useQuery<CarePlan[]>({
    queryKey: [`/api/clients/${clientId}/care-plans`],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/care-plans`);
      if (!response.ok) throw new Error('Failed to fetch care plans');
      return response.json();
    },
  });

  // Fetch staff for assignment dropdown
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Create care plan mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      receivedDate: string;
      enteredToJournalDate?: string;
      status: string;
      assignedStaffId?: string;
      content?: string;
    }) => {
      const response = await fetch(`/api/clients/${clientId}/care-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create care plan');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/care-plans`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/implementation-plans`] });
      setIsCreateOpen(false);
      toast({
        title: "Vårdplan skapad",
        description: result.message || `Vårdplan ${result.carePlan.index} skapad. ${result.message}`,
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa vårdplan",
        variant: "destructive",
      });
    },
  });

  // Update care plan mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await fetch(`/api/care-plans/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error('Failed to update care plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/care-plans`] });
      setIsEditOpen(false);
      setEditingPlan(null);
      toast({
        title: "Vårdplan uppdaterad",
        description: "Vårdplanen har uppdaterats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera vårdplan",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      receivedDate: formData.get('receivedDate') as string,
      enteredToJournalDate: formData.get('enteredToJournalDate') as string || undefined,
      status: formData.get('status') as string,
      assignedStaffId: formData.get('assignedStaffId') as string || undefined,
      content: formData.get('content') as string || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPlan) return;

    const formData = new FormData(e.currentTarget);
    
    updateMutation.mutate({
      id: editingPlan.id,
      updates: {
        receivedDate: formData.get('receivedDate') as string,
        enteredToJournalDate: formData.get('enteredToJournalDate') as string || undefined,
        status: formData.get('status') as string,
        assignedStaffId: formData.get('assignedStaffId') as string || undefined,
        content: formData.get('content') as string || undefined,
      },
    });
  };

  const openEdit = (plan: CarePlan) => {
    setEditingPlan(plan);
    setIsEditOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mottagen': return 'bg-blue-100 text-blue-800';
      case 'Aktiv': return 'bg-green-100 text-green-800';
      case 'Avslutad': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Laddar vårdplaner...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Vårdplaner för {client.displayCode}
        </h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny vårdplan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Skapa ny vårdplan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receivedDate">Mottagen datum *</Label>
                  <Input
                    id="receivedDate"
                    name="receivedDate"
                    type="date"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="enteredToJournalDate">Införd i journal</Label>
                  <Input
                    id="enteredToJournalDate"
                    name="enteredToJournalDate"
                    type="date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="Mottagen">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mottagen">Mottagen</SelectItem>
                      <SelectItem value="Aktiv">Aktiv</SelectItem>
                      <SelectItem value="Avslutad">Avslutad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedStaffId">Ansvarig personal</Label>
                  <Select name="assignedStaffId">
                    <SelectTrigger>
                      <SelectValue placeholder="Välj personal" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Innehåll</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={4}
                  placeholder="Vårdplanens innehåll..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Sparar..." : "Spara"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {carePlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                Inga vårdplaner ännu. Skapa den första vårdplanen för denna klient.
              </p>
            </CardContent>
          </Card>
        ) : (
          carePlans.map((plan) => {
            const assignedStaff = staff.find(s => s.id === plan.assignedStaffId);
            
            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {plan.index}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Vårdplan {plan.index}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Mottagen: {plan.receivedDate}
                          </span>
                          {plan.enteredToJournalDate && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">
                                Journal: {plan.enteredToJournalDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(plan)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignedStaff && (
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Ansvarig: {assignedStaff.name}
                      </span>
                    </div>
                  )}
                  {plan.content && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{plan.content}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Redigera vårdplan {editingPlan?.index}
            </DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-receivedDate">Mottagen datum *</Label>
                  <Input
                    id="edit-receivedDate"
                    name="receivedDate"
                    type="date"
                    defaultValue={editingPlan.receivedDate}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-enteredToJournalDate">Införd i journal</Label>
                  <Input
                    id="edit-enteredToJournalDate"
                    name="enteredToJournalDate"
                    type="date"
                    defaultValue={editingPlan.enteredToJournalDate || ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingPlan.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mottagen">Mottagen</SelectItem>
                      <SelectItem value="Aktiv">Aktiv</SelectItem>
                      <SelectItem value="Avslutad">Avslutad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-assignedStaffId">Ansvarig personal</Label>
                  <Select name="assignedStaffId" defaultValue={editingPlan.assignedStaffId || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj personal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ingen vald</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-content">Innehåll</Label>
                <Textarea
                  id="edit-content"
                  name="content"
                  rows={4}
                  defaultValue={editingPlan.content || ''}
                  placeholder="Vårdplanens innehåll..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Sparar..." : "Spara ändringar"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}