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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Staff, insertStaffSchema } from "@shared/schema";
import * as api from "@/lib/api";
import { auditLogger } from "@/lib/audit";

const StaffFormSchema = insertStaffSchema.pick({
  name: true,
  initials: true,
});

type StaffFormData = z.infer<typeof StaffFormSchema>;

interface StaffFormProps {
  staffMember?: Staff;
  onClose: () => void;
}

function StaffForm({ staffMember, onClose }: StaffFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm<StaffFormData>({
    resolver: zodResolver(StaffFormSchema),
    defaultValues: staffMember
      ? {
          name: staffMember.name,
          initials: staffMember.initials,
        }
      : {
          name: "",
          initials: "",
        },
  });

  const mutation = useMutation<Staff, Error, StaffFormData>({
    mutationFn: (data) =>
      staffMember
        ? api.updateStaff(staffMember.id, data)
        : api.createStaff(data),
    onSuccess: (savedStaff) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: `✅ Personal ${staffMember ? "uppdaterad" : "skapad"}`,
        description: `Personalen ${savedStaff.name} har sparats.`,
      });
      auditLogger.log({
        type: staffMember ? "UPDATE" : "CREATE",
        entity: "STAFF",
        entityId: savedStaff.id,
        details: `Staff ${savedStaff.name} was ${
          staffMember ? "updated" : "created"
        }.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "❌ Fel",
        description: `Kunde inte spara personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StaffFormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Namn</FormLabel>
              <FormControl>
                <Input placeholder="Förnamn Efternamn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="initials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initialer</FormLabel>
              <FormControl>
                <Input placeholder="FE" {...field} />
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
            {staffMember ? "Spara ändringar" : "Skapa personal"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function StaffManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | undefined>(
    undefined
  );
  const { toast } = useToast();

  const {
    data: staff,
    isLoading,
    error,
    refetch,
  } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: api.getStaff,
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation<unknown, Error, string>({
    mutationFn: (id: string) => api.deleteStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "🗑️ Personal raderad",
        description: "Personalen har raderats.",
      });
      auditLogger.log({
        type: "DELETE",
        entity: "STAFF",
        entityId: id,
        details: "Staff deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Fel",
        description: `Kunde inte radera personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddNew = () => {
    setSelectedStaff(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-lg">Laddar personal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold text-destructive">
            Kunde inte ladda personal
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
              <CardTitle>Personalhantering</CardTitle>
              <CardDescription>
                Lägg till, redigera och hantera personal i systemet.
              </CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <UserPlus className="mr-2 h-4 w-4" /> Lägg till ny personal
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">
            Personal ({staff?.length || 0})
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namn</TableHead>
                <TableHead>Initialer</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell className="font-medium">
                    {staffMember.name}
                  </TableCell>
                  <TableCell>{staffMember.initials}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(staffMember)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(staffMember.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedStaff ? "Redigera personal" : "Skapa ny personal"}
          </DialogTitle>
        </DialogHeader>
        <StaffForm
          staffMember={selectedStaff}
          onClose={() => setIsFormOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
