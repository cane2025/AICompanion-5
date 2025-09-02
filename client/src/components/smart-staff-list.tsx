import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Phone, Mail, Clock } from "lucide-react";
import * as api from "@/lib/api";
import type { Staff, Client } from "@shared/schema";

interface SmartStaffListProps {
  selectedStaffId?: string;
  onStaffSelect: (staff: Staff) => void;
  className?: string;
}

export function SmartStaffList({ 
  selectedStaffId, 
  onStaffSelect, 
  className = "" 
}: SmartStaffListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "role" | "clients">("name");

  // Fetch all staff
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
  });

  // Fetch client counts for each staff member
  const { data: clientCounts = {} } = useQuery({
    queryKey: ["/api/staff-client-counts"],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const staffMember of staff) {
        try {
          const clients = await api.getClientsByStaff(staffMember.id);
          counts[staffMember.id] = clients.length;
        } catch {
          counts[staffMember.id] = 0;
        }
      }
      return counts;
    },
    enabled: staff.length > 0,
  });

  // Filter and sort staff
  const filteredAndSortedStaff = useMemo(() => {
    let filtered = staff.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.initials.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.roll || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "role":
          return (a.roll || "").localeCompare(b.roll || "");
        case "clients":
          return (clientCounts[b.id] || 0) - (clientCounts[a.id] || 0);
        default:
          return 0;
      }
    });

    // Put selected staff at top if exists
    if (selectedStaffId) {
      const selectedIndex = filtered.findIndex(s => s.id === selectedStaffId);
      if (selectedIndex > 0) {
        const selected = filtered.splice(selectedIndex, 1)[0];
        filtered.unshift(selected);
      }
    }

    return filtered;
  }, [staff, searchTerm, sortBy, clientCounts, selectedStaffId]);

  const getStatusColor = (staffId: string) => {
    // Mock availability status - in real app this would come from API
    const clientCount = clientCounts[staffId] || 0;
    if (clientCount === 0) return "bg-gray-100 text-gray-600";
    if (clientCount < 5) return "bg-green-100 text-green-600";
    if (clientCount < 10) return "bg-yellow-100 text-yellow-600";
    return "bg-red-100 text-red-600";
  };

  return (
    <div className={`w-64 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-ungdoms-600" />
          <h3 className="font-semibold text-ungdoms-800">Personal</h3>
          <Badge variant="secondary" className="ml-auto">
            {staff.length}
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sök personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Sort options */}
        <div className="flex gap-1">
          {[
            { key: "name", label: "Namn" },
            { key: "role", label: "Roll" },
            { key: "clients", label: "Klienter" }
          ].map(option => (
            <Button
              key={option.key}
              variant={sortBy === option.key ? "default" : "ghost"}
              size="sm"
              className="text-xs px-2 py-1 h-6"
              onClick={() => setSortBy(option.key as typeof sortBy)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Staff List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredAndSortedStaff.map((staffMember, index) => {
            const isSelected = staffMember.id === selectedStaffId;
            const clientCount = clientCounts[staffMember.id] || 0;
            
            return (
              <div
                key={staffMember.id}
                className={`
                  p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm
                  ${isSelected 
                    ? "bg-ungdoms-100 border-2 border-ungdoms-300 shadow-sm" 
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                  }
                `}
                onClick={() => onStaffSelect(staffMember)}
              >
                {/* Quick select number for top 9 */}
                {index < 9 && (
                  <div className="absolute -ml-1 -mt-1">
                    <Badge variant="outline" className="text-xs w-5 h-5 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm text-gray-900 flex items-center gap-1">
                      <span className="font-bold text-ungdoms-600">{staffMember.initials}</span>
                      <span className="text-gray-600">|</span>
                      <span className="truncate max-w-[120px]">{staffMember.name}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staffMember.id)}`}>
                    {clientCount}
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  {staffMember.roll || "Vårdpersonal"}
                </div>

                {/* Hover details */}
                <div className="hidden group-hover:block text-xs text-gray-500 space-y-1">
                  {staffMember.telefon && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{staffMember.telefon}</span>
                    </div>
                  )}
                  {staffMember.epost && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{staffMember.epost}</span>
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-ungdoms-200">
                    <div className="text-xs text-ungdoms-600 font-medium">
                      ✓ Vald som behandlare
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-3 w-3" />
            <span>Senast uppdaterad: {new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="text-gray-400">
            Tryck 1-9 för snabbval
          </div>
        </div>
      </div>
    </div>
  );
}