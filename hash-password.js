const bcrypt = require('bcryptjs');

async function hashPassword(plaintext) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plaintext, salt);
    console.log(`Plain text: ${plaintext}`);
    console.log(`Hash: ${hash}`);
    
    // Verify the hash works
    const isValid = await bcrypt.compare(plaintext, hash);
    console.log(`Verification: ${isValid}`);
    
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
  }
}

// Test with the correct password
hashPassword('justice2025');
