import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Zap, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UIFeatureToggle() {
  const [isCompactEnabled, setIsCompactEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = window.localStorage.getItem('UI_CAREPLAN_COMPACT') === '1';
      setIsCompactEnabled(enabled);
    }
  }, []);

  const toggleCompactUI = () => {
    const newState = !isCompactEnabled;
    setIsCompactEnabled(newState);
    
    if (typeof window !== 'undefined') {
      if (newState) {
        window.localStorage.setItem('UI_CAREPLAN_COMPACT', '1');
      } else {
        window.localStorage.removeItem('UI_CAREPLAN_COMPACT');
      }
    }

    toast({
      title: newState ? "Kompakt UI aktiverat" : "Kompakt UI inaktiverat",
      description: newState 
        ? "Ny professionell vårdplansvy är aktiv. Ladda om sidan för att se ändringen."
        : "Återgår till standard vårdplansvy. Ladda om sidan för att se ändringen.",
      duration: 4000,
    });

    // Auto-reload after 2 seconds to show the change
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={toggleCompactUI}
        variant={isCompactEnabled ? "default" : "outline"}
        size="sm"
        className="text-xs"
      >
        {isCompactEnabled ? (
          <>
            <Zap className="h-3 w-3 mr-1" />
            Kompakt UI
          </>
        ) : (
          <>
            <Settings className="h-3 w-3 mr-1" />
            Standard UI
          </>
        )}
      </Button>
      
      {isCompactEnabled && (
        <Badge variant="secondary" className="text-xs">
          BETA
        </Badge>
      )}
      
      <Button
        onClick={() => window.location.reload()}
        variant="ghost"
        size="sm"
        className="text-xs"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Ladda om
      </Button>
    </div>
  );
}