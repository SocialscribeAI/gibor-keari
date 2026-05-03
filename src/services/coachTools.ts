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
import type {
  ClinicalAssessment,
  KbCategory,
  KbImportance,
  KnowledgeBaseEntry,
  AssessmentSource,
  AssessmentConfidence,
} from '../store/useStore';
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

export type ToolKind = 'read' | 'auto-write' | 'consent-write';

export interface ToolDef {
  name: string;
  description: string;
  /** Short JSON schema-ish hint shown in the prompt. */
  paramsHint: string;
  /** true = safe read (no side effects). false = has side effects. */
  readOnly: boolean;
  /**
   * Optional explicit category. If absent, derived from `readOnly` (true→'read',
   * false→'consent-write'). Use 'auto-write' for KB / assessment writes that
   * don't need consent — they're transparent (user sees in About Me).
   */
  kind?: ToolKind;
  execute: (args: Record<string, unknown>) => Promise<string> | string;
}

export function toolKind(t: ToolDef): ToolKind {
  if (t.kind) return t.kind;
  return t.readOnly ? 'read' : 'consent-write';
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

    // -----------------------------------------------------------------------
    // Knowledge base + clinical assessment tools — these are how the coach
    // becomes a real therapist. Read freely; auto-write tools update the
    // therapist's chart silently (when inferenceMode is 'auto') and
    // transparently (user sees + edits everything in About Me).
    // -----------------------------------------------------------------------
    {
      name: 'kb_get_summary',
      description:
        'Quick summary of the therapist chart: currentAvodah, lastSessionFocus, openLoops, redFlags, and top non-archived entries by importance. Call at the start of every session.',
      paramsHint: '{}',
      readOnly: true,
      execute: () => {
        const s = getState();
        const kb = s.coachKnowledgeBase;
        const ranked = [...kb.entries]
          .filter((e) => !e.archived)
          .sort(rankByImportance)
          .slice(0, 12)
          .map((e) => ({
            id: e.id,
            category: e.category,
            title: e.title,
            content: e.content,
            importance: e.importance,
            source: e.source,
            updatedAt: e.updatedAt,
          }));
        return JSON.stringify(
          {
            currentAvodah: kb.currentAvodah,
            lastSessionFocus: kb.lastSessionFocus,
            openLoops: kb.openLoops,
            redFlags: kb.redFlags,
            topEntries: ranked,
            totalEntries: kb.entries.filter((e) => !e.archived).length,
            inferenceMode: s.inferenceMode,
          },
          null,
          2,
        );
      },
    },
    {
      name: 'kb_get_notes',
      description:
        'Search/filter knowledge-base entries. Args: {category?: string, importance?: "low"|"medium"|"high"|"critical", includeArchived?: boolean, query?: string (substring match on title/content), limit?: number (default 20)}.',
      paramsHint: '{"category":"event","limit":10}',
      readOnly: true,
      execute: (args) => {
        const s = getState();
        const cat = args.category ? String(args.category) : undefined;
        const imp = args.importance ? String(args.importance) : undefined;
        const includeArchived = Boolean(args.includeArchived);
        const query = args.query ? String(args.query).toLowerCase() : '';
        const limit = clampInt(args.limit, 1, 100, 20);
        const filtered = s.coachKnowledgeBase.entries.filter((e) => {
          if (!includeArchived && e.archived) return false;
          if (cat && e.category !== cat) return false;
          if (imp && e.importance !== imp) return false;
          if (query && !(`${e.title}\n${e.content}`.toLowerCase().includes(query))) return false;
          return true;
        });
        return JSON.stringify(
          {
            count: filtered.length,
            entries: filtered.slice(0, limit).map((e) => ({
              id: e.id,
              category: e.category,
              title: e.title,
              content: e.content,
              importance: e.importance,
              source: e.source,
              evidence: e.evidence,
              archived: e.archived ?? false,
              updatedAt: e.updatedAt,
            })),
          },
          null,
          2,
        );
      },
    },
    {
      name: 'clinical_get_assessment',
      description:
        'Full clinical assessment of the user (Ramchal stage, dominant yesod, identity frame, distortions, bitachon baseline, HALT, primary reward, post-fall pattern, marriage/community status, primary framework, working hypothesis). Empty values mean "not yet observed."',
      paramsHint: '{}',
      readOnly: true,
      execute: () => {
        const s = getState();
        // Strip empty fields to keep token count down — coach only sees what's set.
        const ca = s.clinicalAssessment;
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(ca) as (keyof ClinicalAssessment)[]) {
          const f = ca[key];
          if (f.value !== null && f.value !== undefined) {
            out[key] = {
              value: f.value,
              source: f.source,
              confidence: f.confidence,
              evidence: f.evidence,
            };
          }
        }
        return JSON.stringify(out, null, 2);
      },
    },
    {
      name: 'kb_add_note',
      description:
        '[AUTO-WRITE] Save a note to the therapist chart. Categories: theme | event | pattern | commitment | identity-statement | relationship | breakthrough | concern | preference. Importance: low | medium | high | critical. Always include short evidence (a quote or signal). User sees and can edit/delete in About Me. No consent required when inferenceMode=auto; in confirm mode, ASK first.',
      paramsHint:
        '{"category":"identity-statement","title":"future-husband identity","content":"User said they want to become the husband their future wife deserves.","importance":"high","evidence":"\\"my future wife\\" — first message of session 4"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        const category = sanitizeKbCategory(args.category);
        const importance = sanitizeKbImportance(args.importance);
        const title = String(args.title ?? '').trim().slice(0, 120);
        const content = String(args.content ?? '').trim().slice(0, 1500);
        const evidence = args.evidence ? String(args.evidence).trim().slice(0, 500) : undefined;
        if (!title || !content) {
          return JSON.stringify({ ok: false, error: 'title and content required' });
        }
        // Soft-dedupe — if an existing non-archived entry has the same title in
        // the same category, prefer to update it rather than spawn a duplicate.
        const existing = s.coachKnowledgeBase.entries.find(
          (e) => !e.archived && e.category === category && e.title === title,
        );
        if (existing) {
          s.kbUpdateEntry(existing.id, { content, importance, evidence });
          return JSON.stringify({ ok: true, id: existing.id, updated: true });
        }
        const id = s.kbAddEntry({
          category,
          title,
          content,
          importance,
          source: 'coach-inferred',
          evidence,
        });
        return JSON.stringify({ ok: true, id, created: true });
      },
    },
    {
      name: 'kb_update_note',
      description:
        '[AUTO-WRITE] Update an existing knowledge-base entry. Args: {id: string, title?, content?, importance?}.',
      paramsHint: '{"id":"<entry-id>","content":"refined version","importance":"high"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        const id = String(args.id ?? '');
        if (!id) return JSON.stringify({ ok: false, error: 'id required' });
        if (!s.coachKnowledgeBase.entries.find((e) => e.id === id)) {
          return JSON.stringify({ ok: false, error: 'entry not found' });
        }
        const patch: Partial<KnowledgeBaseEntry> = {};
        if (typeof args.title === 'string') patch.title = args.title.trim().slice(0, 120);
        if (typeof args.content === 'string') patch.content = args.content.trim().slice(0, 1500);
        if (typeof args.importance === 'string') patch.importance = sanitizeKbImportance(args.importance);
        s.kbUpdateEntry(id, patch);
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'kb_archive_note',
      description:
        '[AUTO-WRITE] Archive an entry that is no longer relevant (soft delete — user can still see it in About Me). Args: {id: string}.',
      paramsHint: '{"id":"<entry-id>"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        const id = String(args.id ?? '');
        if (!id) return JSON.stringify({ ok: false, error: 'id required' });
        s.kbArchiveEntry(id);
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'kb_set_current_avodah',
      description:
        '[AUTO-WRITE] Set "what the user is working on right now" — one short line. Reset/replace this any time the focus shifts.',
      paramsHint: '{"text":"Building bedtime ritual: phone in kitchen by 22:30"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        s.kbSetCurrentAvodah(String(args.text ?? '').slice(0, 200));
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'kb_set_session_focus',
      description:
        '[AUTO-WRITE] At the END of a coach session, save a one-line theme of what was discussed so the next session can open with continuity.',
      paramsHint: '{"text":"Worked through Beinoni reframe — user resisted then opened up"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        s.kbSetSessionFocus(String(args.text ?? '').slice(0, 240));
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'kb_add_open_loop',
      description:
        '[AUTO-WRITE] Note something to follow up on next session. Short — one sentence each. Auto-deduped against existing loops.',
      paramsHint: '{"text":"Ask how the conversation with mashpia went"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        s.kbAddOpenLoop(String(args.text ?? ''));
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'kb_resolve_open_loop',
      description:
        '[AUTO-WRITE] Mark an open loop resolved — pass the EXACT text of the loop to remove.',
      paramsHint: '{"text":"Ask how the conversation with mashpia went"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        s.kbResolveOpenLoop(String(args.text ?? ''));
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'kb_add_red_flag',
      description:
        '[AUTO-WRITE] Note a pattern to watch for (chaser-effect risk, mood crash signal, isolation drift, etc.). Surfaces in your prompt every session until cleared.',
      paramsHint: '{"text":"Days 2-5 after fall — user historically minimizes and chases"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        s.kbAddRedFlag(String(args.text ?? ''));
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'kb_clear_red_flag',
      description: '[AUTO-WRITE] Mark a red flag resolved. Pass the EXACT text.',
      paramsHint: '{"text":"Days 2-5 after fall — user historically minimizes and chases"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        s.kbClearRedFlag(String(args.text ?? ''));
        return JSON.stringify({ ok: true });
      },
    },
    {
      name: 'clinical_update_assessment',
      description:
        '[AUTO-WRITE] Update one field of the clinical assessment based on what you observed. Fields: ramchalStage | dominantYesod | yesodPattern | identityFrame | activeDistortions | bitachonBaseline | haltSensitivity | primaryReward | postFallPattern | postFallChaserRisk | yearsStruggling | longestCleanStretch | previousAttempts | isMarried | spousalAwareness | hasFrumCommunity | hasMashpiaOrRav | isolationLevel | primaryGoal | motivationDeepReason | workingHypothesis | primaryFramework. confidence: low | medium | high. Always include evidence (1 short sentence). For high-stakes fields (isMarried, hasMashpiaOrRav, primaryFramework) start with confidence "medium" and let it climb as evidence accumulates.',
      paramsHint:
        '{"field":"identityFrame","value":"rasha-despair","confidence":"medium","evidence":"User said \\"I am a bad person\\" three times in this session"}',
      readOnly: false,
      kind: 'auto-write',
      execute: (args) => {
        const s = getState();
        const field = String(args.field ?? '') as keyof ClinicalAssessment;
        if (!isAssessmentField(field, s.clinicalAssessment)) {
          return JSON.stringify({ ok: false, error: `unknown field: ${field}` });
        }
        const value = args.value as ClinicalAssessment[typeof field]['value'];
        const confidence: AssessmentConfidence =
          args.confidence === 'high' || args.confidence === 'low' ? args.confidence : 'medium';
        const evidence = args.evidence ? String(args.evidence).slice(0, 500) : undefined;
        const source: AssessmentSource =
          args.source === 'user-stated' || args.source === 'pattern-detected' || args.source === 'event-derived'
            ? args.source
            : 'coach-inferred';
        // The store action narrows the per-field type; the runtime shape matches.
        s.updateAssessmentField(field, {
          value,
          confidence,
          source,
          evidence,
        } as Partial<ClinicalAssessment[typeof field]> & { value: ClinicalAssessment[typeof field]['value'] });
        return JSON.stringify({ ok: true, field });
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

const KB_CATEGORIES = new Set<KbCategory>([
  'theme',
  'event',
  'pattern',
  'commitment',
  'identity-statement',
  'relationship',
  'breakthrough',
  'concern',
  'preference',
]);

const KB_IMPORTANCE_RANK: Record<KbImportance, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function sanitizeKbCategory(v: unknown): KbCategory {
  const s = String(v ?? '').trim() as KbCategory;
  return KB_CATEGORIES.has(s) ? s : 'theme';
}

function sanitizeKbImportance(v: unknown): KbImportance {
  const s = String(v ?? '').trim();
  if (s === 'critical' || s === 'high' || s === 'medium' || s === 'low') return s;
  return 'medium';
}

function rankByImportance(a: KnowledgeBaseEntry, b: KnowledgeBaseEntry): number {
  const diff = KB_IMPORTANCE_RANK[b.importance] - KB_IMPORTANCE_RANK[a.importance];
  if (diff !== 0) return diff;
  // tie-break: most recently updated first
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function isAssessmentField(
  field: string,
  assessment: ClinicalAssessment,
): field is keyof ClinicalAssessment {
  return field in assessment;
}

// ---------------------------------------------------------------------------
// Tool manifest — rendered into the system prompt so the model knows what's
// available and how to call them.
// ---------------------------------------------------------------------------

export function renderToolManifest(registry: Record<string, ToolDef>): string {
  const inferenceMode = useStore.getState().inferenceMode;
  const lines: string[] = [
    'TOOLS AVAILABLE',
    '',
    'You have access to the user\'s full local database, the therapist chart, and',
    'the user\'s accountability partner (if paired). To call a tool, emit EXACTLY',
    'this on its own line:',
    '',
    `${TOOL_OPEN}{"name":"<tool_name>","args":{...}}${TOOL_CLOSE}`,
    '',
    'Three categories of tools:',
    '',
    '1. READ tools (get_*, kb_get_*, clinical_get_*, pick_mantra_for_now) —',
    '   call freely as needed. They have no side effects.',
    '',
    `2. AUTO-WRITE tools (kb_*, clinical_update_assessment) — these update your`,
    `   therapist chart. Inference mode is currently: ${inferenceMode.toUpperCase()}.`,
    inferenceMode === 'auto'
      ? '   In AUTO mode, call these freely whenever you observe something worth noting.\n   The user sees every entry in About Me with a "coach picked up on this" tag\n   and can edit or delete anything. Be honest, be specific, cite evidence.'
      : '   In CONFIRM mode, ASK the user before calling — e.g., "I noticed X — want me\n   to remember that?" — and only emit the call after they agree.',
    '',
    '3. CONSENT-WRITE tools (log_close_call, add_watchlist_time, ping_partner) —',
    '   ALWAYS ask the user first ("Want me to ping your partner?") and only emit',
    '   the call on a turn after explicit consent. These have real-world side',
    '   effects (database events, partner alerts).',
    '',
    'General rules:',
    '- Multiple read tools per turn is fine.',
    '- After any tool block, you MAY continue talking to the user on the same turn.',
    '- Never fabricate user data — always call a tool to check.',
    '- For KB writes, write what you OBSERVED, not what you assumed. Distinguish',
    '  what the user explicitly said (source: user-stated) from what you inferred',
    '  (source: coach-inferred).',
    '',
    'TOOLS:',
  ];
  // Group tools by kind for readability in the manifest.
  const grouped: Record<ToolKind, ToolDef[]> = { read: [], 'auto-write': [], 'consent-write': [] };
  for (const t of Object.values(registry)) grouped[toolKind(t)].push(t);
  const labels: Record<ToolKind, string> = {
    read: '— READ —',
    'auto-write': '— AUTO-WRITE (silent in auto mode) —',
    'consent-write': '— CONSENT-WRITE (ask first, ALWAYS) —',
  };
  for (const kind of ['read', 'auto-write', 'consent-write'] as ToolKind[]) {
    if (!grouped[kind].length) continue;
    lines.push('', labels[kind]);
    for (const t of grouped[kind]) {
      lines.push(`- ${t.name} — ${t.description}`);
      lines.push(`  params: ${t.paramsHint}`);
    }
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
