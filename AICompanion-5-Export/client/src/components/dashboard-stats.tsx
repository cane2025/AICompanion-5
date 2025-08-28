import { Users, FileText, Calendar, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Staff } from "@shared/schema";

interface DashboardStatsProps {
  staff: Staff[];
}

export function DashboardStats({ staff }: DashboardStatsProps) {
  const totalStaff = staff.length;

  const stats = [
    {
      title: "Total Personal",
      value: totalStaff,
      icon: Users,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Veckodokumentation",
      value: 0, // Will be populated from API
      icon: FileText,
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Månadsrapporter",
      value: 0, // Will be populated from API
      icon: ClipboardList,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600"
    },
    {
      title: "Vårdplaner",
      value: 0, // Will be populated from API
      icon: Calendar,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`${stat.iconColor} h-6 w-6`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
