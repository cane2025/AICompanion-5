import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clsxChips } from "../utils";

type Props = {
  items: any[];
  total: number;
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
  isLoading?: boolean;
};

export function CarePlansCard({ items, total, page, pages, onPageChange, isLoading }: Props) {
  return (
    <Card className="min-h-[220px] shadow-sm">
      <CardHeader>
        <CardTitle>Vårdplaner</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((cp: any, idx: number) => (
              <div key={cp.id ?? idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="truncate">
                  <span className="font-medium mr-1">{cp.clientInitials ?? "?"}</span>
                  {cp.clientName ? <span className="text-muted-foreground">({cp.clientName})</span> : null}
                  <span className="mx-2">–</span>
                  <span className="text-muted-foreground">Vårdplan</span>
                  {cp.planType ? <span className="ml-1">#{cp.planType}</span> : null}
                  <span className="mx-2">–</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${clsxChips(map(cp.status))}`}>{label(map(cp.status))}</span>
                  <span className="mx-2">–</span>
                  <span className="text-muted-foreground">Ansvarig: {cp.responsibleName ?? cp.staffName ?? "-"}</span>
                  {cp.updatedAt && (
                    <span className="ml-2 text-muted-foreground">Uppd: {new Date(cp.updatedAt).toLocaleDateString("sv-SE")}</span>
                  )}
                </div>
                <div className="shrink-0">
                  <Button size="sm">Granska</Button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-muted-foreground">Inget att visa.</div>}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Sida {page} / {pages} ({total} rader)
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>Föregående</Button>
            <Button size="sm" variant="outline" onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page >= pages}>Nästa</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function map(v: any): "waiting" | "active" | "overdue" | "completed" {
  if (!v) return "waiting";
  const s = String(v);
  if (s === "in_progress" || s === "active") return "active";
  if (s === "completed") return "completed";
  if (s === "overdue") return "overdue";
  return "waiting";
}

function label(s: ReturnType<typeof map>) {
  switch (s) {
    case "waiting":
      return "Väntar";
    case "active":
      return "Aktiv";
    case "overdue":
      return "Försenad";
    case "completed":
      return "Slutförd";
  }
}

