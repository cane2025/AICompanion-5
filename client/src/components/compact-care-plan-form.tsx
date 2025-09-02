import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { queryClient } from "@/lib/queryClient";
import * as api from "@/lib/api";
import type { Staff, Client } from "@shared/schema";
import { Archive, Check, Save, Trash2 } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/use-debounce";

interface CompactCarePlanFormProps {
  defaultStaffId?: string | null;
}

type Draft = {
  id?: string;
  staffId: string | "";
  clientInitials: string;
  planNumber: string;
  receivedDate: string;
  journalDate?: string;
  comment?: string;
  goals?: string;
  interventions?: string;
  followUp?: string;
};

const todayStr = () => new Date().toISOString().split("T")[0];

function generatePlanNumber(date: Date = new Date(), seq: number = 1) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const n = String(seq).padStart(3, "0");
  return `VP-${y}-${m}-${n}`;
}

export default function CompactCarePlanForm({ defaultStaffId }: CompactCarePlanFormProps) {
  // Runtime feature flag guard
  if ((window as any).__UI_CAREPLAN_COMPACT__ === 0) return null;

  // Load staff
  const { data: staff = [] } = useQuery<Staff[]>({ queryKey: ["/api/staff"], queryFn: api.getStaff });
  const { data: carePlans = [] } = useQuery<any[]>({ queryKey: ["/api/care-plans"], queryFn: api.getCarePlans });

  // Compute next running number by current month
  const nextSeq = useMemo(() => {
    const now = new Date();
    const prefix = `VP-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-`;
    const nums = (carePlans || [])
      .map((p: any) => (p.planContent || "").match(/VP-\d{4}-\d{2}-(\d{3})/))
      .filter(Boolean)
      .map((m: any) => parseInt(m[1], 10));
    const max = nums.length ? Math.max(...nums) : 0;
    return { prefix, number: max + 1 };
  }, [carePlans]);

  const [openStaff, setOpenStaff] = useState(false);

  const [draft, setDraft] = useState<Draft>({
    staffId: defaultStaffId || "",
    clientInitials: "",
    planNumber: generatePlanNumber(new Date(), nextSeq.number || 1),
    receivedDate: todayStr(),
    journalDate: "",
    comment: "",
    goals: "",
    interventions: "",
    followUp: "",
  });

  // Sync external selected staff into form
  useEffect(() => {
    if (defaultStaffId && defaultStaffId !== draft.staffId) {
      setDraft((d) => ({ ...d, staffId: defaultStaffId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultStaffId]);

  // Update plan number when month sequence known
  useEffect(() => {
    setDraft((d) => ({ ...d, planNumber: generatePlanNumber(new Date(), nextSeq.number || 1) }));
  }, [nextSeq.number]);

  // MRU order
  const mruIds = useMemo<string[]>(() => {
    try {
      const raw = localStorage.getItem("mruStaffIds");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const sortedStaff = useMemo(() => {
    const base = [...(staff ?? [])].sort((a, b) => (a.name || "").localeCompare(b.name || "", "sv"));
    if (!mruIds.length) return base;
    const set = new Set(mruIds);
    return [...base.filter((s) => set.has(s.id)), ...base.filter((s) => !set.has(s.id))];
  }, [staff, mruIds]);

  // Suggestions for clients based on selected staff
  const { data: suggestedClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", draft.staffId],
    queryFn: () => (draft.staffId ? api.getClientsByStaff(draft.staffId) : Promise.resolve([] as Client[])),
    enabled: !!draft.staffId,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.createCarePlan(payload),
    onSuccess: (plan) => {
      setDraft((d) => ({ ...d, id: plan.id }));
      setLastSavedAt(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => api.updateCarePlan(id, updates),
    onSuccess: () => setLastSavedAt(new Date()),
  });

  function persistMRU(id: string) {
    try {
      const next = [id, ...mruIds.filter((x) => x !== id)].slice(0, 6);
      localStorage.setItem("mruStaffIds", JSON.stringify(next));
    } catch {}
  }

  function normalizeInitials(value: string) {
    return value
      .replace(/[^a-zA-Z.\s-]/g, "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/([A-Z])(?=[A-Z])/g, "$1.")
      .replace(/\.\.+/g, ".");
  }

  async function ensureClient(): Promise<string> {
    // Return clientId (create if needed)
    if (!draft.staffId || !draft.clientInitials) throw new Error("missing");
    const list = await api.getClientsByStaff(draft.staffId);
    const found = list.find((c) => c.initials === draft.clientInitials);
    if (found) return found.id;
    const created = await api.createClient({
      initials: draft.clientInitials,
      staffId: draft.staffId,
      personalNumber: "",
      notes: `Vårdplan ${draft.planNumber}`,
      status: "active",
    } as any);
    return created.id;
  }

  function saveNow(after?: () => void) {
    if (!draft.staffId || !draft.planNumber || !draft.receivedDate) return;
    setIsSaving(true);
    setLastSavedAt(new Date()); // optimistic

    const doCreate = async () => {
      const clientId = await ensureClient();
      const payload = {
        clientId,
        staffId: draft.staffId,
        responsibleId: draft.staffId,
        receivedDate: draft.receivedDate,
        enteredJournalDate: draft.journalDate || null,
        staffNotifiedDate: todayStr(),
        planContent: draft.goals || `Vårdplan ${draft.planNumber}`,
        goals: draft.goals || "",
        interventions: draft.interventions || "",
        status: "staff_notified",
        comment: draft.comment || "",
      } as any;
      await createMutation.mutateAsync(payload);
    };

    const doUpdate = async () => {
      if (!draft.id) return;
      const updates = {
        receivedDate: draft.receivedDate,
        enteredJournalDate: draft.journalDate || null,
        planContent: draft.goals || `Vårdplan ${draft.planNumber}`,
        goals: draft.goals || "",
        interventions: draft.interventions || "",
        comment: draft.comment || "",
      } as any;
      await updateMutation.mutateAsync({ id: draft.id, updates });
    };

    (draft.id ? doUpdate() : doCreate())
      .catch(() => {})
      .finally(() => {
        setIsSaving(false);
        after?.();
      });
  }

  // Debounced autosave 800ms
  const autosave = useDebouncedCallback(() => {
    if (draft.staffId && draft.clientInitials && draft.planNumber) {
      saveNow();
    }
  }, 800, [draft]);

  useEffect(() => {
    autosave();
  }, [draft, autosave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "s") {
        e.preventDefault();
        saveNow();
      }
      if ((e.metaKey || e.ctrlKey) && k === "n") {
        e.preventDefault();
        saveNow(() => resetForm());
      }
      if ((e.metaKey || e.ctrlKey) && k === "d") {
        e.preventDefault();
        duplicateLast();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function resetForm() {
    setDraft({
      staffId: defaultStaffId || "",
      clientInitials: "",
      planNumber: generatePlanNumber(new Date(), nextSeq.number || 1),
      receivedDate: todayStr(),
      journalDate: "",
      comment: "",
      goals: "",
      interventions: "",
      followUp: "",
    });
  }

  function duplicateLast() {
    setDraft((d) => ({
      ...d,
      id: undefined,
      planNumber: generatePlanNumber(new Date(), nextSeq.number || 1),
      receivedDate: todayStr(),
    }));
  }

  const planNumberRef = useRef<HTMLInputElement | null>(null);

  // Quick templates
  const applyTemplate = (key: "Hälsa" | "Skola" | "Familj") => {
    const templates: Record<string, { goals: string; interventions: string; followUp: string }> = {
      Hälsa: {
        goals: "Förbättrad fysisk och psykisk hälsa",
        interventions: "Veckovisa samtal, aktivitetsplan, vårdkontakter",
        followUp: "Uppföljning var 4:e vecka med hälsosamtal",
      },
      Skola: {
        goals: "Ökad skolnärvaro och studiero",
        interventions: "Kontakt med mentor, läxstöd, daglig struktur",
        followUp: "Uppföljning varannan vecka med skolrapport",
      },
      Familj: {
        goals: "Stärkt familjerelation och kommunikation",
        interventions: "Familjesamtal, gemensamma aktiviteter, föräldrasamverkan",
        followUp: "Uppföljning var 3:e vecka med familjesamtal",
      },
    };
    const t = templates[key];
    setDraft((d) => ({ ...d, goals: t.goals, interventions: t.interventions, followUp: t.followUp }));
  };

  return (
    <div className="space-y-4">
      {/* Sticky Action Bar */}
      <div className="sticky top-16 z-20 bg-white/90 backdrop-blur border-b p-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {isSaving ? "Sparar..." : lastSavedAt ? `Senast sparad: ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Inte sparad än"}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => saveNow()} className="bg-blue-600 hover:bg-blue-700"><Save className="h-4 w-4 mr-1"/>Spara</Button>
          <Button variant="outline" onClick={() => saveNow(() => resetForm())}>Spara & Ny</Button>
          <Button variant="outline"><Archive className="h-4 w-4 mr-1"/>Arkivera</Button>
          <Button variant="destructive"><Trash2 className="h-4 w-4 mr-1"/>Radera</Button>
        </div>
      </div>

      {/* Top compact row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Behandlare */}
        <div>
          <label className="text-sm font-medium">Behandlare</label>
          <Popover open={openStaff} onOpenChange={setOpenStaff}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {draft.staffId ? (sortedStaff.find((s) => s.id === draft.staffId)?.name || "Välj behandlare") : "Välj behandlare"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[320px]">
              <Command>
                <CommandInput placeholder="Sök personal…" />
                <CommandList>
                  <CommandEmpty>Ingen personal</CommandEmpty>
                  <CommandGroup heading="Personal">
                    {sortedStaff.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={s.name}
                        onSelect={() => {
                          setDraft((d) => ({ ...d, staffId: s.id }));
                          persistMRU(s.id);
                          setOpenStaff(false);
                        }}
                      >
                        <div className="mr-2 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">{s.initials}</div>
                        <div className="flex-1">
                          <div className="text-sm">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.roll || ""}</div>
                        </div>
                        {draft.staffId === s.id && <Check className="h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Vårdplansnummer */}
        <div>
          <label className="text-sm font-medium">Vårdplansnummer</label>
          <Input
            ref={planNumberRef}
            value={draft.planNumber}
            onChange={(e) => setDraft((d) => ({ ...d, planNumber: e.target.value }))}
          />
        </div>

        {/* Klient initialer */}
        <div>
          <label className="text-sm font-medium">Klient initialer</label>
          <Input
            value={draft.clientInitials}
            onChange={(e) => setDraft((d) => ({ ...d, clientInitials: normalizeInitials(e.target.value) }))}
            placeholder="t.ex. A.B."
          />
          {suggestedClients.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {suggestedClients.slice(0, 4).map((c) => (
                <Button key={c.id} size="sm" variant="secondary" onClick={() => setDraft((d) => ({ ...d, clientInitials: c.initials }))}>
                  {c.initials}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Datum */}
        <div>
          <label className="text-sm font-medium">Mottagningsdatum</label>
          <Input
            type="date"
            max={todayStr()}
            value={draft.receivedDate}
            onChange={(e) => setDraft((d) => ({ ...d, receivedDate: e.target.value }))}
          />
        </div>
      </div>

      {/* Quick templates */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Snabbmallar:</span>
        <Button variant="outline" size="sm" onClick={() => applyTemplate("Hälsa")}>Hälsa</Button>
        <Button variant="outline" size="sm" onClick={() => applyTemplate("Skola")}>Skola</Button>
        <Button variant="outline" size="sm" onClick={() => applyTemplate("Familj")}>Familj</Button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <label className="text-sm font-medium">Mål</label>
          <Textarea
            rows={3}
            value={draft.goals}
            onChange={(e) => setDraft((d) => ({ ...d, goals: e.target.value }))}
            placeholder="Beskriv vårdplanens mål"
          />
        </div>
        <div className="col-span-3">
          <label className="text-sm font-medium">Åtgärder</label>
          <Textarea
            rows={3}
            value={draft.interventions}
            onChange={(e) => setDraft((d) => ({ ...d, interventions: e.target.value }))}
            placeholder="Planerade åtgärder"
          />
        </div>
        <div className="col-span-3">
          <label className="text-sm font-medium">Uppföljning</label>
          <Textarea
            rows={2}
            value={draft.followUp}
            onChange={(e) => setDraft((d) => ({ ...d, followUp: e.target.value }))}
            placeholder="När och hur sker uppföljning"
          />
        </div>
      </div>

      {/* Advanced */}
      <details className="mt-2 border rounded">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Avancerade inställningar</summary>
        <div className="p-3 grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Inskannad i JD</label>
            <Input
              type="date"
              value={draft.journalDate}
              onChange={(e) => setDraft((d) => ({ ...d, journalDate: e.target.value }))}
            />
          </div>
          <div className="col-span-3">
            <label className="text-sm font-medium">Kommentarer</label>
            <Textarea
              rows={3}
              value={draft.comment}
              onChange={(e) => setDraft((d) => ({ ...d, comment: e.target.value }))}
              placeholder="Ytterligare kommentarer"
            />
          </div>
        </div>
      </details>
    </div>
  );
}

