import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  filterKey: string;
  gfps: any[];
  staffById: Map<string, any>;
}

export function GfpCard({ filterKey, gfps, staffById }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const now = new Date();
    const mapStatus = (g: any) => {
      if (g.status === "completed") return "completed";
      if (g.status === "in_progress") return "active";
      const overdue = g.dueDate ? new Date(g.dueDate) < now : false;
      return overdue ? "overdue" : "waiting";
    };

    let rows = gfps.map((g: any, idx: number) => ({
      id: g.id,
      clientId: g.clientId,
      index: idx + 1,
      status: mapStatus(g),
      dueDate: g.dueDate as string | undefined,
      lastUpdated: g.updatedAt,
      staff: staffById.get(g.staffId)?.name || "",
    }));

    // Only requires action by default
    if (filterKey === "requires") rows = rows.filter((r) => r.status !== "completed");
    if (filterKey === "waiting") rows = rows.filter((r) => r.status === "waiting");
    if (filterKey === "overdue") rows = rows.filter((r) => r.status === "overdue");
    if (filterKey === "recent_created" || filterKey === "recent_updated") rows.sort((a, b) => (b.lastUpdated || "").localeCompare(a.lastUpdated || ""));

    return rows;
  }, [filterKey, gfps, staffById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const primaryLabel = (s: string) => (s === "waiting" ? "Granska" : s === "active" ? "Uppdatera" : s === "overdue" ? "Åtgärda" : "Öppna");

  return (
    <Card className="shadow-sm min-h-[220px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>GFP – kräver åtgärd ({filtered.length} av {gfps.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))}>Föregående</Button>
            <span className="text-xs text-muted-foreground">Sida {page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))}>Nästa</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pageRows.length === 0 ? (
          <div className="text-sm text-muted-foreground">Allt i fas 👍</div>
        ) : (
          <div className="space-y-2">
            {pageRows.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.index}</span>
                  <span className="text-sm text-muted-foreground">Ansvarig: {r.staff}</span>
                  {r.dueDate && (
                    <span className="text-xs text-muted-foreground">Deadline: {new Date(r.dueDate).toLocaleDateString("sv-SE")}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip status={r.status as any} />
                  <Button size="sm" className="bg-blue-600 text-white">{primaryLabel(r.status)}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }: { status: "waiting" | "active" | "overdue" | "completed" }) {
  const cls =
    status === "waiting"
      ? "bg-gray-100 text-gray-700"
      : status === "active"
      ? "bg-blue-100 text-blue-700"
      : status === "overdue"
      ? "bg-red-100 text-red-700"
      : "bg-green-100 text-green-700";
  const label = status === "waiting" ? "Väntar" : status === "active" ? "Aktiv" : status === "overdue" ? "Försenad" : "Slutförd";
  return <Badge className={cls}>{label}</Badge>;
}

