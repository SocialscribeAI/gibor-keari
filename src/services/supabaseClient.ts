// =============================================================================
// Supabase client — initialized lazily from config stored in the main store.
// The user pastes their project URL + anon key once into Community Settings;
// we keep them in AsyncStorage (same place as everything else) so nothing
// leaks to a server, and rebuild the client when they change.
// =============================================================================

import 'react-native-get-random-values';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let cached: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabase(url: string | null, anonKey: string | null): SupabaseClient | null {
  if (!url || !anonKey) return null;
  const key = `${url}::${anonKey}`;
  if (cached && cachedKey === key) return cached;
  cached = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage as any,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  cachedKey = key;
  return cached;
}

export class CommunityError extends Error {
  constructor(message: string, public kind: 'not-configured' | 'auth' | 'network' | 'db' | 'moderation' = 'db') {
    super(message);
    this.name = 'CommunityError';
  }
}

export function requireClient(url: string | null, anonKey: string | null): SupabaseClient {
  const c = getSupabase(url, anonKey);
  if (!c) throw new CommunityError('Community is not configured yet.', 'not-configured');
  return c;
}

/** Synthetic email derived from username — we never show this to the user. */
export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@guard.local`;
}
