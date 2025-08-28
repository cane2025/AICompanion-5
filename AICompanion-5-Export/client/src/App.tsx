import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import { StaffSidebar } from "@/components/staff-sidebar";
import { Dashboard } from "@/pages/dashboard";
import { StaffClientManagement } from "@/components/staff-client-management";
import { UngdomsLogo } from "@/components/ungdoms-logo";
import { Login } from "@/components/Login";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Staff, User } from "@shared/schema";
import * as api from "@/lib/api";

function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Check authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const response = await fetch("/api/auth/verify", {
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            setCurrentUser(data.user);
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  const handleViewChange = (view: string, staffId?: string) => {
    if (view === "staff" && staffId) {
      setActiveView("staff");
      setActiveStaffId(staffId);
    } else {
      setActiveView(view);
      setActiveStaffId(null);
    }
  };

  const handleExport = async () => {
    try {
      const newWin = window.open(
        "/api/export",
        "_blank",
        "noopener,noreferrer"
      );
      if (newWin) newWin.opener = null;
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    // Invalidate staff query to force refresh after login
    queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setCurrentUser(null);
      setIsAuthenticated(false);
      setActiveView("dashboard");
      setActiveStaffId(null);
    }
  };

  const activeStaff = activeStaffId
    ? staff.find((s) => s.id === activeStaffId)
    : null;

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      const sidebar = document.querySelector("aside");
      const sidebarToggle = document.querySelector("[data-sidebar-toggle]");

      if (
        window.innerWidth < 1024 &&
        sidebar &&
        !sidebar.contains(target) &&
        sidebarToggle &&
        !sidebarToggle.contains(target) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [sidebarOpen]);

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (isAuthLoading || staffLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <UngdomsLogo size="xl" className="justify-center mb-6" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ungdoms-600 mx-auto mb-4"></div>
          <p className="text-ungdoms-600">
            Laddar vårdadministrativt system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onExport={handleExport}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="flex h-screen pt-16">
        <StaffSidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          searchTerm={searchTerm}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6">
            {/* UNGDOMS Logo Header */}
            <div className="mb-6 text-center">
              <UngdomsLogo size="lg" className="justify-center" />
              <h1 className="mt-4 text-2xl font-bold text-ungdoms-700">
                Öppenvård Administrativt System
              </h1>
              <p className="text-muted-foreground mt-1">
                Klienthantering och uppföljning för vårdpersonal
              </p>
            </div>

            {activeView === "dashboard" ? (
              <Dashboard />
            ) : activeStaff ? (
              <div className="space-y-6">
                <div className="bg-ungdoms-50 rounded-lg p-4 border border-ungdoms-200">
                  <h2 className="text-xl font-semibold text-ungdoms-800 mb-2">
                    {activeStaff.name} - {activeStaff.roll}
                  </h2>
                  <p className="text-ungdoms-600">
                    Avdelning: {activeStaff.avdelning} | Initialer:{" "}
                    {activeStaff.initials}
                  </p>
                </div>

                <StaffClientManagement staff={activeStaff} />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-ungdoms-50 rounded-lg p-8 border border-ungdoms-200 max-w-md mx-auto">
                  <p className="text-ungdoms-600 text-lg">
                    Välj en personalmedlem från sidopanelen för att börja
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Systemet använder flödesbaserad klienthantering
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <MainApp />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
