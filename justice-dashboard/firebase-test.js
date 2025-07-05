// Firebase Configuration Test
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQm3l0On3Ka13xrGgl2Ebuuq1UcsLBc8E",
  authDomain: "justice-dashboard-2025-4154e.firebaseapp.com",
  projectId: "justice-dashboard-2025-4154e",
  storageBucket: "justice-dashboard-2025-4154e.firebasestorage.app",
  messagingSenderId: "241577747238",
  appId: "1:241577747238:web:d9b8dfeb56a77a5aae17e7"
};

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('✅ Firebase initialized successfully!');
console.log('📊 Firestore:', db ? 'Ready' : 'Failed');
console.log('🔐 Auth:', auth ? 'Ready' : 'Failed');
console.log('📁 Storage:', storage ? 'Ready' : 'Failed');

export { app, db, auth, storage };
