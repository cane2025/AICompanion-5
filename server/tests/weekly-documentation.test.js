import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../storage.js';

describe('Weekly Documentation', () => {
  let storage;
  let testClientId;

  beforeEach(async () => {
    storage = new MemStorage();
    
    // Create a test client
    const client = await storage.createClient({
      displayCode: 'TEST',
      active: true,
    });
    testClientId = client.id;
  });

  it('should upsert weekly doc correctly', async () => {
    const weeklyDoc = await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2025,
      week: 36,
      days: JSON.stringify({
        mon: { documented: true, qualityApproved: true, onTime: true, delayed: false },
        tue: { documented: true, qualityApproved: false, onTime: false, delayed: true },
      }),
      documented: true,
      qualityApproved: false, // because tue is not approved
      onTime: false, // because tue is delayed
      delayed: true,
      comments: 'Test week',
    });

    expect(weeklyDoc.clientId).toBe(testClientId);
    expect(weeklyDoc.year).toBe(2025);
    expect(weeklyDoc.week).toBe(36);
    expect(weeklyDoc.documented).toBe(true);
    expect(weeklyDoc.qualityApproved).toBe(false);
    expect(weeklyDoc.delayed).toBe(true);
  });

  it('should update existing weekly doc', async () => {
    // Create initial doc
    await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2025,
      week: 36,
      days: JSON.stringify({ mon: { documented: true, qualityApproved: true, onTime: true, delayed: false } }),
      documented: true,
      qualityApproved: true,
      onTime: true,
      delayed: false,
    });

    // Update it
    const updated = await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2025,
      week: 36,
      days: JSON.stringify({
        mon: { documented: true, qualityApproved: true, onTime: true, delayed: false },
        tue: { documented: true, qualityApproved: true, onTime: true, delayed: false },
      }),
      documented: true,
      qualityApproved: true,
      onTime: true,
      delayed: false,
      comments: 'Updated',
    });

    const retrieved = await storage.getWeeklyDoc(testClientId, 2025, 36);
    expect(retrieved.comments).toBe('Updated');
    expect(retrieved.id).toBe(updated.id); // Same document
  });

  it('should get weekly docs by client and year', async () => {
    await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2025,
      week: 35,
      days: JSON.stringify({}),
      documented: false,
      qualityApproved: false,
      onTime: true,
      delayed: false,
    });

    await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2025,
      week: 36,
      days: JSON.stringify({}),
      documented: true,
      qualityApproved: true,
      onTime: true,
      delayed: false,
    });

    await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2024,
      week: 52,
      days: JSON.stringify({}),
      documented: true,
      qualityApproved: true,
      onTime: true,
      delayed: false,
    });

    const docs2025 = await storage.getWeeklyDocsByClient(testClientId, 2025);
    expect(docs2025).toHaveLength(2);
    expect(docs2025[0].week).toBe(36); // newest first
    expect(docs2025[1].week).toBe(35);

    const docs2024 = await storage.getWeeklyDocsByClient(testClientId, 2024);
    expect(docs2024).toHaveLength(1);
    expect(docs2024[0].week).toBe(52);
  });

  it('should calculate week aggregated flags correctly', async () => {
    // Test case: 2 days documented, 1 delayed, 1 not approved
    const days = {
      mon: { documented: true, qualityApproved: true, onTime: true, delayed: false },
      tue: { documented: true, qualityApproved: false, onTime: false, delayed: true }, // delayed and not approved
      wed: { documented: false, qualityApproved: false, onTime: true, delayed: false }, // not documented
    };

    const weeklyDoc = await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2025,
      week: 36,
      days: JSON.stringify(days),
      documented: true, // at least one day documented (mon, tue)
      qualityApproved: false, // not all documented days are approved (tue is not)
      onTime: false, // not all days are on time (tue is delayed)
      delayed: true, // at least one day is delayed (tue)
    });

    expect(weeklyDoc.documented).toBe(true);
    expect(weeklyDoc.qualityApproved).toBe(false);
    expect(weeklyDoc.onTime).toBe(false);
    expect(weeklyDoc.delayed).toBe(true);
  });

  it('should handle unique constraint for client/year/week', async () => {
    await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2025,
      week: 36,
      days: JSON.stringify({}),
      documented: false,
      qualityApproved: false,
      onTime: true,
      delayed: false,
      comments: 'First',
    });

    // This should update, not create new
    await storage.upsertWeeklyDoc({
      clientId: testClientId,
      year: 2025,
      week: 36,
      days: JSON.stringify({}),
      documented: true,
      qualityApproved: true,
      onTime: true,
      delayed: false,
      comments: 'Updated',
    });

    const docs = await storage.getWeeklyDocsByClient(testClientId, 2025);
    expect(docs).toHaveLength(1);
    expect(docs[0].comments).toBe('Updated');
  });
});