import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern to avoid duplicate initialization)
let firebaseApp;
let messaging;
let firestore;

export function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export function getFirebaseMessaging() {
  if (!messaging) {
    initializeFirebase();
    messaging = getMessaging(firebaseApp);
  }
  return messaging;
}

export function getFirebaseFirestore() {
  if (!firestore) {
    initializeFirebase();
    firestore = getFirestore(firebaseApp);
  }
  return firestore;
}

export default initializeFirebase();

