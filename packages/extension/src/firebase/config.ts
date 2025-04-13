import { initializeApp, type FirebaseApp } from "firebase/app"

// --- Debugging Removed ---

const firebaseConfig = {
  apiKey: process.env.PLASMO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PLASMO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PLASMO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PLASMO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PLASMO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PLASMO_PUBLIC_FIREBASE_APP_ID
  // measurementId: process.env.PLASMO_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
}

// --- Debugging Removed ---

// Initialize Firebase
let app: FirebaseApp | null = null // Initialize as null
try {
  // Check if all required config values are present
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  ) {
    app = initializeApp(firebaseConfig)
    console.log("Firebase initialized successfully")
  } else {
    console.error(
      "Firebase config values missing in environment variables. Required: API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID"
    )
  }
} catch (e) {
  console.error("Error initializing Firebase:", e)
  // Handle initialization error appropriately
}

if (!app) {
  console.warn("Firebase app was not initialized. Auth features will not work.")
}

// Export the initialized app (might be null if initialization failed)
export { app }
