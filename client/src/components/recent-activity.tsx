import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Calendar } from "lucide-react";
import type { CarePlan, WeeklyDocumentation, MonthlyReport } from "@shared/schema";

type ActivityItem = {
  label: string;
  type: "care" | "weekly" | "monthly";
  date: Date;
  href?: string;
};

export function RecentActivity() {
  const { data: care = [] } = useQuery<CarePlan[]>({ queryKey: ["/api/care-plans/all"] });
  const { data: weekly = [] } = useQuery<WeeklyDocumentation[]>({ queryKey: ["/api/weekly-documentation/all"] });
  const { data: monthly = [] } = useQuery<MonthlyReport[]>({ queryKey: ["/api/monthly-reports/all"] });

  const items = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];
    for (const cp of care) {
      const d = cp.updatedAt ? new Date(cp.updatedAt as any) : new Date();
      list.push({ label: `${cp.clientId} – Vårdplan`, type: "care", date: d });
    }
    for (const wd of weekly) {
      const d = wd.updatedAt ? new Date(wd.updatedAt as any) : new Date();
      list.push({ label: `${wd.clientId} – Veckodok`, type: "weekly", date: d });
    }
    for (const mr of monthly) {
      const d = mr.updatedAt ? new Date(mr.updatedAt as any) : new Date();
      list.push({ label: `${mr.clientId} – Månadsrapport`, type: "monthly", date: d });
    }
    return list
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [care, weekly, monthly]);

  const formatRel = (d: Date) => {
    const diff = Date.now() - d.getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins} min sedan`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h sedan`;
    const days = Math.round(hrs / 24);
    return days === 1 ? "igår" : `${days} dagar sedan`;
  };

  return (
    <Card className="border-ungdoms-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-ungdoms-800">
          <Clock className="h-5 w-5" /> Senast arbetat med
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {it.type === "care" && <FileText className="h-4 w-4 text-blue-600" />} 
                {it.type === "weekly" && <FileText className="h-4 w-4 text-orange-600" />} 
                {it.type === "monthly" && <Calendar className="h-4 w-4 text-green-600" />} 
                <span>{it.label}</span>
              </div>
              <span className="text-muted-foreground">{formatRel(it.date)}</span>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-muted-foreground">Inga aktiviteter ännu</li>}
        </ul>
        <div className="mt-4">
          <Button variant="outline" className="w-full">Visa alla →</Button>
        </div>
      </CardContent>
    </Card>
  );
}

