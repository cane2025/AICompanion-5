import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Save, 
  Plus, 
  Archive, 
  Trash2, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Clock,
  Zap,
  FileText
} from "lucide-react";
import { SmartStaffList } from "./smart-staff-list";
import type { Staff, Client } from "@shared/schema";

// Validation schema - simplified and less restrictive
const compactCarePlanSchema = z.object({
  staffId: z.string().min(1, "Behandlare krävs"),
  clientInitials: z.string().min(1, "Klientinitialer krävs"),
  planNumber: z.string().min(1, "Vårdplansnummer krävs"),
  receivedDate: z.string().min(1, "Mottagningsdatum krävs"),
  goals: z.string().optional(),
  interventions: z.string().optional(),
  // Advanced fields
  journalDate: z.string().optional(),
  comment: z.string().optional(),
});

type CompactCarePlanFormData = z.infer<typeof compactCarePlanSchema>;

interface CompactCarePlanFormProps {
  onSuccess?: () => void;
  initialData?: Partial<CompactCarePlanFormData>;
}

export function CompactCarePlanForm({ onSuccess, initialData }: CompactCarePlanFormProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Generate auto plan number
  const generatePlanNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(3, '0');
    return `VP-${year}-${month}-${random}`;
  }, []);

  const form = useForm<CompactCarePlanFormData>({
    resolver: zodResolver(compactCarePlanSchema),
    defaultValues: {
      staffId: "",
      clientInitials: "",
      planNumber: generatePlanNumber(),
      receivedDate: new Date().toISOString().split("T")[0],
      goals: "",
      interventions: "",
      journalDate: "",
      comment: "",
      ...initialData,
    },
  });

  const watchedValues = form.watch();

  // Fetch all staff
  const { data: allStaff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
  });

  // Fetch clients for selected staff
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", selectedStaff?.id],
    queryFn: () => api.getClientsByStaff(selectedStaff?.id || ""),
    enabled: !!selectedStaff?.id,
  });

  // Auto-save functionality with 800ms debounce
  const performAutoSave = useCallback(async (data: CompactCarePlanFormData) => {
    if (!data.staffId || !data.clientInitials || !data.planNumber) return;
    
    setIsSaving(true);
    try {
      // In a real app, this would save to a draft endpoint
      console.log("Auto-saving draft:", data);
      setLastSaved(new Date());
      
      // Show discrete saving feedback
      toast({
        title: "Sparar...",
        description: "",
        duration: 1000,
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Debounced auto-save effect
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      const formData = form.getValues();
      if (formData.staffId && formData.clientInitials && formData.planNumber) {
        performAutoSave(formData);
      }
    }, 800);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [watchedValues, performAutoSave, form]);

  // Handle staff selection from left panel
  const handleStaffSelect = useCallback((staff: Staff) => {
    setSelectedStaff(staff);
    form.setValue("staffId", staff.id);
    
    toast({
      title: `${staff.name} vald`,
      description: `${staff.initials} - ${staff.roll || "Vårdpersonal"}`,
      duration: 2000,
    });
  }, [form, toast]);

  // Auto-capitalize client initials
  const handleClientInitialsChange = useCallback((value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-ZÅÄÖ\s\.-]/g, '');
    form.setValue("clientInitials", formatted);
  }, [form]);

  // Create care plan mutation
  const createCarePlanMutation = useMutation({
    mutationFn: async (data: CompactCarePlanFormData) => {
      if (!selectedStaff) throw new Error("Ingen behandlare vald");

      // Create or find client
      let client;
      const existingClient = clients.find(c => c.initials === data.clientInitials);
      
      if (existingClient) {
        client = existingClient;
      } else {
        client = await api.createClient({
          initials: data.clientInitials,
          staffId: data.staffId,
          personalNumber: "",
          notes: `Vårdplan ${data.planNumber}`,
          status: "active",
        });
      }

      // Create care plan
      const carePlan = await api.createCarePlan({
        clientId: client.id,
        staffId: data.staffId,
        responsibleId: data.staffId,
        receivedDate: data.receivedDate,
        enteredJournalDate: data.journalDate || null,
        staffNotifiedDate: new Date().toISOString().split("T")[0],
        planContent: `Vårdplan ${data.planNumber}`,
        goals: data.goals || "Genomföra vårdflöde enligt rutin",
        interventions: data.interventions || "Standard vårdflöde - GFP ska påbörjas inom 3 veckor",
        status: "staff_notified",
        comment: data.comment || "",
      });

      // Create implementation plan automatically
      await api.createImplementationPlan({
        clientId: client.id,
        staffId: data.staffId,
        carePlanId: carePlan.id,
        planContent: `GFP för vårdplan ${data.planNumber}`,
        goals: "Genomförandeplan enligt vårdplan",
        activities: "GFP aktiviteter - ska slutföras inom 3 veckor",
        followUpSchedule: "3 veckor från idag",
        status: "pending",
        isActive: true,
      });

      return { carePlan, client };
    },
    onSuccess: ({ carePlan, client }) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans"] });

      toast({
        title: "Vårdplan skapad!",
        description: `${client.initials} - ${carePlan.planContent}`,
        duration: 4000,
      });

      setLastSaved(new Date());
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa vårdplan",
        variant: "destructive",
      });
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey)) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            form.handleSubmit((data) => createCarePlanMutation.mutate(data))();
            break;
          case 'n':
            e.preventDefault();
            // Save and create new
            form.handleSubmit((data) => {
              createCarePlanMutation.mutate(data);
              // Reset form after save
              setTimeout(() => {
                form.reset({
                  staffId: selectedStaff?.id || "",
                  clientInitials: "",
                  planNumber: generatePlanNumber(),
                  receivedDate: new Date().toISOString().split("T")[0],
                  goals: "",
                  interventions: "",
                  journalDate: "",
                  comment: "",
                });
              }, 1000);
            })();
            break;
          case 'd':
            e.preventDefault();
            // Duplicate current form
            const currentData = form.getValues();
            form.reset({
              ...currentData,
              planNumber: generatePlanNumber(),
              clientInitials: "",
            });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, createCarePlanMutation, selectedStaff, generatePlanNumber]);

  // Quick templates
  const templates = [
    {
      name: "Hälsa",
      goals: "Förbättra fysisk och psykisk hälsa genom strukturerat stöd",
      interventions: "Regelbundna hälsosamtal, aktivitetsplanering, kontakt med vårdcentral vid behov"
    },
    {
      name: "Skola",
      goals: "Stödja utbildningsprocessen och skolnärvaro",
      interventions: "Kontakt med skola, studiehandledning, strukturerat stöd för hemuppgifter"
    },
    {
      name: "Familj",
      goals: "Stärka familjerelationer och förbättra hemförhållanden",
      interventions: "Familjesamtal, föräldrastöd, hembesök vid behov"
    },
    {
      name: "Boende",
      goals: "Säkra lämpligt boende och utveckla boendeskicklighet",
      interventions: "Boendehandledning, kontakt med bostadsaktörer, träning i vardagsrutiner"
    }
  ];

  const applyTemplate = (template: typeof templates[0]) => {
    form.setValue("goals", template.goals);
    form.setValue("interventions", template.interventions);
    toast({
      title: `${template.name}-mall tillagd`,
      description: "Mål och åtgärder har fyllts i",
      duration: 2000,
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Smart Staff List - Left Panel */}
      <SmartStaffList
        selectedStaffId={selectedStaff?.id}
        onStaffSelect={handleStaffSelect}
      />

      {/* Main Form Area */}
      <div className="flex-1 flex flex-col">
        {/* Compact Top Section - 4 Key Fields */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-4 gap-4">
              {/* Behandlare */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Behandlare *
                </label>
                <div className="relative">
                  <Select
                    value={form.watch("staffId")}
                    onValueChange={(value) => {
                      const staffMember = allStaff.find(s => s.id === value);
                      if (staffMember) handleStaffSelect(staffMember);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Välj behandlare">
                        {selectedStaff && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {selectedStaff.initials}
                            </Badge>
                            <span className="truncate">{selectedStaff.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allStaff.map((staffMember) => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {staffMember.initials}
                            </Badge>
                            <span>{staffMember.name}</span>
                            <span className="text-gray-500 text-sm">
                              - {staffMember.roll || "Vårdpersonal"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStaff && (
                    <Check className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              {/* Vårdplansnummer */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Vårdplansnummer *
                </label>
                <div className="relative">
                  <Input
                    {...form.register("planNumber")}
                    className="h-10"
                    placeholder="VP-2025-09-XXX"
                  />
                  {form.watch("planNumber") && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              {/* Klientinitialer */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Klientinitialer *
                </label>
                <div className="relative">
                  <Input
                    value={form.watch("clientInitials")}
                    onChange={(e) => handleClientInitialsChange(e.target.value)}
                    className="h-10 font-mono"
                    placeholder="A.B."
                    maxLength={10}
                  />
                  {form.watch("clientInitials") && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              {/* Mottagningsdatum */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Mottagningsdatum *
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    {...form.register("receivedDate")}
                    className="h-10"
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {form.watch("receivedDate") && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Quick Templates */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Snabbmallar</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {templates.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main Goals and Interventions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Mål och syfte
                </label>
                <Textarea
                  {...form.register("goals")}
                  placeholder="Beskriv målen för vårdplanen..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Åtgärder och interventioner
                </label>
                <Textarea
                  {...form.register("interventions")}
                  placeholder="Beskriv planerade åtgärder..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Advanced Settings - Collapsible */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Avancerade inställningar
                    <Badge variant="secondary" className="text-xs">
                      Valfritt
                    </Badge>
                  </span>
                  {isAdvancedOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Inskannad i JD
                        </label>
                        <Input
                          type="date"
                          {...form.register("journalDate")}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Kommentarer
                        </label>
                        <Textarea
                          {...form.register("comment")}
                          placeholder="Ytterligare kommentarer..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {lastSaved && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Senast sparad: {lastSaved.toLocaleTimeString('sv-SE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              )}
              {isSaving && (
                <div className="flex items-center gap-1 text-blue-600">
                  <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Sparar...</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentData = form.getValues();
                  form.reset({
                    ...currentData,
                    planNumber: generatePlanNumber(),
                    clientInitials: "",
                  });
                }}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Duplicera (⌘D)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Archive className="h-3 w-3 mr-1" />
                Arkivera
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Radera
              </Button>
              
              <Button
                onClick={form.handleSubmit((data) => createCarePlanMutation.mutate(data))}
                disabled={createCarePlanMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                {createCarePlanMutation.isPending ? "Sparar..." : "Spara (⌘S)"}
              </Button>
              
              <Button
                onClick={form.handleSubmit((data) => {
                  createCarePlanMutation.mutate(data);
                  setTimeout(() => {
                    form.reset({
                      staffId: selectedStaff?.id || "",
                      clientInitials: "",
                      planNumber: generatePlanNumber(),
                      receivedDate: new Date().toISOString().split("T")[0],
                      goals: "",
                      interventions: "",
                      journalDate: "",
                      comment: "",
                    });
                  }, 1000);
                })}
                disabled={createCarePlanMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Spara & Ny (⌘N)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}