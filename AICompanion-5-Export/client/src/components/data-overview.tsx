import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Eye
} from "lucide-react";
import type { 
  CarePlan, 
  WeeklyDocumentation, 
  MonthlyReport, 
  Staff, 
  Client 
} from "@shared/schema";

export function DataOverview() {
  // Fetch all data
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans/all"],
  });

  const { data: weeklyDocs = [] } = useQuery<WeeklyDocumentation[]>({
    queryKey: ["/api/weekly-documentation/all"],
  });

  const { data: monthlyReports = [] } = useQuery<any[]>({
    queryKey: ["/api/monthly-reports/all"],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients/all"],
  });

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.name : "Okänd personal";
  };

  const getClientInitials = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.initials : "Okänd klient";
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "Ej angivet";
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ungdoms-800">Dataöversikt</h3>
        <div className="flex gap-2 text-sm text-ungdoms-600">
          <span>Total: {carePlans.length + weeklyDocs.length + monthlyReports.length} poster</span>
        </div>
      </div>

      <Tabs defaultValue="care-plans" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="care-plans">
            Vårdplaner ({carePlans.length})
          </TabsTrigger>
          <TabsTrigger value="weekly-docs">
            Veckodokumentation ({weeklyDocs.length})
          </TabsTrigger>
          <TabsTrigger value="monthly-reports">
            Månadsrapporter ({monthlyReports.length})
          </TabsTrigger>
          <TabsTrigger value="clients">
            Klienter ({clients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="care-plans">
          <div className="space-y-4">
            {carePlans.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Inga vårdplaner skapade ännu</p>
                </CardContent>
              </Card>
            ) : (
              carePlans.map((plan) => (
                <Card key={plan.id} className="border-ungdoms-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium">
                          {getClientInitials(plan.clientId)} - {getStaffName(plan.staffId)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Skapad: {formatDate(plan.createdAt)}
                        </p>
                      </div>
                      <Badge 
                        className={
                          plan.status === "completed" ? "bg-green-100 text-green-800" :
                          plan.status === "staff_notified" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {plan.status === "completed" ? "Klar" :
                         plan.status === "staff_notified" ? "Personal notifierad" :
                         "Pågående"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span>Mottagen: {formatDate(plan.receivedDate)}</span>
                        {plan.enteredJournalDate && (
                          <span>• JD: {formatDate(plan.enteredJournalDate)}</span>
                        )}
                      </div>
                      {plan.planContent && (
                        <p className="text-xs text-muted-foreground truncate">
                          {plan.planContent}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="weekly-docs">
          <div className="space-y-4">
            {weeklyDocs.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Ingen veckodokumentation skapad ännu</p>
                </CardContent>
              </Card>
            ) : (
              weeklyDocs.map((doc) => (
                <Card key={doc.id} className="border-ungdoms-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium">
                          {getClientInitials(doc.clientId)} - Vecka {doc.week}, {doc.year}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Personal: {getStaffName(doc.staffId)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={doc.approved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {doc.approved ? "Godkänd" : "Ej godkänd"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-xs">
                        <span>Dokumenterade dagar:</span>
                        <div className="flex gap-1">
                          {doc.mondayDocumented && <Badge variant="secondary" className="text-xs px-1">Mån</Badge>}
                          {doc.tuesdayDocumented && <Badge variant="secondary" className="text-xs px-1">Tis</Badge>}
                          {doc.wednesdayDocumented && <Badge variant="secondary" className="text-xs px-1">Ons</Badge>}
                          {doc.thursdayDocumented && <Badge variant="secondary" className="text-xs px-1">Tor</Badge>}
                          {doc.fridayDocumented && <Badge variant="secondary" className="text-xs px-1">Fre</Badge>}
                        </div>
                      </div>
                      {doc.documentation && (
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.documentation}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="monthly-reports">
          <div className="space-y-4">
            {monthlyReports.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Inga månadsrapporter skapade ännu</p>
                </CardContent>
              </Card>
            ) : (
              monthlyReports.map((report) => (
                <Card key={report.id} className="border-ungdoms-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium">
                          Månadsrapport - {report.month}/{report.year}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Skapad: {formatDate(report.createdAt)}
                        </p>
                      </div>
                      <Badge 
                        className={
                          report.status === "completed" ? "bg-green-100 text-green-800" :
                          report.status === "reviewed" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {report.status === "completed" ? "Inskickad" :
                          report.status === "late" ? "Försenad" :
                          report.status === "in_progress" ? "Pågående" :
                          "Ej startad"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {report.reportContent && (
                      <p className="text-xs text-muted-foreground truncate">
                        {report.reportContent}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <div className="space-y-4">
            {clients.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Inga klienter registrerade ännu</p>
                </CardContent>
              </Card>
            ) : (
              clients.map((client) => (
                <Card key={client.id} className="border-ungdoms-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium">
                          {client.initials}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Ansvarig: {getStaffName(client.staffId)}
                        </p>
                      </div>
                      <Badge className={client.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {client.status === "active" ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Registrerad: {formatDate(client.createdAt)}
                      </p>
                      {client.notes && (
                        <p className="text-xs text-muted-foreground truncate">
                          {client.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}