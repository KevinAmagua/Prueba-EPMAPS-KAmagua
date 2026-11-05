import type AsyncStorage from '@react-native-async-storage/async-storage';
import type { initializeAuth } from 'firebase/auth';

type AuthDependencies = NonNullable<Parameters<typeof initializeAuth>[1]>;

declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: typeof AsyncStorage,
  ): AuthDependencies['persistence'];
}
