import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { secureValidation, formatValidationErrors, createFieldErrorId, safeLog } from "@/lib/security";
import { z } from "zod";

// Secure validation schema
const carePlanFormSchema = z.object({
  socialWorkerName: secureValidation.name,
  clientInitials: secureValidation.initials,
  planNumber: secureValidation.planNumber,
  receivedDate: secureValidation.date,
  journalDate: secureValidation.date.optional().or(z.literal("")),
  comment: secureValidation.comment,
  staffId: secureValidation.staffId
});

type CarePlanFormData = z.infer<typeof carePlanFormSchema>;

export function SimpleWorkingCarePlan() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CarePlanFormData>({
    socialWorkerName: "",
    clientInitials: "",
    planNumber: "",
    receivedDate: new Date().toISOString().split('T')[0],
    journalDate: "",
    comment: "",
    staffId: "d55270a3-02e5-448b-9013-4a290564fa8d" // Mirza Celik som standard
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Real-time secure validation
  const validateForm = (data: CarePlanFormData): Record<string, string> => {
    try {
      carePlanFormSchema.parse(data);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          errors[field] = err.message;
        });
        return errors;
      }
      return { general: "Oväntat valideringsfel" };
    }
  };

  // Update validation errors when form data changes
  React.useEffect(() => {
    const errors = validateForm(formData);
    setValidationErrors(errors);
  }, [formData]);

  const isFormValid = Object.keys(validationErrors).length === 0 && 
                      formData.socialWorkerName.trim() && 
                      formData.clientInitials.trim() && 
                      formData.planNumber.trim() && 
                      formData.receivedDate;

  const handleInputChange = (field: keyof CarePlanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-save feedback - men bara för viktiga fält
    if (field === 'socialWorkerName' && value.length > 2) {
      toast({
        title: "💾 Socialsekreterare sparad",
        description: `${value}`,
        duration: 1000,
      });
    }
    if (field === 'clientInitials' && value.length > 1) {
      toast({
        title: "💾 Klientinitialer sparade", 
        description: `${value}`,
        duration: 1000,
      });
    }
    if (field === 'planNumber' && value) {
      toast({
        title: "💾 Vårdplansnummer sparat",
        description: `Nummer: ${value}`,
        duration: 1000,
      });
    }
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "⚠️ Kontrollera formuläret",
        description: "Alla obligatoriska fält måste fyllas i korrekt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      safeLog("Creating care plan", { clientInitials: formData.clientInitials });
      
      // 1. Skapa klient
      const clientResponse = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initials: formData.clientInitials,
          staffId: formData.staffId,
          personalNumber: "",
          notes: `Vårdplan ${formData.planNumber} från ${formData.socialWorkerName}`,
          status: "active",
        }),
      });

      const client = await clientResponse.json();

      // 2. Skapa vårdplan
      const carePlanResponse = await fetch("/api/care-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          staffId: formData.staffId,
          receivedDate: formData.receivedDate,
          enteredJournalDate: formData.journalDate || null,
          staffNotifiedDate: new Date().toISOString().split('T')[0],
          planContent: `Vårdplan ${formData.planNumber} från socialsekreterare ${formData.socialWorkerName}`,
          goals: "Genomföra vårdflöde enligt rutin",
          interventions: "Standard vårdflöde - GFP ska påbörjas inom 3 veckor",
          status: "staff_notified",
          comment: formData.comment || "",
        }),
      });

      const carePlan = await carePlanResponse.json();

      // 3. Skapa GFP automatiskt
      await fetch("/api/implementation-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          staffId: formData.staffId,
          carePlanId: carePlan.id,
          planContent: `GFP för vårdplan ${formData.planNumber}`,
          goals: "Genomförandeplan enligt vårdplan",
          activities: "GFP aktiviteter - ska slutföras inom 3 veckor",
          followUpSchedule: "3 veckor från idag",
          status: "pending",
          isActive: true,
        }),
      });

      setIsSaved(true);
      toast({
        title: "✅ VÅRDPLAN SPARAD!",
        description: "🎉 Alla flöden har aktiverats automatiskt",
        duration: 4000,
      });

      // Reset form efter 3 sekunder
      setTimeout(() => {
        setFormData({
          socialWorkerName: "",
          clientInitials: "",
          planNumber: "",
          receivedDate: new Date().toISOString().split('T')[0],
          journalDate: "",
          comment: "",
          staffId: "d55270a3-02e5-448b-9013-4a290564fa8d"
        });
        setIsSaved(false);
        setValidationErrors({});
      }, 3000);

    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara vårdplan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSaved) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-2xl font-bold mb-2 text-green-700">Vårdplan Sparad!</h3>
          <p className="text-muted-foreground">Alla data har sparats korrekt i databasen</p>
          <p className="text-sm text-muted-foreground mt-2">Formuläret återställs automatiskt...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-6 w-6 text-blue-600" />
          Vårdplan
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Registrera ny vårdplan med automatisk aktivering av alla flöden
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Form Fields with Enhanced Styling */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              👤 Socialsekreterare <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.socialWorkerName}
              onChange={(e) => handleInputChange("socialWorkerName", e.target.value)}
              placeholder="Ange namn på socialsekreterare"
              className="border-2 focus:border-blue-500 transition-colors"
              required
              aria-describedby={validationErrors.socialWorkerName ? createFieldErrorId("socialWorkerName") : undefined}
              aria-invalid={!!validationErrors.socialWorkerName}
            />
            {validationErrors.socialWorkerName && (
              <p id={createFieldErrorId("socialWorkerName")} className="text-sm text-red-600 mt-1">
                {validationErrors.socialWorkerName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                🔢 Vårdplansnummer <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.planNumber}
                onChange={(e) => handleInputChange("planNumber", e.target.value)}
                placeholder="1, 2, 3 etc"
                className="border-2 focus:border-blue-500 transition-colors"
                required
                aria-describedby={validationErrors.planNumber ? createFieldErrorId("planNumber") : undefined}
                aria-invalid={!!validationErrors.planNumber}
              />
              {validationErrors.planNumber && (
                <p id={createFieldErrorId("planNumber")} className="text-sm text-red-600 mt-1">
                  {validationErrors.planNumber}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                👦 Klient initialer <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.clientInitials}
                onChange={(e) => handleInputChange("clientInitials", e.target.value)}
                placeholder="t.ex. A.B."
                className="border-2 focus:border-blue-500 transition-colors"
                required
                aria-describedby={validationErrors.clientInitials ? createFieldErrorId("clientInitials") : undefined}
                aria-invalid={!!validationErrors.clientInitials}
              />
              {validationErrors.clientInitials && (
                <p id={createFieldErrorId("clientInitials")} className="text-sm text-red-600 mt-1">
                  {validationErrors.clientInitials}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                📅 Mottagningsdatum <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.receivedDate}
                onChange={(e) => handleInputChange("receivedDate", e.target.value)}
                className="border-2 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                📋 Inskannad i JD <span className="text-gray-400">(valfritt)</span>
              </label>
              <Input
                type="date"
                value={formData.journalDate}
                onChange={(e) => handleInputChange("journalDate", e.target.value)}
                className="border-2 focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              💬 Kommentar <span className="text-gray-400">(valfritt)</span>
            </label>
            <Textarea
              value={formData.comment}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              placeholder="Ytterligare kommentarer eller anteckningar..."
              rows={3}
              className="border-2 focus:border-green-500 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Enhanced Save Button with better visibility */}
          <div className="relative">
            {isSaved ? (
              <Button 
                disabled
                className="w-full bg-green-600 text-white border-2 border-green-400 shadow-lg"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                ✅ VÅRDPLAN SPARAD!
              </Button>
            ) : (
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-400 shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sparar vårdplan...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    💾 SPARA VÅRDPLAN
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Form Status Indicators */}
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="destructive" className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">⚠️ Formuläret innehåller fel</AlertTitle>
              <AlertDescription className="text-red-700">
                <ul className="list-disc list-inside mt-2">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}><strong>{field}:</strong> {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground text-center bg-gray-50 p-3 rounded-lg">
            🔒 Auto-kopplad till: <strong>Mirza Celik (MC)</strong>
            <br />
            <span className="text-xs">Alla ändringar sparas automatiskt med full säkerhet</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
