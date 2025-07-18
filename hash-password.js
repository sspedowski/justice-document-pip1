const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
  }
}

// Hash guest password
const password = process.argv[2] || "guest123";
hashPassword(password);
