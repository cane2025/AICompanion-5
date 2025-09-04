import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { Calendar, FileText, Plus } from "lucide-react";

interface Props {
  clientId: string;
  clientInitials: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "Mottagen":
      return "secondary" as const;
    case "Aktiv":
      return "default" as const;
    case "Avslutad":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

export function V2CarePlanList({ clientId, clientInitials }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    receivedDate: new Date().toISOString().slice(0, 10),
    enteredToJournalDate: "",
    status: "Mottagen",
    assignedStaffId: "",
    content: "",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/v2/care-plans", clientId],
    queryFn: () => api.v2_getCarePlansByClient(clientId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        receivedDate: form.receivedDate,
        status: form.status,
      };
      if (form.enteredToJournalDate) payload.enteredToJournalDate = form.enteredToJournalDate;
      if (form.assignedStaffId) payload.assignedStaffId = form.assignedStaffId;
      if (form.content) payload.content = form.content;
      return api.v2_createCarePlan(clientId, payload);
    },
    onSuccess: ({ autoGfp }) => {
      toast({ title: "Vårdplan skapad", description: `GFP skapad automatiskt (index ${autoGfp?.index ?? "?"}).` });
      qc.invalidateQueries({ queryKey: ["/api/v2/care-plans", clientId] });
      qc.invalidateQueries({ queryKey: ["/api/v2/gfps", clientId] });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Fel", description: e?.message ?? "Kunde inte skapa vårdplan", variant: "destructive" }),
  });

  const sorted = useMemo(() => [...items].sort((a, b) => a.index - b.index), [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Vårdplaner för {clientInitials}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Ny vårdplan">
              <Plus className="mr-2 h-4 w-4" /> Ny vårdplan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ny vårdplan</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Datum mottagen</Label>
                <Input aria-label="receivedDate" type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} />
              </div>
              <div>
                <Label>Inskriven i journal</Label>
                <Input aria-label="enteredToJournalDate" type="date" value={form.enteredToJournalDate} onChange={(e) => setForm({ ...form, enteredToJournalDate: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger aria-label="status">
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
                <Label>Ansvarig (valfritt)</Label>
                <Input aria-label="assignedStaffId" placeholder="staff-id" value={form.assignedStaffId} onChange={(e) => setForm({ ...form, assignedStaffId: e.target.value })} />
              </div>
              <div>
                <Label>Innehåll (valfritt)</Label>
                <Input aria-label="content" placeholder="Text" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => createMutation.mutate()} aria-label="Spara vårdplan">Spara</Button>
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
            const variant = statusVariant(p.status);
            return (
              <Card key={p.id} className="hover:shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> #{p.index} — {clientInitials}
                    </span>
                    <Badge variant={variant}>{p.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Calendar className="h-4 w-4" /> Mottagen: {p.receivedDate}
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

