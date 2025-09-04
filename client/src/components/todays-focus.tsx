import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText, ClipboardList, Users } from "lucide-react";
import type {
  Staff,
  CarePlan,
  WeeklyDocumentation,
  MonthlyReport,
  Client,
} from "@shared/schema";

interface TodaysFocusProps {
  staff: Staff[];
}

function getISOWeek(date: Date) {
  // ISO week-numbering year algorithm
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: tmp.getUTCFullYear(), week };
}

function formatDateSv(date: Date) {
  const day = date.getDate();
  const month = date.toLocaleDateString("sv-SE", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function TodaysFocus({ staff }: TodaysFocusProps) {
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

  const today = new Date();
  const iso = getISOWeek(today);

  const pendingCarePlans = useMemo(
    () => carePlans.filter((cp) => (cp.status ?? "").toString() !== "completed").length,
    [carePlans]
  );

  const weeklyDocsToComplete = useMemo(
    () =>
      weeklyDocs.filter((d) => d.year === iso.year && d.week === iso.week && !d.approved)
        .length,
    [weeklyDocs, iso]
  );

  const monthlyReportsDueTomorrow = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const lastDayOfTomorrowMonth = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth() + 1,
      0
    ).getDate();
    const isLastDayTomorrow = tomorrow.getDate() === lastDayOfTomorrowMonth;
    if (!isLastDayTomorrow) return 0;
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return monthlyReports.filter(
      (mr) => mr.year === year && mr.month === month && (mr.status ?? "") !== "completed"
    ).length;
  }, [monthlyReports]);

  const topStaffInfo = useMemo(() => {
    if (!staff || staff.length === 0) return { name: "", count: 0 };
    const counts: Record<string, number> = {};
    for (const c of clients) {
      if ((c.status ?? "active") !== "inactive") {
        counts[c.staffId] = (counts[c.staffId] || 0) + 1;
      }
    }
    let bestId = staff[0].id as string;
    for (const s of staff) {
      const current = counts[s.id] || 0;
      const best = counts[bestId] || 0;
      if (current > best) bestId = s.id;
    }
    const best = staff.find((s) => s.id === bestId);
    return { name: best?.name ?? "", count: counts[bestId] || 0 };
  }, [clients, staff]);

  return (
    <Card className="shadow-sm border border-ungdoms-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-ungdoms-800">
          <CalendarDays className="h-5 w-5" />
          <span>Idag – {formatDateSv(today)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-ungdoms-800">
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-ungdoms-600" />
            <span>
              {pendingCarePlans} vårdplaner att granska
            </span>
          </li>
          <li className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-ungdoms-600" />
            <span>
              {weeklyDocsToComplete} veckodokument att slutföra
            </span>
          </li>
          <li className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-ungdoms-600" />
            <span>
              {monthlyReportsDueTomorrow} månadsrapporter förfaller imorgon
            </span>
          </li>
          {topStaffInfo.name && (
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-ungdoms-600" />
              <span>
                {topStaffInfo.name} – {topStaffInfo.count} klienter idag
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
