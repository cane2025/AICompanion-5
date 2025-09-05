import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  filterKey: string;
  carePlans: any[];
  staffById: Map<string, any>;
}

export function CarePlansCard({ filterKey, carePlans, staffById }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const mapStatus = (s: string) => s === "completed" ? "completed" : s === "in_progress" ? "active" : "waiting";
    let rows = carePlans.map((p: any, idx: number) => ({
      id: p.id,
      clientId: p.clientId,
      index: idx + 1,
      status: mapStatus(p.status),
      lastUpdated: p.updatedAt,
      staff: staffById.get(p.staffId)?.name || "",
    }));
    if (filterKey === "requires") rows = rows.filter((r) => r.status !== "completed");
    if (filterKey === "waiting") rows = rows.filter((r) => r.status === "waiting");
    if (filterKey === "overdue") rows = rows.filter(() => false); // care plans have no overdue flag in schema
    if (filterKey === "recent_created" || filterKey === "recent_updated") {
      rows.sort((a, b) => (b.lastUpdated || "").localeCompare(a.lastUpdated || ""));
    }
    return rows;
  }, [filterKey, carePlans, staffById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  return (
    <Card className="shadow-sm min-h-[220px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vårdplaner</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))}>
              Föregående
            </Button>
            <span className="text-xs text-muted-foreground">
              Sida {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))}>
              Nästa
            </Button>
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
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip status={r.status as "waiting" | "active" | "overdue" | "completed"} />
                  <Button size="sm" className="bg-blue-600 text-white">Granska</Button>
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

