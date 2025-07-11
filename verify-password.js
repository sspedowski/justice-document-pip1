const bcrypt = require('bcryptjs');

// Current hash from users.json
const currentHash = "$2a$10$EF/0FOPv0L80SSrqZKxadO2wP.13vZiYLeex4Kj9NZUG7kZlHF5m2";

// Test passwords
const testPasswords = ["justice2025", "justice2024", "admin"];

console.log("🔍 Testing password hashes...\n");

testPasswords.forEach(password => {
  const isValid = bcrypt.compareSync(password, currentHash);
  console.log(`Password "${password}": ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
});

// Generate new hash for justice2025 if needed
console.log("\n🔧 Generating new hash for 'justice2025':");
const newHash = bcrypt.hashSync("justice2025", 10);
console.log("New hash:", newHash);

// Test the new hash
const testNewHash = bcrypt.compareSync("justice2025", newHash);
console.log("New hash test:", testNewHash ? '✅ VALID' : '❌ INVALID');
