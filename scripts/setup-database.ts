import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import * as schema from "../shared/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function setupDatabase() {
  console.log("🚀 Starting database setup...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  try {
    // Run migrations
    console.log("📦 Running database migrations...");
    await migrate(db, { migrationsFolder: path.join(__dirname, "../migrations") });
    console.log("✅ Migrations completed successfully");

    // Create admin user if it doesn't exist
    console.log("👤 Creating admin user...");
    const adminUsername = "admin";
    const adminEmail = "admin@uppfoljningssystem.se";
    const adminPassword = "admin123"; // Change this in production!

    const existingAdmin = await db
      .select()
      .from(schema.users)
      .where(schema.eq(schema.users.username, adminUsername))
      .limit(1);

    if (existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await db.insert(schema.users).values({
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: "admin",
        isActive: true,
      });
      console.log("✅ Admin user created successfully");
      console.log("   Username:", adminUsername);
      console.log("   Password:", adminPassword);
      console.log("   ⚠️  Please change the password after first login!");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create demo staff if needed
    console.log("👥 Creating demo staff...");
    const demoStaff = [
      {
        name: "Anna Andersson",
        initials: "AA",
        personnummer: "19850515-1234",
        telefon: "070-1234567",
        epost: "anna.andersson@example.com",
        adress: "Storgatan 1, 12345 Stockholm",
        anställningsdatum: "2020-01-15",
        roll: "Sjuksköterska",
        avdelning: "Avdelning A",
      },
      {
        name: "Erik Eriksson",
        initials: "EE",
        personnummer: "19900620-5678",
        telefon: "070-2345678",
        epost: "erik.eriksson@example.com",
        adress: "Lillgatan 2, 12345 Stockholm",
        anställningsdatum: "2021-03-20",
        roll: "Undersköterska",
        avdelning: "Avdelning B",
      },
    ];

    for (const staff of demoStaff) {
      const existing = await db
        .select()
        .from(schema.staff)
        .where(schema.eq(schema.staff.personnummer, staff.personnummer))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.staff).values(staff);
        console.log(`✅ Created demo staff: ${staff.name}`);
      }
    }

    // Create demo clients
    console.log("👤 Creating demo clients...");
    const staffMembers = await db.select().from(schema.staff).limit(2);
    
    if (staffMembers.length > 0) {
      const demoClients = [
        {
          initials: "JD",
          staffId: staffMembers[0].id,
          personalNumber: "19500101-1111",
          notes: "Behöver extra stöd med medicinering",
          status: "active" as const,
        },
        {
          initials: "KS",
          staffId: staffMembers[0].id,
          personalNumber: "19450202-2222",
          notes: "Allergisk mot penicillin",
          status: "active" as const,
        },
        {
          initials: "LN",
          staffId: staffMembers[1]?.id || staffMembers[0].id,
          personalNumber: "19600303-3333",
          notes: "Vegetarisk kost",
          status: "active" as const,
        },
      ];

      for (const client of demoClients) {
        const existing = await db
          .select()
          .from(schema.clients)
          .where(schema.eq(schema.clients.personalNumber, client.personalNumber))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(schema.clients).values(client);
          console.log(`✅ Created demo client: ${client.initials}`);
        }
      }
    }

    console.log("\n🎉 Database setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Update your .env file with the correct DATABASE_URL");
    console.log("2. Configure email settings in .env for notifications");
    console.log("3. Start the application with 'npm run dev'");
    console.log("4. Login with admin/admin123 and change the password");

  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Helper to import from drizzle-orm
async function importDrizzleOrm() {
  try {
    const { eq } = await import("drizzle-orm");
    (global as any).eq = eq;
    schema.eq = eq;
  } catch (error) {
    console.error("Failed to import drizzle-orm helpers:", error);
  }
}

// Run setup
importDrizzleOrm().then(() => {
  setupDatabase();
});