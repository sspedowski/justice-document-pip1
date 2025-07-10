// Firebase connection test utility
import { db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';

// Test Firebase connection
export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to access a collection (this will test the connection)
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    
    console.log('✅ Firebase connection successful');
    return { success: true, message: 'Firebase connection successful' };
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    
    // Provide helpful error messages based on error type
    let message = 'Firebase connection failed';
    if (error.code === 'permission-denied') {
      message = 'Firebase access denied - check your Firestore security rules';
    } else if (error.code === 'unavailable') {
      message = 'Firebase service unavailable - check your internet connection';
    } else if (error.message.includes('Missing or insufficient permissions')) {
      message = 'Firebase permissions error - check your Firestore security rules';
    } else if (error.message.includes('Failed to get document')) {
      message = 'Firebase project not found - check your project ID';
    }
    
    return { success: false, message, error: error.message };
  }
}

// Auto-test connection when module loads (only in development)
if (import.meta.env.DEV) {
  testFirebaseConnection().then(result => {
    if (result.success) {
      console.log('🔥 Firebase ready for use');
    } else {
      console.warn('🔥 Firebase connection issue:', result.message);
    }
  });
}
