
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAg0iz_PoX0l18KGd3mi7asZ2KdiDoYmxg",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "canal-denuncies.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "canal-denuncies",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "canal-denuncies.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "710552504524",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:710552504524:web:b412741c4cedd143239a69",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RK7HD0GX3W"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
