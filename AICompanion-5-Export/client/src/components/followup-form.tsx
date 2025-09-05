import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, ClipboardList, Clock, Users } from "lucide-react";
import { AddClientDialog } from "./add-client-dialog";
import { ClientDetailsDialog } from "./client-details-dialog";
import { SimpleCarePlanDialog } from "./simple-care-plan-dialog";
import { UngdomsLogo } from "./ungdoms-logo";
import type { Staff, Client } from "@shared/schema";

interface ClientManagementProps {
  staff: Staff;
}

export function ClientManagement({ staff }: ClientManagementProps) {
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/staff", staff.id, "clients"],
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar klienter...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UNGDOMS Header */}
      <div className="ungdoms-header p-6 rounded-lg shadow-lg">
        <UngdomsLogo />
      </div>

      {/* Add Client Button */}
      <Card className="shadow-sm border-ungdoms-600">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Klienthantering</CardTitle>
          <AddClientDialog staff={staff} />
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Inga klienter registrerade än
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client: any) => (
                <Card
                  key={client.id}
                  className="border-ungdoms-600 hover:shadow-lg hover:shadow-ungdoms-500/20 transition-all duration-300 bg-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 bg-ungdoms-500/20 border border-ungdoms-400 rounded-full flex items-center justify-center">
                        <span className="text-ungdoms-300 font-semibold">
                          {client.initials}
                        </span>
                      </div>
                      <ClientDetailsDialog client={client} />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">
                      {client.initials}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-ungdoms-400" />
                        <span className="text-muted-foreground">
                          Skapad:{" "}
                          {client.createdAt
                            ? new Date(client.createdAt).toLocaleDateString(
                                "sv-SE"
                              )
                            : "Okänt"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1 text-ungdoms-400" />
                        <span className="text-muted-foreground">
                          Status: <span className="status-approved">Aktiv</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-ungdoms-600 bg-card/30 backdrop-blur-sm hover:shadow-lg hover:shadow-ungdoms-500/10 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-ungdoms-500/20 border border-ungdoms-400 rounded-lg">
                <FileText className="h-5 w-5 text-ungdoms-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Veckodokumentation
                </p>
                <p className="text-lg font-bold text-foreground">
                  {clients.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-ungdoms-600 bg-card/30 backdrop-blur-sm hover:shadow-lg hover:shadow-ungdoms-500/10 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-900/30 border border-green-700 rounded-lg">
                <ClipboardList className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Månadsrapporter
                </p>
                <p className="text-lg font-bold text-foreground">
                  {clients.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-ungdoms-600 bg-card/30 backdrop-blur-sm hover:shadow-lg hover:shadow-ungdoms-500/10 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Vårdplaner
                </p>
                <p className="text-lg font-bold text-foreground">
                  {clients.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-ungdoms-600 bg-card/30 backdrop-blur-sm hover:shadow-lg hover:shadow-ungdoms-500/10 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-900/30 border border-purple-700 rounded-lg">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Vimsa Tid
                </p>
                <p className="text-lg font-bold text-foreground">
                  {clients.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vårdplan Creation Section */}
      <Card className="border-ungdoms-600">
        <CardHeader>
          <CardTitle className="text-ungdoms-800">Skapa Vårdplan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <SimpleCarePlanDialog
              staffId={staff.id}
              trigger={
                <Button className="bg-ungdoms-600 hover:bg-ungdoms-700 text-white px-8 py-3">
                  <FileText className="h-5 w-5 mr-3" />
                  Skapa Vårdplan (Aktiverar Alla Flöden)
                </Button>
              }
            />
          </div>

          <Card className="bg-ungdoms-50 border-ungdoms-200">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 text-ungdoms-800">
                När du skapar en vårdplan aktiveras automatiskt:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-ungdoms-700">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-ungdoms-500" />
                  Genomförandeplan (GFP)
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-500" />
                  Veckodokumentation (Mån-Sön)
                </div>
                <div className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2 text-blue-500" />
                  Månadsrapporter (Aug-Dec)
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-purple-500" />
                  Vimsa Tid (Vecka 33-52)
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
