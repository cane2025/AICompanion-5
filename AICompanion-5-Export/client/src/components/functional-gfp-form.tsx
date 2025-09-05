import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useSaveData } from "@/hooks/use-save-data";
import type { Client, ImplementationPlan } from "@shared/schema";

interface FunctionalGfpFormProps {
  client: Client;
}

export function FunctionalGfpForm({ client }: FunctionalGfpFormProps) {
  const { saveData, isLoading: isSaving } = useSaveData("gfp-endpoint");

  // Form state
  const [formData, setFormData] = useState({
    planContent: "",
    goals: "",
    activities: "",
    followUpSchedule: "",
    status: "pending",
    planType: "1",
    comments: "",
    completedDate: "",
    sentDate: "",
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing implementation plan
  const { data: implementationPlan, isLoading: isLoadingPlan } =
    useQuery<ImplementationPlan>({
      queryKey: ["/api/implementation-plans", client.id],
      queryFn: async () => {
        const response = await fetch(
          `/api/clients/${client.id}/implementation-plan`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error("Kunde inte hämta genomförandeplan");
        }
        return response.json();
      },
    });

  // Update form when data loads
  useEffect(() => {
    if (implementationPlan) {
      setFormData({
        planContent: implementationPlan.planContent || "",
        goals: implementationPlan.goals || "",
        activities: implementationPlan.activities || "",
        followUpSchedule: implementationPlan.followUpSchedule || "",
        status: implementationPlan.status || "pending",
        planType: implementationPlan.planType || "1",
        comments: implementationPlan.comments || "",
        completedDate: implementationPlan.completedDate
          ? new Date(implementationPlan.completedDate)
              .toISOString()
              .split("T")[0]
          : "",
        sentDate: implementationPlan.sentDate
          ? new Date(implementationPlan.sentDate).toISOString().split("T")[0]
          : "",
      });
      setHasChanges(false);
    }
  }, [implementationPlan]);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Validation
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.planContent.trim()) {
      errors.push("Planinnehåll är obligatoriskt");
    }

    if (!formData.goals.trim()) {
      errors.push("Mål är obligatoriskt");
    }

    return errors;
  };

  // Save function
  const handleSave = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert("Valideringsfel:\n" + errors.join("\n"));
      return;
    }

    const dataToSave = {
      clientId: client.id,
      staffId: client.staffId,
      ...formData,
      completedDate: formData.completedDate
        ? new Date(formData.completedDate)
        : null,
      sentDate: formData.sentDate ? new Date(formData.sentDate) : null,
    };

    // Persist via generic save hook (simplified; real implementation might differentiate POST/PUT)
    saveData(dataToSave);

    setHasChanges(false);
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "sent":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoadingPlan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Laddar genomförandeplan...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Genomförandeplan (GFP) - {client.initials}
          {hasChanges && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              Osparade ändringar
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Plan Content - REQUIRED */}
          <div>
            <label className="text-sm font-medium">
              Planinnehåll <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Beskriv genomförandeplanen..."
              value={formData.planContent}
              className="mt-1 min-h-[100px]"
              onChange={(e) => handleInputChange("planContent", e.target.value)}
            />
          </div>

          {/* Goals and Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                Mål <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Ange mål för genomförandet..."
                value={formData.goals}
                className="mt-1"
                onChange={(e) => handleInputChange("goals", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Aktiviteter</label>
              <Textarea
                placeholder="Ange planerade aktiviteter..."
                value={formData.activities}
                className="mt-1"
                onChange={(e) =>
                  handleInputChange("activities", e.target.value)
                }
              />
            </div>
          </div>

          {/* Follow-up Schedule */}
          <div>
            <label className="text-sm font-medium">Uppföljningsschema</label>
            <Textarea
              placeholder="Beskriv schema för uppföljning..."
              value={formData.followUpSchedule}
              className="mt-1"
              onChange={(e) =>
                handleInputChange("followUpSchedule", e.target.value)
              }
            />
          </div>

          {/* Status and Plan Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Välj status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Väntande</SelectItem>
                  <SelectItem value="in_progress">Pågående</SelectItem>
                  <SelectItem value="completed">Slutförd</SelectItem>
                  <SelectItem value="sent">Skickad</SelectItem>
                  <SelectItem value="overdue">Försenad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Typ av vårdplan</label>
              <Select
                value={formData.planType}
                onValueChange={(value) => handleInputChange("planType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Typ 1</SelectItem>
                  <SelectItem value="2">Typ 2</SelectItem>
                  <SelectItem value="3">Typ 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Slutförd datum</label>
              <Input
                type="date"
                value={formData.completedDate}
                className="mt-1"
                onChange={(e) =>
                  handleInputChange("completedDate", e.target.value)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Skickad datum</label>
              <Input
                type="date"
                value={formData.sentDate}
                className="mt-1"
                onChange={(e) => handleInputChange("sentDate", e.target.value)}
              />
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="text-sm font-medium">Kommentarer</label>
            <Textarea
              placeholder="Lägg till kommentarer..."
              value={formData.comments}
              className="mt-1"
              onChange={(e) => handleInputChange("comments", e.target.value)}
            />
          </div>

          {/* Current Status Display */}
          <div>
            <label className="text-sm font-medium">Aktuell status</label>
            <div className="mt-1">
              <Badge className={getStatusColor(formData.status)}>
                {formData.status === "pending" && "Väntande"}
                {formData.status === "in_progress" && "Pågående"}
                {formData.status === "completed" && "Slutförd"}
                {formData.status === "sent" && "Skickad"}
                {formData.status === "overdue" && "Försenad"}
              </Badge>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sparar...
              </>
            ) : (
              "Spara genomförandeplan"
            )}
          </Button>

          {/* Success Message */}
          {formData.status === "completed" && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                GFP slutförd och godkänd
              </p>
            </div>
          )}

          {/* Validation Info */}
          <div className="text-xs text-muted-foreground">
            <span className="text-red-500">*</span> = Obligatoriska fält
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
