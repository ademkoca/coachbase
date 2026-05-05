import admin from 'firebase-admin'

function parsePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  try {
    // Handle JSON-wrapped format: {"privateKey": "-----BEGIN PRIVATE KEY-----\n..."}
    const parsed = JSON.parse(raw)
    if (parsed.privateKey) return parsed.privateKey.replace(/\\n/g, '\n')
  } catch {
    // Plain key string
  }
  return raw.replace(/\\n/g, '\n')
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  })
}

export const adminAuth = admin.auth()
