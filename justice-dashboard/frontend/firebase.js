// frontend/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

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

let app = null;
let db = null;
let auth = null;
let storage = null;
let functions = null;

if (missingVars.length > 0) {
  console.warn(`⚠️ Firebase not configured: Missing variables: ${missingVars.join(', ')}`);
  console.warn('📝 Please update your .env file with real Firebase configuration values');
  console.warn('🔗 Get config from: https://console.firebase.google.com -> Project Settings -> Your Apps');
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
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    
    // Connect to emulators in development
    if (import.meta.env.DEV) {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectStorageEmulator(storage, 'localhost', 9199);
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('🔧 Connected to Firebase emulators');
      } catch (error) {
        console.log('⚠️ Firebase emulators not running (this is normal for production)');
      }
    }
    
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
  }
}

export { db, auth, storage, functions, app };
