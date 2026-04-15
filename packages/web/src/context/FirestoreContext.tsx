import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

const isFirebaseConfigured = Boolean(firebaseConfig.projectId);

interface FirestoreContextValue {
  app: FirebaseApp | null;
  db: Firestore | null;
}

const FirestoreContext = createContext<FirestoreContextValue | null>(null);

export function FirestoreProvider({ children }: { children: ReactNode }) {
  const value = useMemo<FirestoreContextValue>(() => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase is not configured. Set VITE_FIREBASE_* env vars to enable real-time features.');
      return { app: null, db: null };
    }
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      return { app, db };
    } catch (err) {
      console.error('Failed to initialize Firebase:', err);
      return { app: null, db: null };
    }
  }, []);

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}

export function useFirestore(): FirestoreContextValue {
  const ctx = useContext(FirestoreContext);
  if (!ctx) throw new Error('useFirestore must be used within FirestoreProvider');
  return ctx;
}
