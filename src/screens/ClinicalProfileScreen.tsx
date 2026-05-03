import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import type {
  ClinicalAssessment,
  AssessmentField,
  AssessmentSource,
  AssessmentConfidence,
  RamchalStage,
  Yesod,
  IdentityFrame,
  Distortion,
  BitachonLevel,
  HaltSensitivity,
  PrimaryReward,
  PostFallPattern,
  ChaserRisk,
  SpousalAwareness,
  IsolationLevel,
  RecoveryFramework,
} from '../store/useStore';
import { useTheme } from '../constants/theme';

// =============================================================================
// ClinicalProfileScreen — Coach's research-derived picture of the user.
//
// Every field shows: label, current value, where it came from, how confident
// coach is. Tap any field to edit — your edit becomes "user-stated" with
// confidence "high" automatically. Anything you clear goes back to "unknown."
// =============================================================================

interface Props {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Field metadata — describes every assessment field for rendering + editing
// ---------------------------------------------------------------------------

type FieldGroup = 'foundations' | 'patterns' | 'history' | 'context' | 'goals' | 'hypothesis';

type FieldType =
  | 'string'
  | 'string-multi'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'enum-multi'
  | 'string-list'
  | 'halt';

interface FieldMeta {
  key: keyof ClinicalAssessment;
  label: string;
  description: string;
  group: FieldGroup;
  type: FieldType;
  options?: { value: string; label: string }[];
}

const RAMCHAL_OPTIONS: { value: RamchalStage; label: string }[] = [
  { value: 'zehirut', label: 'Zehirut — Watchfulness' },
  { value: 'zerizut', label: 'Zerizut — Promptness' },
  { value: 'nekiyut', label: 'Nekiyut — Cleanliness' },
  { value: 'perishut', label: 'Perishut — Separation' },
  { value: 'taharah', label: 'Taharah — Purity' },
  { value: 'chassidut', label: 'Chassidut — Saintliness' },
];

const YESOD_OPTIONS: { value: Yesod; label: string }[] = [
  { value: 'earth', label: 'Earth — grounded, slow, heavy' },
  { value: 'water', label: 'Water — emotional, flowing' },
  { value: 'wind', label: 'Wind — restless, scattered' },
  { value: 'fire', label: 'Fire — intense, passionate' },
];

const IDENTITY_OPTIONS: { value: IdentityFrame; label: string }[] = [
  { value: 'tzaddik-fantasy', label: 'Tzaddik fantasy — expects to feel no urges' },
  { value: 'beinoni-realistic', label: 'Beinoni — feels urges, owns actions' },
  { value: 'rasha-despair', label: 'Rasha despair — identifies with the falls' },
];

const DISTORTION_OPTIONS: { value: Distortion; label: string }[] = [
  { value: 'i-can-stop-anytime', label: 'I can stop anytime' },
  { value: 'i-deserve-this', label: 'I deserve this' },
  { value: 'no-one-knows', label: "No one knows" },
  { value: 'not-hurting-anyone', label: 'Not hurting anyone' },
  { value: 'this-is-relaxation', label: 'This is relaxation' },
  { value: 'this-is-self-care', label: 'This is self-care' },
  { value: 'already-fell-may-as-well', label: 'Already fell, may as well' },
  { value: 'just-once', label: 'Just once' },
  { value: 'tomorrow-is-different', label: 'Tomorrow is different' },
  { value: 'i-am-broken-anyway', label: 'I am broken anyway' },
  { value: 'the-app-is-watching-not-me', label: "The app is watching, not me" },
];

const BITACHON_OPTIONS: { value: BitachonLevel; label: string }[] = [
  { value: 'low', label: 'Low — relies on willpower alone' },
  { value: 'moderate', label: 'Moderate — believes but struggles to feel held' },
  { value: 'high', label: 'High — lives the dependence' },
];

const REWARD_OPTIONS: { value: PrimaryReward; label: string }[] = [
  { value: 'stress-relief', label: 'Stress relief' },
  { value: 'loneliness-relief', label: 'Loneliness relief' },
  { value: 'boredom-escape', label: 'Boredom escape' },
  { value: 'rejection-numbing', label: 'Rejection numbing' },
  { value: 'self-soothing', label: 'Self-soothing' },
  { value: 'novelty-seeking', label: 'Novelty seeking' },
  { value: 'ritual-comfort', label: 'Ritual comfort' },
];

const POSTFALL_OPTIONS: { value: PostFallPattern; label: string }[] = [
  { value: 'shame-spiral', label: 'Shame spiral' },
  { value: 'minimize-deny', label: 'Minimize / deny' },
  { value: 'immediate-recommit', label: 'Immediate recommit' },
  { value: 'numb-disconnect', label: 'Numb / disconnect' },
];

const CHASER_OPTIONS: { value: ChaserRisk; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High — days 2-5 are danger zone' },
];

const SPOUSAL_OPTIONS: { value: SpousalAwareness; label: string }[] = [
  { value: 'unknown', label: "Don't know yet" },
  { value: 'aware-supportive', label: 'Aware, supportive' },
  { value: 'aware-not-supportive', label: 'Aware, not supportive' },
  { value: 'unaware', label: 'Unaware' },
];

const ISOLATION_OPTIONS: { value: IsolationLevel; label: string }[] = [
  { value: 'connected', label: 'Connected — has people' },
  { value: 'somewhat-isolated', label: 'Somewhat isolated' },
  { value: 'very-isolated', label: 'Very isolated — no one knows' },
];

const FRAMEWORK_OPTIONS: { value: RecoveryFramework; label: string }[] = [
  { value: 'breslov', label: 'Breslov — hisbodedus, simchah, Tikkun HaKlali' },
  { value: 'tanya', label: 'Tanya — Beinoni, two-souls, hisbonenus' },
  { value: 'mussar-yeshivish', label: 'Mussar yeshivish — Ramchal, Wolbe, va\'ad' },
  { value: 'twerski-12step', label: 'Twerski / 12-step — addictive thinking + Mussar' },
  { value: 'cbt-secular', label: 'CBT secular — clinical, evidence-based' },
  { value: 'mixed', label: 'Mixed — pulling from several' },
];

const FIELDS: FieldMeta[] = [
  // Foundations
  {
    key: 'ramchalStage',
    label: 'Ramchal stage',
    description: "Where you are on Mesillat Yesharim's ladder. Determines which content tier coach surfaces.",
    group: 'foundations',
    type: 'enum',
    options: RAMCHAL_OPTIONS,
  },
  {
    key: 'dominantYesod',
    label: 'Dominant yesod (Bilvavi)',
    description: 'Which element drives your struggle pattern. Personalizes tactic match.',
    group: 'foundations',
    type: 'enum',
    options: YESOD_OPTIONS,
  },
  {
    key: 'yesodPattern',
    label: 'How your yesod expresses',
    description: 'Free text — how this element shows up in your specific struggle.',
    group: 'foundations',
    type: 'string-multi',
  },
  {
    key: 'identityFrame',
    label: 'Identity frame (Tanya)',
    description: 'The single most predictive field. Tzaddik-fantasy is brittle. Beinoni-realistic is resilient. Rasha-despair needs reframe before any tactic.',
    group: 'foundations',
    type: 'enum',
    options: IDENTITY_OPTIONS,
  },
  {
    key: 'bitachonBaseline',
    label: 'Bitachon baseline',
    description: 'Trust-in-Hashem level. Predicts white-knuckling burnout.',
    group: 'foundations',
    type: 'enum',
    options: BITACHON_OPTIONS,
  },
  {
    key: 'primaryFramework',
    label: 'Primary framework',
    description: 'Which research framework leads for you. Coach calibrates content tier accordingly.',
    group: 'foundations',
    type: 'enum',
    options: FRAMEWORK_OPTIONS,
  },

  // Patterns
  {
    key: 'activeDistortions',
    label: 'Active distortions',
    description: 'Twerski "addictive thinking" patterns coach hears in your speech.',
    group: 'patterns',
    type: 'enum-multi',
    options: DISTORTION_OPTIONS,
  },
  {
    key: 'primaryReward',
    label: 'What the urge actually rewards',
    description: 'Per Duhigg: the underlying need. Lonely man needs "call your friend," not pushups.',
    group: 'patterns',
    type: 'enum',
    options: REWARD_OPTIONS,
  },
  {
    key: 'postFallPattern',
    label: 'Post-fall pattern',
    description: 'How you respond after a fall. Determines post-fall protocol variant.',
    group: 'patterns',
    type: 'enum',
    options: POSTFALL_OPTIONS,
  },
  {
    key: 'postFallChaserRisk',
    label: 'Post-fall chaser risk',
    description: 'Days 2-5 risk. High = coach escalates check-ins after a fall.',
    group: 'patterns',
    type: 'enum',
    options: CHASER_OPTIONS,
  },
  {
    key: 'haltSensitivity',
    label: 'HALT sensitivity (0-10 each)',
    description: 'How much each HALT factor amplifies urges for you.',
    group: 'patterns',
    type: 'halt',
  },

  // History
  {
    key: 'yearsStruggling',
    label: 'Years struggling',
    description: 'How long this has been a battle.',
    group: 'history',
    type: 'number',
  },
  {
    key: 'longestCleanStretch',
    label: 'Longest clean stretch (days)',
    description: 'Personal record so far.',
    group: 'history',
    type: 'number',
  },
  {
    key: 'previousAttempts',
    label: 'Previous attempts',
    description: 'What you\'ve tried before — apps, programs, vows. One per line.',
    group: 'history',
    type: 'string-list',
  },

  // Context
  {
    key: 'isMarried',
    label: 'Married?',
    description: 'Married, single, dating — coach calibrates accordingly.',
    group: 'context',
    type: 'boolean',
  },
  {
    key: 'spousalAwareness',
    label: 'Spousal awareness',
    description: 'Only relevant if married. Privately — coach treats this carefully.',
    group: 'context',
    type: 'enum',
    options: SPOUSAL_OPTIONS,
  },
  {
    key: 'hasFrumCommunity',
    label: 'Have a frum community?',
    description: 'Connected to a kehillah, shul, group of friends in similar place.',
    group: 'context',
    type: 'boolean',
  },
  {
    key: 'hasMashpiaOrRav',
    label: 'Have a mashpia or rav?',
    description: 'Spiritual guide / posek you can talk to.',
    group: 'context',
    type: 'boolean',
  },
  {
    key: 'isolationLevel',
    label: 'Isolation level',
    description: 'Twerski: isolation is the largest single accelerant.',
    group: 'context',
    type: 'enum',
    options: ISOLATION_OPTIONS,
  },

  // Goals
  {
    key: 'primaryGoal',
    label: 'Primary goal',
    description: 'In your own words — what does success look like.',
    group: 'goals',
    type: 'string-multi',
  },
  {
    key: 'motivationDeepReason',
    label: 'Deep "why"',
    description: 'The reason underneath the reason. The thing that holds when willpower runs out.',
    group: 'goals',
    type: 'string-multi',
  },

  // Hypothesis
  {
    key: 'workingHypothesis',
    label: "Coach's working hypothesis",
    description: "Coach's evolving theory of what's really going on. Edit if you disagree.",
    group: 'hypothesis',
    type: 'string-multi',
  },
];

const GROUP_LABELS: Record<FieldGroup, string> = {
  foundations: 'Spiritual foundations',
  patterns: 'Patterns & triggers',
  history: 'History',
  context: 'Life context',
  goals: 'Goals',
  hypothesis: "Coach's hypothesis",
};

const GROUP_ORDER: FieldGroup[] = [
  'foundations',
  'patterns',
  'history',
  'context',
  'goals',
  'hypothesis',
];

// ---------------------------------------------------------------------------
// Source / confidence label helpers
// ---------------------------------------------------------------------------

const SOURCE_LABEL: Record<AssessmentSource, string> = {
  'user-stated': 'you said this',
  'coach-inferred': 'coach picked up on this',
  'pattern-detected': 'from your activity',
  'event-derived': 'from a logged event',
  unknown: 'not yet observed',
};

const confidenceColor = (conf: AssessmentConfidence, theme: any): string => {
  if (conf === 'high') return theme.success ?? '#1E8A4A';
  if (conf === 'medium') return theme.accent;
  return theme.textDim;
};

// ---------------------------------------------------------------------------
// Format an assessment field's value for display
// ---------------------------------------------------------------------------

function formatValue(meta: FieldMeta, value: unknown): string {
  if (value === null || value === undefined) return 'Not yet observed';
  if (meta.type === 'boolean') return value ? 'Yes' : 'No';
  if (meta.type === 'enum' && meta.options) {
    return meta.options.find((o) => o.value === value)?.label ?? String(value);
  }
  if (meta.type === 'enum-multi' && meta.options) {
    if (!Array.isArray(value) || value.length === 0) return 'Not yet observed';
    return value
      .map((v) => meta.options!.find((o) => o.value === v)?.label ?? String(v))
      .join(' · ');
  }
  if (meta.type === 'string-list') {
    if (!Array.isArray(value) || value.length === 0) return 'Not yet observed';
    return (value as string[]).join('\n');
  }
  if (meta.type === 'halt') {
    const h = value as HaltSensitivity;
    return `H ${h.hungry} · A ${h.angry} · L ${h.lonely} · T ${h.tired}`;
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export const ClinicalProfileScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const { clinicalAssessment, updateAssessmentField, clearAssessmentField } = useStore();
  const [editing, setEditing] = useState<FieldMeta | null>(null);

  const setCount = Object.values(clinicalAssessment).filter(
    (f) => (f as AssessmentField<unknown>).value !== null && (f as AssessmentField<unknown>).value !== undefined,
  ).length;

  return (
    <Screen>
      <View className="flex-row items-center mb-4">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ChevronLeft size={20} color={theme.muted} />
          <Text className="text-sm ml-1" style={{ color: theme.muted }}>
            About Me
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-black mb-2" style={{ color: theme.text, fontFamily: 'Outfit' }}>
          Coach&apos;s picture of you
        </Text>
        <Text className="leading-6 mb-4" style={{ color: theme.muted }}>
          The clinical assessment — research-derived placements coach builds about you over time.
          Every field shows where it came from. Edit anything that&apos;s wrong.
        </Text>
        <View
          className="rounded-2xl p-4 mb-6"
          style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
        >
          <Text className="text-xs uppercase tracking-widest mb-1" style={{ color: theme.accent }}>
            {setCount} of {FIELDS.length} fields filled
          </Text>
          <Text className="text-xs" style={{ color: theme.muted }}>
            Empty fields = not yet observed. Coach fills these in as you talk. You can also edit any field directly.
          </Text>
        </View>

        {GROUP_ORDER.map((group) => {
          const fields = FIELDS.filter((f) => f.group === group);
          return (
            <View key={group} className="mb-6">
              <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
                {GROUP_LABELS[group]}
              </Text>
              {fields.map((meta) => {
                const field = clinicalAssessment[meta.key] as AssessmentField<unknown>;
                return (
                  <FieldRow
                    key={meta.key}
                    meta={meta}
                    field={field}
                    onEdit={() => setEditing(meta)}
                    theme={theme}
                  />
                );
              })}
            </View>
          );
        })}

        <View className="h-12" />
      </ScrollView>

      {/* Edit modal */}
      <FieldEditorModal
        meta={editing}
        field={editing ? (clinicalAssessment[editing.key] as AssessmentField<unknown>) : null}
        onClose={() => setEditing(null)}
        onSave={(value) => {
          if (!editing) return;
          updateAssessmentField(editing.key, {
            value,
            source: 'user-stated' as AssessmentSource,
            confidence: 'high' as AssessmentConfidence,
            evidence: 'edited directly in About Me',
          } as never);
          setEditing(null);
        }}
        onClear={() => {
          if (!editing) return;
          clearAssessmentField(editing.key);
          setEditing(null);
        }}
        theme={theme}
      />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Field row
// ---------------------------------------------------------------------------

const FieldRow: React.FC<{
  meta: FieldMeta;
  field: AssessmentField<unknown>;
  onEdit: () => void;
  theme: any;
}> = ({ meta, field, onEdit, theme }) => {
  const isSet = field.value !== null && field.value !== undefined;
  const display = formatValue(meta, field.value);
  return (
    <Pressable
      onPress={onEdit}
      className="rounded-2xl p-4 mb-2"
      style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
    >
      <View className="flex-row items-start justify-between mb-1">
        <Text className="font-black text-sm flex-1 mr-2" style={{ color: theme.text }}>
          {meta.label}
        </Text>
        <ChevronRight size={14} color={theme.textDim} />
      </View>
      <Text
        className="text-sm leading-5 mb-2"
        style={{ color: isSet ? theme.text : theme.textDim, fontStyle: isSet ? 'normal' : 'italic' }}
      >
        {display}
      </Text>
      {isSet && (
        <View className="flex-row items-center">
          <View
            className="w-1.5 h-1.5 rounded-full mr-1.5"
            style={{ backgroundColor: confidenceColor(field.confidence, theme) }}
          />
          <Text className="text-[10px] italic" style={{ color: theme.textDim }}>
            {SOURCE_LABEL[field.source]} · {field.confidence} confidence
          </Text>
        </View>
      )}
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Field editor modal — switches editor by field type
// ---------------------------------------------------------------------------

const FieldEditorModal: React.FC<{
  meta: FieldMeta | null;
  field: AssessmentField<unknown> | null;
  onClose: () => void;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ meta, field, onClose, onSave, onClear, theme }) => {
  if (!meta || !field) return null;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View
          className="rounded-t-3xl p-6"
          style={{ backgroundColor: theme.surface, maxHeight: '90%' }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-xs uppercase tracking-widest mb-1" style={{ color: theme.accent }}>
              Edit
            </Text>
            <Text className="text-2xl font-black mb-2" style={{ color: theme.text, fontFamily: 'Outfit' }}>
              {meta.label}
            </Text>
            <Text className="text-xs leading-5 mb-5" style={{ color: theme.muted }}>
              {meta.description}
            </Text>

            <FieldEditorBody meta={meta} field={field} onSave={onSave} onClear={onClear} theme={theme} />

            <Pressable onPress={onClose} className="py-3 items-center mt-2">
              <Text className="text-sm" style={{ color: theme.muted }}>
                Cancel
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const FieldEditorBody: React.FC<{
  meta: FieldMeta;
  field: AssessmentField<unknown>;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ meta, field, onSave, onClear, theme }) => {
  switch (meta.type) {
    case 'string':
    case 'string-multi':
      return <StringEditor meta={meta} field={field} onSave={onSave} onClear={onClear} theme={theme} />;
    case 'number':
      return <NumberEditor meta={meta} field={field} onSave={onSave} onClear={onClear} theme={theme} />;
    case 'boolean':
      return <BooleanEditor onSave={onSave} onClear={onClear} field={field} theme={theme} />;
    case 'enum':
      return <EnumEditor meta={meta} field={field} onSave={onSave} onClear={onClear} theme={theme} />;
    case 'enum-multi':
      return <EnumMultiEditor meta={meta} field={field} onSave={onSave} onClear={onClear} theme={theme} />;
    case 'string-list':
      return <StringListEditor meta={meta} field={field} onSave={onSave} onClear={onClear} theme={theme} />;
    case 'halt':
      return <HaltEditor field={field} onSave={onSave} onClear={onClear} theme={theme} />;
  }
};

// ---------- Editors ---------------------------------------------------------

const SaveBar: React.FC<{
  onSave: () => void;
  onClear: () => void;
  canSave: boolean;
  hasValue: boolean;
  theme: any;
}> = ({ onSave, onClear, canSave, hasValue, theme }) => (
  <View>
    <Pressable
      onPress={canSave ? onSave : undefined}
      disabled={!canSave}
      className="rounded-2xl py-4 items-center mt-2 mb-2"
      style={{ backgroundColor: canSave ? theme.accent : theme.surface2 }}
    >
      <Text
        className="font-black uppercase tracking-widest"
        style={{ color: canSave ? theme.onAccent : theme.muted }}
      >
        Save
      </Text>
    </Pressable>
    {hasValue && (
      <Pressable
        onPress={onClear}
        className="rounded-2xl py-3 items-center flex-row justify-center"
        style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
      >
        <Eraser size={14} color={theme.muted} />
        <Text className="ml-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.muted }}>
          Clear (back to unknown)
        </Text>
      </Pressable>
    )}
  </View>
);

const StringEditor: React.FC<{
  meta: FieldMeta;
  field: AssessmentField<unknown>;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ meta, field, onSave, onClear, theme }) => {
  const [draft, setDraft] = useState<string>(typeof field.value === 'string' ? field.value : '');
  const isMulti = meta.type === 'string-multi';
  return (
    <>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        multiline={isMulti}
        autoFocus
        className="rounded-2xl px-4 py-3 mb-2"
        style={{
          backgroundColor: theme.surface2,
          borderWidth: 1,
          borderColor: theme.hairline,
          color: theme.text,
          minHeight: isMulti ? 100 : 48,
        }}
      />
      <SaveBar
        canSave={true}
        hasValue={field.value !== null}
        onSave={() => onSave(draft.trim() || null)}
        onClear={onClear}
        theme={theme}
      />
    </>
  );
};

const NumberEditor: React.FC<{
  meta: FieldMeta;
  field: AssessmentField<unknown>;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ field, onSave, onClear, theme }) => {
  const [draft, setDraft] = useState<string>(
    field.value !== null && field.value !== undefined ? String(field.value) : '',
  );
  const parsed = Number(draft);
  const canSave = draft.trim().length > 0 && Number.isFinite(parsed) && parsed >= 0;
  return (
    <>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        keyboardType="numeric"
        autoFocus
        className="rounded-2xl px-4 py-3 mb-2"
        style={{
          backgroundColor: theme.surface2,
          borderWidth: 1,
          borderColor: theme.hairline,
          color: theme.text,
        }}
      />
      <SaveBar
        canSave={canSave}
        hasValue={field.value !== null}
        onSave={() => onSave(parsed)}
        onClear={onClear}
        theme={theme}
      />
    </>
  );
};

const BooleanEditor: React.FC<{
  field: AssessmentField<unknown>;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ field, onSave, onClear, theme }) => {
  return (
    <>
      <View className="flex-row gap-2 mb-2">
        <Pressable
          onPress={() => onSave(true)}
          className="flex-1 rounded-2xl py-4 items-center"
          style={{
            backgroundColor: field.value === true ? theme.accent : theme.surface2,
            borderWidth: 1,
            borderColor: field.value === true ? theme.accent : theme.hairline,
          }}
        >
          <Text className="font-black" style={{ color: field.value === true ? theme.onAccent : theme.text }}>
            Yes
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSave(false)}
          className="flex-1 rounded-2xl py-4 items-center"
          style={{
            backgroundColor: field.value === false ? theme.accent : theme.surface2,
            borderWidth: 1,
            borderColor: field.value === false ? theme.accent : theme.hairline,
          }}
        >
          <Text className="font-black" style={{ color: field.value === false ? theme.onAccent : theme.text }}>
            No
          </Text>
        </Pressable>
      </View>
      <SaveBar
        canSave={false}
        hasValue={field.value !== null}
        onSave={() => undefined}
        onClear={onClear}
        theme={theme}
      />
    </>
  );
};

const EnumEditor: React.FC<{
  meta: FieldMeta;
  field: AssessmentField<unknown>;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ meta, field, onSave, onClear, theme }) => {
  return (
    <>
      <View className="mb-2">
        {meta.options!.map((o) => {
          const active = field.value === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onSave(o.value)}
              className="rounded-2xl p-4 mb-2"
              style={{
                backgroundColor: active ? theme.accent : theme.surface2,
                borderWidth: 1,
                borderColor: active ? theme.accent : theme.hairline,
              }}
            >
              <Text
                className="font-bold text-sm"
                style={{ color: active ? theme.onAccent : theme.text }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <SaveBar
        canSave={false}
        hasValue={field.value !== null}
        onSave={() => undefined}
        onClear={onClear}
        theme={theme}
      />
    </>
  );
};

const EnumMultiEditor: React.FC<{
  meta: FieldMeta;
  field: AssessmentField<unknown>;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ meta, field, onSave, onClear, theme }) => {
  const initial = Array.isArray(field.value) ? (field.value as string[]) : [];
  const [draft, setDraft] = useState<string[]>(initial);
  const toggle = (v: string) => {
    setDraft(draft.includes(v) ? draft.filter((x) => x !== v) : [...draft, v]);
  };
  return (
    <>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {meta.options!.map((o) => {
          const active = draft.includes(o.value);
          return (
            <Pressable
              key={o.value}
              onPress={() => toggle(o.value)}
              className="rounded-full px-3 py-2"
              style={{
                backgroundColor: active ? theme.accent : theme.surface2,
                borderWidth: 1,
                borderColor: active ? theme.accent : theme.hairline,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: active ? theme.onAccent : theme.text }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <SaveBar
        canSave={true}
        hasValue={field.value !== null}
        onSave={() => onSave(draft.length === 0 ? null : draft)}
        onClear={onClear}
        theme={theme}
      />
    </>
  );
};

const StringListEditor: React.FC<{
  meta: FieldMeta;
  field: AssessmentField<unknown>;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ field, onSave, onClear, theme }) => {
  const initial = Array.isArray(field.value) ? (field.value as string[]).join('\n') : '';
  const [draft, setDraft] = useState<string>(initial);
  return (
    <>
      <Text className="text-xs mb-2" style={{ color: theme.textDim }}>
        One per line.
      </Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        multiline
        autoFocus
        className="rounded-2xl px-4 py-3 mb-2"
        style={{
          backgroundColor: theme.surface2,
          borderWidth: 1,
          borderColor: theme.hairline,
          color: theme.text,
          minHeight: 120,
        }}
      />
      <SaveBar
        canSave={true}
        hasValue={field.value !== null}
        onSave={() => {
          const list = draft
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
          onSave(list.length === 0 ? null : list);
        }}
        onClear={onClear}
        theme={theme}
      />
    </>
  );
};

const HaltEditor: React.FC<{
  field: AssessmentField<unknown>;
  onSave: (value: unknown) => void;
  onClear: () => void;
  theme: any;
}> = ({ field, onSave, onClear, theme }) => {
  const initial = (field.value as HaltSensitivity | null) ?? { hungry: 0, angry: 0, lonely: 0, tired: 0 };
  const [halt, setHalt] = useState<HaltSensitivity>(initial);
  const labels: { key: keyof HaltSensitivity; label: string }[] = [
    { key: 'hungry', label: 'Hungry' },
    { key: 'angry', label: 'Angry' },
    { key: 'lonely', label: 'Lonely' },
    { key: 'tired', label: 'Tired' },
  ];
  return (
    <>
      {labels.map(({ key, label }) => (
        <View key={key} className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm font-bold" style={{ color: theme.text }}>
              {label}
            </Text>
            <Text className="text-sm font-black" style={{ color: theme.accent }}>
              {halt[key]}
            </Text>
          </View>
          <View className="flex-row gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
              const active = halt[key] === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setHalt({ ...halt, [key]: n })}
                  className="flex-1 py-2 rounded-md items-center"
                  style={{
                    backgroundColor: active ? theme.accent : theme.surface2,
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.hairline,
                  }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: active ? theme.onAccent : theme.muted }}
                  >
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <SaveBar
        canSave={true}
        hasValue={field.value !== null}
        onSave={() => onSave(halt)}
        onClear={onClear}
        theme={theme}
      />
    </>
  );
};
