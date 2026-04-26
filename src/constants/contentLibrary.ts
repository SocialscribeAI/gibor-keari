import type { TaggedContent } from '../utils/contentSelector';

// =============================================================================
// Vetted content library. Every item carries tags + a source. No filler.
// The selector in utils/contentSelector.ts picks from these based on the user's
// 12-axis personality profile.
// =============================================================================

// -----------------------------------------------------------------------------
// MANTRAS — short, first-person, identity-forming. Replace the placeholder trio.
// -----------------------------------------------------------------------------
export const MANTRAS: TaggedContent[] = [
  // --- Clinical / CBT / Stoic ---
  {
    id: 'm-aurelius-1',
    title: 'Aurelius — on impulse',
    body: "You have power over your mind — not outside events. Realize this, and you will find strength.",
    source: 'Marcus Aurelius, Meditations',
    tags: { tone: ['clinical', 'gentle'], religion: ['universal'], triggers: ['stress', 'conflict'], time: 'panic' },
  },
  {
    id: 'm-frankl-1',
    title: 'Frankl — the space between',
    body: "Between stimulus and response there is a space. In that space is our power to choose.",
    source: "Viktor Frankl, Man's Search for Meaning",
    tags: { tone: ['clinical', 'gentle'], religion: ['universal'], triggers: ['stress', 'visual'], time: 'panic' },
  },
  {
    id: 'm-clear-1',
    title: 'Clear — every action is a vote',
    body: "Every action I take is a vote for the person I'm becoming.",
    source: 'James Clear, Atomic Habits',
    tags: { tone: ['clinical'], religion: ['universal'], triggers: ['boredom', 'late-night'], time: 'quick' },
  },
  {
    id: 'm-cbt-reframe',
    title: 'CBT — urges are not commands',
    body: "This feeling will pass whether I act on it or not. Urges crest and fall like waves.",
    source: 'Cognitive Behavioral Therapy — urge surfing (Marlatt)',
    tags: { tone: ['clinical', 'gentle'], religion: ['universal'], triggers: ['visual', 'late-night', 'stress'], time: 'panic' },
  },

  // --- Harsh / drill ---
  {
    id: 'm-goggins-1',
    title: 'Goggins — stay hard',
    body: "The only way out of the pain is through it. Who's going to carry me? Nobody. So I go.",
    source: "David Goggins, Can't Hurt Me",
    tags: { tone: ['harsh'], religion: ['universal'], triggers: ['fatigue', 'boredom'], time: 'quick' },
  },
  {
    id: 'm-jocko-1',
    title: 'Jocko — discipline = freedom',
    body: "Discipline equals freedom. The chain I carry now is the chain I break later.",
    source: 'Jocko Willink, Discipline Equals Freedom',
    tags: { tone: ['harsh'], religion: ['universal'], triggers: ['late-night', 'stress'], time: 'panic' },
  },

  // --- Gentle / self-compassion ---
  {
    id: 'm-brene-1',
    title: 'Brown — shame dies in the light',
    body: "Shame cannot survive being spoken. I'm here. I'm trying. That is enough to start again.",
    source: 'Brené Brown, Daring Greatly',
    tags: { tone: ['gentle'], religion: ['universal'], triggers: ['loneliness', 'rejection'], time: 'medium' },
  },
  {
    id: 'm-neff-1',
    title: 'Neff — self-compassion',
    body: "I'm a human being, having a human moment. I can meet this with kindness.",
    source: 'Kristin Neff, Self-Compassion',
    tags: { tone: ['gentle'], religion: ['universal'], triggers: ['loneliness', 'rejection'], time: 'quick' },
  },

  // --- Spiritual / Jewish ---
  {
    id: 'm-bechirah',
    title: 'Ani bechirah — I am choice',
    body: "Ani bechirah. I am my choices. Each one shapes the soul I'm building.",
    source: 'Rav Dessler, Michtav MeEliyahu — bechirah point',
    tags: { tone: ['spiritual'], religion: ['modern-orthodox', 'chareidi', 'traditional'], triggers: ['visual', 'late-night'], time: 'panic' },
  },
  {
    id: 'm-tehillim-23',
    title: 'Psalm 23 — I walk through',
    body: "Gam ki eilech b'gei tzalmaves — lo ira ra, ki Atah imadi. Even through the valley of shadow, I'm not alone.",
    source: 'Tehillim 23:4',
    tags: { tone: ['spiritual', 'gentle'], religion: ['modern-orthodox', 'chareidi', 'traditional', 'christian'], triggers: ['loneliness', 'late-night'], time: 'panic' },
  },
  {
    id: 'm-twerski-1',
    title: 'Twerski — lift the fallen',
    body: "A fall is not the end. The Shulchan Aruch begins: 'yisgaber ka'ari' — rise like a lion. The lion falls and gets up.",
    source: 'Rav Dr. Abraham Twerski, Growing Each Day',
    tags: { tone: ['spiritual', 'gentle'], religion: ['modern-orthodox', 'chareidi', 'traditional'], triggers: ['rejection', 'loneliness'], time: 'quick' },
  },
  {
    id: 'm-mesillat-1',
    title: 'Mesillat Yesharim — zehirus',
    body: "Zehirus — to watch what I am doing, and to know that every small step either raises or lowers me.",
    source: 'Ramchal, Mesillat Yesharim, ch. 2',
    tags: { tone: ['spiritual'], religion: ['modern-orthodox', 'chareidi'], triggers: ['boredom', 'late-night'], time: 'medium' },
  },
];

// -----------------------------------------------------------------------------
// REFRAMES — Allen-Carr-style short cognitive shifts for the urge moment.
// -----------------------------------------------------------------------------
export const REFRAMES: TaggedContent[] = [
  {
    id: 'r-carr-1',
    title: 'The urge is the old pattern dying',
    body: "What I'm feeling right now isn't weakness. It's the old circuit firing its last shots. Every no I say kills it a little more. This discomfort is the sound of healing.",
    source: 'Allen Carr, Easy Way — reframe model',
    tags: { tone: ['neutral', 'gentle'], religion: ['universal'], triggers: ['visual', 'late-night', 'stress'], time: 'quick', category: 'reframe' },
  },
  {
    id: 'r-carr-2',
    title: 'I am not missing anything',
    body: "Giving in wouldn't give me anything I actually want. It would give me 5 minutes of static followed by hours of regret. I've been through that loop. I know the ending.",
    source: 'Allen Carr, Easy Way',
    tags: { tone: ['neutral', 'clinical'], religion: ['universal'], triggers: ['boredom', 'loneliness'], time: 'quick', category: 'reframe' },
  },
  {
    id: 'r-smart-1',
    title: 'DEADS — Delay',
    body: "I don't have to fight this forever. I only have to delay for 15 minutes. Set a timer. When it goes off, I can decide again. Urges lose 70% of their intensity in 20 minutes.",
    source: 'SMART Recovery — DEADS toolkit',
    tags: { tone: ['clinical'], religion: ['universal'], triggers: ['visual', 'late-night'], time: 'quick', category: 'reframe' },
  },
  {
    id: 'r-identity-1',
    title: 'Who am I becoming?',
    body: "Don't ask 'can I resist this?' Ask 'what would the person I'm becoming do right now?' That person already exists. I just have to act like him.",
    source: 'James Clear, Atomic Habits — identity change',
    tags: { tone: ['neutral', 'harsh'], religion: ['universal'], triggers: ['boredom', 'stress'], time: 'quick', category: 'reframe' },
  },
  {
    id: 'r-future-self',
    title: 'Tomorrow morning',
    body: "In 8 hours I'll either wake up with my streak intact, proud, clear — or hollow, ashamed, resetting. Both versions of tomorrow exist right now. I pick.",
    source: 'Hal Hershfield — future-self continuity research',
    tags: { tone: ['neutral'], religion: ['universal'], triggers: ['late-night', 'boredom'], time: 'quick', category: 'reframe' },
  },
];

// -----------------------------------------------------------------------------
// TACTICS — concrete actions the user can take. Time-to-execute is tagged.
// -----------------------------------------------------------------------------
export const TACTICS: TaggedContent[] = [
  {
    id: 't-478-breath',
    title: '4-7-8 breathing',
    body: "Breathe in through the nose for 4. Hold for 7. Exhale through the mouth for 8. Three cycles. Drops heart rate and interrupts the fight-or-flight loop.",
    source: 'Dr. Andrew Weil — based on pranayama',
    tags: { tone: ['neutral', 'clinical'], religion: ['universal'], triggers: ['stress', 'visual', 'late-night'], time: 'panic', category: 'body' },
  },
  {
    id: 't-cold-water',
    title: 'Cold water on the face',
    body: "Splash cold water on your face for 30 seconds, or hold an ice cube. Triggers the mammalian dive reflex — immediate parasympathetic reset.",
    source: 'Dialectical Behavior Therapy — TIPP skills',
    tags: { tone: ['neutral', 'harsh'], religion: ['universal'], triggers: ['stress', 'visual'], time: 'panic', category: 'body' },
  },
  {
    id: 't-walk-outside',
    title: 'Walk outside — 10 minutes',
    body: "Leave the building. Don't pick up the phone. Walk anywhere for 10 minutes. Sunlight + motion = state change.",
    source: 'Behavioral activation — Lejuez et al.',
    tags: { tone: ['neutral'], religion: ['universal'], triggers: ['boredom', 'loneliness', 'late-night'], time: 'medium', category: 'body' },
  },
  {
    id: 't-call-friend',
    title: 'Call one person',
    body: "Call someone — anyone you trust. You don't need to explain. Talk for 5 minutes about literally anything. Isolation feeds the urge; voice kills it.",
    source: 'SMART — social support protocols',
    tags: { tone: ['gentle', 'neutral'], religion: ['universal'], triggers: ['loneliness', 'rejection'], time: 'medium', category: 'social' },
  },
  {
    id: 't-lie-down',
    title: 'Lie down for 10 minutes',
    body: "If HALT flags Tired: lie flat, close your eyes, no phone. Tired brains can't fight urges. Sleep is a tactic.",
    source: 'HALT protocol — AA clinical folklore; Walker, Why We Sleep',
    tags: { tone: ['gentle'], religion: ['universal'], triggers: ['fatigue', 'late-night'], time: 'medium', category: 'body' },
  },
  {
    id: 't-change-room',
    title: 'Change the room',
    body: "Stand up. Leave the room. Turn on the main ceiling light. The urge is bonded to the environment it started in. Break the environment, weaken the urge.",
    source: 'James Clear — cue disruption (Atomic Habits)',
    tags: { tone: ['neutral'], religion: ['universal'], triggers: ['visual', 'late-night'], time: 'panic', category: 'environment' },
  },
  {
    id: 't-push-ups',
    title: '20 push-ups',
    body: "Drop down. 20 push-ups — or as many as you can. Physical exertion burns the cortisol spike that's driving the urge.",
    source: 'Ratey, Spark — exercise and mood regulation',
    tags: { tone: ['harsh', 'neutral'], religion: ['universal'], triggers: ['stress', 'boredom', 'fatigue'], time: 'quick', category: 'body' },
  },
  {
    id: 't-journal-2min',
    title: 'Write it out — 2 minutes',
    body: "What happened in the last hour? What am I actually feeling? Naming the emotion reduces its power — amygdala-PFC shift.",
    source: 'Matthew Lieberman — affect labeling fMRI studies',
    tags: { tone: ['gentle', 'clinical'], religion: ['universal'], triggers: ['stress', 'conflict', 'rejection'], time: 'quick', category: 'mind' },
  },
  {
    id: 't-mantra-aloud',
    title: 'Say your mantra out loud',
    body: "Say your current mantra aloud three times. Not in your head — with your voice. Verbal self-talk engages a different neural pathway than silent thought.",
    source: 'Kross et al. — distanced self-talk research',
    tags: { tone: ['neutral', 'spiritual'], religion: ['universal'], triggers: ['visual', 'late-night'], time: 'panic', category: 'mind' },
  },
  {
    id: 't-tehillim-short',
    title: 'Three pesukim',
    body: "Open to Tehillim. Say three verses — any three. The act of turning to something higher reframes the moment from private shame to held struggle.",
    source: "Segulos ba'avoda — traditional",
    tags: { tone: ['spiritual'], religion: ['modern-orthodox', 'chareidi', 'traditional'], triggers: ['loneliness', 'rejection', 'late-night'], time: 'quick', category: 'spirit' },
  },
];

// -----------------------------------------------------------------------------
// Convenience getters
// -----------------------------------------------------------------------------
export const ALL_CONTENT = [...MANTRAS, ...REFRAMES, ...TACTICS];
