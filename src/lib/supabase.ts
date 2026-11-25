import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('tu-proyecto.supabase.co') &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes('tu_clave_anon');

const CHUNK_SIZE = 1800;

/**
 * Almacenamiento seguro de sesión usando Expo SecureStore en iOS/Android.
 * Divide valores largos (>1800 bytes) en bloques para respetar el límite de 2048 bytes de SecureStore.
 */
const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    try {
      const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        const parts: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
          if (chunk === null) return null;
          parts.push(chunk);
        }
        return parts.join('');
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await this.removeItem(key);
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}__chunks`, String(chunks.length));
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}__chunk_${i}`, chunks[i]);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    try {
      const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}__chunks`);
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignorar limpieza de claves inexistentes
    }
  },
};

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-anon-key-for-unconfigured-env';

export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : fallbackUrl,
  isSupabaseConfigured ? SUPABASE_ANON_KEY : fallbackKey,
  {
    auth: {
      storage: secureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
