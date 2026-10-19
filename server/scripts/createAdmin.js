import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';

async function createAdmin() {
  const { ADMIN_NAME: name, ADMIN_EMAIL, ADMIN_PHONE: phone, ADMIN_PASSWORD: password } = env;
  if (!name || !ADMIN_EMAIL || !password || password.length < 12) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (at least 12 characters) in the environment');
  }
  await connectDatabase();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) throw new Error('An account already exists with ADMIN_EMAIL; no changes were made');
  const user = await User.create({
    name, email, phone: phone || undefined, password: await bcrypt.hash(password, 12),
    role: 'admin', isEmailVerified: true, isPhoneVerified: false, isActive: true
  });
  console.log(`Admin account created: ${user.email}`);
}

try {
  await createAdmin();
} catch (error) {
  console.error('Admin account creation failed:', error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}

