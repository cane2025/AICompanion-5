import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { DashboardItem, deriveRequiresAction } from "../types";
import type { Staff } from "@shared/schema";

export type ViewFilter =
  | "requires"
  | "recent_created"
  | "recent_updated"
  | "waiting"
  | "overdue"
  | "all";

export function useDashboardData(filter: ViewFilter) {
  const staffQ = useQuery({ queryKey: ["/api/staff"], queryFn: api.getStaff });
  const clientsQ = useQuery({ queryKey: ["/api/clients/all"], queryFn: api.getClients });
  const careQ = useQuery({ queryKey: ["/api/care-plans"], queryFn: api.getCarePlans });
  const gfpQ = useQuery({ queryKey: ["/api/implementation-plans"], queryFn: api.getImplementationPlans });
  const weeklyQ = useQuery({ queryKey: ["/api/weekly-documentation"], queryFn: api.getWeeklyDocumentation });
  const vismaQ = useQuery({ queryKey: ["/api/vimsa-time"], queryFn: api.getVimsaTime });

  const loading = staffQ.isLoading || clientsQ.isLoading || careQ.isLoading || gfpQ.isLoading || weeklyQ.isLoading || vismaQ.isLoading;

  const staffById = useMemo(() => {
    const m = new Map<string, Staff>();
    (staffQ.data ?? []).forEach((s: any) => m.set(s.id, s));
    return m;
  }, [staffQ.data]);

  const items = useMemo<DashboardItem[]>(() => {
    const clients = new Map<string, any>();
    (clientsQ.data ?? []).forEach((c: any) => clients.set(c.id, c));

    const makeItem = (base: Partial<DashboardItem> & { id: string; clientId: string; type: DashboardItem["type"] }) => {
      const c = clients.get(base.clientId) || {};
      const s = staffById.get(c.staffId) as any;
      const clientInitials: string = c.initials || "?";
      const clientName: string | undefined = undefined; // GDPR: default hide name
      const assignedStaff = s?.name || "";
      const lastUpdated = base.lastUpdated || new Date().toISOString();
      const status = (base.status as any) || "waiting";
      const it: DashboardItem = {
        id: base.id,
        type: base.type,
        clientId: base.clientId,
        clientInitials,
        clientName,
        carePlanIndex: base.carePlanIndex,
        implPlanIndex: base.implPlanIndex,
        status: status as DashboardItem["status"],
        assignedStaff,
        dueDate: base.dueDate,
        lastUpdated,
        requiresAction: true,
        actionType: base.actionType,
      };
      it.requiresAction = deriveRequiresAction(it);
      return it;
    };

    const careItems = (careQ.data ?? []).map((p: any, idx: number) =>
      makeItem({
        id: p.id,
        type: "carePlan",
        clientId: p.clientId,
        carePlanIndex: idx + 1,
        status: mapCareStatus(p.status),
        lastUpdated: p.updatedAt,
        actionType: p.status === "in_progress" ? "update" : "review",
      })
    );

    const gfpItems = (gfpQ.data ?? []).map((p: any, idx: number) =>
      makeItem({
        id: p.id,
        type: "implementationPlan",
        clientId: p.clientId,
        implPlanIndex: idx + 1,
        status: mapGfpStatus(p.status, p.dueDate),
        dueDate: p.dueDate,
        lastUpdated: p.updatedAt,
        actionType: p.status === "in_progress" ? "update" : p.status === "pending" ? "review" : "complete",
      })
    );

    const weeklyItems = (weeklyQ.data ?? []).map((w: any) =>
      makeItem({
        id: w.id,
        type: "weeklyDoc",
        clientId: w.clientId,
        status: weeklyMissingThisWeek(w) ? "overdue" : "completed",
        lastUpdated: w.updatedAt,
        actionType: "document",
      })
    );

    // We aggregate visma at staff level; still keep items per staff for card
    const vismaItems = (vismaQ.data ?? []).map((v: any) =>
      makeItem({
        id: v.id,
        type: "vismaTime",
        clientId: v.clientId,
        status: v.status === "completed" ? "completed" : "waiting",
        lastUpdated: v.updatedAt,
        actionType: "update",
      })
    );

    let combined = [...careItems, ...gfpItems, ...weeklyItems, ...vismaItems];

    // Filtering rules per top bar
    if (filter === "requires") combined = combined.filter((it) => it.requiresAction);
    if (filter === "waiting") combined = combined.filter((it) => it.status === "waiting");
    if (filter === "overdue") combined = combined.filter((it) => it.status === "overdue");
    // sort: default lastUpdated desc, secondary by created (unknown -> keep updated desc)
    combined.sort((a, b) => (b.lastUpdated || "").localeCompare(a.lastUpdated || ""));

    return combined;
  }, [filter, staffById, clientsQ.data, careQ.data, gfpQ.data, weeklyQ.data, vismaQ.data]);

  return { loading, items, staff: staffQ.data ?? [], care: careQ.data ?? [], gfp: gfpQ.data ?? [], weekly: weeklyQ.data ?? [], visma: vismaQ.data ?? [] };
}

function mapCareStatus(status: string): DashboardItem["status"] {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "active";
  if (status === "staff_notified") return "waiting";
  return "waiting";
}

function mapGfpStatus(status: string, due?: string): DashboardItem["status"] {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "active";
  const overdue = due ? new Date(due) < new Date() : false;
  return overdue ? "overdue" : "waiting";
}

export function weeklyMissingThisWeek(w: any): boolean {
  const now = new Date();
  const week = getISOWeek(now);
  const year = now.getUTCFullYear();
  if (w.week !== week || w.year !== year) return false;
  const documented = [
    w.mondayDocumented,
    w.tuesdayDocumented,
    w.wednesdayDocumented,
    w.thursdayDocumented,
    w.fridayDocumented,
    w.saturdayDocumented,
    w.sundayDocumented,
  ].some(Boolean);
  return !documented;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
