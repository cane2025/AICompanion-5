import { isSameWeek } from "date-fns";

export function safeInitials(clientInitials: string) {
  return clientInitials || "?";
}

export function formatISODate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function weeklyDocMissingThisWeek(days: { documented: boolean; date: string }[]): boolean {
  const now = new Date();
  return !days.some((d) => d.documented && isSameWeek(new Date(d.date), now, { weekStartsOn: 1 }));
}

export function paginate<T>(arr: T[], page: number, pageSize: number): { pageItems: T[]; total: number; pages: number } {
  const total = arr.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return { pageItems: arr.slice(start, start + pageSize), total, pages };
}

export function clsxChips(status: "waiting" | "active" | "overdue" | "completed") {
  switch (status) {
    case "waiting":
      return "bg-gray-100 text-gray-800";
    case "active":
      return "bg-blue-100 text-blue-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

