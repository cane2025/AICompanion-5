#!/usr/bin/env node

/**
 * AICompanion-5 Automated Test Suite for AI Agents
 * Run with: node ai-agent-test.js
 */

import axios from "axios";
import fs from "fs";
import path from "path";

class AICompanionTester {
  constructor(apiUrl = "http://127.0.0.1:3001/api", token = "s_demo") {
    this.apiUrl = apiUrl;
    this.token = token;
    this.headers = {
      "Content-Type": "application/json",
      "X-Dev-Token": token,
    };
    this.testResults = [];
    this.createdResources = {
      clients: [],
      carePlans: [],
      implementationPlans: [],
      weeklyDocs: [],
      monthlyReports: [],
    };
  }

  async runAllTests() {
    console.log("🤖 AI Agent Test Suite Starting...");
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log("=".repeat(50));

    // Run test categories
    await this.testServerHealth();
    await this.testAuthentication();
    await this.testClientManagement();
    await this.testCarePlans();
    await this.testImplementationPlans();
    await this.testWeeklyDocumentation();
    await this.testMonthlyReports();
    await this.testDataPersistence();
    await this.testErrorHandling();

    return this.generateReport();
  }

  async runTest(name, testFn) {
    const start = Date.now();
    try {
      const result = await testFn();
      this.testResults.push({
        name,
        status: "PASSED",
        duration: Date.now() - start,
        data: result,
      });
      console.log(`✅ ${name}`);
      return true;
    } catch (error) {
      this.testResults.push({
        name,
        status: "FAILED",
        duration: Date.now() - start,
        error: error.message,
      });
      console.log(`❌ ${name}: ${error.message}`);
      return false;
    }
  }

  async testServerHealth() {
    console.log("\n🏥 Testing Server Health...");

    await this.runTest("Server Health Check", async () => {
      const response = await axios.get(`${this.apiUrl}/health`);
      if (response.status !== 200) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
      return { statusCode: response.status };
    });
  }

  async testAuthentication() {
    console.log("\n🔐 Testing Authentication...");

    await this.runTest("Authentication", async () => {
      const response = await axios.post(
        `${this.apiUrl}/auth/login`,
        {},
        { headers: this.headers }
      );
      if (response.status !== 200) {
        throw new Error(`Auth failed: ${response.status}`);
      }
      return response.data;
    });
  }

  async testClientManagement() {
    console.log("\n👥 Testing Client Management...");

    const success = await this.runTest("Create Client", async () => {
      const clientData = {
        initials: "TEST",
        personnummer: `200001${Date.now().toString().slice(-6)}-0000`,
        name: `Test Client ${new Date().toISOString()}`,
        status: "active",
      };

      const response = await axios.post(`${this.apiUrl}/clients`, clientData, {
        headers: this.headers,
      });

      if (response.status !== 201) {
        throw new Error(`Failed to create: ${response.status}`);
      }

      const client = response.data;
      this.createdResources.clients.push(client.id);
      return { clientId: client.id };
    });

    if (success && this.createdResources.clients.length > 0) {
      await this.runTest("Update Client", async () => {
        const clientId = this.createdResources.clients[0];
        const response = await axios.put(
          `${this.apiUrl}/clients/${clientId}`,
          { name: "Updated Test Client" },
          { headers: this.headers }
        );

        if (response.status !== 200) {
          throw new Error(`Update failed: ${response.status}`);
        }
        return response.data;
      });
    }
  }

  async testCarePlans() {
    console.log("\n📋 Testing Care Plans...");

    if (this.createdResources.clients.length === 0) {
      console.log("  ⚠️ No client available, skipping...");
      return;
    }

    const clientId = this.createdResources.clients[0];

    const success = await this.runTest("Create Care Plan", async () => {
      const carePlanData = {
        clientId,
        name: `Test Vårdplan ${Date.now()}`,
        description: "Automated test vårdplan",
        startDate: new Date().toISOString(),
        goals: ["Mål 1", "Mål 2", "Mål 3"],
        activities: ["Aktivitet 1", "Aktivitet 2"],
      };

      const response = await axios.post(
        `${this.apiUrl}/care-plans`,
        carePlanData,
        { headers: this.headers }
      );

      if (![200, 201].includes(response.status)) {
        throw new Error(`Failed: ${response.status}`);
      }

      const carePlan = response.data;
      this.createdResources.carePlans.push(carePlan.id);
      return { carePlanId: carePlan.id };
    });

    if (success && this.createdResources.carePlans.length > 0) {
      await this.runTest("Update Care Plan", async () => {
        const planId = this.createdResources.carePlans[0];
        const response = await axios.put(
          `${this.apiUrl}/care-plans/${planId}`,
          { name: "Updated Vårdplan" },
          { headers: this.headers }
        );

        if (response.status !== 200) {
          throw new Error(`Update failed: ${response.status}`);
        }
        return response.data;
      });
    }
  }

  async testImplementationPlans() {
    console.log("\n📈 Testing Implementation Plans...");

    if (
      this.createdResources.clients.length === 0 ||
      this.createdResources.carePlans.length === 0
    ) {
      console.log("  ⚠️ Missing dependencies, skipping...");
      return;
    }

    await this.runTest("Create Implementation Plan", async () => {
      const implPlanData = {
        clientId: this.createdResources.clients[0],
        carePlanId: this.createdResources.carePlans[0],
        title: "Test Genomförandeplan",
        description: "AI-generated test plan",
        startDate: new Date().toISOString(),
        followUpDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "active",
      };

      const response = await axios.post(
        `${this.apiUrl}/implementation-plans`,
        implPlanData,
        { headers: this.headers }
      );

      if (![200, 201].includes(response.status)) {
        throw new Error(`Failed: ${response.status}`);
      }

      const plan = response.data;
      this.createdResources.implementationPlans.push(plan.id);
      return { implPlanId: plan.id };
    });
  }

  async testWeeklyDocumentation() {
    console.log("\n📅 Testing Weekly Documentation...");

    if (this.createdResources.clients.length === 0) {
      console.log("  ⚠️ No client available, skipping...");
      return;
    }

    await this.runTest("Create Weekly Documentation", async () => {
      const weeklyDocData = {
        clientId: this.createdResources.clients[0],
        week: new Date().getWeek(),
        year: new Date().getFullYear(),
        content: "AI-generated weekly documentation",
        activities: [
          "Monday meeting",
          "Wednesday follow-up",
          "Friday evaluation",
        ],
        notes: "Positive progress noted",
      };

      const response = await axios.post(
        `${this.apiUrl}/weekly-documentation`,
        weeklyDocData,
        { headers: this.headers }
      );

      if (![200, 201].includes(response.status)) {
        throw new Error(`Failed: ${response.status}`);
      }

      const doc = response.data;
      this.createdResources.weeklyDocs.push(doc.id);
      return { weeklyDocId: doc.id };
    });
  }

  async testMonthlyReports() {
    console.log("\n📊 Testing Monthly Reports...");

    if (this.createdResources.clients.length === 0) {
      console.log("  ⚠️ No client available, skipping...");
      return;
    }

    await this.runTest("Create Monthly Report", async () => {
      const reportData = {
        clientId: this.createdResources.clients[0],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        summary: "AI-generated monthly summary",
        progress: "Good progress according to goals",
        challenges: "Minor time management issues",
      };

      const response = await axios.post(
        `${this.apiUrl}/monthly-reports`,
        reportData,
        { headers: this.headers }
      );

      if (![200, 201].includes(response.status)) {
        throw new Error(`Failed: ${response.status}`);
      }

      const report = response.data;
      this.createdResources.monthlyReports.push(report.id);
      return { reportId: report.id };
    });
  }

  async testDataPersistence() {
    console.log("\n💾 Testing Data Persistence...");

    if (this.createdResources.carePlans.length > 0) {
      await this.runTest("Care Plan Persistence", async () => {
        const response = await axios.get(`${this.apiUrl}/care-plans/all`, {
          headers: { "X-Dev-Token": this.token },
        });

        if (response.status !== 200) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const plans = response.data;
        const createdId = this.createdResources.carePlans[0];

        if (!plans.some((p) => p.id === createdId)) {
          throw new Error("Created care plan not found in persistence");
        }

        return { found: true };
      });
    }
  }

  async testErrorHandling() {
    console.log("\n⚠️ Testing Error Handling...");

    await this.runTest("404 Error Handling", async () => {
      try {
        await axios.get(`${this.apiUrl}/care-plans/non-existent-id`, {
          headers: { "X-Dev-Token": this.token },
        });
        throw new Error("Expected 404 but got success");
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return { handled: true };
        }
        throw error;
      }
    });
  }

  generateReport() {
    const passed = this.testResults.filter((r) => r.status === "PASSED").length;
    const failed = this.testResults.filter((r) => r.status === "FAILED").length;
    const totalDuration = this.testResults.reduce(
      (sum, r) => sum + r.duration,
      0
    );

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passed,
        failed,
        successRate:
          this.testResults.length > 0
            ? Math.round((passed / this.testResults.length) * 100)
            : 0,
        totalDuration,
      },
      createdResources: this.createdResources,
      testResults: this.testResults,
    };

    // Print summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total Tests:    ${this.testResults.length}`);
    console.log(`✅ Passed:      ${passed}`);
    console.log(`❌ Failed:      ${failed}`);
    console.log(`Success Rate:   ${report.summary.successRate}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log("=".repeat(50));

    // Print failed tests
    if (failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.testResults
        .filter((r) => r.status === "FAILED")
        .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
    }

    // Save report
    const filename = `test-report-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${filename}`);

    return report;
  }
}

// Helper: Get week number
Date.prototype.getWeek = function () {
  const d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

// Main execution
async function main() {
  const tester = new AICompanionTester();
  const report = await tester.runAllTests();

  if (report.summary.failed === 0) {
    console.log("\n✅ ALL TESTS PASSED! System is working correctly.");
    process.exit(0);
  } else {
    console.log("\n❌ SOME TESTS FAILED! Please review the report.");
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export default AICompanionTester;
