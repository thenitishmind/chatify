const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In production, use a service account JSON file
// For development, you can use the default credentials
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // Fallback: initialize without explicit credentials
  // Useful when running on Google Cloud or with GOOGLE_APPLICATION_CREDENTIALS env var
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'chatify-demo'
  });
}

module.exports = admin;
