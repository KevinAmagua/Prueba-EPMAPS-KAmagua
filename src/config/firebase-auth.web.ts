import { FirebaseError } from 'firebase/app';
import { browserLocalPersistence, getAuth, initializeAuth } from 'firebase/auth';

import { firebaseApp } from '@/config/firebase';

function initializeFirebaseAuth() {
  try {
    return initializeAuth(firebaseApp, {
      persistence: browserLocalPersistence,
    });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

export const auth = initializeFirebaseAuth();
