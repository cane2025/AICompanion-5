// Test script för vårdadminsystem
const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testar vårdadminsystem...\n');

  try {
    // Test 1: Skapa en klient
    console.log('1. Skapar testklient...');
    const clientResponse = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayCode: 'TEST',
        active: true
      })
    });
    
    if (!clientResponse.ok) {
      throw new Error(`Klient skapande misslyckades: ${clientResponse.status}`);
    }
    
    const client = await clientResponse.json();
    console.log('✅ Klient skapad:', client.displayCode);
    
    // Test 2: Skapa en vårdplan
    console.log('\n2. Skapar vårdplan...');
    const carePlanResponse = await fetch(`${API_BASE}/clients/${client.id}/care-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receivedDate: '2025-01-27',
        status: 'Mottagen',
        content: 'Test vårdplan för automatiserad testning'
      })
    });
    
    if (!carePlanResponse.ok) {
      throw new Error(`Vårdplan skapande misslyckades: ${carePlanResponse.status}`);
    }
    
    const carePlanResult = await carePlanResponse.json();
    console.log('✅ Vårdplan skapad:', carePlanResult.carePlan.index);
    console.log('✅ GFP autogenererad:', carePlanResult.gfp.index);
    
    // Test 3: Hämta vårdplaner
    console.log('\n3. Hämtar vårdplaner...');
    const carePlansResponse = await fetch(`${API_BASE}/clients/${client.id}/care-plans`);
    const carePlans = await carePlansResponse.json();
    console.log('✅ Vårdplaner hämtade:', carePlans.length);
    
    // Test 4: Hämta GFP
    console.log('\n4. Hämtar GFP...');
    const gfpResponse = await fetch(`${API_BASE}/clients/${client.id}/implementation-plans`);
    const gfpPlans = await gfpResponse.json();
    console.log('✅ GFP hämtade:', gfpPlans.length);
    
    // Test 5: Uppdatera GFP
    console.log('\n5. Uppdaterar GFP...');
    const gfpUpdateResponse = await fetch(`${API_BASE}/implementation-plans/${gfpPlans[0].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Aktiv',
        dueDate: '2025-02-15'
      })
    });
    
    if (!gfpUpdateResponse.ok) {
      throw new Error(`GFP uppdatering misslyckades: ${gfpUpdateResponse.status}`);
    }
    
    const updatedGFP = await gfpUpdateResponse.json();
    console.log('✅ GFP uppdaterad:', updatedGFP.status);
    
    // Test 6: Skapa veckodokumentation
    console.log('\n6. Skapar veckodokumentation...');
    const weeklyDocResponse = await fetch(`${API_BASE}/clients/${client.id}/weekly-docs/2025/4`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        days: {
          mon: {
            documented: true,
            qualityApproved: true,
            onTime: true,
            delayed: false,
            comment: 'Test dokumentation',
            timestamp: new Date().toISOString()
          },
          tue: {
            documented: true,
            qualityApproved: false,
            onTime: true,
            delayed: false,
            comment: 'Behöver förbättring'
          }
        },
        documented: true,
        qualityApproved: false,
        onTime: true,
        delayed: false,
        comments: 'Test vecka'
      })
    });
    
    if (!weeklyDocResponse.ok) {
      throw new Error(`Veckodokumentation skapande misslyckades: ${weeklyDocResponse.status}`);
    }
    
    const weeklyDoc = await weeklyDocResponse.json();
    console.log('✅ Veckodokumentation skapad för vecka', weeklyDoc.week);
    
    // Test 7: Hämta statistik
    console.log('\n7. Hämtar statistik...');
    const statsResponse = await fetch(`${API_BASE}/stats/client/${client.id}?from=2025-01-01&to=2025-12-31`);
    const stats = await statsResponse.json();
    console.log('✅ Statistik hämtad:', stats.length, 'veckor');
    
    console.log('\n🎉 Alla tester slutförda framgångsrikt!');
    
  } catch (error) {
    console.error('❌ Test misslyckades:', error.message);
    process.exit(1);
  }
}

// Kör tester om servern är igång
fetch(`${API_BASE}/staff`)
  .then(() => {
    console.log('🚀 Servern är igång, startar tester...\n');
    return testAPI();
  })
  .catch(() => {
    console.log('⚠️  Servern verkar inte vara igång. Starta servern med: npm run dev');
    process.exit(1);
  });