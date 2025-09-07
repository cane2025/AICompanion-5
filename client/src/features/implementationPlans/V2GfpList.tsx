import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Eye, Target, CheckCircle, Clock, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ImplementationPlan {
  id: string;
  clientId: string;
  staffId: string;
  name?: string;
  planContent: string;
  goals: string | string[];
  interventions: string;
  status: "draft" | "active" | "completed" | "archived";
  isActive: boolean;
  comment: string;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  priority: "low" | "medium" | "high";
}

interface V2GfpListProps {
  clientId: string;
}

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const STATUS_ICONS = {
  draft: FileText,
  active: AlertCircle,
  completed: CheckCircle,
  archived: FileText,
};

export function V2GfpList({ clientId }: V2GfpListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ImplementationPlan | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    planContent: string;
    goals: string;
    interventions: string;
    status: "draft" | "active" | "completed" | "archived";
    comment: string;
    startDate: string;
    endDate: string;
    priority: "low" | "medium" | "high";
  }>({
    name: "",
    planContent: "",
    goals: "",
    interventions: "",
    status: "draft",
    comment: "",
    startDate: "",
    endDate: "",
    priority: "medium",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch implementation plans for this client
  const { data: implementationPlan, isLoading } = useQuery({
    queryKey: ["/api/implementation-plans", clientId],
    queryFn: () => api.getImplementationPlan(clientId),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createImplementationPlan({ ...data, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", clientId] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Genomförandeplan skapad",
        description: "Genomförandeplanen har skapats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid skapande av genomförandeplan.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateImplementationPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", clientId] });
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      resetForm();
      toast({
        title: "Genomförandeplan uppdaterad",
        description: "Genomförandeplanen har uppdaterats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid uppdatering av genomförandeplan.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteImplementationPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", clientId] });
      toast({
        title: "Genomförandeplan borttagen",
        description: "Genomförandeplanen har borttagits framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Ett fel uppstod vid borttagning av genomförandeplan.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      planContent: "",
      goals: "",
      interventions: "",
      status: "draft",
      comment: "",
      startDate: "",
      endDate: "",
      priority: "medium",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (plan: ImplementationPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name || "",
      planContent: plan.planContent,
      goals: Array.isArray(plan.goals) ? plan.goals.join("\n") : plan.goals,
      interventions: plan.interventions,
      status: plan.status,
      comment: plan.comment,
      startDate: plan.startDate || "",
      endDate: plan.endDate || "",
      priority: plan.priority,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedPlan) {
      updateMutation.mutate({ id: selectedPlan.id, data: formData });
    }
  };

  const handleView = (plan: ImplementationPlan) => {
    setSelectedPlan(plan);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Utkast";
      case "active": return "Aktiv";
      case "completed": return "Slutförd";
      case "archived": return "Arkiverad";
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low": return "Låg";
      case "medium": return "Medium";
      case "high": return "Hög";
      default: return priority;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Genomförandeplaner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Laddar genomförandeplaner...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Genomförandeplaner
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ny genomförandeplan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Skapa ny genomförandeplan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Namn</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Genomförandeplansnamn..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Startdatum</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Slutdatum</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="priority">Prioritet</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Låg</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hög</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="planContent">Planinnehåll</Label>
                  <Textarea
                    id="planContent"
                    value={formData.planContent}
                    onChange={(e) => setFormData({ ...formData, planContent: e.target.value })}
                    placeholder="Beskriv genomförandeplanen..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="goals">Mål</Label>
                  <Textarea
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    placeholder="Lista mål (en per rad)..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="interventions">Åtgärder</Label>
                  <Textarea
                    id="interventions"
                    value={formData.interventions}
                    onChange={(e) => setFormData({ ...formData, interventions: e.target.value })}
                    placeholder="Beskriv åtgärder..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="comment">Kommentarer</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Ytterligare kommentarer..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Skapar..." : "Skapa genomförandeplan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!implementationPlan ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen genomförandeplan än</p>
            <p className="text-sm">Skapa din första genomförandeplan för att komma igång</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {implementationPlan.name || "Genomförandeplan"}
                  </span>
                  <Badge className={STATUS_COLORS[implementationPlan.status as keyof typeof STATUS_COLORS]}>
                    {getStatusLabel(implementationPlan.status)}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[implementationPlan.priority as keyof typeof PRIORITY_COLORS]}>
                    {getPriorityLabel(implementationPlan.priority)}
                  </Badge>
                  {implementationPlan.isActive && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Aktiv
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(implementationPlan)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(implementationPlan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ta bort genomförandeplan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Är du säker på att du vill ta bort denna genomförandeplan? Denna åtgärd kan inte ångras.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(implementationPlan.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Ta bort
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {implementationPlan.planContent && (
                <p className="text-sm text-muted-foreground mb-2">
                  {implementationPlan.planContent.length > 100 
                    ? `${implementationPlan.planContent.substring(0, 100)}...` 
                    : implementationPlan.planContent
                  }
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                Skapad: {format(new Date(implementationPlan.createdAt), "PPP", { locale: sv })}
                {implementationPlan.updatedAt !== implementationPlan.createdAt && (
                  <span> • Uppdaterad: {format(new Date(implementationPlan.updatedAt), "PPP", { locale: sv })}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Redigera genomförandeplan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Namn</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Utkast</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="completed">Slutförd</SelectItem>
                      <SelectItem value="archived">Arkiverad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-priority">Prioritet</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Låg</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hög</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Startdatum</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">Slutdatum</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-planContent">Planinnehåll</Label>
                <Textarea
                  id="edit-planContent"
                  value={formData.planContent}
                  onChange={(e) => setFormData({ ...formData, planContent: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-goals">Mål</Label>
                <Textarea
                  id="edit-goals"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-interventions">Åtgärder</Label>
                <Textarea
                  id="edit-interventions"
                  value={formData.interventions}
                  onChange={(e) => setFormData({ ...formData, interventions: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-comment">Kommentarer</Label>
                <Textarea
                  id="edit-comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Uppdaterar..." : "Uppdatera genomförandeplan"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Genomförandeplan - {selectedPlan?.name || "Genomförandeplan"}
              </DialogTitle>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge className={STATUS_COLORS[selectedPlan.status]}>
                    {getStatusLabel(selectedPlan.status)}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[selectedPlan.priority]}>
                    {getPriorityLabel(selectedPlan.priority)}
                  </Badge>
                  {selectedPlan.isActive && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Aktiv
                    </Badge>
                  )}
                </div>
                {(selectedPlan.startDate || selectedPlan.endDate) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedPlan.startDate && (
                      <div>
                        <span className="font-medium">Startdatum:</span> {format(new Date(selectedPlan.startDate), "PPP", { locale: sv })}
                      </div>
                    )}
                    {selectedPlan.endDate && (
                      <div>
                        <span className="font-medium">Slutdatum:</span> {format(new Date(selectedPlan.endDate), "PPP", { locale: sv })}
                      </div>
                    )}
                  </div>
                )}
                {selectedPlan.planContent && (
                  <div>
                    <h4 className="font-medium mb-2">Planinnehåll</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedPlan.planContent}</p>
                  </div>
                )}
                {selectedPlan.goals && (
                  <div>
                    <h4 className="font-medium mb-2">Mål</h4>
                    <div className="text-sm">
                      {Array.isArray(selectedPlan.goals) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {selectedPlan.goals.map((goal, index) => (
                            <li key={index}>{goal}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="whitespace-pre-wrap">{selectedPlan.goals}</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedPlan.interventions && (
                  <div>
                    <h4 className="font-medium mb-2">Åtgärder</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedPlan.interventions}</p>
                  </div>
                )}
                {selectedPlan.comment && (
                  <div>
                    <h4 className="font-medium mb-2">Kommentarer</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedPlan.comment}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  <p>Skapad: {format(new Date(selectedPlan.createdAt), "PPP 'kl' p", { locale: sv })}</p>
                  {selectedPlan.updatedAt !== selectedPlan.createdAt && (
                    <p>Uppdaterad: {format(new Date(selectedPlan.updatedAt), "PPP 'kl' p", { locale: sv })}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}