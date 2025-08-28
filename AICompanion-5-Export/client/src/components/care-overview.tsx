import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardList,
  AlertCircle,
  User,
} from "lucide-react";
import type {
  Staff,
  Client,
  CarePlan,
  ImplementationPlan,
} from "@shared/schema";

interface CareOverviewProps {
  staff: Staff[];
}

export function CareOverview({ staff }: CareOverviewProps) {
  // Fetch all care plans
  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans/all"],
  });

  // Fetch all implementation plans
  const { data: implementationPlans = [] } = useQuery<ImplementationPlan[]>({
    queryKey: ["/api/implementation-plans/all"],
  });

  // Get all clients for context
  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients/all"],
  });

  // Calculate overview statistics
  const totalCarePlans = carePlans.length;
  const totalImplementationPlans = implementationPlans.length;

  // Find care plans without implementation plans
  const carePlansWithoutGFP = carePlans.filter(
    (carePlan) =>
      !implementationPlans.some((gfp) => gfp.clientId === carePlan.clientId)
  );

  // Find incomplete implementation plans (using isActive as status indicator)
  const incompleteImplementationPlans = implementationPlans.filter(
    (plan) => plan.isActive === true
  );

  // Get client names for display
  const getClientName = (clientId: string) => {
    const client = allClients.find((c) => c.id === clientId);
    return client ? client.initials : "Okänd klient";
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find((s) => s.id === staffId);
    return staffMember ? staffMember.name : "Okänd personal";
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-ungdoms-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ungdoms-700">
              Totala Vårdplaner
            </CardTitle>
            <FileText className="h-4 w-4 text-ungdoms-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ungdoms-800">
              {totalCarePlans}
            </div>
            <p className="text-xs text-muted-foreground">
              Registrerade vårdplaner
            </p>
          </CardContent>
        </Card>

        <Card className="border-ungdoms-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-ungdoms-700">
              Genomförandeplaner
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-ungdoms-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ungdoms-800">
              {totalImplementationPlans}
            </div>
            <p className="text-xs text-muted-foreground">Skapade GFP</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Saknar GFP
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {carePlansWithoutGFP.length}
            </div>
            <p className="text-xs text-red-600">
              Vårdplaner utan genomförandeplan
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Ofullständiga GFP
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {incompleteImplementationPlans.length}
            </div>
            <p className="text-xs text-orange-600">
              Pågående genomförandeplaner
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for missing or incomplete plans */}
      {carePlansWithoutGFP.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">
            Vårdplaner som saknar genomförandeplan ({carePlansWithoutGFP.length}
            )
          </AlertTitle>
          <AlertDescription className="text-red-700">
            Dessa klienter har vårdplaner men saknar genomförandeplaner (GFP).
            Detta behöver åtgärdas.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed View Tabs */}
      <Tabs defaultValue="missing-gfp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="missing-gfp">Saknar GFP</TabsTrigger>
          <TabsTrigger value="incomplete-gfp">Ofullständiga GFP</TabsTrigger>
          <TabsTrigger value="all-care-plans">Alla Vårdplaner</TabsTrigger>
        </TabsList>

        <TabsContent value="missing-gfp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ungdoms-800">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Vårdplaner som saknar genomförandeplan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carePlansWithoutGFP.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Alla vårdplaner har genomförandeplaner! 🎉</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {carePlansWithoutGFP.map((carePlan) => (
                    <div
                      key={carePlan.id}
                      className="border border-red-200 rounded-lg p-4 bg-red-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-800">
                            {getClientName(carePlan.clientId)}
                          </h4>
                          <p className="text-sm text-red-600">
                            Personal: {getStaffName(carePlan.staffId)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vårdplan skapad:{" "}
                            {carePlan.createdAt
                              ? new Date(carePlan.createdAt).toLocaleDateString(
                                  "sv-SE"
                                )
                              : "Okänt datum"}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Saknar GFP
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incomplete-gfp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ungdoms-800">
                <Clock className="h-5 w-5 text-orange-500" />
                Ofullständiga genomförandeplaner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incompleteImplementationPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Alla genomförandeplaner är slutförda!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incompleteImplementationPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-orange-800">
                            {getClientName(plan.clientId)}
                          </h4>
                          <p className="text-sm text-orange-600">
                            Status: {plan.isActive ? "Aktiv" : "Inaktiv"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Senast uppdaterad:{" "}
                            {plan.updatedAt
                              ? new Date(plan.updatedAt).toLocaleDateString(
                                  "sv-SE"
                                )
                              : "Okänt datum"}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {plan.isActive ? "Pågående" : "Inaktiv"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-care-plans">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ungdoms-800">
                <FileText className="h-5 w-5" />
                Alla vårdplaner ({totalCarePlans})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carePlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Inga vårdplaner registrerade ännu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {carePlans.map((carePlan) => {
                    const hasGFP = implementationPlans.some(
                      (gfp) => gfp.clientId === carePlan.clientId
                    );
                    const gfp = implementationPlans.find(
                      (gfp) => gfp.clientId === carePlan.clientId
                    );

                    return (
                      <div
                        key={carePlan.id}
                        className="border border-ungdoms-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-ungdoms-800">
                              {getClientName(carePlan.clientId)}
                            </h4>
                            <p className="text-sm text-ungdoms-600">
                              Personal: {getStaffName(carePlan.staffId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Skapad:{" "}
                              {carePlan.createdAt
                                ? new Date(
                                    carePlan.createdAt
                                  ).toLocaleDateString("sv-SE")
                                : "Okänt datum"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className="border-ungdoms-200"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Vårdplan
                            </Badge>
                            {hasGFP ? (
                              <Badge
                                variant={
                                  !gfp?.isActive ? "default" : "secondary"
                                }
                                className={
                                  !gfp?.isActive
                                    ? "bg-green-600"
                                    : "bg-orange-100 text-orange-800"
                                }
                              >
                                {!gfp?.isActive ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                GFP {!gfp?.isActive ? "Slutförd" : "Pågående"}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Saknar GFP
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
