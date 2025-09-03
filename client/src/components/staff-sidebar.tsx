import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ChartLine, Trash2, Plus, Search, Circle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/staff-data";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Staff } from "@shared/schema";

interface StaffSidebarProps {
  activeView: string;
  onViewChange: (view: string, staffId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  searchTerm?: string;
}

export function StaffSidebar({
  activeView,
  onViewChange,
  isOpen,
  onClose,
  searchTerm = "",
}: StaffSidebarProps) {
  const [filterTerm, setFilterTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch staff data
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
    queryFn: () => apiRequest("GET", "/api/staff").then((r) => r.json()),
  });

  // Use global search term if provided, otherwise use local filter
  const effectiveSearchTerm = searchTerm || filterTerm;

  const sorted = (staff ?? [])
    .slice()
    .sort((a: any, b: any) => a.name.localeCompare(b.name, "sv"));

  const filteredStaff = sorted.filter((s: any) =>
    (s.name || "").toLowerCase().includes(effectiveSearchTerm.toLowerCase())
  );

  // Mock status data - in real implementation this would come from API
  const getStaffStatus = (staffMember: any) => {
    // Simulate different statuses based on name
    if (staffMember.name.includes("Mirza")) {
      return { status: "working", clients: "2/5", color: "bg-green-500" };
    } else if (staffMember.name.includes("Anna")) {
      return { status: "working", clients: "3/3", color: "bg-green-500" };
    } else if (staffMember.name.includes("Demo")) {
      return { status: "overloaded", clients: "5/5", color: "bg-red-500" };
    } else {
      return { status: "available", clients: "0/5", color: "bg-gray-400" };
    }
  };

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: (data: { name: string; initials: string }) =>
      api.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setShowAdd(false);
      setNewName("");
      toast({
        title: "✅ Personal tillagd",
        description: "Den nya personalen har lagts till framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Fel vid tillägg",
        description: `Kunde inte lägga till personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => api.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setDeletingId(null);
      toast({
        title: "🗑️ Personal raderad",
        description: "Personalen har raderats framgångsrikt.",
      });
    },
    onError: (error) => {
      setDeletingId(null);
      toast({
        title: "❌ Fel vid radering",
        description: `Kunde inte radera personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add staff handler
  const handleAddStaff = async () => {
    if (!newName.trim()) return;
    addStaffMutation.mutate({
      name: newName.trim(),
      initials: getInitials(newName.trim()),
    });
  };

  // Delete staff handler
  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna personal?"))
      return;
    deleteStaffMutation.mutate(id);
  };

  return (
    <aside
      className={`sidebar-transition bg-white w-80 shadow-lg border-r border-gray-200 overflow-y-auto fixed lg:static inset-y-0 left-0 z-30 ${
        isOpen ? "" : "sidebar-hidden lg:transform-none"
      }`}
    >
      <div className="p-6">
        {/* Add Staff Button */}
        <div className="mb-6">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white w-full"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Lägg till personal
          </Button>
        </div>

        {showAdd && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namn på personal
              </label>
              <Input
                type="text"
                placeholder="Ange namn..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddStaff}
                disabled={addStaffMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                {addStaffMutation.isPending ? "Lägger till..." : "Spara"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAdd(false)}
                className="flex-1"
              >
                Avbryt
              </Button>
            </div>
          </div>
        )}

        {/* Staff Filter */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Sök personal..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-3">
            <span>PERSONAL ({filteredStaff.length})</span>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Arbetar</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Ledig</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Överbelastad</span>
              </div>
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Ingen personal hittad</p>
              {effectiveSearchTerm && (
                <p className="text-xs mt-1">Prova att ändra söktermen</p>
              )}
            </div>
          ) : (
            filteredStaff.map((staffMember: any) => {
              const initials = getInitials(staffMember.name);
              const isActive = activeView === `staff-${staffMember.id}`;
              const status = getStaffStatus(staffMember);
              
              return (
                <div key={staffMember.id} className="group">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    {/* Status Indicator */}
                    <div className={`w-3 h-3 ${status.color} rounded-full flex-shrink-0`}></div>
                    
                    {/* Avatar */}
                    <div className="h-10 w-10 bg-ungdoms-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-ungdoms-700 font-medium text-sm">
                        {initials}
                      </span>
                    </div>
                    
                    {/* Staff Info */}
                    <div className="flex-1 min-w-0">
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start h-auto p-0 ${
                          isActive
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:text-gray-900"
                        }`}
                        onClick={() => {
                          onViewChange("staff", staffMember.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm truncate">
                            {staffMember.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {staffMember.roll || 'sjuksköterska'} • {status.clients} klienter
                          </div>
                        </div>
                      </Button>
                    </div>
                    
                    {/* Context Menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        onClick={() =>
                          setDeletingId(
                            staffMember.id === deletingId ? null : staffMember.id
                          )
                        }
                        title="Alternativ"
                      >
                        <span className="text-lg leading-none">⋮</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Context Menu Dropdown */}
                  {deletingId === staffMember.id && (
                    <div className="ml-16 mt-1">
                      <div className="bg-white border rounded-lg shadow-lg p-1">
                        <Button
                          variant="ghost"
                          className="w-full text-red-600 justify-start text-sm h-8"
                          onClick={() => handleDeleteStaff(staffMember.id)}
                          disabled={deleteStaffMutation.isPending}
                        >
                          {deleteStaffMutation.isPending
                            ? "Raderar..."
                            : "Ta bort"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
