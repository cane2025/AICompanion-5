import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  createGfpPlan,
  updateGfpPlan,
  getGfpPlan,
  lockGfpPlan,
  deleteGfpPlan,
  type GfpPlan,
} from '@/lib/api';
import { gfpCreateSchema, gfpUpdateSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lock, 
  Unlock, 
  Save, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  WifiOff 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Form validation schema
const gfpFormSchema = z.object({
  title: z.string().min(1, "Titel krävs").max(120, "Titel får vara max 120 tecken"),
  goals: z.array(z.object({
    text: z.string().min(1, "Mål-text krävs").max(280, "Mål-text får vara max 280 tecken")
  })).min(1, "Minst ett mål krävs"),
});

type GfpFormData = z.infer<typeof gfpFormSchema>;

interface GfpFormProps {
  clientId: string;
  staffId: string;
  planId?: string; // For editing existing plan
  onSaved?: (plan: GfpPlan) => void;
  onDeleted?: () => void;
}

export function GfpForm({ clientId, staffId, planId, onSaved, onDeleted }: GfpFormProps) {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLocked, setIsLocked] = useState(false);
  const [version, setVersion] = useState(1);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autosaveTimer, setAutosaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [localDraft, setLocalDraft] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<GfpFormData>({
    resolver: zodResolver(gfpFormSchema),
    defaultValues: {
      title: "",
      goals: [{ text: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "goals",
  });

  // Load existing plan if editing
  const { data: existingPlan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['gfp', planId],
    queryFn: () => planId ? getGfpPlan(planId) : null,
    enabled: !!planId,
  });

  // Initialize form with existing plan data
  useEffect(() => {
    if (existingPlan) {
      form.reset({
        title: existingPlan.title,
        goals: existingPlan.goals.length > 0 ? existingPlan.goals : [{ text: "" }],
      });
      setIsLocked(existingPlan.locked);
      setVersion(existingPlan.version);
    }
  }, [existingPlan, form]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draftKey = `gfp-draft-${clientId}-${planId || 'new'}`;
    const draft = localStorage.getItem(draftKey);
    if (draft && !existingPlan) {
      try {
        const draftData = JSON.parse(draft);
        form.reset(draftData);
        setLocalDraft(draftKey);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    } else {
      setLocalDraft(draftKey);
    }
  }, [clientId, planId, existingPlan, form]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Autosave functionality
  const saveToLocalStorage = useCallback((data: GfpFormData) => {
    if (localDraft) {
      localStorage.setItem(localDraft, JSON.stringify(data));
    }
  }, [localDraft]);

  const clearLocalStorage = useCallback(() => {
    if (localDraft) {
      localStorage.removeItem(localDraft);
    }
  }, [localDraft]);

  // Watch form changes for autosave
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
      }

      const timer = setTimeout(() => {
        saveToLocalStorage(data as GfpFormData);
      }, 5000); // Save every 5 seconds

      setAutosaveTimer(timer);
    });

    return () => {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
      }
      subscription.unsubscribe();
    };
  }, [form, saveToLocalStorage, autosaveTimer]);

  // Save on blur
  const handleBlur = useCallback(() => {
    const data = form.getValues();
    saveToLocalStorage(data);
  }, [form, saveToLocalStorage]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: GfpFormData) => {
      const createData = {
        title: data.title,
        clientRef: clientId,
        goals: data.goals,
        staffId,
      };
      return createGfpPlan(createData);
    },
    onSuccess: (plan) => {
      setSaveState('saved');
      setVersion(plan.version);
      clearLocalStorage();
      queryClient.invalidateQueries({ queryKey: ['gfp'] });
      toast({
        title: "Genomförandeplan sparad",
        description: "Planen har skapats framgångsrikt.",
      });
      onSaved?.(plan);
      setTimeout(() => setSaveState('idle'), 2000);
    },
    onError: (error) => {
      setSaveState('error');
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara genomförandeplan.",
        variant: "destructive",
      });
      setTimeout(() => setSaveState('idle'), 3000);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: GfpFormData) => {
      if (!planId) throw new Error('Plan ID krävs för uppdatering');
      
      const updateData = {
        title: data.title,
        goals: data.goals,
        version,
      };
      return updateGfpPlan(planId, updateData);
    },
    onSuccess: (plan) => {
      setSaveState('saved');
      setVersion(plan.version);
      clearLocalStorage();
      queryClient.invalidateQueries({ queryKey: ['gfp'] });
      toast({
        title: "Genomförandeplan uppdaterad",
        description: "Ändringarna har sparats.",
      });
      onSaved?.(plan);
      setTimeout(() => setSaveState('idle'), 2000);
    },
    onError: (error: any) => {
      setSaveState('error');
      
      // Handle version conflict (409)
      if (error.message?.includes('Version har uppdaterats')) {
        toast({
          title: "Version konflikt",
          description: "Planen har uppdaterats av någon annan. Ladda om sidan för att se de senaste ändringarna.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fel",
          description: error.message || "Kunde inte uppdatera genomförandeplan.",
          variant: "destructive",
        });
      }
      setTimeout(() => setSaveState('idle'), 3000);
    },
  });

  // Lock/unlock mutation
  const lockMutation = useMutation({
    mutationFn: (locked: boolean) => {
      if (!planId) throw new Error('Plan ID krävs för låsning');
      return lockGfpPlan(planId, { locked });
    },
    onSuccess: (plan) => {
      setIsLocked(plan.locked);
      queryClient.invalidateQueries({ queryKey: ['gfp'] });
      toast({
        title: plan.locked ? "Plan låst" : "Plan upplåst",
        description: plan.locked 
          ? "Planen är nu skrivskyddad för andra användare." 
          : "Planen kan nu redigeras av andra användare.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ändra låsstatus.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!planId) throw new Error('Plan ID krävs för borttagning');
      return deleteGfpPlan(planId);
    },
    onSuccess: () => {
      clearLocalStorage();
      queryClient.invalidateQueries({ queryKey: ['gfp'] });
      toast({
        title: "Genomförandeplan borttagen",
        description: "Planen har tagits bort.",
      });
      onDeleted?.();
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ta bort genomförandeplan.",
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (data: GfpFormData) => {
    if (isLocked && planId) {
      toast({
        title: "Plan låst",
        description: "Denna plan är låst och kan inte redigeras.",
        variant: "destructive",
      });
      return;
    }

    setSaveState('saving');

    if (planId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Add goal
  const addGoal = () => {
    append({ text: "" });
  };

  // Remove goal
  const removeGoal = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Toggle lock
  const toggleLock = () => {
    if (planId) {
      lockMutation.mutate(!isLocked);
    }
  };

  // Delete plan
  const handleDelete = () => {
    if (planId && window.confirm('Är du säker på att du vill ta bort denna genomförandeplan?')) {
      deleteMutation.mutate();
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {planId ? 'Redigera' : 'Skapa'} Genomförandeplan (GFP)
            {isLocked && <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" />Låst</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="outline" className="text-orange-600">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            {planId && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleLock}
                  disabled={lockMutation.isPending}
                >
                  {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isLocked ? 'Upplås' : 'Lås'}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Ta bort
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!isOnline && (
          <Alert className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Offline – ändringar sparas lokalt och kommer att synkroniseras när anslutningen återställs.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title field */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Ange titel för genomförandeplanen"
              disabled={isLocked}
              onBlur={handleBlur}
              maxLength={120}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {form.watch('title')?.length || 0}/120 tecken
            </p>
          </div>

          {/* Goals section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Mål *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGoal}
                disabled={isLocked}
              >
                <Plus className="h-4 w-4 mr-1" />
                Lägg till mål
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <Textarea
                      {...form.register(`goals.${index}.text`)}
                      placeholder={`Mål ${index + 1}`}
                      disabled={isLocked}
                      onBlur={handleBlur}
                      maxLength={280}
                      rows={2}
                    />
                    {form.formState.errors.goals?.[index]?.text && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.goals[index]?.text?.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {form.watch(`goals.${index}.text`)?.length || 0}/280 tecken
                    </p>
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGoal(index)}
                      disabled={isLocked}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {form.formState.errors.goals?.root && (
              <p className="text-sm text-red-500">{form.formState.errors.goals.root.message}</p>
            )}
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              {saveState === 'saving' && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sparar...
                </div>
              )}
              {saveState === 'saved' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sparat ✓
                </div>
              )}
              {saveState === 'error' && (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Fel vid sparande
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isLocked || saveState === 'saving'}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveState === 'saving' ? 'Sparar...' : 'Spara genomförandeplan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}