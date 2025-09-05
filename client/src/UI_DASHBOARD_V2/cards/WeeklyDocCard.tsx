import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklyDocumentation, Staff } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  weeklyDocs: WeeklyDocumentation[];
  staff: Staff[];
  isLoading?: boolean;
};

export function WeeklyDocCard({ weeklyDocs, staff, isLoading }: Props) {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const missingByStaff = new Map<string, { staff: Staff; count: number }>();

  for (const s of staff) missingByStaff.set(s.id, { staff: s, count: 0 });

  for (const doc of weeklyDocs) {
    if (doc.week === currentWeek && !doc.mondayDocumented && !doc.tuesdayDocumented && !doc.wednesdayDocumented && !doc.thursdayDocumented && !doc.fridayDocumented && !doc.saturdayDocumented && !doc.sundayDocumented) {
      const entry = missingByStaff.get(doc.staffId);
      if (entry) entry.count += 1;
    }
  }

  const rows = Array.from(missingByStaff.values()).filter((r) => r.count > 0);

  return (
    <Card className="min-h-[220px] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Veckodokumentation</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">Öppna lista</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Klienter utan dokumentation – vecka {currentWeek}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {rows.map(({ staff, count }) => (
                <div key={staff.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">{staff.name}</span>
                    <span className="ml-2 text-muted-foreground">Saknas {count}</span>
                  </div>
                  <Button size="sm">Dokumentera</Button>
                </div>
              ))}
              {rows.length === 0 && <div className="text-sm text-muted-foreground">Alla i fas 👍</div>}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(({ staff, count }) => (
              <div key={staff.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <span className="font-medium">{staff.name}</span>
                  <span className="ml-2 text-muted-foreground">Saknas {count} klient(er) – vecka {currentWeek}</span>
                </div>
                <Button size="sm">Dokumentera</Button>
              </div>
            ))}
            {rows.length === 0 && <div className="text-sm text-muted-foreground">Alla har dokumenterat denna vecka.</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

