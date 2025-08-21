// Temporary script to create admin user
const bcrypt = require("bcryptjs");

const main = async () => {
  const passwordHash = await bcrypt.hash("admin123", 12);
  console.log("Admin user credentials:");
  console.log("Username: admin");
  console.log("Password: admin123");
  console.log("Password hash:", passwordHash);
  console.log("\nDu kan använda dessa för att logga in första gången.");
};

main();
