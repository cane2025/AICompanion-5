import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "server", "data", "store.json");

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize store with all collections and default staff
export let store: any = {
  staff: [
    {
      id: "staff_default_1",
      name: "Anna Behandlare",
      initials: "AB",
      roll: "behandlare",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "staff_default_2", 
      name: "Björn Behandlare",
      initials: "BB",
      roll: "behandlare", 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "staff_default_3",
      name: "Carina Behandlare", 
      initials: "CB",
      roll: "behandlare",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  clients: [],
  carePlans: [],
  implementationPlans: [],
  weeklyDocumentation: [],
  monthlyReports: [],
  vimsaTime: [],
};

// Load existing data if file exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    store = JSON.parse(data);
    console.log("✅ Loaded existing data from store.json");
  } catch (error) {
    console.error("❌ Error loading store.json:", error);
    // Keep default empty store
  }
} else {
  // Create initial file
  persist();
  console.log("✅ Created new store.json file");
}

// Persist function to save data
export function persist() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    console.log("💾 Data persisted to store.json");
  } catch (error) {
    console.error("❌ Error persisting data:", error);
  }
}
