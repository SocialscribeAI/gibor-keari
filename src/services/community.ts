// =============================================================================
// Community API — thin layer over Supabase covering all community features.
// Every call goes through `requireClient()` so the caller gets a consistent
// error if the user hasn't configured their Supabase project yet.
// =============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { CommunityError, requireClient, usernameToEmail } from './supabaseClient';

export interface CommunityConfig {
  url: string | null;
  anonKey: string | null;
}

// --------------------- AUTH (username + password) ----------------------------
export async function signUp(cfg: CommunityConfig, username: string, password: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uname = username.trim();
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(uname)) {
    throw new CommunityError('Username must be 3-24 chars, letters/numbers/underscore only.', 'auth');
  }
  if (password.length < 8) throw new CommunityError('Password must be at least 8 characters.', 'auth');

  const { data, error } = await c.auth.signUp({
    email: usernameToEmail(uname),
    password,
    options: { data: { username: uname } },
  });
  if (error) throw new CommunityError(humanAuthError(error.message), 'auth');
  if (!data.user) throw new CommunityError('Signup failed.', 'auth');

  // Create profile row.
  const { error: profErr } = await c.from('profiles').insert({
    id: data.user.id,
    username: uname,
    display_name: uname,
  });
  if (profErr) {
    if (profErr.code === '23505') throw new CommunityError('That username is already taken.', 'auth');
    throw new CommunityError(profErr.message, 'db');
  }
  return data.user.id;
}

export async function signIn(cfg: CommunityConfig, username: string, password: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { data, error } = await c.auth.signInWithPassword({
    email: usernameToEmail(username.trim()),
    password,
  });
  if (error) throw new CommunityError(humanAuthError(error.message), 'auth');
  return data.user?.id ?? null;
}

export async function signOut(cfg: CommunityConfig) {
  const c = requireClient(cfg.url, cfg.anonKey);
  await c.auth.signOut();
}

export async function currentUserId(cfg: CommunityConfig): Promise<string | null> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { data } = await c.auth.getUser();
  return data.user?.id ?? null;
}

function humanAuthError(msg: string): string {
  if (/Invalid login/i.test(msg)) return 'Wrong username or password.';
  if (/already registered/i.test(msg)) return 'That username is already taken.';
  return msg;
}

// --------------------- PROFILE -----------------------------------------------
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_emoji: string | null;
  bio: string | null;
  current_streak: number;
  longest_streak: number;
  community_enabled: boolean;
  partner_enabled: boolean;
  partner_allow_requests: boolean;
  forums_enabled: boolean;
  leaderboard_visible: boolean;
}

export async function getMyProfile(cfg: CommunityConfig): Promise<Profile | null> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) return null;
  const { data, error } = await c.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw new CommunityError(error.message, 'db');
  return data as Profile | null;
}

export async function updateMyProfile(cfg: CommunityConfig, patch: Partial<Profile>) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) throw new CommunityError('Not signed in.', 'auth');
  const { error } = await c.from('profiles').update(patch).eq('id', uid);
  if (error) throw new CommunityError(error.message, 'db');
}

export async function syncStreak(cfg: CommunityConfig, currentStreak: number, longestStreak: number) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) return;
  await c.from('profiles').update({
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_synced_at: new Date().toISOString(),
  }).eq('id', uid);
}

// --------------------- PUSH TOKENS -------------------------------------------
/**
 * Store the device's Expo push token on the user's profile so the server-side
 * trigger on `urge_alerts` can deliver an instant notification to the partner.
 * Idempotent — safe to call on every app launch.
 */
export async function savePushToken(
  cfg: CommunityConfig,
  token: string,
  platform: 'ios' | 'android' | 'web',
) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) return;
  const { error } = await c.from('profiles').update({
    expo_push_token: token,
    push_platform: platform,
    push_updated_at: new Date().toISOString(),
  }).eq('id', uid);
  if (error) throw new CommunityError(error.message, 'db');
}

/** Clear the token on sign-out so an old device can't keep receiving pushes. */
export async function clearPushToken(cfg: CommunityConfig) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) return;
  await c.from('profiles').update({
    expo_push_token: null,
    push_platform: null,
    push_updated_at: new Date().toISOString(),
  }).eq('id', uid);
}

// --------------------- PARTNERSHIPS ------------------------------------------
export interface Partnership {
  id: string;
  user_a: string;
  user_b: string | null;
  status: 'pending' | 'active' | 'ended';
  invite_code: string | null;
  created_at: string;
}

export async function createInvite(cfg: CommunityConfig): Promise<string> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) throw new CommunityError('Not signed in.', 'auth');
  const code = randomCode(8);
  const { error } = await c.from('partnerships').insert({
    user_a: uid, user_b: null, status: 'pending', invite_code: code,
  });
  if (error) throw new CommunityError(error.message, 'db');
  return code;
}

export async function acceptInvite(cfg: CommunityConfig, code: string): Promise<string> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { data, error } = await c.rpc('accept_partner_invite', { p_code: code.trim() });
  if (error) throw new CommunityError(error.message, 'db');
  return data as string;
}

export async function listMyPartnerships(cfg: CommunityConfig): Promise<(Partnership & { partner: Profile | null })[]> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) return [];
  const { data, error } = await c
    .from('partnerships')
    .select('*')
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)
    .order('created_at', { ascending: false });
  if (error) throw new CommunityError(error.message, 'db');

  const results: (Partnership & { partner: Profile | null })[] = [];
  for (const p of (data ?? []) as Partnership[]) {
    const partnerId = p.user_a === uid ? p.user_b : p.user_a;
    let partner: Profile | null = null;
    if (partnerId && p.status === 'active') {
      const { data: pp } = await c.from('profiles').select('*').eq('id', partnerId).maybeSingle();
      partner = (pp as Profile) ?? null;
    }
    results.push({ ...p, partner });
  }
  return results;
}

export async function endPartnership(cfg: CommunityConfig, partnershipId: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { error } = await c.from('partnerships')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', partnershipId);
  if (error) throw new CommunityError(error.message, 'db');
}

// --------------------- URGE ALERTS -------------------------------------------
export interface UrgeAlert {
  id: string;
  from_user: string;
  partnership_id: string;
  intensity: number;
  note: string | null;
  created_at: string;
  acknowledged_at: string | null;
}

export async function sendUrgeAlert(cfg: CommunityConfig, partnershipId: string, intensity: number, note?: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) throw new CommunityError('Not signed in.', 'auth');
  const { error } = await c.from('urge_alerts').insert({
    from_user: uid, partnership_id: partnershipId, intensity, note: note ?? null,
  });
  if (error) throw new CommunityError(error.message, 'db');
}

export async function listIncomingAlerts(cfg: CommunityConfig, limit = 30): Promise<(UrgeAlert & { from_profile: Profile | null })[]> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) return [];
  const { data, error } = await c
    .from('urge_alerts')
    .select('*')
    .neq('from_user', uid)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new CommunityError(error.message, 'db');

  const results: (UrgeAlert & { from_profile: Profile | null })[] = [];
  for (const a of (data ?? []) as UrgeAlert[]) {
    const { data: prof } = await c.from('profiles').select('*').eq('id', a.from_user).maybeSingle();
    results.push({ ...a, from_profile: (prof as Profile) ?? null });
  }
  return results;
}

export async function acknowledgeAlert(cfg: CommunityConfig, alertId: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { error } = await c.from('urge_alerts')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('id', alertId);
  if (error) throw new CommunityError(error.message, 'db');
}

// --------------------- LEADERBOARD -------------------------------------------
export interface LeaderboardRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_emoji: string | null;
  current_streak: number;
  longest_streak: number;
}

export async function fetchLeaderboard(cfg: CommunityConfig): Promise<LeaderboardRow[]> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { data, error } = await c.from('leaderboard').select('*').limit(100);
  if (error) throw new CommunityError(error.message, 'db');
  return (data ?? []) as LeaderboardRow[];
}

// --------------------- FORUMS ------------------------------------------------
export interface Forum {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  is_locked: boolean;
}

export interface ForumPost {
  id: string;
  forum_id: string;
  author_id: string | null;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  reply_count: number;
}

export interface ForumReply {
  id: string;
  post_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export async function listForums(cfg: CommunityConfig): Promise<Forum[]> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { data, error } = await c.from('forums').select('*').eq('is_hidden', false).order('created_at');
  if (error) throw new CommunityError(error.message, 'db');
  return (data ?? []) as Forum[];
}

export async function createForum(cfg: CommunityConfig, slug: string, title: string, description?: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) throw new CommunityError('Not signed in.', 'auth');
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40);
  const { data, error } = await c.from('forums').insert({
    slug: cleanSlug, title, description: description ?? null, created_by: uid,
  }).select('id').single();
  if (error) {
    if (error.code === '23505') throw new CommunityError('A forum with that slug already exists.', 'db');
    throw new CommunityError(error.message, 'db');
  }
  return data?.id as string;
}

export async function listPosts(cfg: CommunityConfig, forumId: string, limit = 50): Promise<(ForumPost & { author: Profile | null })[]> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { data, error } = await c
    .from('forum_posts')
    .select('*')
    .eq('forum_id', forumId)
    .eq('is_hidden', false)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new CommunityError(error.message, 'db');

  const results: (ForumPost & { author: Profile | null })[] = [];
  for (const p of (data ?? []) as ForumPost[]) {
    let author: Profile | null = null;
    if (p.author_id) {
      const { data: prof } = await c.from('profiles').select('*').eq('id', p.author_id).maybeSingle();
      author = (prof as Profile) ?? null;
    }
    results.push({ ...p, author });
  }
  return results;
}

export async function createPost(cfg: CommunityConfig, forumId: string, title: string, body: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) throw new CommunityError('Not signed in.', 'auth');
  const { data, error } = await c.from('forum_posts').insert({
    forum_id: forumId, author_id: uid, title, body,
  }).select('id').single();
  if (error) throw new CommunityError(error.message, 'db');
  return data?.id as string;
}

export async function getPost(cfg: CommunityConfig, postId: string): Promise<(ForumPost & { author: Profile | null }) | null> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { data, error } = await c.from('forum_posts').select('*').eq('id', postId).maybeSingle();
  if (error) throw new CommunityError(error.message, 'db');
  if (!data) return null;
  const post = data as ForumPost;
  let author: Profile | null = null;
  if (post.author_id) {
    const { data: prof } = await c.from('profiles').select('*').eq('id', post.author_id).maybeSingle();
    author = (prof as Profile) ?? null;
  }
  return { ...post, author };
}

export async function listReplies(cfg: CommunityConfig, postId: string): Promise<(ForumReply & { author: Profile | null })[]> {
  const c = requireClient(cfg.url, cfg.anonKey);
  const { data, error } = await c
    .from('forum_replies')
    .select('*')
    .eq('post_id', postId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });
  if (error) throw new CommunityError(error.message, 'db');

  const results: (ForumReply & { author: Profile | null })[] = [];
  for (const r of (data ?? []) as ForumReply[]) {
    let author: Profile | null = null;
    if (r.author_id) {
      const { data: prof } = await c.from('profiles').select('*').eq('id', r.author_id).maybeSingle();
      author = (prof as Profile) ?? null;
    }
    results.push({ ...r, author });
  }
  return results;
}

export async function createReply(cfg: CommunityConfig, postId: string, body: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) throw new CommunityError('Not signed in.', 'auth');
  const { error } = await c.from('forum_replies').insert({
    post_id: postId, author_id: uid, body,
  });
  if (error) throw new CommunityError(error.message, 'db');
}

export async function reportContent(cfg: CommunityConfig, targetType: 'post' | 'reply' | 'profile', targetId: string, reason: string) {
  const c = requireClient(cfg.url, cfg.anonKey);
  const uid = await currentUserId(cfg);
  if (!uid) throw new CommunityError('Not signed in.', 'auth');
  const { error } = await c.from('reports').insert({
    reporter_id: uid, target_type: targetType, target_id: targetId, reason,
  });
  if (error) throw new CommunityError(error.message, 'db');
}

// --------------------- helpers -----------------------------------------------
function randomCode(len: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
