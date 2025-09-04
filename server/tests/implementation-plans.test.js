import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../storage.js';

describe('Implementation Plans (GFP)', () => {
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

  it('should create implementation plan with auto-incremented index', async () => {
    const gfp1 = await storage.createImplementationPlanVersioned({
      clientId: testClientId,
      carePlanIndex: 1,
      status: 'Väntar',
    });

    expect(gfp1.index).toBe(1);
    expect(gfp1.clientId).toBe(testClientId);
    expect(gfp1.carePlanIndex).toBe(1);
    expect(gfp1.status).toBe('Väntar');

    const gfp2 = await storage.createImplementationPlanVersioned({
      clientId: testClientId,
      carePlanIndex: 2,
      status: 'Aktiv',
    });

    expect(gfp2.index).toBe(2);
  });

  it('should initialize follow-ups correctly', async () => {
    const gfp = await storage.createImplementationPlanVersioned({
      clientId: testClientId,
      carePlanIndex: 1,
      status: 'Väntar',
    });

    const followUps = JSON.parse(gfp.followUps);
    expect(followUps).toHaveLength(5);
    
    expect(followUps[0].key).toBe('Uppföljning1');
    expect(followUps[0].done).toBe(false);
    expect(followUps[1].key).toBe('Uppföljning2');
    expect(followUps[1].done).toBe(false);
    expect(followUps[2].key).toBe('Uppföljning3');
    expect(followUps[2].done).toBe(false);
    expect(followUps[3].key).toBe('Uppföljning4');
    expect(followUps[3].done).toBe(false);
    expect(followUps[4].key).toBe('Uppföljning5');
    expect(followUps[4].done).toBe(false);
  });

  it('should auto-create GFP with correct defaults', async () => {
    const gfp = await storage.autoCreateImplementationPlan(testClientId, 1);

    expect(gfp.clientId).toBe(testClientId);
    expect(gfp.carePlanIndex).toBe(1);
    expect(gfp.status).toBe('Väntar');
    expect(gfp.index).toBe(1);

    const followUps = JSON.parse(gfp.followUps);
    expect(followUps).toHaveLength(5);
    followUps.forEach((followUp, index) => {
      expect(followUp.key).toBe(`Uppföljning${index + 1}`);
      expect(followUp.done).toBe(false);
    });
  });

  it('should get implementation plans by client sorted by index desc', async () => {
    await storage.createImplementationPlanVersioned({
      clientId: testClientId,
      carePlanIndex: 1,
      status: 'Väntar',
    });

    await storage.createImplementationPlanVersioned({
      clientId: testClientId,
      carePlanIndex: 2,
      status: 'Aktiv',
    });

    await storage.createImplementationPlanVersioned({
      clientId: testClientId,
      carePlanIndex: 3,
      status: 'Slutförd',
    });

    const plans = await storage.getImplementationPlansByClient(testClientId);

    expect(plans).toHaveLength(3);
    expect(plans[0].index).toBe(3); // newest first
    expect(plans[1].index).toBe(2);
    expect(plans[2].index).toBe(1);
  });

  it('should handle custom follow-ups', async () => {
    const customFollowUps = [
      { key: 'Uppföljning1', done: true, note: 'Completed task 1', date: '2025-01-15' },
      { key: 'Uppföljning2', done: false },
      { key: 'Uppföljning3', done: true, note: 'Completed task 3' },
      { key: 'Uppföljning4', done: false },
      { key: 'Uppföljning5', done: false },
    ];

    const gfp = await storage.createImplementationPlanVersioned({
      clientId: testClientId,
      carePlanIndex: 1,
      status: 'Aktiv',
      followUps: customFollowUps,
    });

    const savedFollowUps = JSON.parse(gfp.followUps);
    expect(savedFollowUps[0].done).toBe(true);
    expect(savedFollowUps[0].note).toBe('Completed task 1');
    expect(savedFollowUps[0].date).toBe('2025-01-15');
    expect(savedFollowUps[1].done).toBe(false);
    expect(savedFollowUps[2].done).toBe(true);
    expect(savedFollowUps[2].note).toBe('Completed task 3');
  });

  it('should only return plans for specified client', async () => {
    // Create another client
    const client2 = await storage.createClient({
      displayCode: 'TEST2',
      active: true,
    });

    await storage.createImplementationPlanVersioned({
      clientId: testClientId,
      carePlanIndex: 1,
      status: 'Väntar',
    });

    await storage.createImplementationPlanVersioned({
      clientId: client2.id,
      carePlanIndex: 1,
      status: 'Aktiv',
    });

    const client1Plans = await storage.getImplementationPlansByClient(testClientId);
    const client2Plans = await storage.getImplementationPlansByClient(client2.id);

    expect(client1Plans).toHaveLength(1);
    expect(client2Plans).toHaveLength(1);
    expect(client1Plans[0].clientId).toBe(testClientId);
    expect(client2Plans[0].clientId).toBe(client2.id);
  });
});