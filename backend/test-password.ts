import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Test the provided hash
const testPassword = 'Passw0rd!';
const storedHash = '$2a$12$prqszdBxEi5Ur.pQEJYqJuzezBGZ7A2Bd2GvLhzW96iFz0n.m/zA2';

async function testPasswordVerification() {
  console.log('Testing password verification...');
  console.log('Password:', testPassword);
  console.log('Hash:', storedHash);

  const isValid = await comparePassword(testPassword, storedHash);
  console.log('Password matches hash:', isValid);

  if (isValid) {
    console.log('✅ Password verification successful!');
  } else {
    console.log('❌ Password verification failed!');
  }
}

testPasswordVerification().catch(console.error);
