import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UngdomsLogo } from "@/components/ungdoms-logo";
import { LoginData, loginSchema } from "@shared/schema";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, User } from "lucide-react";

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      setError("");
      const json = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return json;
    },
    onSuccess: (userData) => {
      // Save dev token for subsequent requests
      if (userData?.token) {
        localStorage.setItem("devToken", userData.token);
      }
      toast({
        title: "Välkommen!",
        description: `Inloggad som ${userData.user.username}`,
      });
      onLoginSuccess(userData.user);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-ungdoms-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-ungdoms-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <UngdomsLogo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-ungdoms-800">
            Öppenvård Admin
          </CardTitle>
          <p className="text-muted-foreground">
            Säker inloggning för vårdpersonal
          </p>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex items-center justify-center space-x-2 text-sm text-ungdoms-600">
            <Shield className="h-4 w-4" />
            <span>GDPR-säker vårdadministration</span>
          </div>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-ungdoms-700">Användarnamn</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-ungdoms-400" />
                        <Input 
                          placeholder="Skriv ditt användarnamn" 
                          className="pl-10 border-ungdoms-200 focus:border-ungdoms-500 focus:ring-ungdoms-500"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-ungdoms-700">Lösenord</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-ungdoms-400" />
                        <Input 
                          type="password" 
                          placeholder="Skriv ditt lösenord" 
                          className="pl-10 border-ungdoms-200 focus:border-ungdoms-500 focus:ring-ungdoms-500"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-ungdoms-600 hover:bg-ungdoms-700 text-white py-3"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loggar in...</span>
                  </div>
                ) : (
                  "Logga in"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>© 2025 UNGDOMS Öppenvård</p>
            <p>Säker vårdadministration enligt GDPR</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}