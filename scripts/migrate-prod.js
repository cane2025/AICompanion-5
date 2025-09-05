#!/usr/bin/env node

/**
 * Production Migration Script
 * 
 * This script safely migrates data in production with:
 * - Dry-run capability
 * - Environment validation
 * - Backup creation
 * - Rollback capability
 */

import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const STORE_PATH = path.join(process.cwd(), 'server/data/store.json');
const BACKUP_PATH = path.join(process.cwd(), 'server/data/store.backup.json');

function createBackup() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf8');
      fs.writeFileSync(BACKUP_PATH, data);
      console.log('✅ Backup created:', BACKUP_PATH);
      return true;
    }
    console.log('⚠️  No existing store.json found, skipping backup');
    return true;
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    return false;
  }
}

function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';
  
  console.log(`🌍 Environment: ${env}`);
  
  if (isProd) {
    console.log('⚠️  PRODUCTION MODE - Extra caution required');
    
    // Check if dry-run flag is set
    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) {
      console.log('🔍 DRY-RUN MODE - No changes will be made');
      return { isProd, isDryRun };
    }
    
    // Confirm production migration
    console.log('🚨 PRODUCTION MIGRATION - This will modify live data');
    console.log('   Make sure you have a backup and understand the changes');
    
    // In a real scenario, you might want to add a confirmation prompt here
    // For now, we'll proceed with warning
    return { isProd, isDryRun: false };
  }
  
  return { isProd: false, isDryRun: false };
}

function migrateData({ isProd, isDryRun }) {
  console.log('🔄 Starting data migration...');
  
  try {
    // Read existing data
    if (!fs.existsSync(STORE_PATH)) {
      console.log('📝 Creating new store structure');
      const newData = {
        carePlans: [],
        implementationPlans: [],
        weeklyDocs: [],
        clients: [],
        staff: [],
        timeEntries: [],
        monthlyReports: []
      };
      
      if (!isDryRun) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(newData, null, 2));
        console.log('✅ New store.json created');
      } else {
        console.log('🔍 DRY-RUN: Would create new store.json');
      }
      return { success: true, changes: 0 };
    }
    
    const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    console.log('📖 Loaded existing data');
    
    const now = new Date().toISOString();
    let changes = 0;
    
    // Migrate care plans
    if (data.carePlans) {
      console.log('📋 Migrating care plans...');
      
      if (!Array.isArray(data.carePlans)) {
        console.log('  - Converting single care plan to array');
        const oldPlan = data.carePlans;
        data.carePlans = [{
          id: oldPlan.id || nanoid(),
          clientId: oldPlan.clientId,
          title: oldPlan.title || 'Migrerad vårdplan',
          goals: oldPlan.goals || '',
          interventions: oldPlan.interventions || '',
          comment: oldPlan.comment || '',
          status: oldPlan.status || 'active',
          createdAt: oldPlan.createdAt || now,
          updatedAt: oldPlan.updatedAt || now,
          version: oldPlan.version || 1
        }];
        changes++;
      } else {
        // Ensure each care plan has required fields
        data.carePlans = data.carePlans.map(plan => ({
          id: plan.id || nanoid(),
          clientId: plan.clientId,
          title: plan.title || 'Migrerad vårdplan',
          goals: plan.goals || '',
          interventions: plan.interventions || '',
          comment: plan.comment || '',
          status: plan.status || 'active',
          createdAt: plan.createdAt || now,
          updatedAt: plan.updatedAt || now,
          version: plan.version || 1
        }));
        changes += data.carePlans.length;
      }
    } else {
      data.carePlans = [];
    }
    
    // Migrate implementation plans
    if (data.implementationPlans) {
      console.log('📋 Migrating implementation plans...');
      
      if (!Array.isArray(data.implementationPlans)) {
        console.log('  - Converting single implementation plan to array');
        const oldPlan = data.implementationPlans;
        data.implementationPlans = [{
          id: oldPlan.id || nanoid(),
          clientId: oldPlan.clientId,
          title: oldPlan.title || 'Migrerad genomförandeplan',
          actions: oldPlan.actions || '',
          responsible: oldPlan.responsible || [],
          dueDate: oldPlan.dueDate || '',
          status: oldPlan.status || 'planned',
          createdAt: oldPlan.createdAt || now,
          updatedAt: oldPlan.updatedAt || now,
          version: oldPlan.version || 1
        }];
        changes++;
      } else {
        // Ensure each implementation plan has required fields
        data.implementationPlans = data.implementationPlans.map(plan => ({
          id: plan.id || nanoid(),
          clientId: plan.clientId,
          title: plan.title || 'Migrerad genomförandeplan',
          actions: plan.actions || '',
          responsible: plan.responsible || [],
          dueDate: plan.dueDate || '',
          status: plan.status || 'planned',
          createdAt: plan.createdAt || now,
          updatedAt: plan.updatedAt || now,
          version: plan.version || 1
        }));
        changes += data.implementationPlans.length;
      }
    } else {
      data.implementationPlans = [];
    }
    
    // Initialize weekly docs if not present
    if (!data.weeklyDocs) {
      console.log('📋 Initializing weekly docs...');
      data.weeklyDocs = [];
    }
    
    // Ensure other required arrays exist
    if (!data.clients) data.clients = [];
    if (!data.staff) data.staff = [];
    if (!data.timeEntries) data.timeEntries = [];
    if (!data.monthlyReports) data.monthlyReports = [];
    
    // Write migrated data back (unless dry-run)
    if (!isDryRun) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
      console.log('💾 Data migrated successfully');
    } else {
      console.log('🔍 DRY-RUN: Would write migrated data');
    }
    
    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log(`  - Care Plans: ${data.carePlans.length}`);
    console.log(`  - Implementation Plans: ${data.implementationPlans.length}`);
    console.log(`  - Weekly Docs: ${data.weeklyDocs.length}`);
    console.log(`  - Clients: ${data.clients.length}`);
    console.log(`  - Staff: ${data.staff.length}`);
    console.log(`  - Time Entries: ${data.timeEntries.length}`);
    console.log(`  - Monthly Reports: ${data.monthlyReports.length}`);
    console.log(`  - Total changes: ${changes}`);
    
    if (isDryRun) {
      console.log('\n🔍 DRY-RUN COMPLETED - No changes were made');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
    
    return { success: true, changes };
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return { success: false, error: error.message };
  }
}

function main() {
  console.log('🚀 Production Migration Script');
  console.log('================================');
  
  // Validate environment
  const { isProd, isDryRun } = validateEnvironment();
  
  // Create backup (unless dry-run)
  if (!isDryRun) {
    const backupSuccess = createBackup();
    if (!backupSuccess) {
      console.error('❌ Cannot proceed without backup');
      process.exit(1);
    }
  }
  
  // Run migration
  const result = migrateData({ isProd, isDryRun });
  
  if (result.success) {
    console.log('\n🎉 Migration script completed successfully!');
    
    if (isProd && !isDryRun) {
      console.log('\n📋 Next steps:');
      console.log('1. Restart the application');
      console.log('2. Run smoke tests: ./test-e2e-verification.sh');
      console.log('3. Monitor logs for any errors');
      console.log('4. Verify all features work correctly');
    }
    
    process.exit(0);
  } else {
    console.error('\n❌ Migration failed:', result.error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { migrateData, createBackup, validateEnvironment };
