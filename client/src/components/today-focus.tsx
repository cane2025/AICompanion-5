import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, Users } from "lucide-react";
import type { CarePlan, WeeklyDocumentation, MonthlyReport, Staff, Client } from "@shared/schema";

export function TodayFocus() {
  const { data: carePlans = [] } = useQuery<CarePlan[]>({ queryKey: ["/api/care-plans/all"] });
  const { data: weeklyDocs = [] } = useQuery<WeeklyDocumentation[]>({ queryKey: ["/api/weekly-documentation/all"] });
  const { data: monthlyReports = [] } = useQuery<MonthlyReport[]>({ queryKey: ["/api/monthly-reports/all"] });
  const { data: staff = [] } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients/all"] });

  const today = useMemo(() => new Date(), []);

  const carePlansToReview = useMemo(() => {
    // Anything not completed is considered needs review/attention
    return carePlans.filter((cp) => cp.status !== "completed").length;
  }, [carePlans]);

  const weeklyToComplete = useMemo(() => {
    // Not approved yet => to complete
    return weeklyDocs.filter((d) => !d.approved).length;
  }, [weeklyDocs]);

  const monthlyDueSoon = useMemo(() => {
    // Any report this month not completed is considered due soon
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return monthlyReports.filter((mr) => mr.year === year && mr.month === month && mr.status !== "completed").length;
  }, [monthlyReports, today]);

  const topStaffInfo = useMemo(() => {
    if (!staff.length) return null;
    const countByStaff = new Map<string, number>();
    for (const c of clients) {
      countByStaff.set(c.staffId, (countByStaff.get(c.staffId) || 0) + 1);
    }
    let best: { staff: Staff; count: number } | null = null;
    for (const s of staff) {
      const count = countByStaff.get(s.id) || 0;
      if (!best || count > best.count) best = { staff: s, count };
    }
    return best;
  }, [clients, staff]);

  const formattedDate = new Intl.DateTimeFormat("sv-SE", { dateStyle: "full" }).format(today);

  return (
    <Card className="border-ungdoms-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-ungdoms-800">
          <Calendar className="h-5 w-5" />
          Idag – {formattedDate}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-ungdoms-600" />
            <span>
              <strong>{carePlansToReview}</strong> vårdplaner att granska
            </span>
          </li>
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-600" />
            <span>
              <strong>{weeklyToComplete}</strong> veckodokument att slutföra
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span>
              <strong>{monthlyDueSoon}</strong> månadsrapporter förfaller snart
            </span>
          </li>
          {topStaffInfo && (
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span>
                {topStaffInfo.staff.name} – {topStaffInfo.count} klienter idag
                <Badge variant="outline" className="ml-2">{topStaffInfo.staff.initials}</Badge>
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

