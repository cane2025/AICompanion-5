import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type {
  CarePlan,
  WeeklyDocumentation,
  MonthlyReport,
  Client,
} from "@shared/schema";

type ActivityItem = {
  id: string;
  kind: "Vårdplan" | "Veckodok" | "Månadsrapport";
  clientId: string;
  updatedAt: string;
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} min sedan`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "igår";
  if (days < 7) return `${days} dagar sedan`;
  return date.toLocaleDateString("sv-SE", { weekday: "long" });
}

export function RecentActivity() {
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans/all"],
  });
  const { data: weeklyDocs = [] } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/weekly-documentation/all"],
  });
  const { data: monthlyReports = [] } = useQuery<MonthlyReport[]>({
    queryKey: ["/api/monthly-reports/all"],
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients/all"],
  });

  const clientNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of clients) m.set(c.id, c.initials);
    return m;
  }, [clients]);

  const items: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];
    for (const cp of carePlans) {
      if (!(cp as any)?.updatedAt) continue; // skip if no timestamp
      list.push({
        id: cp.id,
        kind: "Vårdplan",
        clientId: cp.clientId,
        updatedAt: (cp.updatedAt as any as string),
      });
    }
    for (const wd of weeklyDocs) {
      if (!(wd as any)?.updatedAt) continue;
      list.push({
        id: wd.id,
        kind: "Veckodok",
        clientId: wd.clientId,
        updatedAt: (wd.updatedAt as any as string),
      });
    }
    for (const mr of monthlyReports) {
      if (!(mr as any)?.updatedAt) continue;
      list.push({
        id: mr.id,
        kind: "Månadsrapport",
        clientId: mr.clientId,
        updatedAt: (mr.updatedAt as any as string),
      });
    }
    return list
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [carePlans, weeklyDocs, monthlyReports]);

  return (
    <Card className="shadow-sm border border-ungdoms-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-ungdoms-800">
          <Clock className="h-5 w-5" /> Senast arbetat med
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen aktivitet ännu.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="text-ungdoms-800">
                {clientNameById.get(it.clientId) ?? it.clientId} – {it.kind} ({timeAgo(it.updatedAt)})
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <a href="#" className="text-sm text-blue-700 hover:underline">Visa alla →</a>
        </div>
      </CardContent>
    </Card>
  );
}


