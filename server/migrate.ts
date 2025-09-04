import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './db.js';

export async function runMigrations() {
  try {
    console.log('🚀 Kör migreringar för vårdadminsystem...');
    
    // Läs migreringsfilen
    const migrationPath = join(process.cwd(), 'migrations', '001_vardadmin_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Kör migreringen
    await pool.query(migrationSQL);
    
    console.log('✅ Migreringar slutförda framgångsrikt!');
    
    // Verifiera att tabellerna skapades korrekt
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('care_plans', 'implementation_plans', 'weekly_documentation', 'staff_weekly_stats')
      ORDER BY table_name;
    `);
    
    console.log('📋 Skapade tabeller:', tables.rows.map((row: any) => row.table_name));
    
  } catch (error) {
    console.error('❌ Fel vid migrering:', error);
    throw error;
  }
}

// Kör migreringar om skriptet körs direkt
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migreringar slutförda!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migreringar misslyckades:', error);
      process.exit(1);
    });
}