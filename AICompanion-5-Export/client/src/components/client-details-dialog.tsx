import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@shared/schema";

interface ClientDetailsDialogProps {
  client: Client;
}

export function ClientDetailsDialog({ client }: ClientDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Klient: {client.initials}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Klientinformation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Initialer:</strong> {client.initials}</p>
                <p><strong>Skapad:</strong> {client.createdAt ? new Date(client.createdAt).toLocaleDateString('sv-SE') : 'Ej angiven'}</p>
                <p><strong>Status:</strong> <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Aktiv</span></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kommande funktioner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Veckodokumentation</h4>
                  <p className="text-xs text-gray-600 mt-1">Status, kvalitetsbedömning</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Månadsrapporter</h4>
                  <p className="text-xs text-gray-600 mt-1">Inlämning, kvalitetspoäng</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Vårdplaner</h4>
                  <p className="text-xs text-gray-600 mt-1">Mål, interventioner</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Vimsa Tid</h4>
                  <p className="text-xs text-gray-600 mt-1">Tidsregistrering per vecka</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}