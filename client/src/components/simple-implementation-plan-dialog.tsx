import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export function SimpleImplementationPlanDialog({
  clientId,
}: {
  clientId: string;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      clientId,
      planRef: "",
      sentDate: "",
      completedDate: "",
      followup1: false,
      followup2: false,
      followup3: false,
      followup4: false,
      followup5: false,
      followup6: false,
      comments: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/implementation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  const onSubmit = async (data: any) => {
    const followups = [
      data.followup1,
      data.followup2,
      data.followup3,
      data.followup4,
      data.followup5,
      data.followup6,
    ];
    const payload = {
      ...data,
      followups,
      sentDate: data.sentDate || null,
      completedDate: data.completedDate || null,
    };
    await mutation.mutateAsync(payload);
    setOpen(false);
    queryClient.invalidateQueries();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Ny genomförandeplan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny administrativ genomförandeplan</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label>Genomförandeplan</Label>
              <Input {...form.register("planRef")} placeholder="Vilken plan" />
            </div>
            <div>
              <Label>Klient</Label>
              <Input {...form.register("clientId")} />
            </div>
            <div>
              <Label>Skickad datum</Label>
              <Input {...form.register("sentDate")} type="date" />
            </div>
            <div>
              <Label>Klar datum</Label>
              <Input {...form.register("completedDate")} type="date" />
            </div>
            <div className="space-y-2">
              <Label>Uppföljningar</Label>
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup1")} /> 1
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup2")} /> 2
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup3")} /> 3
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup4")} /> 4
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup5")} /> 5
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox {...form.register("followup6")} /> 6
                </label>
              </div>
            </div>
            <div>
              <Label>Kommentarer</Label>
              <Textarea {...form.register("comments")} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit">Spara</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

