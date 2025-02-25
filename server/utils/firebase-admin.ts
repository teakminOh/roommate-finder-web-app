import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Access runtime config
const config = useRuntimeConfig()

// Parse credentials based on environment
let serviceAccount: ServiceAccount | string
if (config.googleCredentials.startsWith('{')) {
  // Production: Credentials as JSON string
  serviceAccount = JSON.parse(config.googleCredentials) as ServiceAccount
} else {
  // Local: Path to service-account.json
  serviceAccount = config.googleCredentials
}

// Singleton to avoid reinitialization
let adminApp
if (!adminApp) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
  }, 'admin')
}

export const adminAuth = getAuth(adminApp)