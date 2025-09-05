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

export function GFPCard({ items, total, page, pages, onPageChange, isLoading }: Props) {
  const x = items.filter((p) => ["waiting", "active", "overdue"].includes(map(p.status)));
  return (
    <Card className="min-h-[220px] shadow-sm">
      <CardHeader>
        <CardTitle>GFP – kräver åtgärd ({x.length} av {total})</CardTitle>
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
            {x.map((p: any, idx: number) => (
              <div key={p.id ?? idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="truncate">
                  <span className="font-medium mr-1">{p.clientInitials ?? "?"}</span>
                  {p.clientName ? <span className="text-muted-foreground">({p.clientName})</span> : null}
                  <span className="mx-2">–</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${clsxChips(map(p.status))}`}>{label(map(p.status))}</span>
                  {p.dueDate && (
                    <span className="ml-2 text-muted-foreground">Deadline: {new Date(p.dueDate).toLocaleDateString("sv-SE")}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {map(p.status) === "waiting" && <Button size="sm">Granska</Button>}
                  {map(p.status) === "active" && <Button size="sm">Uppdatera</Button>}
                  {map(p.status) === "overdue" && <Button size="sm" variant="destructive">Åtgärda</Button>}
                </div>
              </div>
            ))}
            {x.length === 0 && <div className="text-sm text-muted-foreground">Inget att visa.</div>}
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
  if (s === "pending") return "waiting";
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

