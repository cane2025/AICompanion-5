import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Calendar, CheckCircle2, Clock, Send, Target } from "lucide-react";
import type { ImplementationPlan, Client } from "@shared/schema";

interface VersionedGFPProps {
  clientId: string;
  client: Client;
}

interface FollowUp {
  key: 'Uppföljning1'|'Uppföljning2'|'Uppföljning3'|'Uppföljning4'|'Uppföljning5';
  done: boolean;
  note?: string;
  date?: string;
}

export function VersionedGFP({ clientId, client }: VersionedGFPProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<ImplementationPlan | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch implementation plans for this client
  const { data: implementationPlans = [], isLoading } = useQuery<ImplementationPlan[]>({
    queryKey: [`/api/clients/${clientId}/implementation-plans`],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/implementation-plans`);
      if (!response.ok) throw new Error('Failed to fetch implementation plans');
      return response.json();
    },
  });

  // Update implementation plan mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await fetch(`/api/implementation-plans/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error('Failed to update implementation plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/implementation-plans`] });
      setIsEditOpen(false);
      setEditingPlan(null);
      toast({
        title: "GFP uppdaterad",
        description: "Genomförandeplanen har uppdaterats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera genomförandeplan",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPlan) return;

    const formData = new FormData(e.currentTarget);
    
    // Get follow-ups data
    const followUps: FollowUp[] = [
      {
        key: 'Uppföljning1',
        done: formData.get('followUp1') === 'on',
        note: formData.get('followUp1Note') as string || undefined,
        date: formData.get('followUp1Date') as string || undefined,
      },
      {
        key: 'Uppföljning2',
        done: formData.get('followUp2') === 'on',
        note: formData.get('followUp2Note') as string || undefined,
        date: formData.get('followUp2Date') as string || undefined,
      },
      {
        key: 'Uppföljning3',
        done: formData.get('followUp3') === 'on',
        note: formData.get('followUp3Note') as string || undefined,
        date: formData.get('followUp3Date') as string || undefined,
      },
      {
        key: 'Uppföljning4',
        done: formData.get('followUp4') === 'on',
        note: formData.get('followUp4Note') as string || undefined,
        date: formData.get('followUp4Date') as string || undefined,
      },
      {
        key: 'Uppföljning5',
        done: formData.get('followUp5') === 'on',
        note: formData.get('followUp5Note') as string || undefined,
        date: formData.get('followUp5Date') as string || undefined,
      },
    ];
    
    updateMutation.mutate({
      id: editingPlan.id,
      updates: {
        status: formData.get('status') as string,
        dueDate: formData.get('dueDate') as string || undefined,
        sentDate: formData.get('sentDate') as string || undefined,
        completedDate: formData.get('completedDate') as string || undefined,
        followUps: JSON.stringify(followUps),
      },
    });
  };

  const openEdit = (plan: ImplementationPlan) => {
    setEditingPlan(plan);
    setIsEditOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Väntar': return 'bg-gray-100 text-gray-800';
      case 'Aktiv': return 'bg-blue-100 text-blue-800';
      case 'Slutförd': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const parseFollowUps = (followUpsJson: string): FollowUp[] => {
    try {
      return JSON.parse(followUpsJson || '[]');
    } catch {
      return [
        { key: 'Uppföljning1', done: false },
        { key: 'Uppföljning2', done: false },
        { key: 'Uppföljning3', done: false },
        { key: 'Uppföljning4', done: false },
        { key: 'Uppföljning5', done: false },
      ];
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Laddar genomförandeplaner...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Genomförandeplaner (GFP) för {client.displayCode}
        </h3>
      </div>

      <div className="grid gap-4">
        {implementationPlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Target className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                Inga genomförandeplaner ännu. GFP skapas automatiskt när en vårdplan sparas.
              </p>
            </CardContent>
          </Card>
        ) : (
          implementationPlans.map((plan) => {
            const followUps = parseFollowUps(plan.followUps);
            const completedFollowUps = followUps.filter(f => f.done).length;
            
            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {plan.index}
                      </div>
                      <div>
                        <CardTitle className="text-lg">GFP {plan.index}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Kopplad till Vårdplan {plan.carePlanIndex}
                          </span>
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
                  <div className="space-y-3">
                    {/* Dates */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {plan.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Förfall: {plan.dueDate}</span>
                        </div>
                      )}
                      {plan.sentDate && (
                        <div className="flex items-center gap-1">
                          <Send className="h-4 w-4" />
                          <span>Skickad: {plan.sentDate}</span>
                        </div>
                      )}
                      {plan.completedDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Slutförd: {plan.completedDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Follow-ups progress */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Uppföljningar</span>
                        <span className="text-sm text-gray-600">
                          {completedFollowUps}/5 slutförda
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(completedFollowUps / 5) * 100}%` }}
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-5 gap-1">
                        {followUps.map((followUp, index) => (
                          <div
                            key={followUp.key}
                            className={`w-4 h-4 rounded-full ${
                              followUp.done ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            title={`${followUp.key}: ${followUp.done ? 'Klar' : 'Ej klar'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Redigera GFP {editingPlan?.index}
            </DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Status and dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingPlan.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Väntar">Väntar</SelectItem>
                      <SelectItem value="Aktiv">Aktiv</SelectItem>
                      <SelectItem value="Slutförd">Slutförd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-dueDate">Förfallodatum</Label>
                  <Input
                    id="edit-dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={editingPlan.dueDate || ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-sentDate">Skickad datum</Label>
                  <Input
                    id="edit-sentDate"
                    name="sentDate"
                    type="date"
                    defaultValue={editingPlan.sentDate || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-completedDate">Slutförd datum</Label>
                  <Input
                    id="edit-completedDate"
                    name="completedDate"
                    type="date"
                    defaultValue={editingPlan.completedDate || ''}
                  />
                </div>
              </div>

              {/* Follow-ups */}
              <div className="space-y-4">
                <h4 className="font-medium">Uppföljningar</h4>
                {parseFollowUps(editingPlan.followUps).map((followUp, index) => (
                  <Card key={followUp.key} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`followUp${index + 1}`}
                        name={`followUp${index + 1}`}
                        defaultChecked={followUp.done}
                      />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`followUp${index + 1}`} className="text-base">
                          {followUp.key}
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`followUp${index + 1}Date`} className="text-sm">
                              Datum
                            </Label>
                            <Input
                              id={`followUp${index + 1}Date`}
                              name={`followUp${index + 1}Date`}
                              type="date"
                              defaultValue={followUp.date || ''}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`followUp${index + 1}Note`} className="text-sm">
                              Anteckning
                            </Label>
                            <Textarea
                              id={`followUp${index + 1}Note`}
                              name={`followUp${index + 1}Note`}
                              defaultValue={followUp.note || ''}
                              rows={2}
                              className="text-sm"
                              placeholder="Valfri anteckning..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
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