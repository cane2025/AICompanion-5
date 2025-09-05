import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { groupBy } from "./utils/groupBy";
import { Staff } from "@shared/schema";
import * as api from "@/lib/api";

import { DashboardTopFilters, FilterKey } from "./components/TopFilters";
import { CarePlansCard } from "./components/cards/CarePlansCard";
import { GfpCard } from "./components/cards/GfpCard";
import { WeeklyDocCard } from "./components/cards/WeeklyDocCard";
import { VismaTimeCard } from "./components/cards/VismaTimeCard";
import { TeamStatsCard } from "./components/cards/TeamStatsCard";

export function DashboardV2() {
  const [filterKey, setFilterKey] = useState<FilterKey>("requires");

  const {
    data: staff = [],
    isLoading: staffLoading,
  } = useQuery<Staff[]>({ queryKey: ["/api/staff"], queryFn: api.getStaff });

  // Batch fetch lists used in cards in parallel via React Query (avoids N+1)
  const carePlansQ = useQuery({ queryKey: ["/api/care-plans"], queryFn: api.getCarePlans });
  const gfpQ = useQuery({ queryKey: ["/api/implementation-plans"], queryFn: api.getImplementationPlans });
  const weeklyQ = useQuery({ queryKey: ["/api/weekly-documentation"], queryFn: api.getWeeklyDocumentation });
  const vismaQ = useQuery({ queryKey: ["/api/vimsa-time"], queryFn: api.getVimsaTime });

  const anyLoading = staffLoading || carePlansQ.isLoading || gfpQ.isLoading || weeklyQ.isLoading || vismaQ.isLoading;

  const staffById = useMemo(() => {
    const map = new Map<string, Staff>();
    staff.forEach((s: any) => map.set(s.id, s));
    return map;
  }, [staff]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Vårdadmin – Dashboard</h2>
          <p className="text-sm text-muted-foreground">Handlingsfokuserad översikt</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">+ Ny vårdplan</Button>
      </div>

      <DashboardTopFilters value={filterKey} onChange={setFilterKey} />

      {anyLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="min-h-[220px] shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Laddar...</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-28 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          {/* Row 1 */}
          <CarePlansCard 
            filterKey={filterKey}
            carePlans={carePlansQ.data ?? []}
            staffById={staffById}
          />
          <WeeklyDocCard 
            filterKey={filterKey}
            weeklyDocs={weeklyQ.data ?? []}
            staff={staff}
          />

          {/* Row 2 */}
          <GfpCard 
            filterKey={filterKey}
            gfps={gfpQ.data ?? []}
            staffById={staffById}
          />
          <TeamStatsCard staff={staff} weekly={weeklyQ.data ?? []} />

          {/* Row 3 */}
          <VismaTimeCard filterKey={filterKey} visma={vismaQ.data ?? []} staff={staff} />
        </div>
      )}
    </div>
  );
}

export default DashboardV2;
