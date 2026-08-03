import admin from 'firebase-admin';

const globalForFirebase = globalThis as unknown as {
  firebase: admin.App | undefined
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
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const app = admin.initializeApp({
      credential: (admin as any).credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });

    console.log('[Firebase] Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('[Firebase] Failed to initialize Admin SDK:', error);
    return null as any;
  }
})()

if (process.env.NODE_ENV !== 'production') globalForFirebase.firebase = firebaseApp

// Export messaging for convenience
export const messaging = firebaseApp ? (admin as any).messaging(firebaseApp) : null;
