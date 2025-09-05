import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useDashboardData } from "./api";
import { filterRequiresAction, type TopFilterKey } from "./types";
import { paginate } from "./utils";
import { StaffStatsCard } from "./cards/StaffStatsCard";
import { CarePlansCard } from "./cards/CarePlansCard";
import { GFPCard } from "./cards/GFPCard";
import { WeeklyDocCard } from "./cards/WeeklyDocCard";
import { VismaCard } from "./cards/VismaCard";

export function DashboardV2() {
  const { staff, carePlans, implementationPlans, weeklyDocs, vimsaTime, isLoading, isError } = useDashboardData();
  const [filter, setFilter] = useState<TopFilterKey>("recentUpdated");
  const [pageCare, setPageCare] = useState(1);
  const [pageGfp, setPageGfp] = useState(1);

  const pageSize = 10;

  const filteredCare = useMemo(() => {
    const base = filter === "showAll" ? carePlans : carePlans.filter((cp: any) => ["waiting", "active", "overdue"].includes(mapStatus(cp.status)));
    return sortByFilter(base, filter);
  }, [carePlans, filter]);

  const filteredGfp = useMemo(() => {
    const base = implementationPlans.filter((p: any) => ["waiting", "active", "overdue"].includes(mapStatus(p.status)));
    return sortByFilter(base, filter);
  }, [implementationPlans, filter]);

  const carePage = paginate(filteredCare, pageCare, pageSize);
  const gfpPage = paginate(filteredGfp, pageGfp, pageSize);

  if (isError) {
    return <div className="p-6 text-red-600">Kunde inte ladda dashboard.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Vårdadmin – Dashboard</h2>
          <p className="text-muted-foreground">Översikt och åtgärder</p>
        </div>
        <Button className="bg-blue-600 text-white"><Plus className="h-4 w-4 mr-2"/>Ny vårdplan</Button>
      </div>

      {/* Top filter row */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as TopFilterKey)} className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="recentCreated">Senast skapade</TabsTrigger>
          <TabsTrigger value="recentUpdated">Senast uppdaterade</TabsTrigger>
          <TabsTrigger value="onlyWaiting">Endast väntande</TabsTrigger>
          <TabsTrigger value="onlyOverdue">Endast försenade</TabsTrigger>
          <TabsTrigger value="showAll">Visa alla</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1 */}
        <div className="space-y-6">
          <CarePlansCard items={carePage.pageItems} total={carePage.total} page={pageCare} pages={carePage.pages} onPageChange={setPageCare} isLoading={isLoading} />
          <GFPCard items={gfpPage.pageItems} total={gfpPage.total} page={pageGfp} pages={gfpPage.pages} onPageChange={setPageGfp} isLoading={isLoading} />
        </div>

        {/* Column 2 */}
        <div className="space-y-6">
          <WeeklyDocCard weeklyDocs={weeklyDocs} staff={staff} isLoading={isLoading} />
          <StaffStatsCard weeklyDocs={weeklyDocs} staff={staff} />
          <VismaCard vimsa={vimsaTime} staff={staff} />
        </div>
      </div>

      {/* Empty state */}
      {!isLoading && filteredCare.length === 0 && filteredGfp.length === 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Allt i fas 👍</CardTitle></CardHeader>
          <CardContent>Inga åtgärder krävs just nu.</CardContent>
        </Card>
      )}
    </div>
  );
}

function sortByFilter<T extends { createdAt?: any; updatedAt?: any }>(arr: T[], filter: TopFilterKey): T[] {
  const cloned = arr.slice();
  switch (filter) {
    case "recentCreated":
      return cloned.sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    case "onlyWaiting":
      return cloned.filter((it: any) => mapStatus(it.status) === "waiting").sort((a: any, b: any) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime());
    case "onlyOverdue":
      return cloned.filter((it: any) => mapStatus(it.status) === "overdue").sort((a: any, b: any) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime());
    case "recentUpdated":
    default:
      return cloned.sort((a: any, b: any) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime());
  }
}

function mapStatus(input: any): "waiting" | "active" | "overdue" | "completed" {
  if (!input) return "waiting";
  const v = String(input);
  if (v === "in_progress" || v === "active") return "active";
  if (v === "pending" || v === "received" || v === "staff_notified") return "waiting";
  if (v === "completed") return "completed";
  if (v === "overdue") return "overdue";
  return "waiting";
}

