import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateStaff } from "@/lib/api";
import {
  insertStaffSchema,
  type Staff,
  type UpdateStaff,
} from "@shared/schema";

interface PersonalInfoFormProps {
  staff: Staff;
}

export function PersonalInfoForm({ staff }: PersonalInfoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UpdateStaff>({
    resolver: zodResolver(insertStaffSchema.partial()),
    defaultValues: {
      name: staff.name,
      initials: staff.initials,
      personnummer: staff.personnummer || "",
      telefon: staff.telefon || "",
      epost: staff.epost || "",
      adress: staff.adress || "",
      anställningsdatum: staff.anställningsdatum || "",
      roll: staff.roll || "",
      avdelning: staff.avdelning || "",
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (data: UpdateStaff) => {
      return await updateStaff(staff.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Framgång",
        description: "Personalinformation sparad framgångsrikt!",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara personalinformation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateStaff) => {
    updateStaffMutation.mutate(data);
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle>Personalinformation</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fullständigt namn</FormLabel>
                    <FormControl>
                      <Input
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
                name="personnummer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personnummer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="YYYYMMDD-XXXX"
                        {...field}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+46 70 123 45 67"
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
                name="epost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-post</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="namn@sjukhus.se"
                        {...field}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="adress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adress</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Gatuadress, Postnummer Stad"
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="anställningsdatum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anställningsdatum</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                name="roll"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll</FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj roll" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sjuksköterska">
                          Sjuksköterska
                        </SelectItem>
                        <SelectItem value="undersköterska">
                          Undersköterska
                        </SelectItem>
                        <SelectItem value="läkare">Läkare</SelectItem>
                        <SelectItem value="kurator">Kurator</SelectItem>
                        <SelectItem value="administratör">
                          Administratör
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="avdelning"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avdelning</FormLabel>
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj avdelning" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="akutmottagning">
                        Akutmottagning
                      </SelectItem>
                      <SelectItem value="öppenvård">Öppenvård</SelectItem>
                      <SelectItem value="intensivvård">Intensivvård</SelectItem>
                      <SelectItem value="barnklinik">Barnklinik</SelectItem>
                      <SelectItem value="kirurgi">Kirurgi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={updateStaffMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Spara Personalinformation
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
