import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CarePlan, WeeklyDocumentation, MonthlyReport } from "@shared/schema";

interface ActivityItem {
  label: string;
  timestamp: string;
  link: string;
}

export function RecentActivityWidget() {
  // Simulate API aggregation
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans/recent"],
  });
  const { data: weeklyDocs = [] } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/weekly-documentation/recent"],
  });
  const { data: monthlyReports = [] } = useQuery<MonthlyReport[]>({
    queryKey: ["/api/monthly-reports/recent"],
  });

  // Build list and sort by timestamp desc
  const items: ActivityItem[] = [
    ...carePlans.map(cp => ({
      label: `${cp.clientInitials} – Vårdplan`,
      timestamp: cp.updatedAt ?? cp.createdAt ?? new Date().toISOString(),
      link: `/care-plans/${cp.id}`
    })),
    ...weeklyDocs.map(doc => ({
      label: `${doc.clientInitials} – Veckodok`,
      timestamp: doc.updatedAt ?? doc.createdAt ?? new Date().toISOString(),
      link: `/weekly-documentation/${doc.id}`
    })),
    ...monthlyReports.map(mr => ({
      label: `${mr.clientInitials} – Månadsrapport`,
      timestamp: mr.updatedAt ?? mr.createdAt ?? new Date().toISOString(),
      link: `/monthly-reports/${mr.id}`
    }))
  ];

  const sorted = items.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0,3);

  return (
    <Card className="border-ungdoms-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-ungdoms-800">
          <Clock className="h-5 w-5" />
          Senast arbetat med
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {sorted.length === 0 && <li>Inga senaste aktiviteter</li>}
          {sorted.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <a href={item.link} className="hover:underline text-ungdoms-700">{item.label}</a>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, includeSeconds: false, locale: undefined })}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-right">
          <a href="/recent" className="text-sm text-blue-600 hover:underline">Visa alla →</a>
        </div>
      </CardContent>
    </Card>
  );
}