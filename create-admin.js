// Admin user creation script - SECURE VERSION
const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const main = async () => {
  console.log("🔐 Skapa admin-användare");
  console.log("========================\n");
  
  rl.question("Ange användarnamn för admin: ", async (username) => {
    rl.question("Ange lösenord för admin: ", async (password) => {
      try {
        const passwordHash = await bcrypt.hash(password, 12);
        console.log("\n✅ Admin-användare skapad:");
        console.log("Användarnamn:", username);
        console.log("Lösenord hash:", passwordHash);
        console.log("\n⚠️  Spara lösenordet på en säker plats!");
        console.log("Du kan nu använda dessa för att logga in.");
      } catch (error) {
        console.error("❌ Fel vid skapande av admin:", error);
      } finally {
        rl.close();
      }
    });
  });
};

main();
