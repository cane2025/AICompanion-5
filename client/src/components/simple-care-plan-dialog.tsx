import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface SimpleCarePlanDialogProps {
  trigger?: React.ReactNode;
  staffId: string;
}

export function SimpleCarePlanDialog({
  trigger,
  staffId,
}: SimpleCarePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const [socialWorker, setSocialWorker] = useState("");
  const [clientInitials, setClientInitials] = useState("");
  const [planNumber, setPlanNumber] = useState("");

  const createPlan = useMutation({
    mutationFn: async () => {
      // Step 1: Create client
      const clientResp = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initials: clientInitials,
          staffId: staffId,
          personalNumber: "",
          notes: `Vårdplan ${planNumber} från ${socialWorker}`,
          status: "active",
        }),
      });

      if (!clientResp.ok) throw new Error("Kunde inte skapa klient");
      const client = await clientResp.json();

      // Step 2: Create care plan
      const carePlanResp = await fetch("/api/care-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          staffId: staffId,
          receivedDate: new Date().toISOString().split("T")[0],
          planContent: `Vårdplan ${planNumber} från socialsekreterare ${socialWorker}`,
          goals: "Genomföra vårdflöde enligt rutin",
          interventions: "Standard vårdflöde - GFP ska påbörjas inom 3 veckor",
          status: "staff_notified",
          comment: "",
        }),
      });

      if (!carePlanResp.ok) throw new Error("Kunde inte skapa vårdplan");
      const carePlan = await carePlanResp.json();

      // Step 3: Create implementation plan
      await fetch("/api/implementation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          staffId: staffId,
          carePlanId: carePlan.id,
          planContent: `GFP för vårdplan ${planNumber}`,
          goals: "Genomförandeplan enligt vårdplan",
          activities: "GFP aktiviteter",
          followUpSchedule: "3 veckor",
          status: "pending",
          isActive: true,
        }),
      });

      // Step 4: Create weekly documentation
      const currentWeek = Math.max(33, Math.min(52, new Date().getWeek()));
      await fetch("/api/weekly-documentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          staffId: staffId,
          year: new Date().getFullYear(),
          week: currentWeek,
          content: "",
          mondayDocumented: false,
          tuesdayDocumented: false,
          wednesdayDocumented: false,
          thursdayDocumented: false,
          fridayDocumented: false,
          saturdayDocumented: false,
          sundayDocumented: false,
          documentation: "",
          approved: false,
          comments: "",
        }),
      });

      // Step 5: Create monthly report
      await fetch("/api/monthly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          staffId: staffId,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          content: "",
          reportContent: "",
          status: "not_started",
          comment: "",
        }),
      });

      // Step 6: Create Vimsa time
      await fetch("/api/vimsa-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          staffId: staffId,
          year: new Date().getFullYear(),
          week: currentWeek,
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
          totalHours: 0,
          status: "not_started",
          approved: false,
          comments: "",
        }),
      });

      return { client, carePlan };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/care-plans"] });

      toast({
        title: "Vårdplan skapad!",
        description: "Alla flöden har aktiverats automatiskt.",
      });

      setIsOpen(false);
      setSocialWorker("");
      setClientInitials("");
      setPlanNumber("");
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!socialWorker || !clientInitials || !planNumber) {
      toast({
        title: "Fel",
        description: "Alla fält måste fyllas i",
        variant: "destructive",
      });
      return;
    }

    createPlan.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-ungdoms-600 hover:bg-ungdoms-700 text-white">
            <FileText className="h-4 w-4 mr-2" />
            Skapa Vårdplan (Aktiverar Alla Flöden)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Skapa Vårdplan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="social-worker">Behandlare *</Label>
            <Input
              id="social-worker"
              value={socialWorker}
              onChange={(e) => setSocialWorker(e.target.value)}
              placeholder="Namn på behandlare"
            />
          </div>

          <div>
            <Label htmlFor="client-initials">Klientinitialer *</Label>
            <Input
              id="client-initials"
              value={clientInitials}
              onChange={(e) => setClientInitials(e.target.value)}
              placeholder="T.ex. AB"
            />
          </div>

          <div>
            <Label htmlFor="plan-number">Vårdplansnummer *</Label>
            <Input
              id="plan-number"
              value={planNumber}
              onChange={(e) => setPlanNumber(e.target.value)}
              placeholder="1, 2, 3 etc"
            />
          </div>

          <div className="bg-ungdoms-50 p-4 rounded-lg">
            <p className="text-sm text-ungdoms-700">
              När du skapar vårdplanen aktiveras automatiskt:
            </p>
            <ul className="text-sm text-ungdoms-600 mt-2 space-y-1">
              <li>• Genomförandeplan (GFP)</li>
              <li>• Veckodokumentation</li>
              <li>• Månadsrapporter</li>
              <li>• Vimsa Tid</li>
            </ul>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createPlan.isPending}
            className="w-full bg-ungdoms-600 hover:bg-ungdoms-700"
          >
            {createPlan.isPending ? "Skapar..." : "Skapa Vårdplan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to get week number
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function () {
  const d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
