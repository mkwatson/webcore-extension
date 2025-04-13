import { getAuth } from "firebase/auth"

import { app } from "./config"

// Check if app was initialized successfully before getting auth
const auth = app ? getAuth(app) : null

if (!auth) {
  console.error(
    "Firebase Auth could not be initialized, likely due to missing config. Auth features will not work."
  )
}

export { app, auth }
