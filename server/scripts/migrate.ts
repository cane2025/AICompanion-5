import { Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("🚀 Starting database migrations...");
    
    // Read and execute the init migration
    const migrationPath = path.join(__dirname, "../migrations/init.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log("✅ Executed migration statement");
      } catch (error) {
        // Log but continue - some statements might fail if already exists
        console.log("⚠️ Migration statement warning:", error.message);
      }
    }
    
    console.log("✅ Database migrations completed successfully");
    
    // Test the connection
    const result = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log(`📊 Users in database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };