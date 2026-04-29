import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, format } from 'date-fns';

// =============================================================================
// TYPES — the 12 personalization axes
// =============================================================================

export type Tone = 'gentle' | 'harsh' | 'spiritual' | 'clinical' | 'custom' | null;

// This app is for Jews — secular through chareidi. Non-Jewish frames are intentionally omitted.
export type ReligiousLevel =
  | 'secular'
  | 'traditional'
  | 'modern-orthodox'
  | 'chareidi'
  | 'chassidish'
  | 'baal-teshuva'
  | 'other'
  | 'custom'
  | null;

export type MotivationStyle =
  | 'incentive'
  | 'punishment'
  | 'mixed'
  | 'pure-discipline'
  | 'custom'
  | null;

export type AccountabilityMode =
  | 'solo'
  | 'partner'
  | 'group'
  | 'anonymous-community'
  | 'sponsor'
  | 'custom'
  | null;

export type LifeStage =
  | 'single'
  | 'dating'
  | 'engaged'
  | 'married'
  | 'married-kids'
  | 'divorced'
  | 'widowed'
  | 'custom'
  | null;

export type TriggerTag =
  | 'stress'
  | 'loneliness'
  | 'boredom'
  | 'fatigue'
  | 'visual'
  | 'late-night'
  | 'rejection'
  | 'success'
  | 'travel'
  | 'conflict';

export type RiskTime = 'morning' | 'midday' | 'evening' | 'late-night' | 'custom' | null;

export type RecoveryStage =
  | 'day-one'
  | 'restarting'
  | 'maintenance'
  | 'helping-friend'
  | 'severe-relapse-rebuild'
  | 'custom'
  | null;

export type Intensity = 'gentle' | 'standard' | 'hardcore' | 'monk-mode' | 'custom' | null;

export type LearningStyle = 'read' | 'listen' | 'watch' | 'do' | 'talk' | 'custom' | null;

export type PrivacyLevel =
  | 'fully-private'
  | 'partner-aggregate'
  | 'partner-detailed'
  | 'anonymous-group'
  | 'opt-in-leaderboard'
  | 'custom'
  | null;

export type Language = 'en' | 'he' | 'yi' | 'es' | 'fr' | 'custom' | null;

// =============================================================================
// TYPES — coach style learning (how the AI should talk to THIS specific user)
// =============================================================================

export type MantraStyle =
  | 'warrior'        // bold, masculine, fighter mentality
  | 'torah'          // Torah/Hebrew sources, Jewish depth
  | 'clinical'       // neuroscience facts, no fluff
  | 'compassionate'  // warm, gentle, non-shaming
  | 'short-punch'    // 5 words or fewer, punchy
  | 'reflective';    // slower, contemplative, meaningful

export type TacticPreference =
  | 'physical'       // cold shower, pushups, walk
  | 'cognitive'      // reframe, journal, rational self-talk
  | 'social'         // call someone, text partner
  | 'spiritual'      // daven, Torah, Shema, Tehillim
  | 'environmental'  // leave the room, phone in drawer
  | 'breathwork';    // breathing, body scan, urge surfing

export type CoachingApproach =
  | 'drill-sergeant'  // harsh, demanding, "get up now"
  | 'warm-mentor'     // compassionate, believing in you
  | 'accountability'  // focused on your commitments and vow
  | 'clinical'        // CBT/ACT lens, analytical
  | 'spiritual'       // Torah wisdom, avodah, elevation
  | 'socratic';       // asks questions, draws out answers

export type TacticDuration = 'instant' | '2min' | '5min' | '10min+';

export interface CoachStylePrefs {
  coachingApproach: CoachingApproach | null;
  mantraStyles: MantraStyle[];
  tacticPreferences: TacticPreference[];
  preferredDuration: TacticDuration | null;
  goHard: boolean;
  firstMoveWhenUrgeHits: TacticPreference | null;
  likedMantraTexts: string[];
  dislikedMantraTexts: string[];
  likedTacticIds: string[];
  dislikedTacticIds: string[];
}

export interface TacticEffectivenessEntry {
  timesUsed: number;
  timesWorked: number;
  contexts: string[];
}

export interface PersonalityProfile {
  // 1. Tone
  tone: Tone;
  customTone?: string;
  // 2. Religious frame
  religiousLevel: ReligiousLevel;
  customReligious?: string;
  // 3. Motivation style
  motivationStyle: MotivationStyle;
  customMotivation?: string;
  // 4. Accountability
  accountabilityMode: AccountabilityMode;
  customAccountability?: string;
  // 5. Life stage
  lifeStage: LifeStage;
  customLifeStage?: string;
  // 6. Primary trigger profile
  primaryTriggers: TriggerTag[];
  customTriggers: string[];
  // 7. Risk time of day
  riskTimeOfDay: RiskTime;
  customRiskTime?: { start: string; end: string };
  // 8. Recovery stage
  recoveryStage: RecoveryStage;
  customRecoveryStage?: string;
  // 9. Intensity
  intensity: Intensity;
  customIntensity?: string;
  // 10. Learning style
  learningStyle: LearningStyle;
  customLearningStyle?: string;
  // 11. Privacy sharing level
  privacyLevel: PrivacyLevel;
  customPrivacy?: string;
  // 12. Language
  language: Language;
  customLanguage?: string;
}

// =============================================================================
// TYPES — event log & detailed tracking
// =============================================================================

export type LogEntry = 'win' | 'fall' | 'medium' | 'close-call';

export type EmotionalTrigger =
  | 'stressed'
  | 'lonely'
  | 'bored'
  | 'rejected'
  | 'tired'
  | 'numb'
  | 'angry'
  | 'excited'
  | 'ashamed'
  | 'anxious';

export type SituationalTrigger =
  | 'in-bed'
  | 'in-bathroom'
  | 'traveling'
  | 'alone-at-home'
  | 'at-work'
  | 'at-party'
  | 'in-public';

export type TemporalTrigger = 'weekday' | 'weekend' | 'late-night' | 'morning' | 'after-work';

export type PrecursorFlag =
  | 'ritual-skipped'
  | 'check-in-missed'
  | 'poor-sleep'
  | 'no-exercise'
  | 'halt-hungry'
  | 'halt-angry'
  | 'halt-lonely'
  | 'halt-tired';

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string; // ISO
}

export interface FallEvent {
  id: string;
  date: string; // ISO
  dayKey: string; // yyyy-MM-dd
  emotionalTriggers: EmotionalTrigger[];
  situationalTriggers: SituationalTrigger[];
  digitalTriggers: string[]; // ids or custom strings (instagram, tiktok, or user text)
  temporalTriggers: TemporalTrigger[];
  customTriggerNotes: string;
  precursors: PrecursorFlag[];
  shameLevel: number; // 0-10
  angerLevel: number; // 0-10
  numbnessLevel: number; // 0-10
  recoveryVow?: string;
  partnerPinged?: boolean;
  planCreated?: boolean;
  notes: string;
}

export interface CloseCallEvent {
  id: string;
  date: string; // ISO
  dayKey: string;
  trigger: string; // what they tapped (alone/tired/bored/visual/custom)
  tacticUsed?: string; // id/label of tactic
  workedRating: number; // 1-5
  notes?: string;
}

export interface CheckInEvent {
  id: string;
  dayKey: string; // yyyy-MM-dd
  status: 'clean' | 'struggled' | 'fall';
  halt: { hungry: boolean; angry: boolean; lonely: boolean; tired: boolean };
  mood: number; // 1-10
  sleepHours?: number;
  exercised?: boolean;
  gratitude?: string;
  reflection?: string;
}

// =============================================================================
// TYPES — danger watchlist (§7)
// =============================================================================

export type WatchType =
  | 'app'
  | 'website'
  | 'time'
  | 'location'
  | 'person'
  | 'emotion'
  | 'event'
  | 'custom';

export type WatchLevel =
  | 'notice'
  | 'warn'
  | 'delay'
  | 'mantra-gate'
  | 'partner-alert'
  | 'hard-block';

export interface DangerWatchItem {
  id: string;
  type: WatchType;
  label: string;
  detector: { kind: string; value: string };
  level: WatchLevel;
  schedule?: { start: string; end: string; days: number[] }; // HH:mm, 0=Sun
  stats: {
    timesTriggered: number;
    timesFollowedByFall: number;
    timesFollowedByCloseCall: number;
    timesSurvivedClean: number;
  };
  suggestedBy: 'user' | 'post-fall-protocol' | 'pattern-engine';
  createdAt: string;
}

// =============================================================================
// TYPES — milestones, badges, cost/benefit, identity, vows
// =============================================================================

export interface MilestoneRung {
  day: number;
  label: string;
  meaning: string;
  reward?: string;
  unlocked: boolean;
  celebratedAt?: string;
}

export interface CostBenefit {
  costs: string[];
  benefits: string[];
  updatedAt: string;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  earnedAt: string;
  category: 'streak' | 'ritual' | 'check-in' | 'close-call' | 'journal' | 'learning';
}

export interface RecoveryVow {
  text: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO (24h from create)
}

// =============================================================================
// TYPES — custom tactics, learn recommendations, AI insights (Phase F)
// =============================================================================

export type TacticCategory = 'body' | 'mind' | 'social' | 'spirit';

export interface CustomTactic {
  id: string;
  title: string;
  desc: string;
  category: TacticCategory;
  timeNeeded?: string;
  source: 'user' | 'ai';
  createdAt: string;
}

export type LearnRecKind = 'youtube' | 'torah-shiur' | 'podcast' | 'article' | 'book';

export interface LearnRecommendation {
  id: string;
  title: string;
  kind: LearnRecKind;
  searchQuery: string;
  why: string;
  url: string;
  createdAt: string;
}

export interface AiRiskWindow {
  start: string; // HH:mm
  end: string; // HH:mm
  weekdays: number[];
  riskLevel: 'high' | 'medium';
  reason: string;
}

export interface AiDangerAnalysis {
  riskWindows: AiRiskWindow[];
  summary: string;
  suggestions: string[];
  updatedAt: string;
}

// =============================================================================
// DEFAULTS
// =============================================================================

const DEFAULT_COACH_STYLE: CoachStylePrefs = {
  coachingApproach: null,
  mantraStyles: [],
  tacticPreferences: [],
  preferredDuration: null,
  goHard: false,
  firstMoveWhenUrgeHits: null,
  likedMantraTexts: [],
  dislikedMantraTexts: [],
  likedTacticIds: [],
  dislikedTacticIds: [],
};

const DEFAULT_PROFILE: PersonalityProfile = {
  tone: null,
  religiousLevel: null,
  motivationStyle: null,
  accountabilityMode: null,
  lifeStage: null,
  primaryTriggers: [],
  customTriggers: [],
  riskTimeOfDay: null,
  recoveryStage: null,
  intensity: null,
  learningStyle: null,
  privacyLevel: 'fully-private',
  language: 'en',
};

const DEFAULT_MANTRAS = [
  "Gibor ka'ari — I stand strong as a lion.",
  "I am not my urges. I am who I choose to be.",
  "Every day I say no, I become someone who says no.",
  "Eizehu gibor? Hakovesh et yitzro. I am that one.",
];

const DEFAULT_RITUALS = [
  { id: 'r1', text: 'Say Modeh Ani', enabled: true },
  { id: 'r2', text: 'Daven Shacharit', enabled: true },
  { id: 'r3', text: 'Cold shower', enabled: false },
  { id: 'r4', text: '10 min learning', enabled: true },
  { id: 'r5', text: 'Read mantra', enabled: true },
];

const DEFAULT_MILESTONES: MilestoneRung[] = [
  { day: 1, label: 'Day One', meaning: 'The cub opens its eyes', unlocked: false },
  { day: 7, label: 'Week One', meaning: 'The cub finds its feet', unlocked: false },
  { day: 14, label: 'Two Weeks', meaning: 'Claws begin to sharpen', unlocked: false },
  { day: 30, label: 'One Month', meaning: 'The young lion roars', unlocked: false },
  { day: 60, label: 'Two Months', meaning: 'The lion finds its pride', unlocked: false },
  { day: 90, label: 'Three Months', meaning: 'The lion stands alone', unlocked: false },
  { day: 180, label: 'Six Months', meaning: 'The mane fills in', unlocked: false },
  { day: 365, label: 'One Year', meaning: "Gibor ka'ari — a lion in full", unlocked: false },
];

// =============================================================================
// STATE
// =============================================================================

interface GuardState {
  // Identity
  userId: string;
  displayName: string;
  memberSince: string;

  // Progress
  streakStart: string | null;
  currentStreak: number;
  longestStreak: number;
  totalFallCount: number;
  lastCheckIn: string | null;

  // Preferences & Content
  personalityProfile: PersonalityProfile;
  calendarLog: Record<string, LogEntry>; // quick day-level summary
  calendarNotes: Record<string, string>; // per-day free-text (§2.5)
  mantras: string[];
  dailyMantraIndex: number | null;
  rituals: { id: string; text: string; enabled: boolean }[];
  ritualStreak: number;
  lastRitualDate: string | null;
  segulotEnabled: boolean;
  hasCompletedOnboarding: boolean;
  toolkit: string[];
  vows: Record<number, string>; // legacy milestone->reward
  lastCelebratedMilestone: number | null;
  hasNewCoachMessage: boolean;

  // Deep tracking (new)
  fallEvents: FallEvent[];
  closeCallEvents: CloseCallEvent[];
  checkInEvents: CheckInEvent[];

  // Watchlist (new — absorbs riskyApps)
  riskyApps: { id: string; name: string; quietStart: string; quietEnd: string }[]; // kept for back-compat
  dangerWatchlist: DangerWatchItem[];

  // Milestones, badges, cost/benefit, identity (new)
  milestoneLadder: MilestoneRung[];
  badges: Badge[];
  costBenefit: CostBenefit | null;
  identityStatement: string | null;
  activeRecoveryVow: RecoveryVow | null;

  // Safety Features
  lightsOutTime: string | null;

  // Notification Settings
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  dangerHour: number;

  // Accountability & Punishment
  checkInStreak: number;
  lastCheckInDate: string | null;
  punishmentModeActive: boolean;
  punishmentModeUntil: string | null;

  // AI (wiring in Phase F — key stored locally, never sent anywhere but the user's chosen provider)
  aiProvider: 'none' | 'anthropic' | 'openai' | 'groq' | 'gemini' | 'local-ollama' | 'custom';
  aiApiKey: string | null;
  aiModel: string | null;
  aiCustomEndpoint: string | null;

  // AI-produced content (Phase F)
  customTactics: CustomTactic[];
  learnRecommendations: LearnRecommendation[];
  aiDangerAnalysis: AiDangerAnalysis | null;

  // Privacy acknowledgements
  privacyPromiseAcknowledged: boolean;

  // Appearance
  themePreference: 'light' | 'dark' | 'system';

  // Coach memory (persistent across sessions)
  coachMessages: CoachMessage[];
  coachSummary: string | null; // rolling AI-generated summary of older turns

  // Coach style learning — how the AI should talk to THIS specific user
  coachStylePrefs: CoachStylePrefs;
  tacticEffectiveness: Record<string, TacticEffectivenessEntry>;

  // =========================================================================
  // ACTIONS
  // =========================================================================

  startStreak: () => void;
  logWin: () => void;
  logFall: () => void;
  logMedium: () => void;
  logCloseCall: (event: Omit<CloseCallEvent, 'id' | 'date' | 'dayKey'>) => void;
  logFallDetailed: (event: Omit<FallEvent, 'id' | 'date' | 'dayKey'>) => void;
  submitCheckIn: (status: 'clean' | 'struggled' | 'fall') => void;
  submitCheckInDetailed: (event: Omit<CheckInEvent, 'id' | 'dayKey'>) => void;
  activatePunishmentMode: (durationHours: number | 'tomorrow') => void;
  deactivatePunishmentMode: () => void;
  updateProfile: (
    profile: Partial<PersonalityProfile> | Partial<{ displayName: string }>
  ) => void;
  updateNotificationSettings: (
    settings: Partial<{
      notificationsEnabled: boolean;
      dailyReminderTime: string;
      dangerHour: number;
    }>
  ) => void;
  addMantra: (mantra: string) => void;
  deleteMantra: (index: number) => void;
  setDailyMantra: (index: number) => void;
  addRitual: (ritual: string) => void;
  toggleRitual: (id: string) => void;
  reorderRituals: (newRituals: { id: string; text: string; enabled: boolean }[]) => void;
  completeRitual: () => void;
  setVow: (day: number, reward: string) => void;
  setLastCelebratedMilestone: (day: number) => void;
  setHasNewCoachMessage: (has: boolean) => void;
  setLightsOutTime: (time: string | null) => void;
  addRiskyApp: (app: { name: string; quietStart: string; quietEnd: string }) => void;
  removeRiskyApp: (id: string) => void;
  toggleTacticToToolkit: (tacticId: string) => void;
  syncStreak: () => void;
  completeOnboarding: () => void;

  // Coach memory
  appendCoachMessage: (msg: Omit<CoachMessage, 'id' | 'timestamp'>) => void;
  clearCoachMessages: () => void;
  setCoachSummary: (summary: string | null) => void;
  setCoachStylePrefs: (patch: Partial<CoachStylePrefs>) => void;
  rateTactic: (id: string, worked: boolean, context?: string) => void;
  likeMantra: (text: string) => void;
  dislikeMantra: (text: string) => void;
  regenerateIdentity: () => void;
  resetData: () => void;

  // Calendar editing (§2.5)
  setCalendarEntry: (dayKey: string, entry: LogEntry | null) => void;
  setCalendarNote: (dayKey: string, note: string) => void;

  // Watchlist (§7)
  addWatchItem: (item: Omit<DangerWatchItem, 'id' | 'createdAt' | 'stats'>) => void;
  updateWatchItem: (id: string, patch: Partial<DangerWatchItem>) => void;
  removeWatchItem: (id: string) => void;
  recordWatchTrigger: (
    id: string,
    outcome: 'triggered' | 'fall' | 'close-call' | 'clean'
  ) => void;

  // Milestones, badges, cost/benefit, identity
  setMilestoneLadder: (rungs: MilestoneRung[]) => void;
  updateMilestone: (day: number, patch: Partial<MilestoneRung>) => void;
  earnBadge: (badge: Omit<Badge, 'earnedAt'>) => void;
  setCostBenefit: (cb: { costs: string[]; benefits: string[] }) => void;
  setIdentityStatement: (text: string) => void;
  setRecoveryVow: (text: string) => void;
  clearExpiredVow: () => void;

  // AI
  setAiConfig: (
    cfg: Partial<{
      aiProvider: GuardState['aiProvider'];
      aiApiKey: string | null;
      aiModel: string | null;
      aiCustomEndpoint: string | null;
    }>
  ) => void;

  // AI-produced content (Phase F)
  addCustomTactic: (tactic: Omit<CustomTactic, 'id' | 'createdAt'>) => void;
  removeCustomTactic: (id: string) => void;
  setLearnRecommendations: (recs: Omit<LearnRecommendation, 'id' | 'createdAt'>[]) => void;
  clearLearnRecommendations: () => void;
  setAiDangerAnalysis: (a: Omit<AiDangerAnalysis, 'updatedAt'> | null) => void;

  // Privacy
  acknowledgePrivacyPromise: () => void;
  exportAllData: () => string; // returns JSON string (caller handles share/save)
  deleteAllData: () => void;

  // Appearance
  setThemePreference: (pref: 'light' | 'dark' | 'system') => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useStore = create<GuardState>()(
  persist(
    (set, get) => ({
      userId: uuidv4(),
      displayName: `Ari_${Math.floor(1000 + Math.random() * 8999)}`,
      memberSince: new Date().toISOString(),

      streakStart: null,
      currentStreak: 0,
      longestStreak: 0,
      totalFallCount: 0,
      lastCheckIn: null,

      personalityProfile: { ...DEFAULT_PROFILE },

      calendarLog: {},
      calendarNotes: {},
      mantras: [...DEFAULT_MANTRAS],
      dailyMantraIndex: 0,
      rituals: [...DEFAULT_RITUALS],
      ritualStreak: 0,
      lastRitualDate: null,
      segulotEnabled: false,
      hasCompletedOnboarding: false,
      toolkit: [],
      vows: {},
      lastCelebratedMilestone: null,
      hasNewCoachMessage: false,

      fallEvents: [],
      closeCallEvents: [],
      checkInEvents: [],

      riskyApps: [],
      dangerWatchlist: [],

      milestoneLadder: [...DEFAULT_MILESTONES],
      badges: [],
      costBenefit: null,
      identityStatement: null,
      activeRecoveryVow: null,

      lightsOutTime: '22:30',

      notificationsEnabled: false,
      dailyReminderTime: '08:00',
      dangerHour: 22,

      checkInStreak: 0,
      lastCheckInDate: null,
      punishmentModeActive: false,
      punishmentModeUntil: null,

      aiProvider: 'gemini',
      aiApiKey: null,
      aiModel: 'gemma-3-27b-it',
      aiCustomEndpoint: null,

      customTactics: [],
      learnRecommendations: [],
      aiDangerAnalysis: null,

      privacyPromiseAcknowledged: false,

      themePreference: 'dark',

      coachMessages: [],
      coachSummary: null,

      coachStylePrefs: { ...DEFAULT_COACH_STYLE },
      tacticEffectiveness: {},

      // ---------------------- Actions ----------------------

      startStreak: () => {
        const now = new Date().toISOString();
        set({ streakStart: now, currentStreak: 0, lastCheckIn: now });
      },

      logWin: () => {
        const { currentStreak, longestStreak, calendarLog } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        const newStreak = currentStreak + 1;
        set({
          currentStreak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          lastCheckIn: new Date().toISOString(),
          calendarLog: { ...calendarLog, [today]: 'win' },
        });
      },

      logMedium: () => {
        const { calendarLog } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        set({
          lastCheckIn: new Date().toISOString(),
          calendarLog: { ...calendarLog, [today]: 'medium' },
        });
      },

      logFall: () => {
        const { totalFallCount, calendarLog } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        set({
          streakStart: null,
          currentStreak: 0,
          totalFallCount: totalFallCount + 1,
          lastCheckIn: new Date().toISOString(),
          calendarLog: { ...calendarLog, [today]: 'fall' },
        });
      },

      logCloseCall: (event) => {
        const now = new Date();
        const dayKey = format(now, 'yyyy-MM-dd');
        const { closeCallEvents, calendarLog } = get();
        const full: CloseCallEvent = {
          ...event,
          id: uuidv4(),
          date: now.toISOString(),
          dayKey,
        };
        set({
          closeCallEvents: [full, ...closeCallEvents],
          // only mark calendar if the day isn't already a win/fall
          calendarLog: calendarLog[dayKey]
            ? calendarLog
            : { ...calendarLog, [dayKey]: 'close-call' },
        });
      },

      logFallDetailed: (event) => {
        const now = new Date();
        const dayKey = format(now, 'yyyy-MM-dd');
        const { fallEvents, totalFallCount, calendarLog } = get();
        const full: FallEvent = {
          ...event,
          id: uuidv4(),
          date: now.toISOString(),
          dayKey,
        };
        set({
          fallEvents: [full, ...fallEvents],
          streakStart: null,
          currentStreak: 0,
          totalFallCount: totalFallCount + 1,
          lastCheckIn: now.toISOString(),
          calendarLog: { ...calendarLog, [dayKey]: 'fall' },
        });
      },

      submitCheckIn: (status) => {
        const { checkInStreak, lastCheckInDate } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        if (lastCheckInDate === today) return;

        let newCheckInStreak = checkInStreak;
        if (status !== 'fall') newCheckInStreak++;
        else {
          newCheckInStreak = 0;
          get().logFall();
        }

        if (status === 'clean') get().logWin();
        else if (status === 'struggled') get().logMedium();

        set({ checkInStreak: newCheckInStreak, lastCheckInDate: today });
      },

      submitCheckInDetailed: (event) => {
        const dayKey = format(new Date(), 'yyyy-MM-dd');
        const { checkInEvents, lastCheckInDate, checkInStreak } = get();
        const existing = checkInEvents.find((e) => e.dayKey === dayKey);
        const full: CheckInEvent = { ...event, id: existing?.id ?? uuidv4(), dayKey };
        const nextEvents = existing
          ? checkInEvents.map((e) => (e.dayKey === dayKey ? full : e))
          : [full, ...checkInEvents];

        let nextStreak = checkInStreak;
        if (lastCheckInDate !== dayKey) {
          if (event.status !== 'fall') nextStreak = checkInStreak + 1;
          else nextStreak = 0;
        }

        if (lastCheckInDate !== dayKey) {
          if (event.status === 'clean') get().logWin();
          else if (event.status === 'struggled') get().logMedium();
          else if (event.status === 'fall') get().logFall();
        }

        set({
          checkInEvents: nextEvents,
          checkInStreak: nextStreak,
          lastCheckInDate: dayKey,
        });
      },

      activatePunishmentMode: (duration) => {
        let until: Date;
        if (duration === 'tomorrow') {
          until = new Date();
          until.setDate(until.getDate() + 1);
          until.setHours(9, 0, 0, 0);
        } else {
          until = new Date();
          until.setHours(until.getHours() + (duration as number));
        }
        set({ punishmentModeActive: true, punishmentModeUntil: until.toISOString() });
      },

      deactivatePunishmentMode: () => {
        set({ punishmentModeActive: false, punishmentModeUntil: null });
      },

      updateProfile: (update) => {
        const currentProfile = get().personalityProfile;
        if ('displayName' in update && update.displayName !== undefined) {
          set({ displayName: update.displayName });
        } else {
          set({
            personalityProfile: {
              ...currentProfile,
              ...(update as Partial<PersonalityProfile>),
            },
          });
        }
      },

      updateNotificationSettings: (settings) => {
        set((state) => ({ ...state, ...settings }));
      },

      addMantra: (mantra) => {
        set((state) => ({ mantras: [...state.mantras, mantra] }));
      },

      deleteMantra: (index) => {
        const { mantras, dailyMantraIndex } = get();
        const newMantras = mantras.filter((_, i) => i !== index);
        let newDailyMantraIndex = dailyMantraIndex;
        if (dailyMantraIndex === index) newDailyMantraIndex = 0;
        else if (
          dailyMantraIndex !== null &&
          dailyMantraIndex > index &&
          newDailyMantraIndex !== null
        ) {
          newDailyMantraIndex--;
        }
        set({
          mantras: newMantras,
          dailyMantraIndex: newMantras.length > 0 ? newDailyMantraIndex : null,
        });
      },

      setDailyMantra: (index) => set({ dailyMantraIndex: index }),

      addRitual: (text) => {
        const newRitual = { id: uuidv4(), text, enabled: true };
        set((state) => ({ rituals: [...state.rituals, newRitual] }));
      },

      toggleRitual: (id) => {
        set((state) => ({
          rituals: state.rituals.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      reorderRituals: (newRituals) => set({ rituals: newRituals }),

      completeRitual: () => {
        const { ritualStreak, lastRitualDate } = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        if (lastRitualDate === today) return;
        set({ ritualStreak: ritualStreak + 1, lastRitualDate: today });
      },

      setVow: (day, reward) => {
        set((state) => ({ vows: { ...state.vows, [day]: reward } }));
      },

      setLastCelebratedMilestone: (day) => set({ lastCelebratedMilestone: day }),
      setHasNewCoachMessage: (has) => set({ hasNewCoachMessage: has }),
      setLightsOutTime: (time) => set({ lightsOutTime: time }),

      addRiskyApp: (app) => {
        const newApp = { ...app, id: uuidv4() };
        set((state) => ({ riskyApps: [...state.riskyApps, newApp] }));
      },

      removeRiskyApp: (id) => {
        set((state) => ({ riskyApps: state.riskyApps.filter((a) => a.id !== id) }));
      },

      toggleTacticToToolkit: (tacticId) => {
        const { toolkit } = get();
        if (toolkit.includes(tacticId)) {
          set({ toolkit: toolkit.filter((id) => id !== tacticId) });
        } else {
          set({ toolkit: [...toolkit, tacticId] });
        }
      },

      syncStreak: () => {
        const { streakStart, calendarLog } = get();
        if (!streakStart) return;
        const start = new Date(streakStart);
        const now = new Date();
        const days = differenceInDays(now, start);
        // Auto-backfill: every day from streakStart up to (but not including)
        // today is marked 'win' unless the user already logged something for
        // that day (fall, close-call, medium, or manually edited).
        // Today stays untouched — user has the whole day to log a fall.
        const updatedLog: Record<string, LogEntry> = { ...calendarLog };
        for (let i = 0; i < days; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const key = format(d, 'yyyy-MM-dd');
          if (!updatedLog[key]) updatedLog[key] = 'win';
        }
        set({ currentStreak: Math.max(0, days), calendarLog: updatedLog });
      },

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      appendCoachMessage: (msg) => {
        const { coachMessages } = get();
        const full: CoachMessage = {
          ...msg,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
        };
        // Cap at last 200 messages to avoid unbounded growth.
        const next = [...coachMessages, full];
        const trimmed = next.length > 200 ? next.slice(next.length - 200) : next;
        set({ coachMessages: trimmed });
      },

      clearCoachMessages: () => set({ coachMessages: [], coachSummary: null }),

      setCoachSummary: (summary) => set({ coachSummary: summary }),

      setCoachStylePrefs: (patch) => {
        const { coachStylePrefs } = get();
        set({ coachStylePrefs: { ...coachStylePrefs, ...patch } });
      },

      rateTactic: (id, worked, context) => {
        const { tacticEffectiveness } = get();
        const existing = tacticEffectiveness[id] ?? { timesUsed: 0, timesWorked: 0, contexts: [] };
        set({
          tacticEffectiveness: {
            ...tacticEffectiveness,
            [id]: {
              timesUsed: existing.timesUsed + 1,
              timesWorked: existing.timesWorked + (worked ? 1 : 0),
              contexts: context ? [...existing.contexts.slice(-9), context] : existing.contexts,
            },
          },
        });
      },

      likeMantra: (text) => {
        const { coachStylePrefs } = get();
        if (coachStylePrefs.likedMantraTexts.includes(text)) return;
        set({
          coachStylePrefs: {
            ...coachStylePrefs,
            likedMantraTexts: [...coachStylePrefs.likedMantraTexts.slice(-19), text],
            dislikedMantraTexts: coachStylePrefs.dislikedMantraTexts.filter((t) => t !== text),
          },
        });
      },

      dislikeMantra: (text) => {
        const { coachStylePrefs } = get();
        if (coachStylePrefs.dislikedMantraTexts.includes(text)) return;
        set({
          coachStylePrefs: {
            ...coachStylePrefs,
            dislikedMantraTexts: [...coachStylePrefs.dislikedMantraTexts.slice(-19), text],
            likedMantraTexts: coachStylePrefs.likedMantraTexts.filter((t) => t !== text),
          },
        });
      },

      regenerateIdentity: () => {
        set({
          displayName: `Ari_${Math.floor(1000 + Math.random() * 8999)}`,
          userId: uuidv4(),
        });
      },

      setThemePreference: (pref) => set({ themePreference: pref }),

      resetData: () => {
        set({
          streakStart: null,
          currentStreak: 0,
          longestStreak: 0,
          totalFallCount: 0,
          lastCheckIn: null,
          calendarLog: {},
          calendarNotes: {},
          checkInStreak: 0,
          ritualStreak: 0,
          toolkit: [],
          mantras: [...DEFAULT_MANTRAS],
          rituals: [...DEFAULT_RITUALS],
          fallEvents: [],
          closeCallEvents: [],
          checkInEvents: [],
          dangerWatchlist: [],
          milestoneLadder: [...DEFAULT_MILESTONES],
          badges: [],
          costBenefit: null,
          identityStatement: null,
          activeRecoveryVow: null,
          customTactics: [],
          learnRecommendations: [],
          aiDangerAnalysis: null,
        });
      },

      // ---- Calendar editing ----
      setCalendarEntry: (dayKey, entry) => {
        const { calendarLog } = get();
        const next = { ...calendarLog };
        if (entry === null) delete next[dayKey];
        else next[dayKey] = entry;
        set({ calendarLog: next });
      },

      setCalendarNote: (dayKey, note) => {
        const { calendarNotes } = get();
        const next = { ...calendarNotes };
        if (!note.trim()) delete next[dayKey];
        else next[dayKey] = note;
        set({ calendarNotes: next });
      },

      // ---- Watchlist ----
      addWatchItem: (item) => {
        const full: DangerWatchItem = {
          ...item,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          stats: {
            timesTriggered: 0,
            timesFollowedByFall: 0,
            timesFollowedByCloseCall: 0,
            timesSurvivedClean: 0,
          },
        };
        set((s) => ({ dangerWatchlist: [...s.dangerWatchlist, full] }));
      },

      updateWatchItem: (id, patch) => {
        set((s) => ({
          dangerWatchlist: s.dangerWatchlist.map((w) =>
            w.id === id ? { ...w, ...patch } : w
          ),
        }));
      },

      removeWatchItem: (id) => {
        set((s) => ({ dangerWatchlist: s.dangerWatchlist.filter((w) => w.id !== id) }));
      },

      recordWatchTrigger: (id, outcome) => {
        set((s) => ({
          dangerWatchlist: s.dangerWatchlist.map((w) => {
            if (w.id !== id) return w;
            const stats = { ...w.stats };
            if (outcome === 'triggered') stats.timesTriggered++;
            if (outcome === 'fall') stats.timesFollowedByFall++;
            if (outcome === 'close-call') stats.timesFollowedByCloseCall++;
            if (outcome === 'clean') stats.timesSurvivedClean++;
            return { ...w, stats };
          }),
        }));
      },

      // ---- Milestones / badges / identity ----
      setMilestoneLadder: (rungs) => set({ milestoneLadder: rungs }),

      updateMilestone: (day, patch) => {
        set((s) => ({
          milestoneLadder: s.milestoneLadder.map((m) =>
            m.day === day ? { ...m, ...patch } : m
          ),
        }));
      },

      earnBadge: (badge) => {
        const { badges } = get();
        if (badges.some((b) => b.id === badge.id)) return;
        set({
          badges: [
            ...badges,
            { ...badge, earnedAt: new Date().toISOString() },
          ],
        });
      },

      setCostBenefit: (cb) => {
        set({ costBenefit: { ...cb, updatedAt: new Date().toISOString() } });
      },

      setIdentityStatement: (text) => set({ identityStatement: text.trim() || null }),

      setRecoveryVow: (text) => {
        const now = new Date();
        const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        set({
          activeRecoveryVow: {
            text: text.trim(),
            createdAt: now.toISOString(),
            expiresAt: expires.toISOString(),
          },
        });
      },

      clearExpiredVow: () => {
        const vow = get().activeRecoveryVow;
        if (vow && new Date(vow.expiresAt).getTime() < Date.now()) {
          set({ activeRecoveryVow: null });
        }
      },

      // ---- AI ----
      setAiConfig: (cfg) => set((s) => ({ ...s, ...cfg })),

      // ---- AI-produced content ----
      addCustomTactic: (tactic) => {
        const full: CustomTactic = {
          ...tactic,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ customTactics: [full, ...s.customTactics] }));
      },
      removeCustomTactic: (id) => {
        set((s) => ({
          customTactics: s.customTactics.filter((t) => t.id !== id),
          toolkit: s.toolkit.filter((tid) => tid !== id),
        }));
      },
      setLearnRecommendations: (recs) => {
        const now = new Date().toISOString();
        set({
          learnRecommendations: recs.map((r) => ({
            ...r,
            id: uuidv4(),
            createdAt: now,
          })),
        });
      },
      clearLearnRecommendations: () => set({ learnRecommendations: [] }),
      setAiDangerAnalysis: (a) => {
        if (a === null) {
          set({ aiDangerAnalysis: null });
          return;
        }
        set({ aiDangerAnalysis: { ...a, updatedAt: new Date().toISOString() } });
      },

      // ---- Privacy ----
      acknowledgePrivacyPromise: () => set({ privacyPromiseAcknowledged: true }),

      exportAllData: () => {
        const state = get();
        // strip functions via JSON roundtrip
        const safe = JSON.parse(
          JSON.stringify(state, (_k, v) => (typeof v === 'function' ? undefined : v))
        );
        return JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            appVersion: '0.1.0',
            data: safe,
          },
          null,
          2
        );
      },

      deleteAllData: () => {
        // Hard reset to fresh install state.
        set({
          userId: uuidv4(),
          displayName: `Ari_${Math.floor(1000 + Math.random() * 8999)}`,
          memberSince: new Date().toISOString(),
          streakStart: null,
          currentStreak: 0,
          longestStreak: 0,
          totalFallCount: 0,
          lastCheckIn: null,
          personalityProfile: { ...DEFAULT_PROFILE },
          calendarLog: {},
          calendarNotes: {},
          mantras: [...DEFAULT_MANTRAS],
          dailyMantraIndex: 0,
          rituals: [...DEFAULT_RITUALS],
          ritualStreak: 0,
          lastRitualDate: null,
          segulotEnabled: false,
          hasCompletedOnboarding: false,
          toolkit: [],
          vows: {},
          lastCelebratedMilestone: null,
          hasNewCoachMessage: false,
          fallEvents: [],
          closeCallEvents: [],
          checkInEvents: [],
          riskyApps: [],
          dangerWatchlist: [],
          milestoneLadder: [...DEFAULT_MILESTONES],
          badges: [],
          costBenefit: null,
          identityStatement: null,
          activeRecoveryVow: null,
          lightsOutTime: '22:30',
          notificationsEnabled: false,
          dailyReminderTime: '08:00',
          dangerHour: 22,
          checkInStreak: 0,
          lastCheckInDate: null,
          punishmentModeActive: false,
          punishmentModeUntil: null,
          aiProvider: 'gemini',
          aiApiKey: null,
          aiModel: 'gemma-3-27b-it',
          aiCustomEndpoint: null,
          customTactics: [],
          learnRecommendations: [],
          aiDangerAnalysis: null,
          privacyPromiseAcknowledged: false,
          coachMessages: [],
          coachSummary: null,
          coachStylePrefs: { ...DEFAULT_COACH_STYLE },
          tacticEffectiveness: {},
        });
      },
    }),
    {
      name: 'guard-user-profile',
      storage: createJSONStorage(() => AsyncStorage),
      version: 8,
      // Migrate from v1 (4-axis profile) to v2 (12-axis profile + new fields).
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;
        const s = persistedState as Record<string, unknown>;
        if (version < 2) {
          const oldProfile = (s.personalityProfile as Partial<PersonalityProfile>) ?? {};
          s.personalityProfile = { ...DEFAULT_PROFILE, ...oldProfile };
          s.calendarNotes = s.calendarNotes ?? {};
          s.fallEvents = s.fallEvents ?? [];
          s.closeCallEvents = s.closeCallEvents ?? [];
          s.checkInEvents = s.checkInEvents ?? [];
          s.dangerWatchlist = s.dangerWatchlist ?? [];
          s.milestoneLadder = s.milestoneLadder ?? [...DEFAULT_MILESTONES];
          s.badges = s.badges ?? [];
          s.costBenefit = s.costBenefit ?? null;
          s.identityStatement = s.identityStatement ?? null;
          s.activeRecoveryVow = s.activeRecoveryVow ?? null;
          s.aiProvider = s.aiProvider ?? 'none';
          s.aiApiKey = s.aiApiKey ?? null;
          s.aiModel = s.aiModel ?? null;
          s.aiCustomEndpoint = s.aiCustomEndpoint ?? null;
          s.privacyPromiseAcknowledged = s.privacyPromiseAcknowledged ?? false;
        }
        if (version < 3) {
          s.themePreference = s.themePreference ?? 'light';
        }
        if (version < 4) {
          s.customTactics = s.customTactics ?? [];
          s.learnRecommendations = s.learnRecommendations ?? [];
          s.aiDangerAnalysis = s.aiDangerAnalysis ?? null;
        }
        if (version < 5) {
          // Force AI config to auto-use built-in Gemini and clear stale AI caches.
          s.aiProvider = 'gemini';
          s.aiApiKey = 'AIzaSyCg-vbH9pkZoYq4BwHnRjB7mpzSCjJN828';
          s.aiModel = 'gemma-3-27b-it';
          s.aiCustomEndpoint = null;
          s.learnRecommendations = [];
          s.aiDangerAnalysis = null;
        }
        if (version < 6) {
          // Default to dark theme. Strip non-Jewish religious frames left over
          // from earlier versions of the app.
          s.themePreference = 'dark';
          const p = s.personalityProfile as Partial<PersonalityProfile> | undefined;
          if (p && (p.religiousLevel === ('christian' as unknown as ReligiousLevel) ||
                    p.religiousLevel === ('muslim' as unknown as ReligiousLevel))) {
            p.religiousLevel = 'other';
          }
        }
        if (version < 7) {
          // Wipe the previously-leaked bundled key from any persisted state so
          // we always pick up the current bundled key from _builtinKey.ts.
          // Users with a custom key (different value) keep theirs.
          const LEAKED = 'AIzaSyCg-vbH9pkZoYq4BwHnRjB7mpzSCjJN828';
          if (s.aiApiKey === LEAKED || !s.aiApiKey) s.aiApiKey = null;
          // Initialise coach memory.
          s.coachMessages = s.coachMessages ?? [];
          s.coachSummary = s.coachSummary ?? null;
        }
        if (version < 8) {
          s.coachStylePrefs = s.coachStylePrefs ?? { ...DEFAULT_COACH_STYLE };
          s.tacticEffectiveness = s.tacticEffectiveness ?? {};
        }
        return s;
      },
    }
  )
);
