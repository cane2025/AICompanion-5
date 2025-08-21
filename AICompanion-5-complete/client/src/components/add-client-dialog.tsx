import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertClientSchema, type InsertClient, type Staff } from "@shared/schema";

interface AddClientDialogProps {
  staff: Staff;
}

export function AddClientDialog({ staff }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      staffId: staff.id,
      initials: "",
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", staff.id, "clients"] });
      form.reset({ staffId: staff.id, initials: "" });
      setOpen(false);
      toast({
        title: "Framgång",
        description: "Klient tillagd framgångsrikt!",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till klient",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertClient) => {
    createClientMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Lägg till klient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lägg till ny klient</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="initials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initialer (GDPR-säkert)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="t.ex. A.B eller AB" 
                      {...field}
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500">
                    Använd endast initialer för att skydda klientens integritet enligt GDPR
                  </p>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Avbryt
              </Button>
              <Button 
                type="submit"
                disabled={createClientMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createClientMutation.isPending ? "Sparar..." : "Lägg till"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}