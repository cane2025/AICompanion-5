import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Staff } from "@shared/schema";
import { useState } from "react";

export function SmartStaffSidebar() {
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });
  const [search, setSearch] = useState("");

  const filtered = staff.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-64 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-2">Personal ({staff.length})</h3>
        <Input placeholder="Sök..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <ScrollArea className="flex-1">
        {filtered.map(p => (
          <div key={p.id} className="px-4 py-2 flex items-center gap-2 hover:bg-gray-50 cursor-pointer group">
            <div className={`w-2 h-2 rounded-full ${p.status === "active" ? "bg-green-500" : "bg-gray-400"}`}></div>
            <span className="text-sm flex-1 truncate">{p.firstName} {p.lastName}</span>
            <span className="text-xs text-muted-foreground group-hover:opacity-100 opacity-0 transition-opacity">{p.todayClients ?? 0}/5</span>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}