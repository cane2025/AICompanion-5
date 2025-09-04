import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { Calendar, CheckSquare, Plus } from "lucide-react";

interface Props {
  clientId: string;
}

function statusChip(status: string) {
  switch (status) {
    case "Väntar":
      return { label: "Väntar", className: "bg-gray-100 text-gray-800" };
    case "Aktiv":
      return { label: "Aktiv", className: "bg-blue-100 text-blue-800" };
    case "Slutförd":
      return { label: "Slutförd", className: "bg-green-100 text-green-800" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-800" };
  }
}

export function V2GfpList({ clientId }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    carePlanIndex: 1,
    status: "Väntar",
    dueDate: "",
    sentDate: "",
    completedDate: "",
    followUps: [
      { key: "Uppföljning1", done: false },
      { key: "Uppföljning2", done: false },
      { key: "Uppföljning3", done: false },
      { key: "Uppföljning4", done: false },
      { key: "Uppföljning5", done: false },
    ],
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/v2/gfps", clientId],
    queryFn: () => api.v2_getGfpsByClient(clientId),
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.v2_createGfp(clientId, {
        carePlanIndex: Number(form.carePlanIndex),
        status: form.status,
        dueDate: form.dueDate || undefined,
        sentDate: form.sentDate || undefined,
        completedDate: form.completedDate || undefined,
        followUps: form.followUps,
      }),
    onSuccess: () => {
      toast({ title: "GFP skapad" });
      qc.invalidateQueries({ queryKey: ["/api/v2/gfps", clientId] });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Fel", description: e?.message ?? "Kunde inte skapa GFP", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; updates: any }) =>
      api.v2_updateGfp(payload.id, payload.updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/v2/gfps", clientId] });
      toast({ title: "Sparat" });
    },
    onError: (e: any) => toast({ title: "Fel", description: e?.message ?? "Kunde inte spara", variant: "destructive" }),
  });

  const sorted = useMemo(() => [...items].sort((a, b) => b.index - a.index), [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">GFP per vårdplan</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Ny GFP">
              <Plus className="mr-2 h-4 w-4" /> Ny GFP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ny Genomförandeplan</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Vårdplan-index</Label>
                <Input type="number" min={1} value={form.carePlanIndex} onChange={(e) => setForm({ ...form, carePlanIndex: Number(e.target.value) })} aria-label="carePlanIndex" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Förfallodatum</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} aria-label="dueDate" />
                </div>
                <div>
                  <Label>Skickad</Label>
                  <Input type="date" value={form.sentDate} onChange={(e) => setForm({ ...form, sentDate: e.target.value })} aria-label="sentDate" />
                </div>
                <div>
                  <Label>Slutförd</Label>
                  <Input type="date" value={form.completedDate} onChange={(e) => setForm({ ...form, completedDate: e.target.value })} aria-label="completedDate" />
                </div>
              </div>

              <div>
                <Label>Uppföljningar</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {form.followUps.map((fu, idx) => (
                    <label key={fu.key} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={fu.done} onCheckedChange={(v) => {
                        const next = [...form.followUps];
                        next[idx] = { ...fu, done: Boolean(v) };
                        setForm({ ...form, followUps: next });
                      }} aria-label={`uppfoljning-${idx+1}`} />
                      {fu.key}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => createMutation.mutate()} aria-label="Spara GFP">Spara</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Laddar...</p>
      ) : (
        <div className="grid gap-3">
          {sorted.map((p) => {
            const chip = statusChip(p.status);
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" /> GFP #{p.index} — VP {p.carePlanIndex}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${chip.className}`}>{chip.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>Förfallo: {p.dueDate || "-"}</div>
                    <div>Skickad: {p.sentDate || "-"}</div>
                    <div>Slutförd: {p.completedDate || "-"}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {p.followUps?.map((fu: any) => (
                      <label key={fu.key} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={!!fu.done} onCheckedChange={(v) => updateMutation.mutate({ id: p.id, updates: { followUps: p.followUps.map((x: any) => x.key === fu.key ? { ...x, done: Boolean(v) } : x) } })} aria-label={`uppfoljning-${fu.key}`} />
                        {fu.key}
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

