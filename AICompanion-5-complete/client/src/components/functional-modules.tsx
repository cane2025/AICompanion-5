import React, { useState } from "react";
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
import { Calendar, CheckCircle, Save, AlertTriangle } from "lucide-react";
import { useSaveData } from "@/hooks/use-save-data";

// Vårdplan Component
export function CarePlanForm() {
  const { saveData, isLoading, error } = useSaveData("care-plans");
  const [formData, setFormData] = useState({
    diagnosis: "",
    treatment: "",
    goals: "",
    notes: "",
    status: "active",
  });

  const handleSave = async () => {
    try {
      await saveData(formData);
      alert("Vårdplan sparad!");
    } catch (err: any) {
      alert("Fel: " + err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Vårdplan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Diagnos</label>
          <Input
            value={formData.diagnosis}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))
            }
            placeholder="Ange diagnos..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Behandling</label>
          <Textarea
            value={formData.treatment}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, treatment: e.target.value }))
            }
            placeholder="Beskriv behandling..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Mål</label>
          <Textarea
            value={formData.goals}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, goals: e.target.value }))
            }
            placeholder="Ange behandlingsmål..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Anteckningar</label>
          <Textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Lägg till anteckningar..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="completed">Slutförd</SelectItem>
              <SelectItem value="on_hold">Pausad</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Sparar..." : "Spara vårdplan"}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}

// Genomförandeplan (GFP) Component
export function ImplementationPlanForm() {
  const { saveData, isLoading, error } = useSaveData("implementation-plans");
  const [formData, setFormData] = useState({
    planContent: "",
    goals: "",
    activities: "",
    followUpSchedule: "",
    status: "pending",
    comments: "",
  });

  const handleSave = async () => {
    try {
      await saveData(formData);
      alert("Genomförandeplan sparad!");
    } catch (err: any) {
      alert("Fel: " + err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Genomförandeplan (GFP)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Planinnehåll *</label>
          <Textarea
            value={formData.planContent}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, planContent: e.target.value }))
            }
            placeholder="Beskriv genomförandeplanen..."
            className="min-h-[100px]"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Mål *</label>
            <Textarea
              value={formData.goals}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, goals: e.target.value }))
              }
              placeholder="Ange mål..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Aktiviteter</label>
            <Textarea
              value={formData.activities}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, activities: e.target.value }))
              }
              placeholder="Ange aktiviteter..."
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Uppföljningsschema</label>
          <Textarea
            value={formData.followUpSchedule}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                followUpSchedule: e.target.value,
              }))
            }
            placeholder="Beskriv uppföljningsschema..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Väntande</SelectItem>
              <SelectItem value="in_progress">Pågående</SelectItem>
              <SelectItem value="completed">Slutförd</SelectItem>
              <SelectItem value="sent">Skickad</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Kommentarer</label>
          <Textarea
            value={formData.comments}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, comments: e.target.value }))
            }
            placeholder="Lägg till kommentarer..."
          />
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Sparar..." : "Spara genomförandeplan"}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}

// Uppföljning Component
export function FollowUpForm() {
  const { saveData, isLoading, error } = useSaveData("follow-ups");
  const [formData, setFormData] = useState({
    date: "",
    type: "weekly",
    notes: "",
    status: "completed",
    nextFollowUp: "",
  });

  const handleSave = async () => {
    try {
      await saveData(formData);
      alert("Uppföljning sparad!");
    } catch (err: any) {
      alert("Fel: " + err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Uppföljning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Datum</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Typ</label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daglig</SelectItem>
                <SelectItem value="weekly">Veckovis</SelectItem>
                <SelectItem value="monthly">Månadsvis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Anteckningar</label>
          <Textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Skriv uppföljningsanteckningar..."
            className="min-h-[100px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Slutförd</SelectItem>
              <SelectItem value="delayed">Försenad</SelectItem>
              <SelectItem value="cancelled">Inställd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Nästa uppföljning</label>
          <Input
            type="date"
            value={formData.nextFollowUp}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, nextFollowUp: e.target.value }))
            }
          />
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Sparar..." : "Spara uppföljning"}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}

// Veckodokumentation Component
export function WeeklyDocumentationForm() {
  const { saveData, isLoading, error } = useSaveData("weekly-documentation");
  const [formData, setFormData] = useState({
    week: "",
    year: new Date().getFullYear().toString(),
    activities: "",
    progress: "",
    challenges: "",
    nextWeekPlan: "",
  });

  const handleSave = async () => {
    try {
      await saveData(formData);
      alert("Veckodokumentation sparad!");
    } catch (err: any) {
      alert("Fel: " + err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Veckodokumentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Vecka</label>
            <Input
              type="number"
              min="1"
              max="53"
              value={formData.week}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, week: e.target.value }))
              }
              placeholder="Veckonummer"
            />
          </div>
          <div>
            <label className="text-sm font-medium">År</label>
            <Input
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, year: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Aktiviteter</label>
          <Textarea
            value={formData.activities}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, activities: e.target.value }))
            }
            placeholder="Beskriv veckans aktiviteter..."
            className="min-h-[80px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Framsteg</label>
          <Textarea
            value={formData.progress}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, progress: e.target.value }))
            }
            placeholder="Beskriv framsteg..."
            className="min-h-[80px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Utmaningar</label>
          <Textarea
            value={formData.challenges}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, challenges: e.target.value }))
            }
            placeholder="Beskriv utmaningar..."
            className="min-h-[80px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Plan för nästa vecka</label>
          <Textarea
            value={formData.nextWeekPlan}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, nextWeekPlan: e.target.value }))
            }
            placeholder="Planering för nästa vecka..."
            className="min-h-[80px]"
          />
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Sparar..." : "Spara veckodokumentation"}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}

// Månadsrapport Component
export function MonthlyReportForm() {
  const { saveData, isLoading, error } = useSaveData("monthly-reports");
  const [formData, setFormData] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    summary: "",
    achievements: "",
    challenges: "",
    recommendations: "",
    status: "draft",
  });

  const handleSave = async () => {
    try {
      await saveData(formData);
      alert("Månadsrapport sparad!");
    } catch (err: any) {
      alert("Fel: " + err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Månadsrapport
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Månad</label>
            <Select
              value={formData.month}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, month: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj månad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Januari</SelectItem>
                <SelectItem value="2">Februari</SelectItem>
                <SelectItem value="3">Mars</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">Maj</SelectItem>
                <SelectItem value="6">Juni</SelectItem>
                <SelectItem value="7">Juli</SelectItem>
                <SelectItem value="8">Augusti</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">Oktober</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">År</label>
            <Input
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, year: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Sammanfattning</label>
          <Textarea
            value={formData.summary}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, summary: e.target.value }))
            }
            placeholder="Månadssammanfattning..."
            className="min-h-[100px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Uppnådda resultat</label>
          <Textarea
            value={formData.achievements}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, achievements: e.target.value }))
            }
            placeholder="Beskriv uppnådda resultat..."
            className="min-h-[80px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Utmaningar</label>
          <Textarea
            value={formData.challenges}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, challenges: e.target.value }))
            }
            placeholder="Beskriv utmaningar..."
            className="min-h-[80px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Rekommendationer</label>
          <Textarea
            value={formData.recommendations}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                recommendations: e.target.value,
              }))
            }
            placeholder="Rekommendationer för framtiden..."
            className="min-h-[80px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Utkast</SelectItem>
              <SelectItem value="review">Under granskning</SelectItem>
              <SelectItem value="approved">Godkänd</SelectItem>
              <SelectItem value="sent">Skickad</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Sparar..." : "Spara månadsrapport"}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}
