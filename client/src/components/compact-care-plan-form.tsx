import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, Save, Trash2, Copy, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Staff, Client } from "@shared/schema";
import * as api from "@/lib/api";

type FormValues = {
  staffId: string;
  planNumber: string;
  clientInitials: string;
  receivedDate: string;
  goals: string;
  interventions: string;
  followup: string;
  journalDate?: string;
  comment?: string;
};

const schema = z.object({
  staffId: z.string().min(1),
  planNumber: z.string().min(1),
  clientInitials: z
    .string()
    .min(1)
    .transform((s) => s.replace(/\s+/g, "").toUpperCase()),
  receivedDate: z.string().min(1),
  goals: z.string().optional().default(""),
  interventions: z.string().optional().default(""),
  followup: z.string().optional().default(""),
  journalDate: z.string().optional(),
  comment: z.string().optional(),
});

function formatPlanNumber(date: Date, next: number) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const seq = String(next).padStart(3, "0");
  return `VP-${year}-${month}-${seq}`;
}

export function CompactCarePlanForm({
  defaultStaffId,
  onSaved,
}: {
  defaultStaffId?: string;
  onSaved?: () => void;
}) {
  const { toast } = useToast();

  const { data: staff = [] } = useQuery<Staff[]>({ queryKey: ["/api/staff"], queryFn: api.getStaff });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"], queryFn: api.getClients });

  const [openStaff, setOpenStaff] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Compute default plan number for current month from existing care plans
  const { data: allCarePlans = [] } = useQuery<any[]>({
    queryKey: ["/api/care-plans"],
    queryFn: api.getCarePlans,
  });

  const now = React.useMemo(() => new Date(), []);
  const nextSeq = React.useMemo(() => {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `VP-${year}-${month}-`;
    const nums = allCarePlans
      .map((p) => (p.planContent as string) || "")
      .map((s) => (s.match(/VP-\d{4}-\d{2}-(\d{3})/)?.[1] ? Number(RegExp.$1) : 0))
      .filter((n) => !Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return max + 1;
  }, [allCarePlans, now]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      staffId: defaultStaffId || "",
      planNumber: formatPlanNumber(now, nextSeq),
      clientInitials: "",
      receivedDate: new Date().toISOString().split("T")[0],
      goals: "",
      interventions: "",
      followup: "",
      journalDate: "",
      comment: "",
    },
    mode: "onBlur",
  });

  // Autosave 800ms after changes
  const autosave = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerAutosave = () => {
    if (autosave.current) clearTimeout(autosave.current);
    autosave.current = setTimeout(() => handleSave(true), 800);
  };

  React.useEffect(() => {
    const sub = form.watch(() => triggerAutosave());
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (e.key === "s") {
        e.preventDefault();
        handleSave(false);
      }
      if (e.key === "n") {
        e.preventDefault();
        handleSave(false, { reset: true });
      }
      if (e.key === "d") {
        e.preventDefault();
        duplicateLatest();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Ensure client exists/created for staff
      let client = clients.find((c) => c.initials === values.clientInitials);
      if (!client) {
        client = await api.createClient({
          initials: values.clientInitials,
          staffId: values.staffId,
          personalNumber: "",
          notes: "",
          status: "active",
        } as any);
      }

      const plan = await api.createCarePlan({
        clientId: client.id,
        staffId: values.staffId,
        receivedDate: values.receivedDate,
        enteredJournalDate: values.journalDate || null,
        staffNotifiedDate: new Date().toISOString().split("T")[0],
        planContent: `Vårdplan ${values.planNumber}`,
        goals: values.goals || "",
        interventions: values.interventions || "",
        status: "staff_notified",
        comment: values.comment || "",
      });
      return plan;
    },
    onSuccess: () => {
      const t = new Date();
      setLastSavedAt(`${t.getHours().toString().padStart(2, "0")}:${t
        .getMinutes()
        .toString()
        .padStart(2, "0")}`);
      toast({ title: "Sparad", description: "Vårdplan sparad" });
      onSaved?.();
    },
  });

  async function handleSave(silent = false, opts?: { reset?: boolean }) {
    const values = form.getValues();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      // No loud validation, just stop and gently indicate
      if (!silent) toast({ title: "Komplettera fält", description: "Fyll i obligatoriska fält." });
      return;
    }
    try {
      setIsSaving(true);
      await createMutation.mutateAsync(parsed.data);
      if (opts?.reset) {
        form.reset({
          ...parsed.data,
          planNumber: formatPlanNumber(new Date(), nextSeq + 1),
          clientInitials: "",
          goals: "",
          interventions: "",
          followup: "",
          comment: "",
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  function duplicateLatest() {
    const v = form.getValues();
    form.reset({ ...v, planNumber: formatPlanNumber(new Date(), nextSeq + 1) });
    toast({ title: "Duplicerad", description: "Fält kopierade – uppdatera vid behov." });
  }

  const selectedStaff = staff.find((s) => s.id === form.watch("staffId"));
  const suggestedClients = React.useMemo(() => {
    if (!selectedStaff) return [] as Client[];
    return clients
      .filter((c) => c.staffId === selectedStaff.id)
      .slice(0, 8);
  }, [clients, selectedStaff]);

  return (
    <div className="space-y-3">
      {/* Top compact row */}
      <div className="grid grid-cols-4 gap-3 items-end">
        {/* Staff combobox */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Behandlare</label>
          <Popover open={openStaff} onOpenChange={setOpenStaff}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="truncate">
                  {selectedStaff ? `${selectedStaff.name} - ${selectedStaff.roll || "Personal"}` : "Välj behandlare"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[420px]">
              <Command>
                <CommandInput placeholder="Sök för- eller efternamn..." />
                <CommandEmpty>Ingen personal hittad.</CommandEmpty>
                <CommandGroup>
                  {staff
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name, "sv"))
                    .map((s) => (
                      <CommandItem
                        key={s.id}
                        onSelect={() => {
                          form.setValue("staffId", s.id, { shouldDirty: true, shouldTouch: true });
                          setOpenStaff(false);
                        }}
                        value={s.name}
                      >
                        <Check className={`mr-2 h-4 w-4 ${form.watch("staffId") === s.id ? "opacity-100" : "opacity-0"}`} />
                        <span className="truncate">{s.name} - {s.roll || "Personal"}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Vårdplansnummer</label>
          <Input {...form.register("planNumber")} onBlur={() => form.trigger("planNumber")} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Klientinitialer</label>
          <Input
            {...form.register("clientInitials")}
            onBlur={() => form.trigger("clientInitials")}
            placeholder="t.ex. A.B."
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Mottagningsdatum</label>
          <Input type="date" max={new Date().toISOString().split("T")[0]} {...form.register("receivedDate")} />
        </div>
      </div>

      {/* Suggestions */}
      {selectedStaff && suggestedClients.length > 0 && (
        <div className="text-xs text-muted-foreground">Föreslagna klienter: {suggestedClients.map((c) => c.initials).join(", ")}</div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="col-span-3">
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <label className="text-xs font-medium">Mål</label>
                <Textarea rows={3} {...form.register("goals")} placeholder="Beskriv vårdplanens mål" />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-medium">Åtgärder</label>
                <Textarea rows={3} {...form.register("interventions")} placeholder="Planerade åtgärder" />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-medium">Uppföljning</label>
                <Textarea rows={2} {...form.register("followup")} placeholder="När och hur uppföljning sker" />
              </div>
            </div>

            {/* Advanced collapsed */}
            <details className="mt-2">
              <summary className="text-sm cursor-pointer select-none">Avancerade inställningar</summary>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium">Kommentar</label>
                  <Textarea rows={2} {...form.register("comment")} placeholder="Valfritt" />
                </div>
                <div>
                  <label className="text-xs font-medium">Inskannad i JD (valfritt)</label>
                  <Input type="date" {...form.register("journalDate")} />
                </div>
              </div>
            </details>

            {/* Sticky action bar */}
            <div className="sticky bottom-0 bg-white border-t pt-2 flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {isSaving ? "Sparar..." : lastSavedAt ? `Senast sparad: ${lastSavedAt}` : ""}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSave(false)} className="bg-blue-600 text-white">
                  <Save className="h-4 w-4 mr-1" /> Spara
                </Button>
                <Button variant="secondary" onClick={() => handleSave(false, { reset: true })}>
                  <PlusCircle className="h-4 w-4 mr-1" /> Spara & Ny
                </Button>
                <Button variant="outline" onClick={duplicateLatest}>
                  <Copy className="h-4 w-4 mr-1" /> Duplicera
                </Button>
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-1" /> Radera
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

