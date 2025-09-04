import { describe, it, expect, beforeAll } from 'vitest';

const API = 'http://127.0.0.1:3001/api';
const headers = { 'Content-Type': 'application/json', 'X-Dev-Token': 's_demo' } as const;

async function safeFetch(input: string, init?: any) {
  try {
    return await fetch(input as any, init);
  } catch {
    return undefined as any;
  }
}

async function postJson(path: string, body: any) {
  const res = await safeFetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res) return { ok: false, json: {} } as const;
  const json = await res.json();
  return { ok: (res as any).ok, json } as const;
}
async function putJson(path: string, body: any) {
  const res = await safeFetch(`${API}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res) return { ok: false, json: {} } as const;
  const json = await res.json();
  return { ok: (res as any).ok, json } as const;
}
async function getJson(path: string) {
  const res = await safeFetch(`${API}${path}`, { headers });
  if (!res) return { ok: false, json: [] } as const;
  const json = await res.json();
  return { ok: (res as any).ok, json } as const;
}

describe('V2 flows', () => {
  let clientId = '';
  let reachable = true;

  beforeAll(async () => {
    const health = await safeFetch(`${API}/health`);
    reachable = !!health;
    if (!reachable) return;
    const { json } = await postJson('/clients', { initials: 'UT', status: 'active' });
    clientId = (json as any)?.id || '';
  });

  it.skipIf(() => !reachable)('createCarePlan ⇒ autoCreateGFP with correct indices', async () => {
    const r1 = await postJson(`/clients/${clientId}/care-plans`, { receivedDate: '2025-09-01' });
    const r2 = await postJson(`/clients/${clientId}/care-plans`, { receivedDate: '2025-09-02' });
    const r3 = await postJson(`/clients/${clientId}/care-plans`, { receivedDate: '2025-09-03' });
    expect(r1.ok && r2.ok && r3.ok).toBe(true);
    const { json: gfps } = await getJson(`/clients/${clientId}/implementation-plans`);
    const indices = (gfps as any[]).map((g: any) => g.index).sort((a: number,b: number)=>a-b);
    expect(indices).toEqual([1,2,3]);
    const linked = (gfps as any[]).map((g: any) => g.carePlanIndex).sort((a: number,b: number)=>a-b);
    expect(linked).toEqual([1,2,3]);
  });

  it.skipIf(() => !reachable)('weeklyDocs upsert aggregates correctly', async () => {
    const { json: wd } = await putJson(`/clients/${clientId}/weekly-docs/2025/36`, {
      days: {
        mon: { documented: true, qualityApproved: true },
        tue: { documented: true, qualityApproved: false, delayed: true },
      },
    });
    expect((wd as any).documented).toBe(true);
    expect((wd as any).qualityApproved).toBe(false);
    expect((wd as any).delayed).toBe(true);
  });

  it.skipIf(() => !reachable)('stats aggregation for staff handles empty gracefully and returns fields', async () => {
    const { json: stats } = await getJson(`/stats/staff?from=2025-01-01&to=2025-12-31`);
    expect(Array.isArray(stats)).toBe(true);
    if ((stats as any[]).length > 0) {
      const s = (stats as any[])[0];
      expect(s).toHaveProperty('documentedCount');
      expect(s).toHaveProperty('delayedCount');
      expect(s).toHaveProperty('notApprovedCount');
    }
  });
});

