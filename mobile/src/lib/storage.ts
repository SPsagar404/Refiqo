import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token storage. Uses expo-secure-store on device (Keychain/Keystore) and falls
 * back to localStorage on web (dev only).
 */
const memoryStore = new Map<string, string>();

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const STORAGE_KEYS = {
  accessToken: 'refiqo.accessToken',
  refreshToken: 'refiqo.refreshToken',
} as const;
