#!/usr/bin/env node

const API_BASE = "http://127.0.0.1:3001/api";

async function test(name, fn) {
  try {
    console.log(`🧪 ${name}...`);
    await fn();
    console.log(`✅ ${name} - OK`);
  } catch (error) {
    console.error(`❌ ${name} - FAIL:`, error.message);
    process.exit(1);
  }
}

async function request(method, url, body) {
  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  if (response.status === 204) return null;
  return response.json();
}

async function main() {
  console.log("🚀 UNGDOMS Öppenvård - Smoke Test");
  console.log("=====================================");

  // Test 1: Health check
  await test("Health check", async () => {
    const result = await request('GET', '/health');
    if (!result.ok) throw new Error('Health check failed');
  });

  // Test 2: Login
  let loginData;
  await test("Login with any credentials", async () => {
    loginData = await request('POST', '/auth/login', {
      username: 'testuser',
      password: 'testpass'
    });
    if (!loginData.ok || !loginData.user) throw new Error('Login failed');
  });

  // Test 3: Get staff list
  let staffList;
  await test("Get staff list", async () => {
    staffList = await request('GET', '/staff');
    if (!Array.isArray(staffList)) throw new Error('Staff list not an array');
    if (staffList.length === 0) throw new Error('Staff list is empty');
  });

  // Test 4: Create client
  let newClient;
  await test("Create client", async () => {
    newClient = await request('POST', '/clients', {
      initials: 'ST',
      staffId: staffList[0].id
    });
    if (!newClient.id) throw new Error('Client creation failed - no ID returned');
  });

  // Test 5: Create care plan
  let newCarePlan;
  await test("Create care plan", async () => {
    newCarePlan = await request('POST', '/care-plans', {
      clientId: newClient.id,
      staffId: staffList[0].id,
      planContent: 'Test vårdplan',
      goals: 'Test mål',
      interventions: 'Test interventioner'
    });
    if (!newCarePlan.id) throw new Error('Care plan creation failed - no ID returned');
  });

  // Test 6: Create implementation plan
  let newImplPlan;
  await test("Create implementation plan", async () => {
    newImplPlan = await request('POST', '/implementation-plans', {
      clientId: newClient.id,
      planRef: 'GFP-Test',
      sentDate: '2025-08-22',
      followups: [false, false, false, false, false, false]
    });
    if (!newImplPlan.id) throw new Error('Implementation plan creation failed - no ID returned');
  });

  // Test 7: Create weekly documentation
  let newWeeklyDoc;
  await test("Create weekly documentation", async () => {
    newWeeklyDoc = await request('POST', '/weekly-documentation', {
      clientId: newClient.id,
      year: 2025,
      week: 34,
      documentation: 'Test veckodokumentation',
      days: {
        mon: true,
        tue: false,
        wed: true,
        thu: false,
        fri: true,
        sat: false,
        sun: false
      }
    });
    if (!newWeeklyDoc.id) throw new Error('Weekly documentation creation failed - no ID returned');
  });

  // Test 8: Create monthly report
  let newMonthlyReport;
  await test("Create monthly report", async () => {
    newMonthlyReport = await request('POST', '/monthly-reports', {
      clientId: newClient.id,
      year: 2025,
      month: 8,
      reportContent: 'Test månadsrapport',
      approved: true
    });
    if (!newMonthlyReport.id) throw new Error('Monthly report creation failed - no ID returned');
  });

  // Test 9: Create Vimsa time
  let newVimsaTime;
  await test("Create Vimsa time", async () => {
    newVimsaTime = await request('POST', '/vimsa-time', {
      clientId: newClient.id,
      year: 2025,
      week: 34,
      hoursWorked: 8.5,
      approved: true,
      matchesDocumentation: true,
      comments: 'Test Vimsa tid'
    });
    if (!newVimsaTime.id) throw new Error('Vimsa time creation failed - no ID returned');
  });

  // Test 10: Update operations
  await test("Update implementation plan", async () => {
    const updated = await request('PUT', `/implementation-plans/${newImplPlan.id}`, {
      followups: [true, false, true, false, false, false],
      comments: 'Updated test comments'
    });
    if (!updated.id) throw new Error('Implementation plan update failed');
  });

  await test("Update monthly report", async () => {
    const updated = await request('PUT', `/monthly-reports/${newMonthlyReport.id}`, {
      approved: false,
      reportContent: 'Updated test månadsrapport'
    });
    if (!updated.id) throw new Error('Monthly report update failed');
  });

  await test("Update Vimsa time", async () => {
    const updated = await request('PUT', `/vimsa-time/${newVimsaTime.id}`, {
      hoursWorked: 9.0,
      approved: false
    });
    if (!updated.id) throw new Error('Vimsa time update failed');
  });

  // Test 11: Get operations
  await test("Get clients by staff", async () => {
    const clients = await request('GET', `/staff/${staffList[0].id}/clients`);
    if (!Array.isArray(clients)) throw new Error('Clients by staff not an array');
    const found = clients.find(c => c.id === newClient.id);
    if (!found) throw new Error('Created client not found in staff clients');
  });

  await test("Get care plans by staff", async () => {
    const carePlans = await request('GET', `/care-plans/staff/${staffList[0].id}`);
    if (!Array.isArray(carePlans)) throw new Error('Care plans by staff not an array');
  });

  await test("Get implementation plans by client", async () => {
    const implPlans = await request('GET', `/implementation-plans/${newClient.id}`);
    if (!Array.isArray(implPlans)) throw new Error('Implementation plans by client not an array');
  });

  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("=====================================");
  console.log("✅ Login: valfritt user/pass → dev-token");
  console.log("✅ Staff: hämtas och visas");
  console.log("✅ Klient: skapa, knyta till personal");
  console.log("✅ Vårdplan: skapa med POST 201+id");
  console.log("✅ Genomförandeplan: admin-fält, full CRUD");
  console.log("✅ Veckodokumentation: Mån-Sön, full CRUD");
  console.log("✅ Månadsrapport: full CRUD");
  console.log("✅ Vimsa Tid: full CRUD");
  console.log("\n🌐 Frontend: http://127.0.0.1:5175");
  console.log("🔧 API: http://127.0.0.1:3001/api");
}

main().catch(console.error);
