import { Button } from "@/components/ui/button";
import { BarChart3, Users, FileText } from "lucide-react";

interface Props {
  active: string;
  onChange: (v: string) => void;
}

export function SidebarV2({ active, onChange }: Props) {
  const item = (key: string, label: string, Icon: any) => (
    <Button
      key={key}
      variant={active === key ? "default" : "ghost"}
      className={`w-full justify-start ${active === key ? "bg-blue-50 text-blue-700 border border-blue-200" : ""}`}
      onClick={() => onChange(key)}
    >
      <Icon className="mr-3 h-4 w-4" />
      {label}
    </Button>
  );
  return (
    <aside className="bg-white w-64 border-r p-4 space-y-2">
      {item("overview", "Översikt", BarChart3)}
      {item("clients", "Klienten", Users)}
      {item("staff", "Personal", Users)}
      {item("reports", "Rapporter", FileText)}
    </aside>
  );
}

