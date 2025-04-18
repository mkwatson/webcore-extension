import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  type User // Import type User
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { useEffect, useMemo, useState } from "react"

// Adjust import path to point to index file in the same directory
import { app, auth } from "."

// Set persistence only if auth is available
if (auth) {
  try {
    setPersistence(auth, browserLocalPersistence)
  } catch (error) {
    console.error("Error setting auth persistence:", error)
  }
} else {
  console.warn("Auth not initialized, skipping persistence setting.")
}

export const useFirebase = () => {
  const [isLoading, setIsLoading] = useState(true) // Start loading until first auth state check
  const [user, setUser] = useState<User | null>(null) // Explicitly type as User | null

  // Initialize firestore only if app is available
  const firestore = useMemo(
    () => (app && user ? getFirestore(app) : null),
    [user]
  )

  const onLogout = async () => {
    if (!auth) {
      console.error("Cannot logout, auth not initialized.")
      return
    }
    setIsLoading(true)
    try {
      await auth.signOut()
      // setUser(null) // Let onAuthStateChanged handle the update
      console.log("User signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onLogin = () => {
    if (!auth) {
      console.error("Cannot login, auth not initialized.")
      setErrorState("Firebase Auth not initialized.")
      return
    }
    setIsLoading(true)
    // Check if chrome.identity is available
    console.log("[Auth Debug] About to call chrome.identity.getAuthToken. chrome:", typeof chrome, "chrome.identity:", chrome?.identity)
    if (typeof chrome !== "undefined" && chrome.identity?.getAuthToken) {
      console.log("[Auth Debug] Calling chrome.identity.getAuthToken...")
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        console.log("[Auth Debug] getAuthToken callback fired. token:", token, "lastError:", chrome.runtime.lastError)
        if (chrome.runtime.lastError || !token) {
          console.error(
            "Error getting auth token:",
            chrome.runtime.lastError?.message
          )
          setErrorState(
            chrome.runtime.lastError?.message || "Could not retrieve token."
          )
          setIsLoading(false)
          return
        }
        // Use the two-argument version: credential(idToken: null, accessToken: string)
        const credential = GoogleAuthProvider.credential(null, token as string)
        try {
          // Add another check for auth to satisfy TS inside the async callback
          if (!auth) {
            throw new Error("Firebase auth became null unexpectedly.")
          }
          console.log("[Auth Debug] About to call signInWithCredential with credential:", credential)
          await signInWithCredential(auth, credential)
          // setUser will be updated by onAuthStateChanged
          console.log("signInWithCredential successful")
        } catch (e) {
          console.error("Could not log in with credential. ", e)
          setErrorState("Firebase sign-in failed.")
          setIsLoading(false)
        }
      })
    } else {
      console.error("chrome.identity.getAuthToken is not available.")
      setErrorState("Chrome Identity API not available.")
      setIsLoading(false)
    }
  }

  // Separate state for errors to avoid complexity with user state
  const [errorState, setErrorState] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      // If auth isn't initialized, stop loading and set appropriate state
      setIsLoading(false)
      setUser(null)
      // setErrorState("Firebase Auth not initialized on mount."); // Optional: set error
      console.warn(
        "Auth not initialized, skipping onAuthStateChanged listener."
      )
      return // Don't attach listener if auth is null
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user?.uid)
      setUser(user) // Update user state
      setIsLoading(false) // Auth state determined, stop loading
      setErrorState(null) // Clear errors on auth change
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, []) // Dependency array is empty, but effect now depends on auth being available initially

  return {
    isLoading,
    user,
    error: errorState, // Expose error state
    firestore, // Keep from example, maybe remove later if unused
    onLogin,
    onLogout
  }
}
