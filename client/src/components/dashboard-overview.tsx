import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Users } from "lucide-react";

interface TodaysFocusData {
  carePlansToReview: number;
  weeklyDocsToComplete: number;
  monthlyReportsDue: number;
  activeStaffToday: number;
}

interface RecentWorkData {
  client: string;
  type: string;
  time: string;
}

interface DashboardOverviewProps {
  todaysFocus: TodaysFocusData;
  recentWork: RecentWorkData[];
}

export function DashboardOverview({ todaysFocus, recentWork }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Today's Focus Panel */}
      <Card className="shadow-sm border border-ungdoms-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-ungdoms-600" />
            📅 IDAG - {new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-900">{todaysFocus.carePlansToReview}</div>
                  <div className="text-sm text-blue-700">vårdplaner att granska</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-semibold text-orange-900">{todaysFocus.weeklyDocsToComplete}</div>
                  <div className="text-sm text-orange-700">veckodokument att slutföra</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-semibold text-green-900">{todaysFocus.monthlyReportsDue}</div>
                  <div className="text-sm text-green-700">månadsrapporter förfaller imorgon</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-semibold text-purple-900">{todaysFocus.activeStaffToday}</div>
                  <div className="text-sm text-purple-700">aktiva personal idag</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Work Panel */}
      <Card className="shadow-sm border border-ungdoms-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-ungdoms-600" />
            🕐 SENAST ARBETAT MED
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentWork.map((work, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-ungdoms-100 rounded-full flex items-center justify-center">
                    <span className="text-ungdoms-700 font-medium text-sm">
                      {work.client}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{work.client} - {work.type}</div>
                    <div className="text-sm text-gray-500">{work.time}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-ungdoms-600 hover:text-ungdoms-700">
                  Öppna
                </Button>
              </div>
            ))}
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-ungdoms-600">
                Visa alla →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}