import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// ======================================
// JAREXA FIREBASE CONFIGURATION
// ======================================

const firebaseConfig = {
  apiKey: "AIzaSyBepvseQ3RIYoaOGF3TdRX4Vehu4ALKRfM",
  authDomain: "vex-lol-96e60.firebaseapp.com",
  projectId: "vex-lol-96e60",
  storageBucket: "vex-lol-96e60.firebasestorage.app",
  messagingSenderId: "753177343405",
  appId: "1:753177343405:web:c62a17ccd9848290c2dd24",
  measurementId: "G-WY1TP1WRK7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);