// =============================================================================
// Built-in Supabase config.
// Every user of the published app connects to the same backend (this project's
// Supabase instance) so community features (partner, forums, leaderboard)
// work out of the box. Users never see or touch these values.
//
// Safe to ship: the anon key is the public client key. Row-Level Security
// in supabase/migrations/0001_community.sql is what keeps it safe — not
// key secrecy.
// =============================================================================

export const BUILTIN_SUPABASE_URL = 'https://gsxpkueggxibilaphyxz.supabase.co';
export const BUILTIN_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeHBrdWVnZ3hpYmlsYXBoeXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjYyOTgsImV4cCI6MjA5MjYwMjI5OH0.0XpQvvVFf9GYprxmxZfUr7kM8dCfCQsh6jpMeun1q4Y';
