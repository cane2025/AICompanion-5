import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  filterKey: string;
  visma: any[];
  staff: any[];
}

export function VismaTimeCard({ filterKey, visma, staff }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const staffById = useMemo(() => {
    const m = new Map<string, any>();
    (staff ?? []).forEach((s: any) => m.set(s.id, s));
    return m;
  }, [staff]);

  const currentMonth = new Date().toLocaleString("sv-SE", { month: "short", year: "numeric" });

  const rows = useMemo(() => {
    // We consider notReportedThisMonth at staff level by aggregating entries
    const byStaff = new Map<string, any[]>();
    (visma ?? []).forEach((v) => {
      const list = byStaff.get(v.staffId) ?? [];
      list.push(v);
      byStaff.set(v.staffId, list);
    });
    const arr = Array.from(byStaff.entries()).map(([staffId, list]) => ({
      staff: staffById.get(staffId)?.name || "",
      totalHours: list.reduce((a, x) => a + (x.totalHours ?? 0), 0),
      reportedThisMonth: list.length > 0,
    }));
    let filtered = arr.filter((r) => !r.reportedThisMonth);
    if (filterKey === "all") filtered = arr;
    return filtered;
  }, [visma, staffById, filterKey]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <Card className="shadow-sm min-h-[220px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Visma tid</CardTitle>
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
            {pageRows.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{r.staff}</span>
                  <span className="text-xs text-muted-foreground">{currentMonth}</span>
                  <span className="text-xs text-muted-foreground">0 / 160 h</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">Ej rapporterad</Badge>
                  <Button size="sm" className="bg-blue-600 text-white">Rapportera</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

