#!/usr/bin/env node

const API_BASE = "http://127.0.0.1:3001/api";
const TOKEN = "s_demo";

// Helper function for week number
function getWeek(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

async function testAllFunctions() {
  console.log("🧪 Starting comprehensive API test suite...\n");

  const results = {
    passed: [],
    failed: [],
  };

  try {
    // Test 1: Health Check
    console.log("📝 Test 1: Health check...");
    const healthRes = await fetch(`${API_BASE}/health`);
    if (!healthRes.ok)
      throw new Error(`Health check failed: ${healthRes.status}`);
    console.log("✅ Health check passed");
    results.passed.push("Health Check");

    // Test 2: Create Client
    console.log("📝 Test 2: Creating client...");
    const clientRes = await fetch(`${API_BASE}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dev-Token": TOKEN,
      },
      body: JSON.stringify({
        initials: "TEST",
        status: "active",
      }),
    });

    if (!clientRes.ok) {
      const errorText = await clientRes.text();
      throw new Error(
        `Create client failed: ${clientRes.status}, Body: ${errorText}`
      );
    }
    const client = await clientRes.json();
    console.log("✅ Client created:", client.id);
    results.passed.push("Create Client");

    // Test 3: Create Care Plan
    console.log("📝 Test 3: Creating care plan...");
    const carePlanRes = await fetch(`${API_BASE}/care-plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dev-Token": TOKEN,
      },
      body: JSON.stringify({
        clientId: client.id,
        name: "Test Vårdplan",
        description: "Test beskrivning",
        startDate: new Date().toISOString(),
        goals: ["Mål 1", "Mål 2"],
        activities: ["Aktivitet 1", "Aktivitet 2"],
      }),
    });

    if (!carePlanRes.ok) {
      const errorText = await carePlanRes.text();
      throw new Error(
        `Create care plan failed: ${carePlanRes.status}, Body: ${errorText}`
      );
    }
    const carePlan = await carePlanRes.json();
    console.log("✅ Care plan created:", carePlan.id);
    results.passed.push("Create Care Plan");

    // Test 4: Update Care Plan
    console.log("📝 Test 4: Updating care plan...");
    const updateCarePlanRes = await fetch(
      `${API_BASE}/care-plans/${carePlan.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Dev-Token": TOKEN,
        },
        body: JSON.stringify({
          name: "Updated Vårdplan",
          description: "Updated beskrivning",
        }),
      }
    );

    if (!updateCarePlanRes.ok) {
      const errorText = await updateCarePlanRes.text();
      throw new Error(
        `Update care plan failed: ${updateCarePlanRes.status}, Body: ${errorText}`
      );
    }
    console.log("✅ Care plan updated");
    results.passed.push("Update Care Plan");

    // Test 5: Create Implementation Plan
    console.log("📝 Test 5: Creating implementation plan...");
    const implPlanRes = await fetch(`${API_BASE}/implementation-plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dev-Token": TOKEN,
      },
      body: JSON.stringify({
        clientId: client.id,
        carePlanId: carePlan.id,
        title: "Test Genomförandeplan",
        description: "Test GFP beskrivning",
        startDate: new Date().toISOString(),
        followUpDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "active",
      }),
    });

    if (!implPlanRes.ok) {
      const errorText = await implPlanRes.text();
      throw new Error(
        `Create implementation plan failed: ${implPlanRes.status}, Body: ${errorText}`
      );
    }
    const implPlan = await implPlanRes.json();
    console.log("✅ Implementation plan created:", implPlan.id);
    results.passed.push("Create Implementation Plan");

    // Test 6: Create Weekly Documentation
    console.log("📝 Test 6: Creating weekly documentation...");
    const weeklyDocRes = await fetch(`${API_BASE}/weekly-documentation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dev-Token": TOKEN,
      },
      body: JSON.stringify({
        clientId: client.id,
        week: getWeek(new Date()),
        year: new Date().getFullYear(),
        content: "Test veckodokumentation",
        activities: ["Aktivitet 1", "Aktivitet 2"],
        notes: "Anteckningar för veckan",
      }),
    });

    if (!weeklyDocRes.ok) {
      const errorText = await weeklyDocRes.text();
      throw new Error(
        `Create weekly documentation failed: ${weeklyDocRes.status}, Body: ${errorText}`
      );
    }
    const weeklyDoc = await weeklyDocRes.json();
    console.log("✅ Weekly documentation created:", weeklyDoc.id);
    results.passed.push("Create Weekly Documentation");

    // Test 7: Create Monthly Report
    console.log("📝 Test 7: Creating monthly report...");
    const monthlyReportRes = await fetch(`${API_BASE}/monthly-reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dev-Token": TOKEN,
      },
      body: JSON.stringify({
        clientId: client.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        summary: "Månadssammanfattning",
        progress: "God progress",
        challenges: "Inga större utmaningar",
      }),
    });

    if (!monthlyReportRes.ok) {
      const errorText = await monthlyReportRes.text();
      throw new Error(
        `Create monthly report failed: ${monthlyReportRes.status}, Body: ${errorText}`
      );
    }
    const monthlyReport = await monthlyReportRes.json();
    console.log("✅ Monthly report created:", monthlyReport.id);
    results.passed.push("Create Monthly Report");

    // Test 8: Create VIMSA Time Entry
    console.log("📝 Test 8: Creating VIMSA time entry...");
    const vimsaTimeRes = await fetch(`${API_BASE}/vimsa-time`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dev-Token": TOKEN,
      },
      body: JSON.stringify({
        clientId: client.id,
        date: new Date().toISOString(),
        hours: 2.5,
        activity: "Vårdplanering",
        notes: "Test VIMSA-tid",
      }),
    });

    if (!vimsaTimeRes.ok) {
      const errorText = await vimsaTimeRes.text();
      throw new Error(
        `Create VIMSA time failed: ${vimsaTimeRes.status}, Body: ${errorText}`
      );
    }
    const vimsaTime = await vimsaTimeRes.json();
    console.log("✅ VIMSA time entry created:", vimsaTime.id);
    results.passed.push("Create VIMSA Time");

    // Test 9: Get all care plans
    console.log("📝 Test 9: Fetching all care plans...");
    const getAllPlansRes = await fetch(`${API_BASE}/care-plans/all`, {
      headers: { "X-Dev-Token": TOKEN },
    });

    if (!getAllPlansRes.ok) {
      const errorText = await getAllPlansRes.text();
      throw new Error(
        `Get all care plans failed: ${getAllPlansRes.status}, Body: ${errorText}`
      );
    }
    const allPlans = await getAllPlansRes.json();
    console.log(`✅ Found ${allPlans.length} care plans`);
    results.passed.push("Get All Care Plans");

    // Test 10: Get client-specific care plans
    console.log("📝 Test 10: Fetching client-specific care plans...");
    const clientPlansRes = await fetch(`${API_BASE}/care-plans/${client.id}`, {
      headers: { "X-Dev-Token": TOKEN },
    });

    if (!clientPlansRes.ok) {
      const errorText = await clientPlansRes.text();
      throw new Error(
        `Get client care plans failed: ${clientPlansRes.status}, Body: ${errorText}`
      );
    }
    const clientPlans = await clientPlansRes.json();
    console.log(`✅ Found ${clientPlans.length} care plans for client`);
    results.passed.push("Get Client Care Plans");

    // Test 11: Get all clients
    console.log("📝 Test 11: Fetching all clients...");
    const getAllClientsRes = await fetch(`${API_BASE}/clients/all`, {
      headers: { "X-Dev-Token": TOKEN },
    });

    if (!getAllClientsRes.ok) {
      const errorText = await getAllClientsRes.text();
      throw new Error(
        `Get all clients failed: ${getAllClientsRes.status}, Body: ${errorText}`
      );
    }
    const allClients = await getAllClientsRes.json();
    console.log(`✅ Found ${allClients.length} clients`);
    results.passed.push("Get All Clients");

    // Test 12: Get staff-specific clients
    console.log("📝 Test 12: Fetching staff-specific clients...");
    const staffClientsRes = await fetch(`${API_BASE}/staff/${TOKEN}/clients`, {
      headers: { "X-Dev-Token": TOKEN },
    });

    if (!staffClientsRes.ok) {
      const errorText = await staffClientsRes.text();
      throw new Error(
        `Get staff clients failed: ${staffClientsRes.status}, Body: ${errorText}`
      );
    }
    const staffClients = await staffClientsRes.json();
    results.passed.push("Get Staff Clients");

    // Test 13: Get all implementation plans
    console.log("📝 Test 13: Fetching all implementation plans...");
    const getAllImplPlansRes = await fetch(
      `${API_BASE}/implementation-plans/all`,
      {
        headers: { "X-Dev-Token": TOKEN },
      }
    );

    if (!getAllImplPlansRes.ok) {
      const errorText = await getAllImplPlansRes.text();
      throw new Error(
        `Get all implementation plans failed: ${getAllImplPlansRes.status}, Body: ${errorText}`
      );
    }
    const allImplPlans = await getAllImplPlansRes.json();
    console.log(`✅ Found ${allImplPlans.length} implementation plans`);
    results.passed.push("Get All Implementation Plans");

    // Test 14: Get all weekly documentation
    console.log("📝 Test 14: Fetching all weekly documentation...");
    const getAllWeeklyDocsRes = await fetch(
      `${API_BASE}/weekly-documentation/all`,
      {
        headers: { "X-Dev-Token": TOKEN },
      }
    );

    if (!getAllWeeklyDocsRes.ok) {
      const errorText = await getAllWeeklyDocsRes.text();
      throw new Error(
        `Get all weekly documentation failed: ${getAllWeeklyDocsRes.status}, Body: ${errorText}`
      );
    }
    const allWeeklyDocs = await getAllWeeklyDocsRes.json();
    console.log(
      `✅ Found ${allWeeklyDocs.length} weekly documentation entries`
    );
    results.passed.push("Get All Weekly Documentation");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    results.failed.push(error.message);
  }

  // Summary
  console.log("\n📊 TEST RESULTS:");
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.passed.length > 0) {
    console.log("\n✅ Passed tests:");
    results.passed.forEach((test) => console.log(`  - ${test}`));
  }

  if (results.failed.length > 0) {
    console.log("\n❌ Failed tests:");
    results.failed.forEach((test) => console.log(`  - ${test}`));
  }

  console.log(
    `\n🎯 Success Rate: ${Math.round(
      (results.passed.length /
        (results.passed.length + results.failed.length)) *
        100
    )}%`
  );

  return results;
}

// Run the test
testAllFunctions().catch(console.error);
