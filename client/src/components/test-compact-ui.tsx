import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CarePlanFormCompact } from "./care-plan-form-compact";
import { StaffSidebarCompact } from "./staff-sidebar-compact";

export function TestCompactUI() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const handleViewChange = (view: string, staffId?: string) => {
    setActiveView(view);
    if (staffId) {
      setSelectedStaffId(staffId);
    }
  };

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffId(staffId);
    console.log("Selected staff:", staffId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Test: Kompakt Vårdplan-UI
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "Dölj Sidebar" : "Visa Sidebar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveView(activeView === "dashboard" ? "care-plan" : "dashboard")}
            >
              Växla till {activeView === "dashboard" ? "Vårdplan" : "Dashboard"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-20">
        {/* Staff Sidebar */}
        <StaffSidebarCompact
          activeView={activeView}
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onStaffSelect={handleStaffSelect}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {activeView === "dashboard" ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard-vy
              </h2>
              <p className="text-gray-600">
                Detta är dashboard-vyn. Klicka på "Vårdplan" för att testa formuläret.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CarePlanFormCompact
                onStaffSelect={handleStaffSelect}
                initialData={{
                  staffId: selectedStaffId,
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}