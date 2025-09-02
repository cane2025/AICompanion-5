import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  FileText, 
  Check, 
  Save, 
  Archive, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Search,
  User,
  Calendar,
  Hash,
  Clock,
  ChevronsUpDown,
  Loader2
} from "lucide-react";
import type { Staff, Client } from "@shared/schema";
import React from "react";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";

// Schema without the annoying validation messages
const carePlanSchema = z.object({
  staffId: z.string().min(1, "Välj behandlare"),
  clientId: z.string().min(1, "Välj klient"),
  planNumber: z.string().transform(val => {
    // Auto-generate if empty
    if (!val) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
      return `VP-${year}-${month}-${random}`;
    }
    return val;
  }),
  receivedDate: z.string().min(1, "Datum krävs"),
  assignedStaffIds: z.array(z.string()).min(1, "Välj minst en personal"),
  journalDate: z.string().optional(),
  comment: z.string().optional(),
  goals: z.string().optional(),
  interventions: z.string().optional(),
  followUp: z.string().optional(),
});

type CarePlanFormData = z.infer<typeof carePlanSchema>;

interface CarePlanDialogCompactProps {
  trigger?: React.ReactNode;
  staffId?: string;
  onSuccess?: () => void;
}

// Personnel list component for the left sidebar
function PersonnelSidebar({ 
  staff, 
  selectedStaffId, 
  onSelectStaff,
  activeClients 
}: {
  staff: Staff[];
  selectedStaffId: string | null;
  onSelectStaff: (staffId: string) => void;
  activeClients: Record<string, number>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "role" | "clients">("name");
  
  // Filter and sort staff
  const filteredStaff = staff
    .filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.initials.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.epost?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, 'sv');
      if (sortBy === "role") return (a.roll || "").localeCompare(b.roll || "", 'sv');
      if (sortBy === "clients") return (activeClients[b.id] || 0) - (activeClients[a.id] || 0);
      return 0;
    });

  // Get availability status (mock for now)
  const getStatus = (staffId: string) => {
    // In real app, this would check actual availability
    const random = Math.random();
    if (random > 0.7) return "busy";
    if (random > 0.3) return "available";
    return "away";
  };

  return (
    <div className="w-[250px] border-r bg-gray-50/50 flex flex-col h-full">
      {/* Search header */}
      <div className="p-3 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sök personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex gap-1 mt-2">
          <Button
            variant={sortBy === "name" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("name")}
            className="text-xs flex-1"
          >
            Namn
          </Button>
          <Button
            variant={sortBy === "role" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("role")}
            className="text-xs flex-1"
          >
            Roll
          </Button>
          <Button
            variant={sortBy === "clients" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("clients")}
            className="text-xs flex-1"
          >
            Klienter
          </Button>
        </div>
      </div>

      {/* Staff list */}
      <div className="flex-1 overflow-y-auto">
        {filteredStaff.map((staffMember, index) => {
          const status = getStatus(staffMember.id);
          const clientCount = activeClients[staffMember.id] || 0;
          const isSelected = selectedStaffId === staffMember.id;
          
          return (
            <div
              key={staffMember.id}
              onClick={() => onSelectStaff(staffMember.id)}
              className={cn(
                "px-3 py-2 cursor-pointer transition-colors border-b border-gray-100",
                "hover:bg-gray-100",
                isSelected && "bg-blue-50 hover:bg-blue-100 border-l-2 border-l-blue-500",
                index < 9 && "relative"
              )}
            >
              {/* Quick number shortcut */}
              {index < 9 && (
                <span className="absolute right-2 top-2 text-xs text-gray-400">
                  {index + 1}
                </span>
              )}
              
              <div className="flex items-start gap-2">
                {/* Status indicator */}
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5",
                  status === "available" && "bg-green-500",
                  status === "busy" && "bg-yellow-500",
                  status === "away" && "bg-gray-400"
                )} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm">{staffMember.initials}</span>
                    <span className="text-sm truncate">{staffMember.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{staffMember.roll || "Personal"}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">{clientCount} klienter</span>
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <Check className="absolute right-2 bottom-2 h-4 w-4 text-blue-600" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-600">
        Visar {filteredStaff.length} av {staff.length} personal
      </div>
    </div>
  );
}

export function CarePlanDialogCompact({
  trigger,
  staffId: propStaffId,
  onSuccess,
}: CarePlanDialogCompactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStaffFromSidebar, setSelectedStaffFromSidebar] = useState<string | null>(null);
  
  const { toast } = useToast();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch data
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ["/api/clients/all"],
    queryFn: async () => {
      const promises = staff.map(s => api.getClientsByStaff(s.id));
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: staff.length > 0,
  });

  // Get active client counts per staff
  const activeClientsPerStaff = allClients.reduce((acc, client) => {
    const staffId = client.staffId;
    if (staffId) {
      acc[staffId] = (acc[staffId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Use either prop staffId or selected from sidebar
  const effectiveStaffId = propStaffId || selectedStaffFromSidebar;

  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      staffId: effectiveStaffId || "",
      clientId: "",
      planNumber: "",
      receivedDate: new Date().toISOString().split("T")[0],
      assignedStaffIds: effectiveStaffId ? [effectiveStaffId] : [],
      journalDate: "",
      comment: "",
      goals: "",
      interventions: "",
      followUp: "",
    },
  });

  // Update form when staff is selected from sidebar
  useEffect(() => {
    if (selectedStaffFromSidebar) {
      form.setValue("staffId", selectedStaffFromSidebar);
      form.setValue("assignedStaffIds", [selectedStaffFromSidebar]);
    }
  }, [selectedStaffFromSidebar, form]);

  // Auto-save functionality
  const autoSave = useCallback(
    debounce(async (data: CarePlanFormData) => {
      if (!form.formState.isDirty) return;
      
      setIsSaving(true);
      try {
        // In real app, this would save to backend
        await new Promise(resolve => setTimeout(resolve, 500));
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (error) {
        setIsSaving(false);
        console.error("Auto-save failed:", error);
      }
    }, 800),
    []
  );

  // Watch form changes for auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      autoSave(data as CarePlanFormData);
    });
    return () => subscription.unsubscribe();
  }, [form, autoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Cmd/Ctrl + S - Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        form.handleSubmit(handleSubmit)();
      }
      
      // Cmd/Ctrl + N - Save & New
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        form.handleSubmit((data) => {
          handleSubmit(data);
          // Reset form for new entry
          form.reset();
        })();
      }
      
      // Number keys 1-9 for quick staff selection
      if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey) {
        const index = parseInt(e.key) - 1;
        if (staff[index]) {
          setSelectedStaffFromSidebar(staff[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, form, staff]);

  // Fetch clients for selected staff
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", effectiveStaffId],
    queryFn: () => api.getClientsByStaff(effectiveStaffId!),
    enabled: !!effectiveStaffId,
  });

  // Create care plan mutation
  const createCarePlanMutation = useMutation({
    mutationFn: async (data: CarePlanFormData) => {
      const primaryStaffId = data.assignedStaffIds[0];
      const clients = await api.getClientsByStaff(primaryStaffId);
      const client = clients.find((c) => c.id === data.clientId);

      if (!client) {
        throw new Error("Vald klient hittades inte");
      }

      const carePlan = await api.createCarePlan({
        clientId: client.id,
        staffId: primaryStaffId,
        responsibleId: data.staffId,
        receivedDate: data.receivedDate,
        enteredJournalDate: data.journalDate || null,
        staffNotifiedDate: new Date().toISOString().split("T")[0],
        planContent: data.planNumber,
        goals: data.goals || "Genomföra vårdflöde enligt rutin",
        interventions: data.interventions || "Standard vårdflöde",
        status: "staff_notified",
        comment: data.comment || "",
      });

      return carePlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans"] });
      toast({
        title: "✅ Vårdplan skapad",
        description: "Vårdplanen har sparats och alla flöden har aktiverats.",
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        form.reset();
        onSuccess?.();
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "❌ Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CarePlanFormData) => {
    setIsSuccess(false);
    createCarePlanMutation.mutate(data);
  };

  // Format client initials with auto-uppercase
  const handleClientInitialsChange = (value: string) => {
    return value.toUpperCase().replace(/[^A-ZÅÄÖ\s-]/g, '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="open-care-plan"
          >
            <Plus className="h-4 w-4 mr-2" />
            Skapa Vårdplan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Personnel sidebar */}
          <PersonnelSidebar
            staff={staff}
            selectedStaffId={effectiveStaffId}
            onSelectStaff={setSelectedStaffFromSidebar}
            activeClients={activeClientsPerStaff}
          />

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Vårdplan
                </DialogTitle>
                <div className="flex items-center gap-4">
                  {lastSaved && (
                    <span className="text-sm text-gray-500">
                      Senast sparad: {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {isSaving && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sparar...
                    </span>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Success state */}
            {isSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-green-500 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-bold mb-2">Vårdplan Skapad!</h3>
                  <p className="text-muted-foreground">
                    Datan har sparats och alla flöden har aktiverats.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Form content */}
                <div className="flex-1 overflow-y-auto">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="p-6 space-y-6"
                    >
                      {/* Top section - 4 key fields */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-4 gap-4">
                          {/* Behandlare */}
                          <FormField
                            control={form.control}
                            name="staffId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Behandlare*
                                </FormLabel>
                                <FormControl>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value
                                          ? staff.find((s) => s.id === field.value)?.name
                                          : "Välj behandlare..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[250px] p-0">
                                      <Command>
                                        <CommandInput placeholder="Sök behandlare..." />
                                        <CommandEmpty>Ingen behandlare hittad.</CommandEmpty>
                                        <CommandGroup>
                                          {staff.map((staffMember) => (
                                            <CommandItem
                                              key={staffMember.id}
                                              value={staffMember.name}
                                              onSelect={() => {
                                                field.onChange(staffMember.id);
                                                form.setValue("assignedStaffIds", [staffMember.id]);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === staffMember.id
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {staffMember.name} - {staffMember.roll || "Personal"}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Vårdplansnummer */}
                          <FormField
                            control={form.control}
                            name="planNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  Vårdplansnummer*
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="VP-2025-09-001"
                                    {...field}
                                    className={cn(
                                      field.value && "border-green-500"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Klientinitialer */}
                          <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Klientinitialer*
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <SelectTrigger className={cn(
                                      field.value && "border-green-500"
                                    )}>
                                      <SelectValue placeholder="Välj klient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                          {handleClientInitialsChange(client.initials)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Mottagningsdatum */}
                          <FormField
                            control={form.control}
                            name="receivedDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Mottagningsdatum*
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                    max={new Date().toISOString().split("T")[0]}
                                    className={cn(
                                      field.value && "border-green-500"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Main content area */}
                      <div className="space-y-4">
                        {/* Goals */}
                        <FormField
                          control={form.control}
                          name="goals"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mål</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Beskriv vårdplanens mål..."
                                  className="min-h-[100px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Interventions */}
                        <FormField
                          control={form.control}
                          name="interventions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Åtgärder</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Beskriv planerade åtgärder..."
                                  className="min-h-[100px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Follow-up */}
                        <FormField
                          control={form.control}
                          name="followUp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Uppföljning</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="När och hur ska uppföljning ske..."
                                  className="min-h-[80px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Quick templates */}
                      <div className="flex gap-2">
                        <span className="text-sm text-gray-500">Snabbmallar:</span>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            form.setValue("goals", form.getValues("goals") + "\n• Förbättra hälsa och välmående");
                            form.setValue("interventions", form.getValues("interventions") + "\n• Regelbundna hälsokontroller");
                          }}
                        >
                          + Hälsa
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            form.setValue("goals", form.getValues("goals") + "\n• Stödja skolnärvaro och prestationer");
                            form.setValue("interventions", form.getValues("interventions") + "\n• Samarbete med skola");
                          }}
                        >
                          + Skola
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            form.setValue("goals", form.getValues("goals") + "\n• Stärka familjerelationer");
                            form.setValue("interventions", form.getValues("interventions") + "\n• Familjesamtal");
                          }}
                        >
                          + Familj
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            form.setValue("goals", form.getValues("goals") + "\n• Säkerställa trygg boendesituation");
                            form.setValue("interventions", form.getValues("interventions") + "\n• Boendestöd");
                          }}
                        >
                          + Boende
                        </Badge>
                      </div>

                      {/* Advanced section (collapsible) */}
                      <div className="border rounded-lg">
                        <button
                          type="button"
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium">Avancerade inställningar</span>
                          {showAdvanced ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        
                        {showAdvanced && (
                          <div className="p-4 border-t space-y-4">
                            <FormField
                              control={form.control}
                              name="journalDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Inskannad i JD</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
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
                                  <FormLabel>Kommentarer</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Ytterligare anteckningar..."
                                      className="min-h-[80px] resize-none"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </form>
                  </Form>
                </div>

                {/* Action bar (sticky) */}
                <div className="border-t bg-gray-50 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {lastSaved ? (
                        <>Senast sparad: {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</>
                      ) : (
                        <>Ej sparad</>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        onClick={form.handleSubmit(handleSubmit)}
                        disabled={createCarePlanMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createCarePlanMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Spara <kbd className="ml-1 text-xs opacity-60">⌘S</kbd>
                      </Button>
                      
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          form.handleSubmit((data) => {
                            handleSubmit(data);
                            form.reset();
                          })();
                        }}
                        disabled={createCarePlanMutation.isPending}
                      >
                        Spara & Ny <kbd className="ml-1 text-xs opacity-60">⌘N</kbd>
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        disabled
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Arkivera
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Radera
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}