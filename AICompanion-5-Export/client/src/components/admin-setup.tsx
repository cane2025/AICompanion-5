import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UngdomsLogo } from "@/components/ungdoms-logo";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Shield } from "lucide-react";

interface AdminSetupProps {
  onAdminCreated: () => void;
}

export function AdminSetup({ onAdminCreated }: AdminSetupProps) {
  const { toast } = useToast();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "admin",
      email: "admin@ungdoms.se",
      passwordHash: "", // Will be the actual password before hashing
      role: "admin",
      isActive: true,
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Kunde inte skapa administratör");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Administratör skapad!",
        description: "Du kan nu logga in med dina uppgifter.",
      });
      onAdminCreated();
    },
    onError: (error: Error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
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
            Första installationen
          </CardTitle>
          <p className="text-muted-foreground">
            Skapa administratörskonto för UNGDOMS Öppenvård
          </p>
        </CardHeader>

        <CardContent>
          <div className="mb-6 flex items-center justify-center space-x-2 text-sm text-ungdoms-600">
            <Shield className="h-4 w-4" />
            <span>Säker systemadministration</span>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                createAdminMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-ungdoms-700">
                      Användarnamn
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin"
                        className="border-ungdoms-200 focus:border-ungdoms-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-ungdoms-700">E-post</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@ungdoms.se"
                        className="border-ungdoms-200 focus:border-ungdoms-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordHash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-ungdoms-700">Lösenord</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ange säkert lösenord"
                        className="border-ungdoms-200 focus:border-ungdoms-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-ungdoms-700">Roll</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-ungdoms-200">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administratör</SelectItem>
                        <SelectItem value="staff">Vårdpersonal</SelectItem>
                        <SelectItem value="viewer">Granskning</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-ungdoms-600 hover:bg-ungdoms-700 text-white py-3"
                disabled={createAdminMutation.isPending}
              >
                {createAdminMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Skapar administratör...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Skapa Administratör</span>
                  </div>
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
