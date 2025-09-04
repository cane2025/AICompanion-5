import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

interface Props {
  staff: any[];
  weekly: any[];
}

const COLORS = ["#4c6ef5", "#e0e7ff"]; // approved vs remaining

export function TeamStatsCard({ staff, weekly }: Props) {
  // Simple mock metrics derived from weekly docs
  const documentedDays = weekly.length; // proxy
  const targetDays = Math.max(1, staff.length * 5);
  const percent = Math.min(100, Math.round((documentedDays / targetDays) * 100));

  const lineData = Array.from({ length: 8 }).map((_, i) => ({
    x: i + 1,
    y: Math.max(10, Math.min(90, percent + (i - 4) * 3)),
  }));

  const donutData = [
    { name: "Godkänt", value: Math.max(0, Math.min(100, 83)) },
    { name: "Övrigt", value: 100 - Math.max(0, Math.min(100, 83)) },
  ];

  return (
    <Card className="shadow-sm min-h-[220px]">
      <CardHeader>
        <CardTitle>Personalstatistik – hela teamet ({staff.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="x" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="y" stroke="#4c6ef5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-40 flex items-center justify-center">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={donutData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <div className="text-2xl font-bold">83%</div>
              <div className="text-xs text-muted-foreground">Kvalitet godkänd</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

