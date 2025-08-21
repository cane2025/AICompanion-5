import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChartLine, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/staff-data";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Staff } from "@shared/schema";

interface StaffSidebarProps {
  staff: Staff[];
  activeView: string;
  onViewChange: (view: string, staffId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  searchTerm?: string;
}

export function StaffSidebar({
  staff,
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

  // Use global search term if provided, otherwise use local filter
  const effectiveSearchTerm = searchTerm || filterTerm;

  const filteredStaff = staff.filter((s) =>
    (s.name || "").toLowerCase().includes(effectiveSearchTerm.toLowerCase())
  );

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: (data: { name: string; initials: string }) =>
      api.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "staff"] });
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
      queryClient.invalidateQueries({ queryKey: ["api", "staff"] });
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
        <div className="mb-4 flex items-center gap-2">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Lägg till personal
          </Button>
        </div>
        {showAdd && (
          <div className="mb-4 flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Namn på personal..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAddStaff}
              disabled={addStaffMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addStaffMutation.isPending ? "Lägger till..." : "Spara"}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Avbryt
            </Button>
          </div>
        )}
        {/* Dashboard Link */}
        <div className="mb-6">
          <Button
            variant={activeView === "dashboard" ? "default" : "outline"}
            className={`w-full justify-start ${
              activeView === "dashboard"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : ""
            }`}
            onClick={() => {
              onViewChange("dashboard");
              if (window.innerWidth < 1024) onClose();
            }}
          >
            <ChartLine className="mr-3 h-4 w-4" />
            Dashboard
          </Button>
        </div>
        {/* Staff Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrera personal
          </label>
          <Input
            type="text"
            placeholder="Sök personal..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
          />
        </div>
        {/* Staff Tabs */}
        <div className="space-y-2">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Ingen personal hittad</p>
              {effectiveSearchTerm && (
                <p className="text-xs mt-1">Prova att ändra söktermen</p>
              )}
            </div>
          ) : (
            filteredStaff.map((staffMember) => {
              const initials = getInitials(staffMember.name);
              const isActive = activeView === `staff-${staffMember.id}`;
              return (
                <div key={staffMember.id} className="flex items-center gap-2">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                    onClick={() => {
                      onViewChange("staff", staffMember.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                  >
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-gray-600 font-medium text-sm">
                        {initials}
                      </span>
                    </div>
                    <span className="font-medium">{staffMember.name}</span>
                  </Button>
                  <div className="relative">
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-gray-500 hover:bg-gray-100"
                      onClick={() =>
                        setDeletingId(
                          staffMember.id === deletingId ? null : staffMember.id
                        )
                      }
                      title="Alternativ"
                    >
                      <span className="text-[1.5em] leading-none">⋮</span>
                    </Button>
                    {deletingId === staffMember.id && (
                      <div className="absolute right-0 z-10 mt-2 w-32 bg-white border rounded shadow-lg">
                        <Button
                          variant="ghost"
                          className="w-full text-red-600 justify-start"
                          onClick={() => handleDeleteStaff(staffMember.id)}
                          disabled={deleteStaffMutation.isPending}
                        >
                          {deleteStaffMutation.isPending
                            ? "Raderar..."
                            : "Ta bort"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
