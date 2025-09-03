import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  AlertCircle,
  User,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Staff } from "@shared/schema";

interface StaffStatus {
  id: number;
  status: "active" | "away" | "busy";
  currentClients: number;
  maxClients: number;
  todaySchedule: {
    clientCount: number;
    meetings: number;
    nextAppointment?: string;
  };
}

export function SmartStaffList({ staff }: { staff: Staff[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch staff status data
  const { data: staffStatuses = {} } = useQuery<Record<number, StaffStatus>>({
    queryKey: ["/api/staff/status"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the backend
      // For now, we'll return mock data
      const statuses: Record<number, StaffStatus> = {};
      staff.forEach((person) => {
        const random = Math.random();
        statuses[person.id] = {
          id: person.id,
          status: random > 0.7 ? "away" : random > 0.3 ? "active" : "busy",
          currentClients: Math.floor(Math.random() * 5),
          maxClients: 5,
          todaySchedule: {
            clientCount: Math.floor(Math.random() * 4),
            meetings: Math.floor(Math.random() * 3),
            nextAppointment: random > 0.5 ? "14:30" : undefined,
          },
        };
      });
      return statuses;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const filteredStaff = useMemo(() => {
    const filtered = staff.filter((person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort by status: active first, then busy, then away
    return filtered.sort((a, b) => {
      const statusOrder = { active: 0, busy: 1, away: 2 };
      const aStatus = staffStatuses[a.id]?.status || "away";
      const bStatus = staffStatuses[b.id]?.status || "away";
      return statusOrder[aStatus] - statusOrder[bStatus];
    });
  }, [staff, searchTerm, staffStatuses]);

  const getStatusIndicator = (status: StaffStatus) => {
    if (status.status === "away") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <span className="w-2 h-2 bg-gray-300 rounded-full" />
          </TooltipTrigger>
          <TooltipContent>Ledig</TooltipContent>
        </Tooltip>
      );
    }

    const isOverloaded = status.currentClients >= status.maxClients;
    if (isOverloaded) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Överbelastad</TooltipContent>
        </Tooltip>
      );
    }

    if (status.status === "busy") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
          </TooltipTrigger>
          <TooltipContent>Upptagen</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="w-2 h-2 bg-green-500 rounded-full" />
        </TooltipTrigger>
        <TooltipContent>Tillgänglig</TooltipContent>
      </Tooltip>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>PERSONAL</span>
          <Badge variant="secondary">{staff.length}</Badge>
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sök personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <TooltipProvider>
            <div className="px-4 pb-4">
              {filteredStaff.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Ingen personal hittades
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredStaff.map((person) => {
                    const status = staffStatuses[person.id];
                    if (!status) return null;

                    return (
                      <div
                        key={person.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                          status.status === "away"
                            ? "opacity-50 hover:opacity-75"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Avatar/Initials */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {getInitials(person.name)}
                          </span>
                        </div>

                        {/* Name and info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {person.name}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {status.todaySchedule.clientCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {status.currentClients}/{status.maxClients} klienter
                              </span>
                            )}
                            {status.todaySchedule.nextAppointment && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {status.todaySchedule.nextAppointment}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status indicator */}
                        <div className="flex-shrink-0">
                          {getStatusIndicator(status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TooltipProvider>
        </ScrollArea>

        {/* Legend */}
        <div className="border-t px-4 py-3 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Tillgänglig</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Upptagen</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              <span>Ledig</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-orange-500" />
              <span>Överbelastad</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}