/**
 * Seed Admin Script
 * 
 * Run this once to create (or update) the initial admin account:
 *   node utils/seedAdmin.js
 * 
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from server/.env
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌  Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.');
  process.exit(1);
}

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦  Connected to MongoDB');

    let user = await User.findOne({ email: ADMIN_EMAIL });

    if (user) {
      // Update existing user to admin
      user.role = 'admin';
      user.password = ADMIN_PASSWORD; // will be hashed by pre-save hook
      await user.save();
      console.log(`✅  Existing user "${user.username}" upgraded to admin.`);
    } else {
      // Create new admin user
      const username = ADMIN_EMAIL.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
      user = await User.create({
        name: 'Admin',
        username,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // will be hashed by pre-save hook
        role: 'admin',
        provider: 'local',
      });
      console.log(`✅  Admin user created: ${user.username} (${user.email})`);
    }

    await mongoose.disconnect();
    console.log('📦  Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌  Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
