# Dashboard Integration & Navigation - AICompanion-5

## 🏠 Dashboard Arkitektur

### 1. **Huvudapplikation (App.tsx)**

```typescript
// App.tsx - Central navigation state management
function MainApp() {
  const [activeView, setActiveView] = useState("dashboard");
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // React Query för data fetching
  const { data: staff = [], isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
    enabled: isAuthenticated,
  });

  // Navigation handlers
  const handleViewChange = (view: string) => {
    setActiveView(view);
    setActiveStaffId(null); // Reset staff selection
  };

  const handleStaffSelect = (staffId: string) => {
    setActiveStaffId(staffId);
    setActiveView("staff-client-management");
  };

  // Render baserat på aktiv vy
  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard staff={staff} onStaffSelect={handleStaffSelect} />;
      case "staff-client-management":
        return (
          <StaffClientManagement
            staff={staff}
            activeStaffId={activeStaffId}
            onBack={() => setActiveView("dashboard")}
          />
        );
      default:
        return <Dashboard staff={staff} onStaffSelect={handleStaffSelect} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          activeView={activeView}
          onViewChange={handleViewChange}
        />
        <main className="flex-1">{renderActiveView()}</main>
      </div>
    </ErrorBoundary>
  );
}
```

### 2. **Dashboard Komponent**

```typescript
// dashboard.tsx - Huvuddashboard
export function Dashboard({ staff, onStaffSelect }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Filtrera personal baserat på sök
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch = member.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        selectedFilter === "all" || member.role === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [staff, searchTerm, selectedFilter]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">UNGDOMS Öppenvård</h1>
        <DashboardStats staff={staff} />
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Sök personal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrera roll" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla roller</SelectItem>
            <SelectItem value="admin">Administratörer</SelectItem>
            <SelectItem value="staff">Personal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <StaffCard
            key={member.id}
            staff={member}
            onClick={() => onStaffSelect(member.id)}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
```

## 🧭 Navigation System

### 1. **Staff Sidebar Navigation**

```typescript
// staff-sidebar.tsx - Sidomeny för personal
export function StaffSidebar({
  staff,
  activeStaffId,
  onStaffSelect,
}: StaffSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sortera personal A-Ö
  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => a.name.localeCompare(b.name));
  }, [staff]);

  return (
    <div
      className={`bg-white shadow-lg ${
        isCollapsed ? "w-16" : "w-64"
      } transition-all duration-300`}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h2 className="font-semibold">Personal</h2>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
      </div>

      <nav className="p-2">
        {sortedStaff.map((member) => (
          <button
            key={member.id}
            onClick={() => onStaffSelect(member.id)}
            className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
              activeStaffId === member.id
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {member.name.charAt(0)}
              </div>
              {!isCollapsed && (
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.role}</div>
                </div>
              )}
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
```

### 2. **Client Detail View Navigation**

```typescript
// ClientDetailView.tsx - Klientöversikt med tabs
export function ClientDetailView({ clientId }: { clientId: string }) {
  const [activeTab, setActiveTab] = useState("care-plans");

  const tabs = [
    {
      id: "care-plans",
      label: "Vårdplaner",
      icon: FileText,
      component: <CarePlanList clientId={clientId} />,
    },
    {
      id: "implementation-plans",
      label: "Genomförandeplaner",
      icon: Target,
      component: <ImplementationPlanList clientId={clientId} />,
    },
    {
      id: "weekly-docs",
      label: "Veckodokumentation",
      icon: Calendar,
      component: <WeeklyDocumentation clientId={clientId} />,
    },
    {
      id: "monthly-reports",
      label: "Månadsrapporter",
      icon: FileCheck,
      component: <MonthlyReport clientId={clientId} />,
    },
    {
      id: "vimsa",
      label: "Vimsa",
      icon: Activity,
      component: <VimsaIntegration clientId={clientId} />,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Klientöversikt</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
```

## 📊 Data Integration

### 1. **React Query Integration**

```typescript
// queryClient.ts - Central data management
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuter
      cacheTime: 10 * 60 * 1000, // 10 minuter
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        toast.error("Operation misslyckades");
      },
    },
  },
});

// API request wrapper med authentication
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Add JWT token
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res;
}
```

### 2. **Dashboard Stats Integration**

```typescript
// dashboard-stats.tsx - Statistik på dashboard
export function DashboardStats({ staff }: { staff: Staff[] }) {
  const stats = useMemo(() => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter((s) => s.status === "active").length;
    const adminCount = staff.filter((s) => s.role === "admin").length;
    const staffCount = staff.filter((s) => s.role === "staff").length;

    return { totalStaff, activeStaff, adminCount, staffCount };
  }, [staff]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Personal"
        value={stats.totalStaff}
        icon={Users}
        color="blue"
      />
      <StatCard
        title="Aktiva"
        value={stats.activeStaff}
        icon={UserCheck}
        color="green"
      />
      <StatCard
        title="Administratörer"
        value={stats.adminCount}
        icon={Shield}
        color="purple"
      />
      <StatCard
        title="Personal"
        value={stats.staffCount}
        icon={User}
        color="orange"
      />
    </div>
  );
}
```

## 🔄 State Management

### 1. **Global State med React Context**

```typescript
// AppContext.tsx - Global state management
interface AppContextType {
  currentUser: User | null;
  activeView: string;
  activeStaffId: string | null;
  setActiveView: (view: string) => void;
  setActiveStaffId: (id: string | null) => void;
  setCurrentUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);

  const value = {
    currentUser,
    activeView,
    activeStaffId,
    setActiveView,
    setActiveStaffId,
    setCurrentUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
```

### 2. **Local Storage Integration**

```typescript
// useLocalStorage.ts - Persistent state
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

## 🎯 Performance Optimering

### 1. **Lazy Loading av Komponenter**

```typescript
// Lazy loading för stora komponenter
const CarePlanList = lazy(() => import("@/features/carePlans/CarePlanList"));
const ImplementationPlanList = lazy(
  () => import("@/features/implementationPlans/ImplementationPlanList")
);
const WeeklyDocumentation = lazy(
  () => import("@/features/weeklyDocs/WeeklyDocumentation")
);
const MonthlyReport = lazy(() => import("@/features/reports/MonthlyReport"));
const VimsaIntegration = lazy(
  () => import("@/features/vimsa/VimsaIntegration")
);

// Med Suspense boundaries
<Suspense fallback={<LoadingSpinner />}>
  <CarePlanList clientId={clientId} />
</Suspense>;
```

### 2. **Memoization för Tunga Komponenter**

```typescript
// Memoized komponenter för bättre prestanda
export const StaffCard = memo(({ staff, onClick }: StaffCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {staff.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold">{staff.name}</h3>
            <p className="text-sm text-gray-500">{staff.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
```

## 🔐 Authentication Integration

### 1. **Protected Routes**

```typescript
// ProtectedRoute.tsx - Skydda vyer
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### 2. **Role-based Access Control**

```typescript
// useAuth.tsx - Authentication hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("authToken");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } else {
      throw new Error("Login failed");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return { user, isAuthenticated, isLoading, login, logout };
}
```

## 📱 Responsive Design

### 1. **Mobile Navigation**

```typescript
// Mobile navigation med hamburger menu
export function MobileNavigation({
  staff,
  activeStaffId,
  onStaffSelect,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
        <Menu className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Personal</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <nav className="p-2">
              {staff.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onStaffSelect(member.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg mb-1 ${
                    activeStaffId === member.id
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

**Detta dashboard-system är designat för att vara responsivt, skalbart och användarvänligt med fokus på prestanda och säkerhet.**
