export interface AuditLog {
  id?: number;
  timestamp: Date;
  type:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "RESTORE"
    | "LOGIN"
    | "LOGOUT"
    | "VIEW";
  entity: "STAFF" | "CLIENT" | "DOCUMENT" | "USER" | "SYSTEM";
  entityId?: string;
  details: string;
}

const STORAGE_KEY = "auditLogs";

function readLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (Omit<AuditLog, "timestamp"> & {
      timestamp: string;
    })[];
    return parsed.map((l) => ({ ...l, timestamp: new Date(l.timestamp) }));
  } catch {
    return [];
  }
}

function writeLogs(logs: AuditLog[]) {
  try {
    const serializable = logs.map((l) => ({
      ...l,
      timestamp: l.timestamp.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.error("Failed to persist audit logs", e);
  }
}

export const auditLogger = {
  log: async (logEntry: Omit<AuditLog, "id" | "timestamp">): Promise<void> => {
    const logs = readLogs();
    const id = logs.length ? (logs[logs.length - 1].id ?? logs.length) + 1 : 1;
    logs.push({ id, timestamp: new Date(), ...logEntry });
    writeLogs(logs);
  },
  getLogs: async (): Promise<AuditLog[]> => {
    return readLogs().sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  },
};
