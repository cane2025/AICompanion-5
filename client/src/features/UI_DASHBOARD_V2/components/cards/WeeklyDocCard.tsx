import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  filterKey: string;
  weeklyDocs: any[];
  staff: any[];
}

export function WeeklyDocCard({ filterKey, weeklyDocs, staff }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const staffById = useMemo(() => {
    const m = new Map<string, any>();
    (staff ?? []).forEach((s: any) => m.set(s.id, s));
    return m;
  }, [staff]);

  const filtered = useMemo(() => {
    const now = new Date();
    const isoWeek = getISOWeek(now);
    const year = now.getUTCFullYear();

    const missing = (w: any) => {
      if (w.week !== isoWeek || w.year !== year) return false;
      const documented = [
        w.mondayDocumented,
        w.tuesdayDocumented,
        w.wednesdayDocumented,
        w.thursdayDocumented,
        w.fridayDocumented,
        w.saturdayDocumented,
        w.sundayDocumented,
      ].some(Boolean);
      return !documented;
    };

    let rows = weeklyDocs
      .filter((w: any) => missing(w))
      .map((w: any) => ({
        id: w.id,
        clientId: w.clientId,
        staff: staffById.get(w.staffId)?.name || "",
        lastUpdated: w.updatedAt,
        missingDays: [
          w.mondayDocumented ? null : "mån",
          w.tuesdayDocumented ? null : "tis",
          w.wednesdayDocumented ? null : "ons",
          w.thursdayDocumented ? null : "tor",
          w.fridayDocumented ? null : "fre",
          w.saturdayDocumented ? null : "lör",
          w.sundayDocumented ? null : "sön",
        ].filter(Boolean) as string[],
      }));

    if (filterKey === "recent_created" || filterKey === "recent_updated") rows.sort((a, b) => (b.lastUpdated || "").localeCompare(a.lastUpdated || ""));
    return rows;
  }, [filterKey, weeklyDocs, staffById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  return (
    <Card className="shadow-sm min-h-[220px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Veckodokumentation</CardTitle>
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
                  <span className="text-sm text-muted-foreground">Ansvarig: {r.staff}</span>
                  <span className="text-xs text-muted-foreground">Saknas {r.missingDays.join(", ")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">Saknas</Badge>
                  <Button size="sm" className="bg-blue-600 text-white">Dokumentera</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

