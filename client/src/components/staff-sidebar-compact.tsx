import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { 
  ChartLine, 
  Trash2, 
  Plus, 
  Search, 
  User, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/staff-data";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Staff } from "@shared/schema";

interface StaffSidebarCompactProps {
  activeView: string;
  onViewChange: (view: string, staffId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  searchTerm?: string;
  onStaffSelect?: (staffId: string) => void;
}

type SortField = 'name' | 'role' | 'clientCount' | 'lastActive';
type SortDirection = 'asc' | 'desc';

export function StaffSidebarCompact({
  activeView,
  onViewChange,
  isOpen,
  onClose,
  searchTerm = "",
  onStaffSelect,
}: StaffSidebarCompactProps) {
  const [filterTerm, setFilterTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch staff data
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
    queryFn: () => apiRequest("GET", "/api/staff").then((r) => r.json()),
  });

  // Fetch client counts for each staff member
  const { data: clientCounts = {} } = useQuery({
    queryKey: ["/api/staff/client-counts"],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const staffMember of staff) {
        try {
          const response = await apiRequest("GET", `/api/staff/${staffMember.id}/clients`);
          const clients = await response.json();
          counts[staffMember.id] = clients.length;
        } catch (error) {
          counts[staffMember.id] = 0;
        }
      }
      return counts;
    },
    enabled: staff.length > 0,
  });

  // Use global search term if provided, otherwise use local filter
  const effectiveSearchTerm = searchTerm || filterTerm;

  // Filter and sort staff
  const filteredAndSortedStaff = useMemo(() => {
    let filtered = staff.filter((s: Staff) => {
      const matchesSearch = (s.name || "").toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
                           (s.initials || "").toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
                           (s.roll || "").toLowerCase().includes(effectiveSearchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || s.roll === filterRole;
      const matchesStatus = filterStatus === 'all' || getStaffStatus(s, clientCounts[s.id] || 0) === filterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort staff
    filtered.sort((a: Staff, b: Staff) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'role':
          aValue = a.roll || '';
          bValue = b.roll || '';
          break;
        case 'clientCount':
          aValue = clientCounts[a.id] || 0;
          bValue = clientCounts[b.id] || 0;
          break;
        case 'lastActive':
          aValue = a.lastActive || new Date(0);
          bValue = b.lastActive || new Date(0);
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [staff, effectiveSearchTerm, filterRole, filterStatus, sortField, sortDirection, clientCounts]);

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    const roles = staff.map((s: Staff) => s.roll).filter(Boolean);
    return ['all', ...Array.from(new Set(roles))];
  }, [staff]);

  // Get staff status based on client count and activity
  function getStaffStatus(staffMember: Staff, clientCount: number): string {
    if (clientCount === 0) return 'available';
    if (clientCount <= 3) return 'moderate';
    if (clientCount <= 7) return 'busy';
    return 'overloaded';
  }

  // Get status color and icon
  function getStatusDisplay(status: string) {
    switch (status) {
      case 'available':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Ledig' };
      case 'moderate':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: User, label: 'Upptagen' };
      case 'busy':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock, label: 'Upptagen' };
      case 'overloaded':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle, label: 'Överbelastad' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: User, label: 'Okänd' };
    }
  }

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

  // Handle staff selection
  const handleStaffClick = (staffId: string) => {
    if (onStaffSelect) {
      onStaffSelect(staffId);
    }
    onViewChange("staff", staffId);
    if (window.innerWidth < 1024) onClose();
  };

  // Toggle sort direction
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <aside
      className={`sidebar-transition bg-white w-80 shadow-lg border-r border-gray-200 overflow-y-auto fixed lg:static inset-y-0 left-0 z-30 ${
        isOpen ? "" : "sidebar-hidden lg:transform-none"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Personal</h2>
          <p className="text-sm text-gray-600">33 anställda</p>
        </div>

        {/* Add Staff Button */}
        <div className="mb-4">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white w-full"
            onClick={() => setShowAdd(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Lägg till personal
          </Button>
        </div>

        {/* Add Staff Form */}
        {showAdd && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="Namn på personal..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 text-sm"
                size={1}
              />
              <Button
                onClick={handleAddStaff}
                disabled={addStaffMutation.isPending}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {addStaffMutation.isPending ? "..." : "Spara"}
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowAdd(false)}
              size="sm"
              className="w-full text-xs"
            >
              Avbryt
            </Button>
          </div>
        )}

        {/* Dashboard Link */}
        <div className="mb-4">
          <Button
            variant={activeView === "dashboard" ? "default" : "outline"}
            className={`w-full justify-start text-sm ${
              activeView === "dashboard"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : ""
            }`}
            onClick={() => {
              onViewChange("dashboard");
              if (window.innerWidth < 1024) onClose();
            }}
            size="sm"
          >
            <ChartLine className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Sök personal..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="pl-10 text-sm"
              size={1}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role === 'all' ? 'Alla roller' : role}
                </option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="all">Alla status</option>
              <option value="available">Ledig</option>
              <option value="moderate">Upptagen</option>
              <option value="busy">Upptagen</option>
              <option value="overloaded">Överbelastad</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="mb-3 flex items-center justify-between text-xs text-gray-600">
          <span>Sortera efter:</span>
          <div className="flex gap-1">
            {[
              { field: 'name' as SortField, label: 'Namn' },
              { field: 'role' as SortField, label: 'Roll' },
              { field: 'clientCount' as SortField, label: 'Klienter' },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`px-2 py-1 rounded text-xs ${
                  sortField === field
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                {label}
                {sortField === field && (
                  sortDirection === 'asc' ? <SortAsc className="inline h-3 w-3 ml-1" /> : <SortDesc className="inline h-3 w-3 ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-1">
          {filteredAndSortedStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Ingen personal hittad</p>
              {effectiveSearchTerm && (
                <p className="text-xs mt-1">Prova att ändra söktermen</p>
              )}
            </div>
          ) : (
            filteredAndSortedStaff.map((staffMember: Staff) => {
              const initials = getInitials(staffMember.name);
              const isActive = activeView === `staff-${staffMember.id}`;
              const clientCount = clientCounts[staffMember.id] || 0;
              const status = getStaffStatus(staffMember, clientCount);
              const statusDisplay = getStatusDisplay(status);

              return (
                <div
                  key={staffMember.id}
                  className={`group relative p-2 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                  onClick={() => handleStaffClick(staffMember.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with status indicator */}
                    <div className="relative">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {initials}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${statusDisplay.bgColor} border-2 border-white`}></div>
                    </div>

                    {/* Staff info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm truncate ${
                          isActive ? "text-blue-700" : "text-gray-900"
                        }`}>
                          {staffMember.name}
                        </span>
                        {staffMember.roll && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {staffMember.roll}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{initials}</span>
                        <span>•</span>
                        <span>{clientCount} klienter</span>
                        <span>•</span>
                        <span className={statusDisplay.color}>{statusDisplay.label}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-gray-500 hover:text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(
                            staffMember.id === deletingId ? null : staffMember.id
                          );
                        }}
                        title="Alternativ"
                      >
                        <span className="text-[1.2em] leading-none">⋮</span>
                      </Button>
                    </div>
                  </div>

                  {/* Delete dropdown */}
                  {deletingId === staffMember.id && (
                    <div className="absolute right-0 z-10 mt-1 w-24 bg-white border rounded shadow-lg">
                      <Button
                        variant="ghost"
                        className="w-full text-red-600 justify-start text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStaff(staffMember.id);
                        }}
                        disabled={deleteStaffMutation.isPending}
                      >
                        {deleteStaffMutation.isPending ? "..." : "Ta bort"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {filteredAndSortedStaff.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
            Visar {filteredAndSortedStaff.length} av {staff.length} personal
          </div>
        )}
      </div>
    </aside>
  );
}