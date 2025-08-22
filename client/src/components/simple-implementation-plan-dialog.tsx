import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FileCheck } from "lucide-react";

// Schema för administrativa genomförandeplaner (inga mål/planinnehåll)
const implementationPlanSchema = z.object({
  planRef: z.string().min(1, "Planreferens krävs"),
  sentDate: z.string().optional(),
  completedDate: z.string().optional(),
  followups: z.array(z.boolean()).length(6),
  comments: z.string().optional(),
});

type ImplementationPlanFormData = z.infer<typeof implementationPlanSchema>;

interface SimpleImplementationPlanDialogProps {
  trigger?: React.ReactNode;
  clientId: string;
  staffId: string;
  existingPlan?: any;
  onSuccess?: () => void;
}

export function SimpleImplementationPlanDialog({
  trigger,
  clientId,
  staffId,
  existingPlan,
  onSuccess,
}: SimpleImplementationPlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ImplementationPlanFormData>({
    resolver: zodResolver(implementationPlanSchema),
    defaultValues: {
      planRef: existingPlan?.planRef || "",
      sentDate: existingPlan?.sentDate || "",
      completedDate: existingPlan?.completedDate || "",
      followups: existingPlan?.followups || [false, false, false, false, false, false],
      comments: existingPlan?.comments || "",
    },
  });

  // Create/Update implementation plan mutation
  const savePlanMutation = useMutation({
    mutationFn: async (data: ImplementationPlanFormData) => {
      const payload = {
        clientId,
        staffId,
        planRef: data.planRef,
        sentDate: data.sentDate || null,
        completedDate: data.completedDate || null,
        followups: data.followups,
        comments: data.comments || "",
        status: data.completedDate ? "completed" : "pending",
      };

      if (existingPlan) {
        return api.updateImplementationPlan(existingPlan.id, payload);
      } else {
        return api.createImplementationPlan(payload);
      }
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "implementation-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans/staff", staffId] });

      toast({
        title: existingPlan ? "Genomförandeplan uppdaterad" : "Genomförandeplan skapad",
        description: `Administrativa uppgifter har ${existingPlan ? "uppdaterats" : "sparats"}.`,
      });

      form.reset();
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara genomförandeplan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ImplementationPlanFormData) => {
    savePlanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            {existingPlan ? "Redigera GFP" : "Skapa Genomförandeplan"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Genomförandeplan (Administrativ)
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="planRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vilken genomförandeplan *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="T.ex. GFP-1, GFP-2, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skickad datum</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="completedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klar datum</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="followups"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uppföljning (1-6)</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((num, index) => (
                      <div key={num} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value[index]}
                          onCheckedChange={(checked) => {
                            const newFollowups = [...field.value];
                            newFollowups[index] = checked as boolean;
                            field.onChange(newFollowups);
                          }}
                        />
                        <label className="text-sm font-medium">
                          Uppföljning {num}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kommentarer (valfritt)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Administrativa kommentarer..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={savePlanMutation.isPending}
              >
                {savePlanMutation.isPending
                  ? "Sparar..."
                  : existingPlan
                  ? "Uppdatera"
                  : "Spara"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}