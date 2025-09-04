import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Unlock } from "lucide-react";
import * as gfp from "@/lib/gfpApi";
import { initQueueProcessing } from "@/lib/offlineQueue";

const goalSchema = z.object({ text: z.string().min(1).max(280), done: z.boolean().optional() });
const formSchema = z.object({
  title: z.string().min(1).max(120),
  goals: z.array(goalSchema).min(1),
});

type FormData = z.infer<typeof formSchema>;

export function GfpEditor({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showSavedTick, setShowSavedTick] = useState(false);

  useEffect(() => {
    initQueueProcessing();
  }, []);

  const { data: list, isLoading } = useQuery({
    queryKey: ["/api/gfp", clientId],
    queryFn: () => gfp.listGfp(clientId),
    retry: false,
  });

  const existing = useMemo(() => (list && list.length > 0 ? list[0] : null), [list]);
  const [form, setForm] = useState<FormData>({ title: "", goals: [{ text: "" }] });

  useEffect(() => {
    if (existing) {
      setForm({ title: existing.title, goals: existing.goals.map((g) => ({ text: g.text, done: g.done })) });
    }
  }, [existing]);

  const upsert = useMutation({
    mutationFn: async () => {
      setStatus("saving");
      setError(null);
      // validate
      formSchema.parse(form);
      if (!existing) {
        const created = await gfp.createGfp({ title: form.title, clientRef: clientId, goals: form.goals });
        return created;
      } else {
        const updated = await gfp.updateGfp(existing.id, {
          title: form.title,
          goals: form.goals,
          version: existing.version,
        });
        return updated;
      }
    },
    onSuccess: () => {
      setStatus("saved");
      setShowSavedTick(true);
      setTimeout(() => setShowSavedTick(false), 1200);
      qc.invalidateQueries({ queryKey: ["/api/gfp", clientId] });
      // Clear any local drafts could be handled here if implemented
    },
    onError: (e: any) => {
      const msg = String(e?.message || e);
      if (msg.startsWith("409")) {
        setError("Version har uppdaterats, ladda om?");
      } else {
        setError("Kunde inte spara");
      }
      setStatus("error");
    },
  });

  const toggleLock = useMutation({
    mutationFn: async (locked: boolean) => {
      if (!existing) return null;
      return gfp.setGfpLock(existing.id, locked);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/gfp", clientId] }),
  });

  const addGoal = () => setForm((f) => ({ ...f, goals: [...f.goals, { text: "" }] }));
  const updateGoal = (i: number, text: string) =>
    setForm((f) => ({ ...f, goals: f.goals.map((g, idx) => (idx === i ? { ...g, text } : g)) }));
  const removeGoal = (i: number) => setForm((f) => ({ ...f, goals: f.goals.filter((_, idx) => idx !== i) }));

  const disabled = existing?.locked && !!existing.lockedBy && existing.lockedBy !== "s_demo";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Genomförandeplan (GFP)
          {existing?.locked && <Badge className="bg-gray-200 text-gray-800">Låst</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Laddar...</div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium">Titel</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                disabled={disabled}
                placeholder="Titel på genomförandeplanen"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mål</label>
                <Button variant="outline" size="sm" onClick={addGoal} disabled={disabled}>
                  Lägg till mål
                </Button>
              </div>
              {form.goals.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <Textarea
                    placeholder="Beskriv målet (1–280 tecken)"
                    value={g.text}
                    onChange={(e) => updateGoal(i, e.target.value)}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => removeGoal(i)} disabled={disabled}>
                    Ta bort
                  </Button>
                </div>
              ))}
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex items-center gap-2">
              <Button onClick={() => upsert.mutate()} disabled={disabled}>
                {status === "saving" ? "Sparar…" : showSavedTick ? "Sparat ✓" : "Spara"}
              </Button>
              {existing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleLock.mutate(!(existing?.locked ?? false))}
                >
                  {existing?.locked ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                  {existing?.locked ? "Lås upp" : "Lås"}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

