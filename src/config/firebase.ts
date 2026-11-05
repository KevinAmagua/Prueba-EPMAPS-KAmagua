import { getApp, getApps, initializeApp } from 'firebase/app';

function requiredConfigValue(value: string | undefined, variableName: string): string {
  if (!value) {
    throw new Error(`Falta configurar ${variableName} en el archivo .env.`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredConfigValue(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    'EXPO_PUBLIC_FIREBASE_API_KEY',
  ),
  authDomain: requiredConfigValue(
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  ),
  projectId: requiredConfigValue(
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  ),
  storageBucket: requiredConfigValue(
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  ),
  messagingSenderId: requiredConfigValue(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  ),
  appId: requiredConfigValue(
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ),
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
