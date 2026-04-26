// =============================================================================
// Coach tools — lets the AI coach read the user's full database and perform
// side effects (ping partner, log a close call, add to watchlist, etc.).
//
// Gemma (our current model) doesn't support native function calling, so we use
// a text protocol: the model emits lines like
//   <<TOOL>>{"name":"ping_partner","args":{"intensity":8,"note":"home alone"}}<<END>>
// We parse them out, execute, feed the result back in, and ask the model to
// continue. This works with any chat LLM.
// =============================================================================

import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useCommunityStore } from '../store/useCommunityStore';
import { sendUrgeAlert, listMyPartnerships } from './community';

// ---------------------------------------------------------------------------
// Tool protocol
// ---------------------------------------------------------------------------

export const TOOL_OPEN = '<<TOOL>>';
export const TOOL_CLOSE = '<<END>>';

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  /** Raw string the model emitted (so we can strip it from user-visible output). */
  raw: string;
}

export interface ToolResult {
  name: string;
  ok: boolean;
  output: string;
}

export interface ToolDef {
  name: string;
  description: string;
  /** Short JSON schema-ish hint shown in the prompt. */
  paramsHint: string;
  /** true = safe read (no side effects). false = requires user consent first. */
  readOnly: boolean;
  execute: (args: Record<string, unknown>) => Promise<string> | string;
}

// ---------------------------------------------------------------------------
// Parser — find tool calls in the raw model output
// ---------------------------------------------------------------------------

export function parseToolCalls(text: string): { cleaned: string; calls: ToolCall[] } {
  const calls: ToolCall[] = [];
  const regex = new RegExp(
    `${escapeRegex(TOOL_OPEN)}\\s*([\\s\\S]*?)\\s*${escapeRegex(TOOL_CLOSE)}`,
    'g',
  );
  let cleaned = text;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[0];
    const json = m[1].trim();
    try {
      const parsed = JSON.parse(json) as { name?: string; args?: Record<string, unknown> };
      if (parsed && typeof parsed.name === 'string') {
        calls.push({ name: parsed.name, args: parsed.args ?? {}, raw });
      }
    } catch {
      // ignore malformed; fall through
    }
  }
  // Remove all tool blocks from the visible output.
  cleaned = cleaned.replace(regex, '').replace(/\n{3,}/g, '\n\n').trim();
  return { cleaned, calls };
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Tool registry — reads live state via useStore.getState()
// ---------------------------------------------------------------------------

export function buildToolRegistry(): Record<string, ToolDef> {
  const getState = () => useStore.getState();

  const tools: ToolDef[] = [
    {
      name: 'get_profile_snapshot',
      description: 'Full user profile, streak, identity, why, active vow, intensity.',
      paramsHint: '{}',
      readOnly: true,
      execute: () => {
        const s = getState();
        return JSON.stringify(
          {
            displayName: s.displayName,
            currentStreak: s.currentStreak,
            longestStreak: s.longestStreak,
            identityStatement: s.identityStatement,
            activeRecoveryVow: s.activeRecoveryVow,
            personalityProfile: s.personalityProfile,
            checkInStreak: s.checkInStreak,
            lastCheckInDate: s.lastCheckInDate,
          },
          null,
          2,
        );
      },
    },
    {
      name: 'get_mantras',
      description: 'User\'s personal mantras and which one is the daily mantra.',
      paramsHint: '{}',
      readOnly: true,
      execute: () => {
        const s = getState();
        return JSON.stringify({ mantras: s.mantras, dailyIndex: s.dailyMantraIndex });
      },
    },
    {
      name: 'get_tactics',
      description: 'User\'s custom tactics (added or AI-suggested in Settings).',
      paramsHint: '{}',
      readOnly: true,
      execute: () => {
        const s = getState();
        return JSON.stringify(s.customTactics ?? []);
      },
    },
    {
      name: 'get_recent_events',
      description: 'Recent falls, close calls, and check-ins. Optional args: {days: number (default 14)}.',
      paramsHint: '{"days": 14}',
      readOnly: true,
      execute: (args) => {
        const s = getState();
        const days = Math.max(1, Math.min(90, Number(args.days) || 14));
        const cutoff = Date.now() - days * 86400_000;
        const inWindow = (iso: string) => new Date(iso).getTime() >= cutoff;
        return JSON.stringify(
          {
            window_days: days,
            falls: s.fallEvents.filter((e) => inWindow(e.date)).map((e) => ({
              date: e.date,
              emotionalTriggers: e.emotionalTriggers,
              situationalTriggers: e.situationalTriggers,
              digitalTriggers: e.digitalTriggers,
              shameLevel: e.shameLevel,
              angerLevel: e.angerLevel,
              numbnessLevel: e.numbnessLevel,
              notes: e.notes,
            })),
            closeCalls: s.closeCallEvents.filter((e) => inWindow(e.date)).map((e) => ({
              date: e.date,
              trigger: e.trigger,
              tacticUsed: e.tacticUsed,
              workedRating: e.workedRating,
              notes: e.notes,
            })),
            checkIns: s.checkInEvents.filter((e) => {
              // CheckInEvent uses dayKey not date
              const iso = `${e.dayKey}T00:00:00Z`;
              return inWindow(iso);
            }).map((e) => ({
              dayKey: e.dayKey,
              status: e.status,
              mood: e.mood,
              halt: e.halt,
              reflection: e.reflection,
            })),
          },
          null,
          2,
        );
      },
    },
    {
      name: 'get_watchlist',
      description: 'User\'s danger watchlist (risky times, apps, contexts).',
      paramsHint: '{}',
      readOnly: true,
      execute: () => {
        const s = getState();
        return JSON.stringify(s.dangerWatchlist ?? []);
      },
    },
    {
      name: 'get_rituals_and_reminders',
      description: 'Reminder time, lights-out time, and any scheduled rituals.',
      paramsHint: '{}',
      readOnly: true,
      execute: () => {
        const s = getState();
        return JSON.stringify({
          dailyReminderTime: s.dailyReminderTime,
          lightsOutTime: s.lightsOutTime,
          dangerHour: s.dangerHour,
          notificationsEnabled: s.notificationsEnabled,
        });
      },
    },
    {
      name: 'log_close_call',
      description:
        'Record a close call the user just got through. Args: {trigger: string, workedRating: 1-5, notes?: string}. Only call after the user confirms.',
      paramsHint: '{"trigger":"loneliness","workedRating":4,"notes":"home alone, used coach"}',
      readOnly: false,
      execute: (args) => {
        const s = getState();
        const trigger = String(args.trigger ?? 'unspecified');
        const workedRating = clampInt(args.workedRating, 1, 5, 3);
        const notes = args.notes ? String(args.notes) : undefined;
        s.logCloseCall({ trigger, workedRating, tacticUsed: 'coach', notes });
        return JSON.stringify({ ok: true, logged_at: new Date().toISOString() });
      },
    },
    {
      name: 'add_watchlist_time',
      description:
        'Add a danger time window to the watchlist. Args: {label: string, weekdays: number[] 0-6, startHour: 0-23, endHour: 0-23}. Only call after the user confirms.',
      paramsHint: '{"label":"Late-night solitude","weekdays":[5,6],"startHour":22,"endHour":1}',
      readOnly: false,
      execute: (args) => {
        const s = getState();
        const label = String(args.label ?? 'Unnamed window');
        const weekdays = Array.isArray(args.weekdays)
          ? args.weekdays.map((n) => clampInt(n, 0, 6, 0))
          : [];
        const startHour = clampInt(args.startHour, 0, 23, 22);
        const endHour = clampInt(args.endHour, 0, 23, 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        s.addWatchItem({
          type: 'time',
          label,
          detector: { kind: 'time-window', value: `${pad(startHour)}:00-${pad(endHour)}:00` },
          schedule: {
            start: `${pad(startHour)}:00`,
            end: `${pad(endHour)}:00`,
            days: weekdays,
          },
          level: 'mantra-gate',
          suggestedBy: 'user',
        });
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'ping_partner',
      description:
        'Send an urgent ping to the user\'s accountability partner with a note. Requires a partnership to be set up and community to be configured. Args: {intensity: 1-10, note?: string}. Only call after the user confirms.',
      paramsHint: '{"intensity": 9, "note": "home alone, need a check-in"}',
      readOnly: false,
      execute: async (args) => {
        const cs = useCommunityStore.getState();
        if (!cs.isConfigured()) {
          return JSON.stringify({ ok: false, error: 'Community/Supabase not configured. Partner alerts unavailable.' });
        }
        if (!cs.userId) {
          return JSON.stringify({ ok: false, error: 'Not signed in to community yet.' });
        }
        try {
          const partnerships = await listMyPartnerships({
            url: cs.supabaseUrl!,
            anonKey: cs.supabaseAnonKey!,
          });
          const active = partnerships.find((p) => p.status === 'active');
          if (!active) {
            return JSON.stringify({ ok: false, error: 'No active partnership. User has no partner paired yet.' });
          }
          const intensity = clampInt(args.intensity, 1, 10, 7);
          const note = args.note ? String(args.note) : undefined;
          await sendUrgeAlert(
            { url: cs.supabaseUrl!, anonKey: cs.supabaseAnonKey! },
            active.id,
            intensity,
            note,
          );
          return JSON.stringify({
            ok: true,
            partner: active.partner?.display_name ?? active.partner?.username ?? 'your partner',
            sent_at: new Date().toISOString(),
          });
        } catch (e: any) {
          return JSON.stringify({ ok: false, error: String(e?.message ?? e) });
        }
      },
    },
    {
      name: 'pick_mantra_for_now',
      description:
        'Pick the best-fit mantra from the user\'s list for the current moment. Args: {reason?: string}. Returns the text.',
      paramsHint: '{"reason":"fighting loneliness urge"}',
      readOnly: true,
      execute: (args) => {
        const s = getState();
        if (!s.mantras.length) return JSON.stringify({ text: null, error: 'User has no mantras yet.' });
        const reason = String(args.reason ?? '').toLowerCase();
        // Prefer the daily mantra unless the reason hints at something different.
        const daily = s.mantras[s.dailyMantraIndex ?? 0] ?? s.mantras[0];
        if (!reason) return JSON.stringify({ text: daily });
        // Simple keyword match; model can always ignore and pick its own.
        const match = s.mantras.find((m) => reason.split(/\W+/).some((w) => w && m.toLowerCase().includes(w)));
        return JSON.stringify({ text: match || daily });
      },
    },
  ];

  const registry: Record<string, ToolDef> = {};
  for (const t of tools) registry[t.name] = t;
  return registry;
}

function clampInt(v: unknown, min: number, max: number, def: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
}

// ---------------------------------------------------------------------------
// Tool manifest — rendered into the system prompt so the model knows what's
// available and how to call them.
// ---------------------------------------------------------------------------

export function renderToolManifest(registry: Record<string, ToolDef>): string {
  const lines: string[] = [
    'TOOLS AVAILABLE',
    '',
    'You have access to the user\'s full local database and to their accountability',
    'partner (if paired). To call a tool, emit EXACTLY this on its own line:',
    '',
    `${TOOL_OPEN}{"name":"<tool_name>","args":{...}}${TOOL_CLOSE}`,
    '',
    'Rules:',
    '- Read tools (get_*, pick_mantra_for_now) can be called freely.',
    '- WRITE tools (log_close_call, add_watchlist_time, ping_partner) MUST be',
    '  confirmed by the user first. Ask explicitly ("Want me to ping your partner?")',
    '  and only emit the tool call on the next turn after they say yes.',
    '- You may call multiple read tools in a single turn.',
    '- After a tool block, you MAY continue talking to the user on the same turn.',
    '- Never fabricate data — always call a tool to check.',
    '',
    'TOOLS:',
  ];
  for (const t of Object.values(registry)) {
    const tag = t.readOnly ? '(read)' : '(WRITE — needs consent)';
    lines.push(`- ${t.name} ${tag} — ${t.description}`);
    lines.push(`  params: ${t.paramsHint}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Snapshot — a short plain-text summary we inject on every turn so the model
// doesn't have to burn a tool call to get the basics.
// ---------------------------------------------------------------------------

export function renderLiveSnapshot(): string {
  const s = useStore.getState();
  const cs = useCommunityStore.getState();
  const today = format(new Date(), 'EEEE, MMM d, yyyy · HH:mm');
  const recentFalls = s.fallEvents.filter((e) => Date.now() - new Date(e.date).getTime() < 7 * 86400_000).length;
  const recentCloseCalls = s.closeCallEvents.filter((e) => Date.now() - new Date(e.date).getTime() < 7 * 86400_000).length;
  const partnerState = !cs.isConfigured()
    ? 'no community account'
    : !cs.userId
      ? 'community configured but not signed in'
      : 'community ready — can ping partner if paired';
  return [
    `NOW: ${today}`,
    `Streak: ${s.currentStreak}d (longest ${s.longestStreak}d)`,
    `Last 7d: ${recentFalls} falls, ${recentCloseCalls} close calls`,
    s.identityStatement ? `Identity: "${s.identityStatement}"` : '',
    s.activeRecoveryVow ? `Active vow: "${s.activeRecoveryVow.text}"` : '',
    `Mantras saved: ${s.mantras.length}. Custom tactics: ${(s.customTactics ?? []).length}. Watchlist items: ${(s.dangerWatchlist ?? []).length}.`,
    `Partner status: ${partnerState}`,
    `Lights-out: ${s.lightsOutTime}. Daily reminder: ${s.dailyReminderTime}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ---------------------------------------------------------------------------
// Execute — run all calls from a single turn, return formatted results to
// feed back into the model.
// ---------------------------------------------------------------------------

export async function executeToolCalls(
  calls: ToolCall[],
  registry: Record<string, ToolDef>,
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  for (const call of calls) {
    const def = registry[call.name];
    if (!def) {
      results.push({ name: call.name, ok: false, output: JSON.stringify({ error: 'unknown_tool' }) });
      continue;
    }
    try {
      const out = await def.execute(call.args);
      results.push({ name: call.name, ok: true, output: String(out) });
    } catch (e: any) {
      results.push({ name: call.name, ok: false, output: JSON.stringify({ error: String(e?.message ?? e) }) });
    }
  }
  return results;
}

export function renderToolResults(results: ToolResult[]): string {
  return results
    .map((r) => `TOOL RESULT [${r.name}] ${r.ok ? 'ok' : 'error'}:\n${r.output}`)
    .join('\n\n');
}
