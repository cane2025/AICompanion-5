import { useQuery } from "@tanstack/react-query";
import type { Staff, CarePlan, ImplementationPlan, WeeklyDocumentation, VimsaTime } from "@shared/schema";

export function useDashboardData() {
  // Batch queries in parallel; react-query dedupes and caches
  const staffQ = useQuery<Staff[]>({ queryKey: ["/api/staff"], queryFn: () => fetch("/api/staff").then(r => r.json()) });
  const carePlansQ = useQuery<CarePlan[]>({ queryKey: ["/api/care-plans/all"], queryFn: () => fetch("/api/care-plans/all").then(r => r.json()) });
  const implPlansQ = useQuery<ImplementationPlan[]>({ queryKey: ["/api/implementation-plans/all"], queryFn: () => fetch("/api/implementation-plans/all").then(r => r.json()) });
  const weeklyDocsQ = useQuery<WeeklyDocumentation[]>({ queryKey: ["/api/weekly-documentation/all"], queryFn: () => fetch("/api/weekly-documentation/all").then(r => r.json()) });
  const vimsaQ = useQuery<VimsaTime[]>({ queryKey: ["/api/vimsa-time/all"], queryFn: () => fetch("/api/vimsa-time/all").then(r => r.json()) });

  const isLoading = staffQ.isLoading || carePlansQ.isLoading || implPlansQ.isLoading || weeklyDocsQ.isLoading || vimsaQ.isLoading;
  const isError = staffQ.isError || carePlansQ.isError || implPlansQ.isError || weeklyDocsQ.isError || vimsaQ.isError;

  return {
    staff: staffQ.data ?? [],
    carePlans: carePlansQ.data ?? [],
    implementationPlans: implPlansQ.data ?? [],
    weeklyDocs: weeklyDocsQ.data ?? [],
    vimsaTime: vimsaQ.data ?? [],
    isLoading,
    isError,
  };
}

