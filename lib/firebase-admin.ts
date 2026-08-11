import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const globalForFirebase = globalThis as unknown as {
  firebase: App | undefined
}

export const firebaseApp = globalForFirebase.firebase ?? (() => {
  // Only initialize if credentials are provided
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase] Missing credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). FCM features will be disabled.');
    return null as any;
  }

  // Handle private key newline escaping from .env files
  let formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  // Remove surrounding quotes if present (common .env parsing issue)
  if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
    formattedPrivateKey = formattedPrivateKey.slice(1, -1);
  }
  if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
    formattedPrivateKey = formattedPrivateKey.slice(1, -1);
  }

  // Validate key structure before passing to Firebase
  const keyStructureValid = formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----') &&
                            formattedPrivateKey.includes('-----END PRIVATE KEY-----');

  if (!keyStructureValid) {
    console.error('[Firebase] Invalid private key format: Missing BEGIN/END PRIVATE KEY markers. Check FIREBASE_PRIVATE_KEY in .env file.');
    return null as any;
  }

  try {
    // Check if already initialized to avoid duplicate initialization
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log('[Firebase] Admin SDK already initialized');
      return existingApps[0];
    }

    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });

    console.log('[Firebase] Admin SDK initialized successfully');
    console.log(`[Firebase] Using Firebase project ID: ${projectId}`);
    return app;
  } catch (error: any) {
    if (error.code === 'app/invalid-credential') {
      console.error('[Firebase] Failed to initialize Admin SDK: Invalid credential format. The private key may be malformed or incomplete. Check FIREBASE_PRIVATE_KEY in .env file. Ensure it has proper newlines and no extra quotes.');
    } else {
      console.error('[Firebase] Failed to initialize Admin SDK:', error);
    }
    return null as any;
  }
})()

if (process.env.NODE_ENV !== 'production') globalForFirebase.firebase = firebaseApp

// Export messaging for convenience
export const messaging = firebaseApp ? getMessaging(firebaseApp) : null;
