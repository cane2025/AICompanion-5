/**
 * Dashboard V2 Demo Script
 * För att demonstrera feature flag-funktionalitet
 */

import { featureFlagHelpers } from "@/lib/feature-flags";

export const dashboardV2Demo = {
  // Aktivera Dashboard V2
  enable: () => {
    console.log("🚀 Aktiverar Dashboard V2...");
    featureFlagHelpers.enableDashboardV2();
    console.log("✅ Dashboard V2 aktiverad! Refresh sidan för att se förändringen.");
    console.log("💡 Tips: Använd 'Tillbaka till V1'-knappen för att växla tillbaka.");
  },

  // Deaktivera Dashboard V2
  disable: () => {
    console.log("⏪ Deaktiverar Dashboard V2...");
    featureFlagHelpers.disableDashboardV2();
    console.log("✅ Dashboard V2 deaktiverad! Refresh sidan för att återgå till V1.");
  },

  // Växla mellan V1 och V2
  toggle: () => {
    console.log("🔄 Växlar Dashboard-version...");
    featureFlagHelpers.toggleDashboardV2();
    const isEnabled = featureFlagHelpers.logFlags();
    console.log(`✅ Dashboard V2 är nu ${isEnabled ? 'aktiverad' : 'deaktiverad'}!`);
    console.log("🔄 Refresh sidan för att se förändringen.");
  },

  // Visa aktuell status
  status: () => {
    console.log("📊 Aktuell status för feature flags:");
    featureFlagHelpers.logFlags();
  },

  // Komplett demo-sekvens
  demo: () => {
    console.log("🎭 Startar Dashboard V2 Demo...\n");
    
    console.log("1️⃣ Visar aktuell status:");
    dashboardV2Demo.status();
    
    console.log("\n2️⃣ Aktiverar Dashboard V2:");
    dashboardV2Demo.enable();
    
    console.log("\n3️⃣ Instruktioner för test:");
    console.log("   - Refresh sidan för att se Dashboard V2");
    console.log("   - Testa alla filter-knappar");
    console.log("   - Klicka på olika kort");
    console.log("   - Använd 'Tillbaka till V1'-knappen");
    
    console.log("\n4️⃣ För att deaktivera:");
    console.log("   dashboardV2Demo.disable()");
    
    console.log("\n🎉 Demo klar! Lycka till med testningen!");
  },

  // Hjälp-text
  help: () => {
    console.log(`
🩺 Dashboard V2 Demo - Hjälp

Tillgängliga kommandon:
- dashboardV2Demo.enable()  - Aktivera Dashboard V2
- dashboardV2Demo.disable() - Deaktivera Dashboard V2  
- dashboardV2Demo.toggle()  - Växla mellan V1/V2
- dashboardV2Demo.status()  - Visa aktuell status
- dashboardV2Demo.demo()    - Kör komplett demo
- dashboardV2Demo.help()    - Visa denna hjälp

Feature Flag Information:
- Lagras i localStorage som 'featureFlags'
- Kan även sättas via VITE_UI_DASHBOARD_V2=true
- Säker rollback via UI eller console

Testning:
1. Kör dashboardV2Demo.demo()
2. Refresh sidan
3. Testa alla funktioner
4. Rapportera feedback
    `);
  }
};

// Gör tillgängligt globalt i development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).dashboardV2Demo = dashboardV2Demo;
  console.log("🎭 Dashboard V2 Demo laddad! Kör 'dashboardV2Demo.help()' för att komma igång.");
}