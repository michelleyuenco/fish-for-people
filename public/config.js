// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// TO SET UP:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Add a Web App to the project
// 4. Copy the firebaseConfig object and paste it below
// 5. Enable Firestore Database (in test mode is fine)
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Service ID — change this each Sunday or for each service
// Format: YYYY-MM-DD or any identifier you prefer
const DEFAULT_SERVICE_ID = new Date().toISOString().split('T')[0];
