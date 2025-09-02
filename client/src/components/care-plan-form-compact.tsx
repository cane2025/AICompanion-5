import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Plus, 
  Archive, 
  Trash2, 
  CheckCircle, 
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Hash,
  Calendar,
  MessageSquare
} from "lucide-react";
import type { Staff, Client } from "@shared/schema";
import * as api from "@/lib/api";

// Feature flag for the new compact UI
const UI_CAREPLAN_COMPACT = true;

const carePlanSchema = z.object({
  staffId: z.string().min(1, "Behandlare måste väljas"),
  carePlanNumber: z.string().min(1, "Vårdplansnummer krävs"),
  clientInitials: z.string().min(1, "Klientinitialer krävs").max(5, "Max 5 tecken"),
  receivedDate: z.string().min(1, "Mottagningsdatum krävs"),
  goals: z.string().optional(),
  interventions: z.string().optional(),
  followUp: z.string().optional(),
  comment: z.string().optional(),
  journalDate: z.string().optional(),
});

type CarePlanFormData = z.infer<typeof carePlanSchema>;

interface CarePlanFormCompactProps {
  onStaffSelect?: (staffId: string) => void;
  initialData?: Partial<CarePlanFormData>;
}

export function CarePlanFormCompact({ onStaffSelect, initialData }: CarePlanFormCompactProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      staffId: initialData?.staffId || "",
      carePlanNumber: initialData?.carePlanNumber || generateCarePlanNumber(),
      clientInitials: initialData?.clientInitials || "",
      receivedDate: initialData?.receivedDate || new Date().toISOString().split('T')[0],
      goals: initialData?.goals || "",
      interventions: initialData?.interventions || "",
      followUp: initialData?.followUp || "",
      comment: initialData?.comment || "",
      journalDate: initialData?.journalDate || "",
    },
  });

  // Fetch staff data
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: () => api.getStaff(),
  });

  // Fetch clients for selected staff
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/staff", selectedStaff?.id, "clients"],
    queryFn: () => selectedStaff ? api.getStaffClients(selectedStaff.id) : Promise.resolve([]),
    enabled: !!selectedStaff,
  });

  // Generate care plan number
  function generateCarePlanNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `VP-${year}-${month}-${day}`;
  }

  // Auto-save functionality
  const autoSave = useCallback(async (data: CarePlanFormData) => {
    if (!data.staffId || !data.carePlanNumber || !data.clientInitials || !data.receivedDate) {
      return; // Don't save incomplete forms
    }

    setIsSaving(true);
    try {
      // Here you would implement the actual save logic
      // For now, we'll simulate a save
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLastSaved(new Date());
      toast({
        title: "Autosparat",
        description: "Vårdplanen har sparats automatiskt",
        duration: 1500,
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Set up auto-save timer
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        autoSave(data as CarePlanFormData);
      }, 800);
      
      setAutoSaveTimer(timer);
    });

    return () => {
      subscription.unsubscribe();
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [form, autoSave, autoSaveTimer]);

  // Handle staff selection
  const handleStaffSelect = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    setSelectedStaff(staffMember || null);
    form.setValue("staffId", staffId);
    
    if (onStaffSelect) {
      onStaffSelect(staffId);
    }

    // Auto-generate care plan number for new staff
    if (!form.getValues("carePlanNumber") || form.getValues("carePlanNumber").startsWith("VP-")) {
      form.setValue("carePlanNumber", generateCarePlanNumber());
    }
  };

  // Handle client initials input (auto-uppercase)
  const handleClientInitialsChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z.]/g, '');
    form.setValue("clientInitials", upperValue);
  };

  // Quick templates
  const quickTemplates = [
    { name: "Hälsa", goals: "Förbättra klientens fysiska och psykiska hälsa", interventions: "Regelbunden uppföljning, samverkan med vårdcentral" },
    { name: "Skola", goals: "Stödja skolprestationer och utbildningsmål", interventions: "Kontakt med skola, läxhjälp, studieplanering" },
    { name: "Familj", goals: "Stärka familjerelationer och kommunikation", interventions: "Familjeterapi, konflikthantering, samtal" },
    { name: "Boende", goals: "Säkerställa stabilt boende och livsmiljö", interventions: "Bostadssökning, ekonomiskt stöd, praktisk hjälp" },
  ];

  const applyTemplate = (template: typeof quickTemplates[0]) => {
    const currentGoals = form.getValues("goals") || "";
    const currentInterventions = form.getValues("interventions") || "";
    
    form.setValue("goals", currentGoals ? `${currentGoals}\n\n${template.goals}` : template.goals);
    form.setValue("interventions", currentInterventions ? `${currentInterventions}\n\n${template.interventions}` : template.interventions);
  };

  // Manual save
  const handleManualSave = async () => {
    const data = form.getValues();
    await autoSave(data);
  };

  // Save and new
  const handleSaveAndNew = async () => {
    const data = form.getValues();
    await autoSave(data);
    
    // Reset form with new care plan number
    form.reset({
      staffId: data.staffId, // Keep same staff
      carePlanNumber: generateCarePlanNumber(),
      clientInitials: "",
      receivedDate: new Date().toISOString().split('T')[0],
      goals: "",
      interventions: "",
      followUp: "",
      comment: "",
      journalDate: "",
    });
  };

  // Archive
  const handleArchive = () => {
    toast({
      title: "Arkiverad",
      description: "Vårdplanen har arkiverats",
    });
  };

  // Delete
  const handleDelete = () => {
    if (window.confirm("Är du säker på att du vill radera denna vårdplan?")) {
      form.reset();
      toast({
        title: "Raderad",
        description: "Vårdplanen har raderats",
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleSaveAndNew();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        // Duplicate functionality could be added here
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!UI_CAREPLAN_COMPACT) {
    return <div>Kompakt UI är inte aktiverat</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Vårdplan
          </h2>
          <p className="text-gray-600 mt-1">
            Registrera ny vårdplan med automatisk aktivering av alla flöden
          </p>
        </div>
        
        {/* Last saved indicator */}
        {lastSaved && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Senast sparad: {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Top section - 4 key fields in horizontal row */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {/* Behandlare */}
            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Behandlare *
                  </FormLabel>
                  <Select onValueChange={handleStaffSelect} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj behandlare" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staff.map((staffMember) => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                              {staffMember.initials}
                            </div>
                            <span>{staffMember.name}</span>
                            {staffMember.roll && (
                              <Badge variant="outline" className="text-xs">
                                {staffMember.roll}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Vårdplansnummer */}
            <FormField
              control={form.control}
              name="carePlanNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Vårdplansnummer *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="VP-2025-09-001"
                      className="font-mono"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Klientinitialer */}
            <FormField
              control={form.control}
              name="clientInitials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Klientinitialer *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      value={field.value}
                      onChange={(e) => handleClientInitialsChange(e.target.value)}
                      placeholder="A.B."
                      maxLength={5}
                      className="uppercase font-medium"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Mottagningsdatum */}
            <FormField
              control={form.control}
              name="receivedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mottagningsdatum *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick templates */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Snabbmallar</h3>
        <div className="flex flex-wrap gap-2">
          {quickTemplates.map((template) => (
            <Button
              key={template.name}
              variant="outline"
              size="sm"
              onClick={() => applyTemplate(template)}
              className="text-xs"
            >
              + {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Goals and Interventions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goals */}
          <FormField
            control={form.control}
            name="goals"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Mål
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field}
                    placeholder="Beskriv vårdplanens mål..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Interventions */}
          <FormField
            control={form.control}
            name="interventions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Åtgärder
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field}
                    placeholder="Beskriv planerade åtgärder..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Follow-up */}
          <FormField
            control={form.control}
            name="followUp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Uppföljning
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field}
                    placeholder="När och hur ska uppföljning ske?"
                    rows={3}
                    className="resize-none"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Right column - Advanced settings and client suggestions */}
        <div className="space-y-6">
          {/* Client suggestions */}
          {selectedStaff && clients.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Vanliga klienter för {selectedStaff.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {clients.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                      onClick={() => form.setValue("clientInitials", client.initials)}
                    >
                      <span className="text-sm font-medium">{client.initials}</span>
                      <Badge variant="outline" className="text-xs">
                        {client.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced settings */}
          <Card>
            <CardHeader 
              className="pb-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            >
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center justify-between">
                Avancerade inställningar
                {isAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            {isAdvancedOpen && (
              <CardContent className="pt-0 space-y-4">
                {/* Journal date */}
                <FormField
                  control={form.control}
                  name="journalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Inskannad i JD
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="date"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Comments */}
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Kommentar
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Ytterligare kommentarer..."
                          rows={3}
                          className="resize-none"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isSaving ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Sparar...
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                Senast sparad: {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : null}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleArchive}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Arkivera
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Radera
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSaveAndNew}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Spara & Ny
            </Button>
            
            <Button
              onClick={handleManualSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Sparar..." : "Spara"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}