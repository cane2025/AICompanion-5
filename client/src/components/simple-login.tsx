import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SimpleLoginProps {
  onLoginSuccess: (user: any) => void;
  onLogout?: () => void;
}

export function SimpleLogin({ onLoginSuccess, onLogout }: SimpleLoginProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [devToken, setDevToken] = useState("s_demo");
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dev-Token": devToken,
        },
        credentials: "include",
      });

      if (response.ok) {
        localStorage.setItem("devToken", devToken);
        setIsLoggedIn(true);
        onLoginSuccess({ id: devToken, username: devToken });
        toast({
          title: "✅ Inloggad!",
          description: `Du är nu inloggad som ${devToken}`,
        });
      } else {
        throw new Error("Inloggning misslyckades");
      }
    } catch (error) {
      toast({
        title: "❌ Fel vid inloggning",
        description: "Kunde inte logga in. Kontrollera servern.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("devToken");
    setIsLoggedIn(false);
    toast({
      title: "👋 Utloggad",
      description: "Du är nu utloggad",
    });
    onLogout?.();
  };

  if (isLoggedIn) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">✅ Inloggad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Du är inloggad som: <strong>{devToken}</strong>
            </p>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Logga ut
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">🔐 Dev Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="devToken">Dev Token</Label>
          <Input
            id="devToken"
            type="text"
            value={devToken}
            onChange={(e) => setDevToken(e.target.value)}
            placeholder="s_demo"
          />
        </div>
        <Button onClick={handleLogin} className="w-full">
          Logga in
        </Button>
        <div className="text-xs text-gray-500 text-center">
          <p>För att testa, använd:</p>
          <p>
            <strong>s_afif</strong>, <strong>s_ahmed_alrakabi</strong>, etc.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
