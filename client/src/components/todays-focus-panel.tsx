import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CalendarDays, 
  CheckCircle, 
  FileText, 
  AlertCircle, 
  Timer,
  TrendingUp 
} from "lucide-react";
import type { Staff } from "@shared/schema";

interface TodaysFocusPanelProps {
  staff: Staff[];
}

export function TodaysFocusPanel({ staff }: TodaysFocusPanelProps) {
  // In a real implementation, this would fetch today's tasks from the API
  const currentDate = new Date().toLocaleDateString('sv-SE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Mock data - replace with real API calls
  const todaysFocus = {
    careToReview: 3,
    weeklyDocsToComplete: 5,
    monthlyReportsDeadline: 2,
    todaysActiveStaff: staff.filter(s => s.name.includes("Mirza") || s.name.includes("Anna")).length,
    totalStaff: staff.length
  };

  const focusItems = [
    {
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      count: todaysFocus.careToReview,
      text: "vårdplaner att granska",
      priority: "high"
    },
    {
      icon: FileText,
      color: "text-orange-600", 
      bgColor: "bg-orange-50",
      count: todaysFocus.weeklyDocsToComplete,
      text: "veckodokument att slutföra",
      priority: "medium"
    },
    {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50", 
      count: todaysFocus.monthlyReportsDeadline,
      text: "månadsrapporter förfaller imorgon",
      priority: "urgent"
    },
    {
      icon: Timer,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      count: todaysFocus.todaysActiveStaff,
      text: `av ${todaysFocus.totalStaff} personal arbetar idag`,
      priority: "info"
    }
  ];

  return (
    <Card className="shadow-sm border border-ungdoms-200 h-fit dashboard-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-ungdoms-800 text-lg">
          <CalendarDays className="h-5 w-5 mr-2" />
          📅 IDAG – {currentDate}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {focusItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={index}
                className={`flex items-center p-3 rounded-lg ${item.bgColor} cursor-pointer border border-transparent hover:border-gray-200 focus-item`}
              >
                <div className={`p-2 rounded-full ${item.bgColor} mr-3`}>
                  <IconComponent className={`h-4 w-4 ${item.color} flex-shrink-0`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-ungdoms-800 font-semibold text-lg mr-2">
                      {item.count}
                    </span>
                    <span className="text-ungdoms-700">
                      {item.text}
                    </span>
                  </div>
                  {item.priority === "urgent" && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-xs text-red-600 font-medium">Hög prioritet</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}