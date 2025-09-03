import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TodaysFocusData {
  carePlansToReview: number;
  weeklyDocsToComplete: number;
  monthlyReportsDueSoon: number;
  staffWithClients: Array<{
    name: string;
    clientsToday: number;
    totalClients: number;
  }>;
}

export function TodaysFocus() {
  const today = new Date().toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Fetch today's focus data
  const { data, isLoading } = useQuery<TodaysFocusData>({
    queryKey: ["/api/dashboard/today-focus"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the backend
      // For now, we'll return mock data
      return {
        carePlansToReview: 3,
        weeklyDocsToComplete: 5,
        monthlyReportsDueSoon: 2,
        staffWithClients: [
          { name: "Mirza Celik", clientsToday: 2, totalClients: 5 },
          { name: "Anna Andersson", clientsToday: 3, totalClients: 3 },
        ],
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            IDAG – {today}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-orange-600",
      text: `${data?.carePlansToReview || 0} vårdplaner att granska`,
      priority: "medium",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      color: "text-blue-600",
      text: `${data?.weeklyDocsToComplete || 0} veckodokument att slutföra`,
      priority: "high",
    },
    {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-red-600",
      text: `${data?.monthlyReportsDueSoon || 0} månadsrapporter förfaller imorgon`,
      priority: "urgent",
    },
  ];

  // Add staff with clients
  data?.staffWithClients?.forEach((staff) => {
    items.push({
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-green-600",
      text: `${staff.name} – ${staff.clientsToday} klienter idag`,
      priority: "info",
    });
  });

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-blue-600" />
          IDAG – {today}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 text-sm p-2 rounded-lg transition-colors ${
              item.priority === "urgent"
                ? "bg-red-50 hover:bg-red-100"
                : item.priority === "high"
                ? "bg-orange-50 hover:bg-orange-100"
                : "hover:bg-gray-50"
            }`}
          >
            <span className={item.color}>{item.icon}</span>
            <span className="flex-1">{item.text}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}