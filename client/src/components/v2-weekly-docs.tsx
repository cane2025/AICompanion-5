import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { FileText, Filter, Download } from "lucide-react";

interface Props {
  clientId: string;
  year?: number;
}

const dayOrder = ["mon","tue","wed","thu","fri","sat","sun"] as const;
const dayLabel: Record<any, string> = { mon: "Mån", tue: "Tis", wed: "Ons", thu: "Tors", fri: "Fre", sat: "Lör", sun: "Sön" };

function chip(doc?: any) {
  if (!doc) return { label: "Saknas", className: "bg-red-100 text-red-800" };
  if (doc.delayed) return { label: "Försenad", className: "bg-red-100 text-red-800" };
  if (doc.qualityApproved) return { label: "Kvalitet godkänd", className: "bg-green-100 text-green-800" };
  if (doc.documented) return { label: "Dokumenterad", className: "bg-green-50 text-green-700" };
  return { label: "Saknas", className: "bg-red-100 text-red-800" };
}

function toCSV(rows: any[]): string {
  const headers = ["clientId","year","week","day","documented","qualityApproved","onTime","delayed","comment","authorStaffId","timestamp"];
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  return lines.join("\n");
}

export function V2WeeklyDocs({ clientId, year }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const y = year || new Date().getFullYear();
  const [filters, setFilters] = useState({ onlyDelayed: false, onlyNotApproved: false });
  const [selected, setSelected] = useState<{ week?: number; open: boolean }>({ open: false });
  const [edit, setEdit] = useState<any>({});

  const { data: weeks = [] } = useQuery({
    queryKey: ["/api/v2/weekly-docs", clientId, y],
    queryFn: () => api.v2_getWeeklyDocsByClientYear(clientId, y),
  });

  const upsert = useMutation({
    mutationFn: (payload: { week: number; data: any }) => api.v2_upsertWeeklyDoc(clientId, y, payload.week, payload.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/v2/weekly-docs", clientId, y] });
      toast({ title: "Sparat" });
      setSelected({ open: false });
    },
    onError: (e: any) => toast({ title: "Fel", description: e?.message ?? "Kunde inte spara", variant: "destructive" }),
  });

  const allWeeks = useMemo(() => {
    const set = new Set<number>(weeks.map((w: any) => w.week));
    // show from 34 to 52 per requirement example
    for (let w = 34; w <= 52; w++) set.add(w);
    return Array.from(set.values()).sort((a, b) => a - b);
  }, [weeks]);

  const filtered = useMemo(() => {
    return weeks.filter((w: any) => {
      if (filters.onlyDelayed && !w.delayed) return false;
      if (filters.onlyNotApproved && w.qualityApproved) return false;
      return true;
    });
  }, [weeks, filters]);

  const exportCSV = () => {
    const rows: any[] = [];
    for (const w of weeks) {
      for (const k of dayOrder) {
        const d = w.days?.[k];
        if (!d) continue;
        rows.push({ clientId, year: w.year, week: w.week, day: k, ...d });
      }
    }
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weekly_docs_${clientId}_${y}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Veckodokumentation {y}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFilters({ ...filters, onlyDelayed: !filters.onlyDelayed })} aria-label="visa endast försenade">
            <Filter className="h-4 w-4 mr-2" /> Försenade {filters.onlyDelayed ? "✓" : ""}
          </Button>
          <Button variant="outline" onClick={() => setFilters({ ...filters, onlyNotApproved: !filters.onlyNotApproved })} aria-label="visa ej godkända">
            <Filter className="h-4 w-4 mr-2" /> Ej godkända {filters.onlyNotApproved ? "✓" : ""}
          </Button>
          <Button variant="outline" onClick={exportCSV} aria-label="exportera CSV">
            <Download className="h-4 w-4 mr-2" /> Exportera CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allWeeks.map((w) => {
          const doc = weeks.find((x: any) => x.week === w);
          const c = chip(doc);
          return (
            <Card key={w} className="cursor-pointer" onClick={() => { setSelected({ week: w, open: true }); setEdit(doc || { days: {} }); }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vecka {w}</span>
                  <Badge className={c.className}>{c.label}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {doc ? (
                    <span>
                      {doc.documented ? "Dokumenterad" : "Saknas"} • {doc.qualityApproved ? "Godkänd" : "Ej godkänd"} • {doc.delayed ? "Försenad" : "I tid"}
                    </span>
                  ) : (
                    <span>Ingen data</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected.open} onOpenChange={(o) => setSelected({ week: selected.week, open: o })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vecka {selected.week}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayOrder.map((k) => {
                const d = edit?.days?.[k] || { documented: false, qualityApproved: false, delayed: false, onTime: true };
                return (
                  <Card key={k}>
                    <CardHeader>
                      <CardTitle className="text-sm">{dayLabel[k]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={!!d.documented} onCheckedChange={(v) => setEdit((prev: any) => ({ ...prev, days: { ...prev.days, [k]: { ...d, documented: Boolean(v) } } }))} aria-label={`${k}-documented`} /> Dokumenterad
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={!!d.qualityApproved} onCheckedChange={(v) => setEdit((prev: any) => ({ ...prev, days: { ...prev.days, [k]: { ...d, qualityApproved: Boolean(v) } } }))} aria-label={`${k}-approved`} /> Kvalitet godkänd
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={!!d.delayed} onCheckedChange={(v) => setEdit((prev: any) => ({ ...prev, days: { ...prev.days, [k]: { ...d, delayed: Boolean(v) } } }))} aria-label={`${k}-delayed`} /> Försenad
                        </label>
                        <Textarea placeholder="Kommentar" value={d.comment || ""} onChange={(e) => setEdit((prev: any) => ({ ...prev, days: { ...prev.days, [k]: { ...d, comment: e.target.value } } }))} aria-label={`${k}-comment`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div>
              <label className="text-sm block mb-1">Veckokommentar</label>
              <Input placeholder="Kommentar" value={edit?.comments || ""} onChange={(e) => setEdit((prev: any) => ({ ...prev, comments: e.target.value }))} aria-label="veckokommentar" />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => upsert.mutate({ week: selected.week!, data: edit })} aria-label="Spara">Spara</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

