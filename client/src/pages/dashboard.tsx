import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard-header";
import { TodaysFocusPanel } from "@/components/todays-focus-panel";
import { RecentWorkPanel } from "@/components/recent-work-panel";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import {
  FileText,
  Calendar,
  CheckCircle,
} from "lucide-react";
import type { Staff } from "@shared/schema";

export function Dashboard() {
  // Enable real-time synchronization
  useRealtimeSync();

  const {
    data: staff = [],
    isLoading: staffLoading,
    isError: staffError,
    error,
  } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });



  if (staffLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (staffError) {
    return (
      <div className="p-6 text-red-600">
        <div className="font-bold mb-2">Kunde inte ladda personaldata.</div>
        <div className="text-sm">
          {error instanceof Error ? error.message : "Något gick fel."}
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="p-6 text-center text-ungdoms-600">
        <div className="font-bold mb-2">Ingen personal hittades.</div>
        <div className="text-sm mb-4">
          Lägg till personal för att komma igång med systemet.
        </div>
        <div className="text-sm">
          Gå till sidopanelen för att lägga till ny personal.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 fade-in">
      {/* Header with Primary Actions */}
      <DashboardHeader />

      {/* Main Content Grid - Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Today's Focus Panel - Replaces Quickstart Form */}
        <TodaysFocusPanel staff={staff} />

        {/* Recent Work Panel - Quick Access */}
        <RecentWorkPanel />
      </div>

      {/* Additional Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-800">{staff.length}</div>
              <div className="text-sm text-blue-600">Aktiv personal</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-800">12</div>
              <div className="text-sm text-green-600">Aktiva vårdplaner</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-800">8</div>
              <div className="text-sm text-purple-600">Denna månad</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
