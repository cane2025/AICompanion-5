#!/usr/bin/env node

/**
 * Data Migration Script
 *
 * This script migrates existing data to the new structure with:
 * - nanoid for unique IDs
 * - createdAt/updatedAt timestamps
 * - version tracking
 * - proper array structure for multi-item support
 */

import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const STORE_PATH = path.join(process.cwd(), "server/data/store.json");

function migrateData() {
  console.log("🔄 Starting data migration...");

  try {
    // Read existing data
    const data = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    console.log("📖 Loaded existing data");

    const now = new Date().toISOString();
    let changes = 0;

    // Migrate care plans
    if (data.carePlans) {
      console.log("📋 Migrating care plans...");

      // If carePlans is not an array, wrap it
      if (!Array.isArray(data.carePlans)) {
        console.log("  - Converting single care plan to array");
        const oldPlan = data.carePlans;
        data.carePlans = [
          {
            id: oldPlan.id || nanoid(),
            clientId: oldPlan.clientId,
            title: oldPlan.title || "Migrerad vårdplan",
            goals: oldPlan.goals || "",
            interventions: oldPlan.interventions || "",
            comment: oldPlan.comment || "",
            status: oldPlan.status || "active",
            createdAt: oldPlan.createdAt || now,
            updatedAt: oldPlan.updatedAt || now,
            version: oldPlan.version || 1,
          },
        ];
        changes++;
      } else {
        // Ensure each care plan has required fields
        data.carePlans = data.carePlans.map((plan) => ({
          id: plan.id || nanoid(),
          clientId: plan.clientId,
          title: plan.title || "Migrerad vårdplan",
          goals: plan.goals || "",
          interventions: plan.interventions || "",
          comment: plan.comment || "",
          status: plan.status || "active",
          createdAt: plan.createdAt || now,
          updatedAt: plan.updatedAt || now,
          version: plan.version || 1,
        }));
        changes += data.carePlans.length;
      }
    } else {
      data.carePlans = [];
    }

    // Migrate implementation plans
    if (data.implementationPlans) {
      console.log("📋 Migrating implementation plans...");

      // If implementationPlans is not an array, wrap it
      if (!Array.isArray(data.implementationPlans)) {
        console.log("  - Converting single implementation plan to array");
        const oldPlan = data.implementationPlans;
        data.implementationPlans = [
          {
            id: oldPlan.id || nanoid(),
            clientId: oldPlan.clientId,
            title: oldPlan.title || "Migrerad genomförandeplan",
            actions: oldPlan.actions || "",
            responsible: oldPlan.responsible || [],
            dueDate: oldPlan.dueDate || "",
            status: oldPlan.status || "planned",
            createdAt: oldPlan.createdAt || now,
            updatedAt: oldPlan.updatedAt || now,
            version: oldPlan.version || 1,
          },
        ];
        changes++;
      } else {
        // Ensure each implementation plan has required fields
        data.implementationPlans = data.implementationPlans.map((plan) => ({
          id: plan.id || nanoid(),
          clientId: plan.clientId,
          title: plan.title || "Migrerad genomförandeplan",
          actions: plan.actions || "",
          responsible: plan.responsible || [],
          dueDate: plan.dueDate || "",
          status: plan.status || "planned",
          createdAt: plan.createdAt || now,
          updatedAt: plan.updatedAt || now,
          version: plan.version || 1,
        }));
        changes += data.implementationPlans.length;
      }
    } else {
      data.implementationPlans = [];
    }

    // Initialize weekly docs if not present
    if (!data.weeklyDocs) {
      console.log("📋 Initializing weekly docs...");
      data.weeklyDocs = [];
    }

    // Ensure other required arrays exist
    if (!data.clients) data.clients = [];
    if (!data.staff) data.staff = [];
    if (!data.timeEntries) data.timeEntries = [];
    if (!data.monthlyReports) data.monthlyReports = [];

    // Write migrated data back
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    console.log("💾 Data migrated successfully");

    // Print summary
    console.log("\n📊 Migration Summary:");
    console.log(`  - Care Plans: ${data.carePlans.length}`);
    console.log(`  - Implementation Plans: ${data.implementationPlans.length}`);
    console.log(`  - Weekly Docs: ${data.weeklyDocs.length}`);
    console.log(`  - Clients: ${data.clients.length}`);
    console.log(`  - Staff: ${data.staff.length}`);
    console.log(`  - Time Entries: ${data.timeEntries.length}`);
    console.log(`  - Monthly Reports: ${data.monthlyReports.length}`);
    console.log(`  - Total changes: ${changes}`);

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export { migrateData };
