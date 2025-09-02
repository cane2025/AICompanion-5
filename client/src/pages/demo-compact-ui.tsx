import { useState } from "react";
import { CarePlanFormCompact } from "@/components/care-plan-form-compact";
import { StaffSidebarCompact } from "@/components/staff-sidebar-compact";
import { UngdomsLogo } from "@/components/ungdoms-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap,
  Shield,
  Target
} from "lucide-react";

export function DemoCompactUI() {
  const [activeView, setActiveView] = useState("demo");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffId(staffId);
  };

  const handleViewChange = (view: string, staffId?: string) => {
    setActiveView(view);
    if (staffId) {
      setSelectedStaffId(staffId);
    }
  };

  const demoSteps = [
    {
      id: 1,
      title: "Välj behandlare",
      description: "Klicka på personal i vänsterlistan för snabbval",
      icon: Users,
      color: "bg-blue-100 text-blue-700"
    },
    {
      id: 2,
      title: "Använd snabbmallar",
      description: "Klicka på Hälsa, Skola, Familj för förfylld text",
      icon: FileText,
      color: "bg-green-100 text-green-700"
    },
    {
      id: 3,
      title: "Tangentbordskort",
      description: "⌘S = Spara, ⌘N = Spara & Ny, ⌘D = Duplicera",
      icon: Zap,
      color: "bg-purple-100 text-purple-700"
    },
    {
      id: 4,
      title: "Autosave",
      description: "Sparar automatiskt var 800ms - ingen data går förlorad",
      icon: Shield,
      color: "bg-orange-100 text-orange-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UngdomsLogo size="md" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Demo: Kompakt Vårdplan-UI</h1>
              <p className="text-sm text-gray-600">Professionellt och effektivt formulär för vårdpersonal</p>
            </div>
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
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Live Demo
            </Badge>
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
            {/* Demo Header */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Välkommen till den nya Vårdplan-UI:n! 🎉
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Detta är en komplett redesign som gör det möjligt att skapa vårdplaner på under 1 minut. 
                  Fokus är på effektivitet, professionalism och användarvänlighet.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tid att skapa</p>
                        <p className="text-2xl font-bold text-gray-900">45s</p>
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
                        <p className="text-sm font-medium text-gray-600">Autosave</p>
                        <p className="text-2xl font-bold text-gray-900">800ms</p>
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
                        <p className="text-sm font-medium text-gray-600">Scroll-fält</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
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
                        <p className="text-sm font-medium text-gray-600">Effektivitet</p>
                        <p className="text-2xl font-bold text-gray-900">+50%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Demo Steps */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Så här fungerar det nya systemet
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {demoSteps.map((step) => (
                  <Card 
                    key={step.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      currentStep === step.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`h-12 w-12 ${step.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      {currentStep === step.id && (
                        <div className="mt-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Aktuell
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Interactive Demo */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Interaktiv Demo - Testa själv!
                  </h3>
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    size="sm"
                  >
                    Starta om demo
                  </Button>
                </div>
                
                <CarePlanFormCompact
                  onStaffSelect={handleStaffSelect}
                  initialData={{
                    staffId: selectedStaffId,
                  }}
                />
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Huvudfunktioner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Kompakt design</p>
                      <p className="text-xs text-gray-600">4 nyckelfält i en horisontell rad</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Smart personallista</p>
                      <p className="text-xs text-gray-600">Sökning, filtrering och sortering</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Autosave</p>
                      <p className="text-xs text-gray-600">Sparar automatiskt var 800ms</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tangentbordskort</p>
                      <p className="text-xs text-gray-600">⌘S, ⌘N, ⌘D för snabb åtkomst</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Snabbtips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Klicka på personal</p>
                      <p className="text-xs text-gray-600">Välj behandlare från vänsterlistan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Använd snabbmallar</p>
                      <p className="text-xs text-gray-600">Klicka på Hälsa, Skola, Familj</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Testa tangentbord</p>
                      <p className="text-xs text-gray-600">⌘S för att spara, ⌘N för ny</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                      4
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Se autosave</p>
                      <p className="text-xs text-gray-600">Skriv och vänta 800ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <div className="mt-8 text-center">
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Redo att använda det nya systemet?
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Det nya vårdplan-formuläret är designat för att göra ditt arbete snabbare, 
                    enklare och mer professionellt.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <ArrowRight className="h-5 w-5 mr-2" />
                      Börja använda
                    </Button>
                    <Button variant="outline" size="lg">
                      <FileText className="h-5 w-5 mr-2" />
                      Läs dokumentation
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