import { Button } from "@/components/ui/button";

export type FilterKey = "requires" | "recent_created" | "recent_updated" | "waiting" | "overdue" | "all";

interface Props {
  value: FilterKey;
  onChange: (v: FilterKey) => void;
}

export function DashboardTopFilters({ value, onChange }: Props) {
  const btn = (k: FilterKey, label: string) => (
    <Button
      key={k}
      variant={value === k ? "default" : "outline"}
      className={value === k ? "bg-blue-600 text-white" : ""}
      onClick={() => onChange(k)}
    >
      {label}
    </Button>
  );

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {btn("recent_created", "Senast skapade")}
      {btn("recent_updated", "Senast uppdaterade")}
      {btn("waiting", "Endast väntande")}
      {btn("overdue", "Endast försenade")}
      {btn("requires", "Kräver åtgärd")}
      {btn("all", "Visa alla")}
    </div>
  );
}
