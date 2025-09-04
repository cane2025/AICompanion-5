import { enqueue } from "./offlineQueue";

const API = "/api";

async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit & { maxRetries?: number }
) {
  const maxRetries = init?.maxRetries ?? 2;
  const backoffs = [200, 500, 1000];
  let attempt = 0;

  while (true) {
    try {
      const res = await fetch(input, init);
      if (!res.ok && res.status >= 500) {
        throw new Error(`${res.status}`);
      }
      return res;
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      await new Promise((r) => setTimeout(r, backoffs[Math.min(attempt, backoffs.length - 1)]));
      attempt++;
    }
  }
}

export interface GfpGoal {
  id?: string;
  text: string;
  done?: boolean;
}

export interface GfpItem {
  id: string;
  title: string;
  clientRef: string;
  goals: GfpGoal[];
  version: number;
  locked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export async function listGfp(clientRef?: string): Promise<GfpItem[]> {
  const url = clientRef ? `${API}/gfp?clientRef=${encodeURIComponent(clientRef)}` : `${API}/gfp`;
  const res = await fetchWithRetry(url, { method: "GET", credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getGfp(id: string): Promise<GfpItem> {
  const res = await fetchWithRetry(`${API}/gfp/${id}`, { method: "GET", credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createGfp(payload: { title: string; clientRef: string; goals: GfpGoal[] }): Promise<GfpItem> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueue({ method: "POST", url: `${API}/gfp`, body: payload });
    // Return a local draft-like object
    return {
      id: `local_${Date.now()}`,
      title: payload.title,
      clientRef: payload.clientRef,
      goals: payload.goals,
      version: 1,
      locked: false,
      lockedBy: null,
      lockedAt: null,
      ownerId: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as GfpItem;
  }
  const res = await fetchWithRetry(`${API}/gfp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateGfp(
  id: string,
  payload: Partial<Pick<GfpItem, "title" | "clientRef" | "goals">> & { version: number }
): Promise<GfpItem> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueue({ method: "PUT", url: `${API}/gfp/${id}`, body: payload });
    // Simulate local version increment
    return { ...(await getGfp(id)), ...payload, version: payload.version + 1 } as GfpItem;
  }
  const res = await fetchWithRetry(`${API}/gfp/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    const text = await res.text();
    throw new Error(`409: ${text}`);
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setGfpLock(id: string, locked: boolean): Promise<GfpItem> {
  const res = await fetchWithRetry(`${API}/gfp/${id}/lock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ locked }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteGfp(id: string): Promise<void> {
  const res = await fetchWithRetry(`${API}/gfp/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
}

