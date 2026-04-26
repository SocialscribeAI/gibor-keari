// =============================================================================
// Community store — session, config, and toggles. Separate from the main
// useStore to keep cloud-sensitive state isolated. Also persists to
// AsyncStorage so the user stays signed in across launches.
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '../services/supabaseClient';
import { BUILTIN_SUPABASE_URL, BUILTIN_SUPABASE_ANON_KEY } from '../services/supabaseConfig';

export interface CommunityToggles {
  masterEnabled: boolean;
  partnerEnabled: boolean;
  allowPartnerRequests: boolean;
  forumsEnabled: boolean;
  leaderboardVisible: boolean;
  leaderboardViewable: boolean;
  moderationEnabled: boolean; // use configured AI for content moderation
}

interface CommunityState {
  // Config
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;

  // Session (mirror of Supabase auth)
  userId: string | null;
  username: string | null;

  // Toggles (local, also mirrored to profile row on server)
  toggles: CommunityToggles;

  // Actions
  setSupabaseConfig: (url: string, anonKey: string) => void;
  clearSupabaseConfig: () => void;
  setSession: (userId: string | null, username: string | null) => void;
  setToggle: <K extends keyof CommunityToggles>(k: K, v: CommunityToggles[K]) => void;

  isConfigured: () => boolean;
  getConfig: () => { url: string | null; anonKey: string | null };
}

const DEFAULT_TOGGLES: CommunityToggles = {
  masterEnabled: true, // shared backend is baked in — no setup friction
  partnerEnabled: true,
  allowPartnerRequests: true,
  forumsEnabled: true,
  leaderboardVisible: true,
  leaderboardViewable: true,
  moderationEnabled: true,
};

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      supabaseUrl: null,
      supabaseAnonKey: null,
      userId: null,
      username: null,
      toggles: { ...DEFAULT_TOGGLES },

      setSupabaseConfig: (url, anonKey) => {
        set({ supabaseUrl: url.trim(), supabaseAnonKey: anonKey.trim() });
      },
      clearSupabaseConfig: () => set({ supabaseUrl: null, supabaseAnonKey: null, userId: null, username: null }),
      setSession: (userId, username) => set({ userId, username }),
      setToggle: (k, v) => set((s) => ({ toggles: { ...s.toggles, [k]: v } })),

      isConfigured: () => {
        const s = get();
        return !!((s.supabaseUrl && s.supabaseAnonKey) || (BUILTIN_SUPABASE_URL && BUILTIN_SUPABASE_ANON_KEY));
      },
      getConfig: () => {
        const s = get();
        // Prefer user-overridden config (advanced users pointing at a different backend).
        // Fall back to the built-in project everyone shares by default.
        return {
          url: s.supabaseUrl || BUILTIN_SUPABASE_URL,
          anonKey: s.supabaseAnonKey || BUILTIN_SUPABASE_ANON_KEY,
        };
      },
    }),
    {
      name: 'guard-community',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Helper so screens can `const cfg = useCommunityConfig()` concisely. */
export function useCommunityConfig() {
  const url = useCommunityStore((s) => s.supabaseUrl) || BUILTIN_SUPABASE_URL;
  const key = useCommunityStore((s) => s.supabaseAnonKey) || BUILTIN_SUPABASE_ANON_KEY;
  return { url, anonKey: key };
}

/** Kick Supabase's cached client at boot so getSession() has the right URL. */
export function bootstrapSupabase() {
  const s = useCommunityStore.getState();
  getSupabase(s.supabaseUrl || BUILTIN_SUPABASE_URL, s.supabaseAnonKey || BUILTIN_SUPABASE_ANON_KEY);
}
