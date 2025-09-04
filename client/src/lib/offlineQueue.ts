type HttpMethod = "POST" | "PUT" | "PATCH";

export interface QueuedRequest {
  id: string;
  method: HttpMethod;
  url: string;
  body: any;
  headers?: Record<string, string>;
  createdAt: number;
}

const STORAGE_KEY = "offlineQueue.v1";

function loadQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

export function enqueue(request: Omit<QueuedRequest, "id" | "createdAt">) {
  const queue = loadQueue();
  const item: QueuedRequest = {
    id: `qr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    ...request,
  };
  queue.push(item);
  saveQueue(queue);
}

export async function processQueue(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const queue = loadQueue();
  const remaining: QueuedRequest[] = [];

  for (const req of queue) {
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(req.headers || {}),
        },
        body: JSON.stringify(req.body),
        credentials: "include",
      });
      // On 2xx consider delivered; otherwise keep in queue unless 4xx
      if (!res.ok && res.status >= 400 && res.status < 500) {
        // Drop invalid requests
        continue;
      }
      if (!res.ok) {
        remaining.push(req);
      }
    } catch {
      remaining.push(req);
    }
  }

  saveQueue(remaining);
}

export function initQueueProcessing() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    void processQueue();
  });
  // Try once on init
  void processQueue();
}

