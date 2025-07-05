// frontend/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Ensure all environment variables are defined before initialization
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.warn(`⚠️ Firebase not configured: Missing variables: ${missingVars.join(', ')}`);
  console.warn('📝 Please update your .env file with real Firebase configuration values');
  console.warn('🔗 Get config from: https://console.firebase.google.com -> Project Settings -> Your Apps');
  
  // Export dummy objects to prevent crashes
  export const db = null;
  export const app = null;
} else {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Initialize Firebase with error handling
  let app;
  let db;

  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('🔥 Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    console.error('Firebase config:', {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '***' : 'MISSING',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'MISSING',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'MISSING',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'MISSING',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'MISSING',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || 'MISSING',
    });
    throw error;
  }

  export { db, app };
}
