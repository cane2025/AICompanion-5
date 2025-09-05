# CRUD-operationer & Skalbarhet - AICompanion-5

## 📊 Översikt över CRUD-systemet

Systemet använder en konsekvent arkitektur för alla CRUD-operationer:

### 1. **React Query Pattern**

```typescript
// Standard CRUD hook
const useCarePlans = (clientId: string) => {
  return useQuery({
    queryKey: ["/api/care-plans", clientId],
    queryFn: () => api.getCarePlans(clientId),
    staleTime: 5 * 60 * 1000, // 5 minuter
  });
};

// Mutation hook
const useCreateCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createCarePlan,
    onSuccess: (data, variables) => {
      // Invalidera cache
      queryClient.invalidateQueries({
        queryKey: ["/api/care-plans", variables.clientId],
      });
      // Optimistic update
      queryClient.setQueryData(
        ["/api/care-plans", variables.clientId],
        (old: any) => [...(old || []), data]
      );
    },
  });
};
```

### 2. **API Layer Pattern**

```typescript
// Standard API funktioner
export const getCarePlans = async (clientId: string): Promise<CarePlan[]> => {
  const response = await apiRequest("GET", `/care-plans?clientId=${clientId}`);
  return response.json();
};

export const createCarePlan = async (
  data: CreateCarePlanData
): Promise<CarePlan> => {
  const response = await apiRequest("POST", "/care-plans", data);
  return response.json();
};

export const updateCarePlan = async (
  id: string,
  data: UpdateCarePlanData
): Promise<CarePlan> => {
  const response = await apiRequest("PUT", `/care-plans/${id}`, data);
  return response.json();
};

export const deleteCarePlan = async (id: string): Promise<void> => {
  await apiRequest("DELETE", `/care-plans/${id}`);
};
```

## 🏗️ Komponentstruktur för CRUD

### 1. **List Component Pattern**

```typescript
// CarePlanList.tsx
export function CarePlanList({ clientId }: { clientId: string }) {
  const { data: carePlans = [], isLoading, error } = useCarePlans(clientId);
  const createMutation = useCreateCarePlan();
  const updateMutation = useUpdateCarePlan();
  const deleteMutation = useDeleteCarePlan();

  // Search & Filter
  const { filteredData, searchTerm, setSearchTerm, filters, setFilters } =
    useSmartSearch(carePlans, {
      keys: ["title", "goals", "status"],
      threshold: 0.3,
    });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="grid gap-4">
        {filteredData.map((plan) => (
          <CarePlanCard
            key={plan.id}
            plan={plan}
            onEdit={(data) => updateMutation.mutate({ id: plan.id, ...data })}
            onDelete={() => deleteMutation.mutate(plan.id)}
          />
        ))}
      </div>

      <CreateCarePlanDialog
        clientId={clientId}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}
```

### 2. **Dialog Component Pattern**

```typescript
// CarePlanDialog.tsx
export function CarePlanDialog({
  plan,
  clientId,
  onSubmit,
  onClose,
}: CarePlanDialogProps) {
  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: plan || {
      title: "",
      goals: [],
      interventions: "",
      status: "draft",
      clientId,
    },
  });

  const handleSubmit = (data: CarePlanFormData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {plan ? "Redigera vårdplan" : "Skapa ny vårdplan"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fler fält... */}

            <DialogFooter>
              <Button type="submit">
                {plan ? "Spara ändringar" : "Skapa vårdplan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

## 🔄 Optimistic Updates & Error Handling

### 1. **Optimistic Updates**

```typescript
const useUpdateCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateCarePlan,
    onMutate: async (variables) => {
      // Avbryt outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["/api/care-plans", variables.clientId],
      });

      // Snapshot tidigare värde
      const previousCarePlans = queryClient.getQueryData([
        "/api/care-plans",
        variables.clientId,
      ]);

      // Optimistic update
      queryClient.setQueryData(
        ["/api/care-plans", variables.clientId],
        (old: CarePlan[]) =>
          old?.map((plan) =>
            plan.id === variables.id ? { ...plan, ...variables } : plan
          )
      );

      return { previousCarePlans };
    },
    onError: (err, variables, context) => {
      // Återställ vid fel
      if (context?.previousCarePlans) {
        queryClient.setQueryData(
          ["/api/care-plans", variables.clientId],
          context.previousCarePlans
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidera cache
      queryClient.invalidateQueries({
        queryKey: ["/api/care-plans", variables.clientId],
      });
    },
  });
};
```

### 2. **Error Boundaries**

```typescript
// ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Skicka till Sentry eller annan error tracking
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Något gick fel</h2>
          <p>Ett oväntat fel inträffade i systemet.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Försök igen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 📈 Skalbarhet & Prestanda

### 1. **Pagination & Virtualization**

```typescript
// För stora datamängder
const usePaginatedCarePlans = (clientId: string, page: number = 1) => {
  return useQuery({
    queryKey: ["/api/care-plans", clientId, page],
    queryFn: () => api.getCarePlans(clientId, { page, limit: 20 }),
    keepPreviousData: true, // Behåll tidigare data under laddning
  });
};

// Virtualized list för mycket stora listor
import { FixedSizeList as List } from "react-window";

const VirtualizedCarePlanList = ({ carePlans }: { carePlans: CarePlan[] }) => {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <CarePlanCard plan={carePlans[index]} />
    </div>
  );

  return (
    <List height={600} itemCount={carePlans.length} itemSize={120} width="100%">
      {Row}
    </List>
  );
};
```

### 2. **Caching Strategy**

```typescript
// React Query konfiguration för optimal caching
const queryClient = new QueryClient({
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
```

### 3. **Background Sync**

```typescript
// Offline support med background sync
class SyncManager {
  private db: IDBDatabase;
  private syncQueue: SyncOperation[] = [];

  async queueOperation(operation: SyncOperation) {
    await this.db.add("syncQueue", operation);

    if (navigator.onLine) {
      await this.sync();
    }
  }

  async sync() {
    const queue = await this.db.getAll("syncQueue");

    for (const op of queue) {
      try {
        await this.executeOperation(op);
        await this.db.delete("syncQueue", op.id);
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }
  }

  private async executeOperation(op: SyncOperation) {
    switch (op.type) {
      case "CREATE_CARE_PLAN":
        await api.createCarePlan(op.data);
        break;
      case "UPDATE_CARE_PLAN":
        await api.updateCarePlan(op.id, op.data);
        break;
      case "DELETE_CARE_PLAN":
        await api.deleteCarePlan(op.id);
        break;
    }
  }
}
```

## 🔐 Säkerhet & Validering

### 1. **Input Validation**

```typescript
// Zod schemas för alla inputs
export const carePlanSchema = z.object({
  title: z.string().min(1, "Titel krävs").max(255, "Titel för lång"),
  goals: z.array(z.string().min(1, "Mål krävs")),
  interventions: z.string().max(1000, "Interventioner för långa"),
  status: z.enum(["draft", "active", "completed"]),
  clientId: z.string().uuid("Ogiltigt klient-ID"),
  staffId: z.string().uuid("Ogiltigt personal-ID"),
});

// Server-side validation
export const validateCarePlan = (data: any) => {
  return carePlanSchema.parse(data);
};
```

### 2. **Authorization**

```typescript
// Role-based access control
const useAuthorizedMutation = (requiredRole: string) => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: api.createCarePlan,
    onMutate: () => {
      if (user.role !== requiredRole && user.role !== "admin") {
        throw new Error("Otillräckliga behörigheter");
      }
    },
  });
};
```

## 📊 Monitoring & Analytics

### 1. **Performance Tracking**

```typescript
// Mät CRUD-operationer
const useTrackedMutation = (operation: string) => {
  return useMutation({
    mutationFn: api.createCarePlan,
    onMutate: () => {
      performance.mark(`${operation}-start`);
    },
    onSuccess: () => {
      performance.mark(`${operation}-end`);
      performance.measure(operation, `${operation}-start`, `${operation}-end`);

      // Skicka till analytics
      analytics.track("CRUD_Operation", {
        operation,
        duration: performance.getEntriesByName(operation)[0].duration,
      });
    },
  });
};
```

### 2. **Error Tracking**

```typescript
// Strukturerad error logging
const logError = (error: Error, context: any) => {
  console.error("CRUD Error:", {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  // Skicka till Sentry
  Sentry.captureException(error, {
    extra: context,
  });
};
```

## 🚀 Deployment & Production

### 1. **Database Migration**

```sql
-- PostgreSQL schema för produktion
CREATE TABLE care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  title VARCHAR(255) NOT NULL,
  goals TEXT,
  interventions TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES staff(id),
  version INT DEFAULT 1,
  deleted_at TIMESTAMP,
  audit_log JSONB DEFAULT '[]'::jsonb
);

-- Index för performance
CREATE INDEX idx_care_plans_client_id ON care_plans(client_id);
CREATE INDEX idx_care_plans_status ON care_plans(status);
CREATE INDEX idx_care_plans_created_at ON care_plans(created_at DESC);
```

### 2. **Rate Limiting**

```typescript
// API rate limiting
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 100, // max 100 requests per windowMs
  message: "För många requests, försök igen senare",
});

app.use("/api/", apiLimiter);
```

---

**Detta CRUD-system är designat för att hantera stora datamängder, vara skalbart och säkert för produktionsanvändning.**
