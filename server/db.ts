import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Check if using SQLite or PostgreSQL
const databaseUrl = process.env.DATABASE_URL;

let db: any;
let pool: any = null;

if (databaseUrl.startsWith("sqlite:")) {
  // SQLite configuration
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const Database = (await import("better-sqlite3")).default;
  const dbPath = databaseUrl.replace("sqlite:", "");
  const sqlite = new Database(dbPath);
  db = drizzle(sqlite, { schema });
} else {
  // PostgreSQL/Neon configuration
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const ws = (await import("ws")).default;

  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
}

export { db, pool };
