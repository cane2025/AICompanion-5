import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../storage.js';

describe('Versioned Care Plans', () => {
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

  it('should create care plan with auto-incremented index', async () => {
    const carePlan1 = await storage.createCarePlanVersioned({
      clientId: testClientId,
      receivedDate: '2025-01-15',
      status: 'Mottagen',
    });

    expect(carePlan1.index).toBe(1);
    expect(carePlan1.clientId).toBe(testClientId);
    expect(carePlan1.status).toBe('Mottagen');

    const carePlan2 = await storage.createCarePlanVersioned({
      clientId: testClientId,
      receivedDate: '2025-01-16',
      status: 'Aktiv',
    });

    expect(carePlan2.index).toBe(2);
  });

  it('should auto-create GFP when care plan is created', async () => {
    const carePlan = await storage.createCarePlanVersioned({
      clientId: testClientId,
      receivedDate: '2025-01-15',
      status: 'Mottagen',
    });

    const gfp = await storage.autoCreateImplementationPlan(testClientId, carePlan.index);

    expect(gfp.clientId).toBe(testClientId);
    expect(gfp.carePlanIndex).toBe(carePlan.index);
    expect(gfp.status).toBe('Väntar');
    expect(gfp.index).toBe(1);

    // Check follow-ups are initialized
    const followUps = JSON.parse(gfp.followUps);
    expect(followUps).toHaveLength(5);
    expect(followUps[0].key).toBe('Uppföljning1');
    expect(followUps[0].done).toBe(false);
  });

  it('should get care plans by client sorted by index desc', async () => {
    await storage.createCarePlanVersioned({
      clientId: testClientId,
      receivedDate: '2025-01-15',
      status: 'Mottagen',
    });

    await storage.createCarePlanVersioned({
      clientId: testClientId,
      receivedDate: '2025-01-16',
      status: 'Aktiv',
    });

    await storage.createCarePlanVersioned({
      clientId: testClientId,
      receivedDate: '2025-01-17',
      status: 'Avslutad',
    });

    const carePlans = await storage.getCarePlansByClient(testClientId);

    expect(carePlans).toHaveLength(3);
    expect(carePlans[0].index).toBe(3); // newest first
    expect(carePlans[1].index).toBe(2);
    expect(carePlans[2].index).toBe(1);
  });

  it('should only return care plans for specified client', async () => {
    // Create another client
    const client2 = await storage.createClient({
      displayCode: 'TEST2',
      active: true,
    });

    await storage.createCarePlanVersioned({
      clientId: testClientId,
      receivedDate: '2025-01-15',
      status: 'Mottagen',
    });

    await storage.createCarePlanVersioned({
      clientId: client2.id,
      receivedDate: '2025-01-16',
      status: 'Aktiv',
    });

    const client1Plans = await storage.getCarePlansByClient(testClientId);
    const client2Plans = await storage.getCarePlansByClient(client2.id);

    expect(client1Plans).toHaveLength(1);
    expect(client2Plans).toHaveLength(1);
    expect(client1Plans[0].clientId).toBe(testClientId);
    expect(client2Plans[0].clientId).toBe(client2.id);
  });
});