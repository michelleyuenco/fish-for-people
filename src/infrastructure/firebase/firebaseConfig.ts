import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase project configuration
// These values are safe to include in client-side code (they are public API keys)
// Security is enforced via Firestore rules
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fish-for-people.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fish-for-people',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fish-for-people.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Singleton pattern — only initialize once
let app: FirebaseApp;
let db: Firestore;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export { firebaseConfig };
