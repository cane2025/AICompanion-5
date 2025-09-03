import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CarePlanDialog } from "@/components/care-plan-dialog";
import { MonthlyReportDialog } from "@/components/monthly-report-dialog";
import { WeeklyDocumentationDialog } from "@/components/weekly-documentation-dialog";
import { VimsaTimeDialog } from "@/components/vimsa-time-dialog";
import {
  FileText,
  Calendar,
  Clock,
} from "lucide-react";

export function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center mb-2">
            <h2 className="text-2xl font-bold text-ungdoms-800">
              Dashboard - UNGDOMS Öppenvård
            </h2>
            <div className="ml-4 text-sm text-ungdoms-500 bg-ungdoms-50 px-3 py-1 rounded-full">
              {timeString}
            </div>
          </div>
          <p className="text-ungdoms-600">
            Överskådlig sammanfattning av vårdplaner, genomförandeplaner och personalstatistik
          </p>
          <p className="text-sm text-ungdoms-500 mt-1">
            {dateString}
          </p>
        </div>
      </div>

      {/* Primary Action Buttons - No Duplicates, Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <CarePlanDialog
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 w-full h-auto flex items-center justify-center shadow-sm hover:shadow-md primary-action-button">
              <FileText className="h-5 w-5 mr-2" />
              <span className="font-medium">Skapa Vårdplan</span>
            </Button>
          }
        />
        <WeeklyDocumentationDialog
          trigger={
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 w-full h-auto flex items-center justify-center shadow-sm hover:shadow-md primary-action-button">
              <FileText className="h-5 w-5 mr-2" />
              <span className="font-medium">Veckodokumentation</span>
            </Button>
          }
        />
        <MonthlyReportDialog
          trigger={
            <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 w-full h-auto flex items-center justify-center shadow-sm hover:shadow-md primary-action-button">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="font-medium">Månadsrapport</span>
            </Button>
          }
        />
        <VimsaTimeDialog
          trigger={
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 w-full h-auto flex items-center justify-center shadow-sm hover:shadow-md primary-action-button">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-medium">Visma Tid</span>
            </Button>
          }
        />
      </div>
    </div>
  );
}