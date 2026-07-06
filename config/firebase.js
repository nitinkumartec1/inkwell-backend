import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// The user must provide a base64 encoded service account JSON string, or pass normal variables
// For simplicity, we can load individual credentials from the environment,
// or use GOOGLE_APPLICATION_CREDENTIALS

let app;

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      );
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines from .env string
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      });
    } else {
      console.warn('Firebase Admin is NOT initialized. Missing FIREBASE credentials in .env');
    }
  }
} catch (error) {
  console.error('Firebase Admin init error', error);
}

export default admin;
