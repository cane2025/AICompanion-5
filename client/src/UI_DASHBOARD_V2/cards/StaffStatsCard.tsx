import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import type { WeeklyDocumentation, Staff } from "@shared/schema";

type Props = {
  weeklyDocs: WeeklyDocumentation[];
  staff: Staff[];
};

export function StaffStatsCard({ weeklyDocs, staff }: Props) {
  // Build a tiny synthetic series for documentation trend
  const data = Array.from({ length: 8 }).map((_, i) => {
    const week = i + 1;
    const documented = weeklyDocs.filter((d) => d.week % 8 === week && (d.mondayDocumented || d.tuesdayDocumented || d.wednesdayDocumented || d.thursdayDocumented || d.fridayDocumented || d.saturdayDocumented || d.sundayDocumented)).length;
    return { name: `${week}`, value: documented };
  });

  const approvedPct = 0.83; // placeholder aggregate target

  return (
    <Card className="min-h-[220px] shadow-sm">
      <CardHeader>
        <CardTitle>Personalstatistik – hela teamet ({staff.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center">
            <PieChart width={160} height={160}>
              <Pie data={[{ name: "approved", value: Math.round(approvedPct * 100) }, { name: "rest", value: 100 - Math.round(approvedPct * 100) }]} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270}>
                <Cell fill="#16a34a" />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>
            <div className="-ml-24 text-center">
              <div className="text-2xl font-bold">{Math.round(approvedPct * 100)}%</div>
              <div className="text-xs text-muted-foreground">Kvalitet godkänd</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

