import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Info } from "lucide-react";

export function FeatureFlagTest() {
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    // Check current state
    const currentFlag = 
      import.meta.env.VITE_UI_CAREPLAN_COMPACT === "1" || 
      localStorage.getItem("UI_CAREPLAN_COMPACT") === "1" ||
      new URLSearchParams(window.location.search).get("ui_compact") === "1";
    
    setCompactMode(currentFlag);
  }, []);

  const toggleCompactMode = (checked: boolean) => {
    if (checked) {
      localStorage.setItem("UI_CAREPLAN_COMPACT", "1");
    } else {
      localStorage.removeItem("UI_CAREPLAN_COMPACT");
    }
    setCompactMode(checked);
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Feature Flag: Kompakt Vårdplan UI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Detta är en testfunktion för att aktivera det nya kompakta vårdplan-gränssnittet.
              Ändringar sparas i localStorage och kräver omladdning av sidan.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="compact-mode"
                checked={compactMode}
                onCheckedChange={toggleCompactMode}
              />
              <Label htmlFor="compact-mode" className="cursor-pointer">
                Aktivera kompakt vårdplan UI (UI_CAREPLAN_COMPACT)
              </Label>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Status:</strong> {compactMode ? "Aktiverad ✅" : "Avaktiverad ❌"}</p>
              <p><strong>Funktioner i kompakt läge:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Smart personallista i vänsterspalten med sökning och sortering</li>
                <li>Kompakt toppsektion med 4 nyckelfält i rad</li>
                <li>Automatisk sparning var 800ms</li>
                <li>Tangentbordsgenvägar (⌘S, ⌘N)</li>
                <li>Kollapsbar avancerad sektion</li>
                <li>Snabbmallar för vanliga vårdplanstyper</li>
                <li>Professionell look utan störande valideringsmeddelanden</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={refreshPage} variant="default">
                Ladda om sidan
              </Button>
              <Button 
                onClick={() => window.location.href = "/"}
                variant="outline"
              >
                Gå till Dashboard
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-2">Andra sätt att aktivera:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Lägg till <code className="bg-gray-200 px-1 rounded">?ui_compact=1</code> i URL:en</li>
                <li>Sätt miljövariabeln <code className="bg-gray-200 px-1 rounded">VITE_UI_CAREPLAN_COMPACT=1</code></li>
                <li>Kör i konsolen: <code className="bg-gray-200 px-1 rounded">localStorage.setItem("UI_CAREPLAN_COMPACT", "1")</code></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}