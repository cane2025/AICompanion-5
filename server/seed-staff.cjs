const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Lista med alla personalnamn exakt som specificerat
const staffNames = [
  "Afif Derbas-",
  "Ahmed Alrakabi",
  "Ahmed Ramadan –",
  "Ajmen Rafiq-",
  "Alana Salah-",
  "Alharis Albayati",
  "Amir Al-Istarabadi  -",
  "Anjelika Bååth-",
  "Bashdar Reza –",
  "Constanza Soto",
  "Deni Dulji",
  "Diana Gharib",
  "Drilon Muqkurtaj",
  "Heidar Farhan",
  "Hussein Ahmed",
  "Ida Björkbacka",
  "Ikhlas Almaliki",
  "Intisar Almansour",
  "Israa Touman",
  "Johan Wessberg",
  "Kim Torneus",
  "Lejla Kocacik",
  "Mirza Celik",
  "Mirza Hodzic",
  "Nasima Kuraishe",
  "Nicolas Lazcano",
  "Omar Mezza",
  "Qasin Abdullahi",
  "Robert Ackar",
  "Samir Bezzina",
  "Sebastian Holm",
  "Wissam Hemissi",
  "Yasmin Ibrahim"
];

function seedStaff() {
  const storePath = path.join(__dirname, 'data', 'store.json');
  
  try {
    // Läs befintlig data
    const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    
    // Ta bort all befintlig personal utom systemkonton
    data.staff = data.staff.filter((s) => 
      s.name === 'System Admin' || s.name === 'Test User'
    );
    
    // Lägg till ny personal
    const newStaff = staffNames.map(displayName => {
      // Ta bort avslutande bindestreck/en-dash och trimma för intern hantering
      const fullName = displayName.replace(/[\-–]\s*$/, '').trim();
      
      // Generera initialer från fullName (inte displayName)
      const nameParts = fullName.split(' ');
      const initials = nameParts
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      
      return {
        id: `staff_${crypto.randomUUID()}`,
        name: displayName, // Spara displayName exakt som det är
        fullName: fullName, // Intern representation för logik
        initials: initials,
        roll: 'personal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
    
    // Ingen validering behövs för JSON-baserad lagring
    
    // Lägg till i data
    data.staff.push(...newStaff);
    
    // Spara tillbaka
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    
    console.log(`Successfully seeded ${newStaff.length} staff members`);
    
  } catch (error) {
    console.error('Error seeding staff:', error);
    process.exit(1);
  }
}

// Kör seed om filen körs direkt
if (require.main === module) {
  seedStaff();
}

module.exports = { seedStaff };
