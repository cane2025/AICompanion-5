import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  UserPlus,
  Loader2,
  AlertTriangle,
  Undo,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Client,
  Staff,
  insertClientSchema,
  UpdateClient,
} from "@shared/schema";
import * as api from "@/lib/api";
import { auditLogger } from "@/lib/audit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Use only the fields needed for the form
const ClientFormSchema = insertClientSchema.pick({
  initials: true,
  personalNumber: true,
  notes: true,
  staffId: true,
  status: true,
});

type ClientFormData = z.infer<typeof ClientFormSchema>;

interface ClientFormProps {
  client?: Client;
  staffList: Staff[];
  onClose: () => void;
}

function ClientForm({ client, staffList, onClose }: ClientFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm<ClientFormData>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: client
      ? {
          initials: client.initials,
          personalNumber: client.personalNumber || "",
          notes: client.notes || "",
          staffId: client.staffId,
          status: client.status || "active",
        }
      : {
          initials: "",
          personalNumber: "",
          notes: "",
          staffId: "",
          status: "active",
        },
  });

  const mutation = useMutation<Client, Error, UpdateClient | ClientFormData>({
    mutationFn: (data) =>
      client
        ? api.updateClient(client.id, data as UpdateClient)
        : api.createClient(data as ClientFormData),
    onSuccess: (savedClient) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", savedClient.id] });
      toast({
        title: `✅ Klient ${client ? "uppdaterad" : "skapad"}`,
        description: `Klienten ${savedClient.initials} har sparats.`,
      });
      auditLogger.log({
        type: client ? "UPDATE" : "CREATE",
        entity: "CLIENT",
        entityId: savedClient.id,
        details: `Client ${savedClient.initials} was ${
          client ? "updated" : "created"
        }.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "❌ Fel",
        description: `Kunde inte spara klienten: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (client) {
      mutation.mutate(data);
    } else {
      mutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="initials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initialer</FormLabel>
              <FormControl>
                <Input
                  placeholder="t.ex. A.B."
                  {...field}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="personalNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personnummer (valfritt)</FormLabel>
              <FormControl>
                <Input
                  placeholder="ÅÅMMDD-XXXX"
                  {...field}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="staffId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ansvarig personal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en ansvarig" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anteckningar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Särskilda anteckningar om klienten..."
                  {...field}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Avbryt
            </Button>
          </DialogClose>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {client ? "Spara ändringar" : "Skapa klient"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ClientManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(
    undefined
  );
  const { toast } = useToast();

  const {
    data: clients,
    isLoading,
    error,
    refetch,
  } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: api.getClients,
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation<unknown, Error, string>({
    mutationFn: (id: string) => api.deleteClient(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "🗑️ Klient raderad",
        description: "Klienten har flyttats till papperskorgen.",
      });
      auditLogger.log({
        type: "DELETE",
        entity: "CLIENT",
        entityId: id,
        details: "Client soft-deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Fel",
        description: `Kunde inte radera klient: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation<Client, Error, string>({
    mutationFn: (id: string) => api.restoreClient(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "🔄 Klient återställd",
        description: "Klienten har återställts.",
      });
      auditLogger.log({
        type: "RESTORE",
        entity: "CLIENT",
        entityId: id,
        details: "Client restored",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Fel",
        description: `Kunde inte återställa klient: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddNew = () => {
    setSelectedClient(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const activeClients = clients?.filter((c) => !c.deletedAt) || [];
  const deletedClients = clients?.filter((c) => c.deletedAt) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-lg">Laddar klienter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold text-destructive">
            Kunde inte ladda klienter
          </h3>
          <p className="text-muted-foreground mt-2 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Försök igen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Klienthantering</CardTitle>
              <CardDescription>
                Lägg till, redigera och hantera klienter i systemet.
              </CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <UserPlus className="mr-2 h-4 w-4" /> Lägg till ny klient
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">
            Aktiva Klienter ({activeClients.length})
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Initialer</TableHead>
                <TableHead>Ansvarig</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeClients.map((client) => {
                const responsibleStaff = staffList.find(
                  (s) => s.id === client.staffId
                );
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.initials}
                    </TableCell>
                    <TableCell>{responsibleStaff?.name || "Okänd"}</TableCell>
                    <TableCell>{client.status}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(client.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {deletedClients.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-8 mb-2">
                Papperskorg ({deletedClients.length})
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Initialer</TableHead>
                    <TableHead>Raderad</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedClients.map((client) => (
                    <TableRow key={client.id} className="bg-muted/50">
                      <TableCell className="font-medium text-muted-foreground">
                        {client.initials}
                      </TableCell>
                      <TableCell>
                        {client.deletedAt
                          ? new Date(client.deletedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => restoreMutation.mutate(client.id)}
                          disabled={restoreMutation.isPending}
                        >
                          <Undo className="h-4 w-4 text-green-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedClient ? "Redigera klient" : "Skapa ny klient"}
          </DialogTitle>
        </DialogHeader>
        <ClientForm
          client={selectedClient}
          staffList={staffList}
          onClose={() => setIsFormOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
