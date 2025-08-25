import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listWeeklyDocs,
  createWeeklyDoc,
  addWeeklyDocEntry,
  updateWeeklyDocEntry,
  deleteWeeklyDocEntry,
} from "./api";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Calendar, Clock, Tag } from "lucide-react";
import { useState } from "react";

interface WeeklyDocViewProps {
  clientId: string;
}

// Helper function to get start of week (Monday) as ISO string
function startOfWeekISO(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

// Helper function to get day name from ISO date
function getDayName(dateISO: string): string {
  const days = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
  const date = new Date(dateISO);
  return days[date.getDay()];
}

// WeekPicker component
function WeekPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (week: string) => void;
}) {
  const [currentWeek] = useState(startOfWeekISO(new Date()));

  const goToPreviousWeek = () => {
    const date = new Date(value);
    date.setDate(date.getDate() - 7);
    onChange(startOfWeekISO(date));
  };

  const goToNextWeek = () => {
    const date = new Date(value);
    date.setDate(date.getDate() + 7);
    onChange(startOfWeekISO(date));
  };

  const goToCurrentWeek = () => {
    onChange(currentWeek);
  };

  const formatWeekDisplay = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("sv-SE")} - ${end.toLocaleDateString(
      "sv-SE"
    )}`;
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Veckodokumentation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            ←
          </Button>
          <div className="flex-1 text-center">
            <div className="font-medium">{formatWeekDisplay(value)}</div>
            <div className="text-sm text-muted-foreground">
              Vecka {getWeekNumber(new Date(value))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            →
          </Button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={goToCurrentWeek}
          className="w-full"
        >
          Gå till denna vecka
        </Button>
      </CardContent>
    </Card>
  );
}

// SummaryPanel component
function SummaryPanel({ doc }: { doc: any }) {
  if (!doc) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Summering</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ingen veckodokumentation för denna vecka
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalHours =
    doc.entries?.reduce(
      (sum: number, entry: any) => sum + (entry.hours || 0),
      0
    ) || 0;
  const categories =
    doc.entries?.reduce((acc: any, entry: any) => {
      acc[entry.category] = (acc[entry.category] || 0) + (entry.hours || 0);
      return acc;
    }, {}) || {};

  const avgMood =
    doc.entries
      ?.filter((e: any) => e.mood)
      .reduce((sum: number, entry: any) => sum + entry.mood, 0) /
      doc.entries?.filter((e: any) => e.mood).length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summering</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-medium">{totalHours}h totalt</span>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Kategorier:</h4>
          <div className="space-y-1">
            {Object.entries(categories).map(([category, hours]) => (
              <div key={category} className="flex justify-between text-sm">
                <span>{category}</span>
                <Badge variant="outline">{hours}h</Badge>
              </div>
            ))}
          </div>
        </div>

        {avgMood > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Genomsnittligt humör:</h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= avgMood ? "text-yellow-500" : "text-gray-300"
                  }
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// DayEditor component
function DayEditor({
  doc,
  day,
  dateISO,
}: {
  doc: any;
  day: string;
  dateISO: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const entry = doc?.entries?.find((e: any) => e.dateISO === dateISO);

  const addEntryMut = useMutation({
    mutationFn: (entryData: any) => addWeeklyDocEntry(doc.id, entryData),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: qk.weeklyDocs(doc.clientId, doc.weekStartISO),
      });
      toast({ title: "Post tillagd", description: "Ny post har skapats" });
    },
  });

  const updateEntryMut = useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: any }) =>
      updateWeeklyDocEntry(doc.id, entryId, data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: qk.weeklyDocs(doc.clientId, doc.weekStartISO),
      });
      setIsEditing(false);
      setEditingEntry(null);
      toast({ title: "Post uppdaterad", description: "Ändringar har sparats" });
    },
  });

  const deleteEntryMut = useMutation({
    mutationFn: (entryId: string) => deleteWeeklyDocEntry(doc.id, entryId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: qk.weeklyDocs(doc.clientId, doc.weekStartISO),
      });
      toast({ title: "Post borttagen", description: "Posten har tagits bort" });
    },
  });

  const quickTemplates = [
    { name: "Skola", category: "Skola", hours: 6, notes: "Skolgång" },
    { name: "Familj", category: "Familj", hours: 2, notes: "Familjetid" },
    {
      name: "Fritid",
      category: "Fritid",
      hours: 3,
      notes: "Fritidsaktiviteter",
    },
    { name: "BJJ", category: "BJJ", hours: 1.5, notes: "BJJ-träning" },
    { name: "Hälsa", category: "Hälsa", hours: 1, notes: "Hälsorutiner" },
  ];

  const handleQuickTemplate = (template: any) => {
    if (entry) {
      // Update existing entry
      updateEntryMut.mutate({
        entryId: entry.id,
        data: { ...entry, ...template },
      });
    } else {
      // Create new entry
      addEntryMut.mutate({
        dateISO,
        category: template.category,
        hours: template.hours,
        notes: template.notes,
      });
    }
  };

  const handleEdit = () => {
    setEditingEntry(
      entry || {
        dateISO,
        category: "",
        hours: 0,
        notes: "",
        location: "",
        mood: 0,
        tags: [],
      }
    );
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editingEntry) {
      updateEntryMut.mutate({
        entryId: editingEntry.id,
        data: editingEntry,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {day} {new Date(dateISO).toLocaleDateString("sv-SE")}
          </span>
          {entry && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Ta bort denna post?")) {
                    deleteEntryMut.mutate(entry.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!entry && !isEditing ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Ingen post för denna dag
            </p>
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickTemplate(template)}
                  disabled={addEntryMut.isPending}
                >
                  {template.name}
                </Button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till post
            </Button>
          </div>
        ) : entry && !isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{entry.category}</Badge>
              {entry.hours && <Badge variant="secondary">{entry.hours}h</Badge>}
              {entry.mood && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= entry.mood ? "text-yellow-500" : "text-gray-300"
                      }
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              )}
            </div>
            {entry.location && (
              <div className="text-sm text-muted-foreground">
                📍 {entry.location}
              </div>
            )}
            {entry.notes && <div className="text-sm">{entry.notes}</div>}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <Select
                value={editingEntry?.category || ""}
                onValueChange={(value) =>
                  setEditingEntry({ ...editingEntry, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Skola">Skola</SelectItem>
                  <SelectItem value="Familj">Familj</SelectItem>
                  <SelectItem value="Fritid">Fritid</SelectItem>
                  <SelectItem value="BJJ">BJJ</SelectItem>
                  <SelectItem value="Hälsa">Hälsa</SelectItem>
                  <SelectItem value="Övrigt">Övrigt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Timmar</label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={editingEntry?.hours || ""}
                onChange={(e) =>
                  setEditingEntry({
                    ...editingEntry,
                    hours: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Plats</label>
              <Input
                value={editingEntry?.location || ""}
                onChange={(e) =>
                  setEditingEntry({ ...editingEntry, location: e.target.value })
                }
                placeholder="Var aktiviteten ägde rum"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Humör (1-5)
              </label>
              <Select
                value={editingEntry?.mood?.toString() || ""}
                onValueChange={(value) =>
                  setEditingEntry({ ...editingEntry, mood: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj humör" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Mycket dåligt</SelectItem>
                  <SelectItem value="2">2 - Dåligt</SelectItem>
                  <SelectItem value="3">3 - Okej</SelectItem>
                  <SelectItem value="4">4 - Bra</SelectItem>
                  <SelectItem value="5">5 - Mycket bra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Anteckningar
              </label>
              <Textarea
                value={editingEntry?.notes || ""}
                onChange={(e) =>
                  setEditingEntry({ ...editingEntry, notes: e.target.value })
                }
                placeholder="Beskriv aktiviteten..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Taggar</label>
              <Input
                value={editingEntry?.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditingEntry({
                    ...editingEntry,
                    tags: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateEntryMut.isPending}
                className="flex-1"
              >
                Spara
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditingEntry(null);
                }}
                className="flex-1"
              >
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main WeeklyDocView component
export default function WeeklyDocView({ clientId }: WeeklyDocViewProps) {
  const [week, setWeek] = useState(startOfWeekISO(new Date()));
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery({
    queryKey: qk.weeklyDocs(clientId, week),
    queryFn: () => listWeeklyDocs(clientId, week),
  });

  const createDocMut = useMutation({
    mutationFn: createWeeklyDoc,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.weeklyDocs(clientId, week) });
      toast({
        title: "Veckodokumentation skapad",
        description: "Ny veckodokumentation har skapats",
      });
    },
  });

  const doc = data[0]; // Get the first (and should be only) doc for this week

  const weekDays = [
    { day: "Mån", dateISO: week },
    {
      day: "Tis",
      dateISO: new Date(new Date(week).getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      day: "Ons",
      dateISO: new Date(new Date(week).getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      day: "Tor",
      dateISO: new Date(new Date(week).getTime() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      day: "Fre",
      dateISO: new Date(new Date(week).getTime() + 4 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      day: "Lör",
      dateISO: new Date(new Date(week).getTime() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      day: "Sön",
      dateISO: new Date(new Date(week).getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  ];

  const handleCreateWeek = () => {
    createDocMut.mutate({
      clientId,
      weekStartISO: week,
    });
  };

  if (isLoading) {
    return <div>Laddar veckodokumentation...</div>;
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-4 space-y-4">
        <WeekPicker value={week} onChange={setWeek} />
        <SummaryPanel doc={doc} />

        {!doc && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleCreateWeek}
                disabled={createDocMut.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Skapa veckodokumentation
              </Button>
            </CardContent>
          </Card>
        )}
      </aside>

      <main className="col-span-8 space-y-4">
        {doc ? (
          weekDays.map(({ day, dateISO }) => (
            <DayEditor key={dateISO} doc={doc} day={day} dateISO={dateISO} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Välj en vecka och skapa veckodokumentation för att komma igång
          </div>
        )}
      </main>
    </div>
  );
}
