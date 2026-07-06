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
import admin from '../config/firebase.js';

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

    // 1. Ensure user exists in Firebase Auth (since frontend uses Firebase)
    try {
      const fbUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log(`✅  Found existing admin user in Firebase Auth.`);
      await admin.auth().updateUser(fbUser.uid, { password: ADMIN_PASSWORD });
      console.log(`✅  Updated existing admin password in Firebase Auth.`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: 'Admin'
        });
        console.log(`✅  Created admin user in Firebase Auth.`);
      } else {
        throw err;
      }
    }

    // 2. Ensure user exists in MongoDB
    let user = await User.findOne({ email: ADMIN_EMAIL });

    if (user) {
      // Update existing user to admin
      user.role = 'admin';
      user.password = ADMIN_PASSWORD; // will be hashed by pre-save hook
      await user.save();
      console.log(`✅  Existing user "${user.username}" upgraded to admin in MongoDB.`);
    } else {
      // Create new admin user
      const username = ADMIN_EMAIL.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
      user = await User.create({
        name: 'Admin',
        username,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // will be hashed by pre-save hook
        role: 'admin',
        provider: 'email', // Changed from local to email to match Firebase
      });
      console.log(`✅  Admin user created in MongoDB: ${user.username} (${user.email})`);
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
