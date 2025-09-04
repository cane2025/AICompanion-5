import { useState } from "react";
import { CarePlanFormCompact } from "@/components/care-plan-form-compact";
import { StaffSidebarCompact } from "@/components/staff-sidebar-compact";
import { UngdomsLogo } from "@/components/ungdoms-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Plus
} from "lucide-react";

interface CarePlanPageProps {
  onBackToDashboard?: () => void;
}

export function CarePlanPage({ onBackToDashboard }: CarePlanPageProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [activeView, setActiveView] = useState("care-plan");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffId(staffId);
  };

  const handleViewChange = (view: string, staffId?: string) => {
    setActiveView(view);
    if (staffId) {
      setSelectedStaffId(staffId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToDashboard}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Tillbaka till Dashboard
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <UngdomsLogo size="md" />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Vårdplan - Snabbstart</p>
              <p className="text-xs text-gray-500">Effektivt formulär för vårdpersonal</p>
            </div>
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
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Skapa Vårdplan
                  </h1>
                  <p className="text-lg text-gray-600">
                    Professionellt och effektivt formulär för vårdplaner
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden"
                  >
                    {sidebarOpen ? "Dölj personal" : "Visa personal"}
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Vårdplaner idag</p>
                        <p className="text-2xl font-bold text-gray-900">3</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Slutförda</p>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pågående</p>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Genomsnittstid</p>
                        <p className="text-2xl font-bold text-gray-900">45s</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Care Plan Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CarePlanFormCompact
                onStaffSelect={handleStaffSelect}
                initialData={{
                  staffId: selectedStaffId,
                }}
              />
            </div>

            {/* Help Section */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Snabbtips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Välj behandlare</p>
                      <p className="text-xs text-gray-600">Klicka på personal i vänsterlistan för snabbval</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Använd snabbmallar</p>
                      <p className="text-xs text-gray-600">Klicka på Hälsa, Skola, Familj för förfylld text</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tangentbordskort</p>
                      <p className="text-xs text-gray-600">⌘S = Spara, ⌘N = Spara & Ny, ⌘D = Duplicera</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Autosave
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Sparar automatiskt var 800ms</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>Ingen data går förlorad</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <span>Optimistic updates för snabb känsla</span>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Skapa ny vårdplan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}