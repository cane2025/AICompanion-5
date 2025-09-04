import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VimsaTime, Staff } from "@shared/schema";

type Props = {
  vimsa: VimsaTime[];
  staff: Staff[];
};

export function VismaCard({ vimsa, staff }: Props) {
  const current = new Date();
  const month = current.getMonth() + 1;
  const staffMap = new Map(staff.map((s) => [s.id, s] as const));

  const notReported = staff.filter((s) => {
    const rows = vimsa.filter((v) => v.staffId === s.id && getMonthFromWeek(v.year, v.week) === month);
    return rows.length === 0;
  });

  return (
    <Card className="min-h-[220px] shadow-sm">
      <CardHeader>
        <CardTitle>Visma tid</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notReported.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <span className="font-medium">{s.initials}</span>
                <span className="ml-2 text-muted-foreground">{formatMonth(current)} – 0 / {s.weeklyCapacityHours * 4} h</span>
              </div>
              <Button size="sm">Rapportera</Button>
            </div>
          ))}
          {notReported.length === 0 && (
            <div className="text-sm text-muted-foreground">Alla har rapporterat denna månad.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getMonthFromWeek(year: number, week: number): number {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  return simple.getMonth() + 1;
}

function formatMonth(d: Date) {
  const months = ["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

