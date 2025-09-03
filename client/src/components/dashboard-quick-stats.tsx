import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, BarChart3, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  activeCarePlans: number;
  weeklyDocuments: number;
  monthlyReports: number;
  activeClients: number;
}

export function DashboardQuickStats() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the backend
      return {
        activeCarePlans: 24,
        weeklyDocuments: 18,
        monthlyReports: 7,
        activeClients: 42,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const stats = [
    {
      title: "Aktiva vårdplaner",
      value: data?.activeCarePlans || 0,
      icon: FileText,
      color: "border-l-blue-600",
      iconColor: "text-blue-600",
    },
    {
      title: "Veckodokument",
      value: data?.weeklyDocuments || 0,
      icon: FileText,
      color: "border-l-orange-600",
      iconColor: "text-orange-600",
    },
    {
      title: "Månadsrapporter",
      value: data?.monthlyReports || 0,
      icon: BarChart3,
      color: "border-l-green-600",
      iconColor: "text-green-600",
    },
    {
      title: "Aktiva klienter",
      value: data?.activeClients || 0,
      icon: Users,
      color: "border-l-purple-600",
      iconColor: "text-purple-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-l-4">
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className={`border-l-4 ${stat.color} hover:shadow-md transition-shadow duration-200`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.iconColor} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}