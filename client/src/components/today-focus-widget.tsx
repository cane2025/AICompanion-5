import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { FileText, ClipboardCheck, Clock } from "lucide-react";
import type { CarePlan, WeeklyDocumentation, MonthlyReport, Staff } from "@shared/schema";
import { format } from "date-fns";

interface TodayFocusWidgetProps {
  staff: Staff[];
}

export function TodayFocusWidget({ staff }: TodayFocusWidgetProps) {
  // Fetch today's pending items
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans/pending"],
  });

  const { data: weeklyDocs = [] } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/weekly-documentation/pending"],
  });

  const { data: monthlyReports = [] } = useQuery<MonthlyReport[]>({
    queryKey: ["/api/monthly-reports/pending"],
  });

  const todayDate = format(new Date(), "d MMMM yyyy");

  return (
    <Card className="border-ungdoms-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-ungdoms-800">
          <Calendar className="h-5 w-5" />
          IDAG – {todayDate}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-ungdoms-500" />
            <span>{carePlans.length} vårdplaner att granska</span>
          </li>
          <li className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-ungdoms-500" />
            <span>{weeklyDocs.length} veckodokument att slutföra</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-ungdoms-500" />
            <span>{monthlyReports.length} månadsrapporter förfaller imorgon</span>
          </li>
          {staff.length > 0 && (
            <li className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-ungdoms-500" />
              <span>{staff[0].firstName} {staff[0].lastName} – 2 klienter idag</span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}