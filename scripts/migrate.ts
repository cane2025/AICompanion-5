import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL must be set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  try {
    console.log("Starting database migration...");

    // Create tables
    await db.execute(schema.createUsersTable);
    await db.execute(schema.createStaffTable);
    await db.execute(schema.createClientsTable);
    await db.execute(schema.createWeeklyDocumentationTable);
    await db.execute(schema.createMonthlyReportsTable);
    await db.execute(schema.createCarePlansTable);
    await db.execute(schema.createImplementationPlansTable);
    await db.execute(schema.createVimsaTimeTable);

    console.log("✅ Database migration completed successfully!");

    // Create default admin user if it doesn't exist
    const adminUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin"),
    });

    if (!adminUser) {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash("admin123", 12);
      
      await db.insert(schema.users).values({
        username: "admin",
        email: "admin@example.com",
        passwordHash: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("✅ Default admin user created (username: admin, password: admin123)");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}