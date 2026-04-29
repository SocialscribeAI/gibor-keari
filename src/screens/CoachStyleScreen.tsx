import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { ArrowLeft, Check, Zap, Heart, Brain, Phone, Wind, Shield, Flame, BookOpen, MessageCircle, Sparkles } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore, type CoachingApproach, type MantraStyle, type TacticPreference, type TacticDuration } from '../store/useStore';
import { useTheme } from '../constants/theme';

interface Props {
  onBack: () => void;
}

// =============================================================================
// Coach style configuration — tells the AI exactly how to talk to this user.
// Every choice feeds directly into the system prompt on every AI call.
// =============================================================================

const APPROACHES: { id: CoachingApproach; icon: any; label: string; desc: string }[] = [
  {
    id: 'drill-sergeant',
    icon: Flame,
    label: 'Drill sergeant',
    desc: "Don't go easy on me. Demand more. Hold me accountable. No excuses.",
  },
  {
    id: 'warm-mentor',
    icon: Heart,
    label: 'Warm mentor',
    desc: 'Believe in me even when I don\'t. Compassionate, not preachy.',
  },
  {
    id: 'accountability',
    icon: Shield,
    label: 'Accountability partner',
    desc: 'Keep bringing me back to my vow and commitments. No drift.',
  },
  {
    id: 'clinical',
    icon: Brain,
    label: 'Clinical / CBT',
    desc: 'Stick to psychology, neuroscience, and evidence. Skip the inspiration.',
  },
  {
    id: 'spiritual',
    icon: BookOpen,
    label: 'Torah wisdom',
    desc: 'Anchor everything in mussar, chassidus, and Torah sources.',
  },
  {
    id: 'socratic',
    icon: MessageCircle,
    label: 'Socratic',
    desc: 'Ask me questions. Help me arrive at the answer myself.',
  },
];

const MANTRA_STYLES: { id: MantraStyle; label: string; example: string }[] = [
  { id: 'warrior', label: 'Warrior / bold', example: '"I am a lion. I do not negotiate with weakness."' },
  { id: 'torah', label: 'Torah / sources', example: '"Eizehu gibor? Hakovesh et yitzro."' },
  { id: 'clinical', label: 'Clinical / facts', example: '"Urges peak at 20 minutes and pass. I can wait."' },
  { id: 'compassionate', label: 'Compassionate', example: '"I am not my urges. I am who I choose to be."' },
  { id: 'short-punch', label: 'Short & punchy', example: '"Not today."' },
  { id: 'reflective', label: 'Reflective', example: '"Every breath is a choice toward who I\'m becoming."' },
];

const TACTICS: { id: TacticPreference; icon: any; label: string; examples: string }[] = [
  { id: 'physical', icon: Zap, label: 'Physical', examples: 'Cold shower, pushups, run' },
  { id: 'breathwork', icon: Wind, label: 'Breathwork', examples: '4-7-8 breathing, body scan' },
  { id: 'spiritual', icon: BookOpen, label: 'Spiritual', examples: 'Daven, Shema, Tehillim' },
  { id: 'cognitive', icon: Brain, label: 'Cognitive', examples: 'Reframe, journal, CBT' },
  { id: 'social', icon: Phone, label: 'Social', examples: 'Call someone, text partner' },
  { id: 'environmental', icon: Shield, label: 'Change environment', examples: 'Leave the room, phone away' },
];

const DURATIONS: { id: TacticDuration; label: string; desc: string }[] = [
  { id: 'instant', label: 'Instant (~30s)', desc: 'Splash water, say Shema' },
  { id: '2min', label: '2 minutes', desc: 'Pushups, cold water, breathing' },
  { id: '5min', label: '5 minutes', desc: 'Walk, full breathing cycle' },
  { id: '10min+', label: '10+ minutes', desc: 'Full session, call someone' },
];

export const CoachStyleScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const { coachStylePrefs, setCoachStylePrefs } = useStore();

  const [saved, setSaved] = useState(false);

  const patch = <K extends keyof typeof coachStylePrefs>(key: K, value: typeof coachStylePrefs[K]) => {
    setCoachStylePrefs({ [key]: value } as Partial<typeof coachStylePrefs>);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const toggleApproach = (id: CoachingApproach) => patch('coachingApproach', id);

  const toggleMantraStyle = (id: MantraStyle) => {
    const current = coachStylePrefs.mantraStyles;
    patch('mantraStyles', current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const toggleTacticPref = (id: TacticPreference) => {
    const current = coachStylePrefs.tacticPreferences;
    patch('tacticPreferences', current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const setFirstMove = (id: TacticPreference) =>
    patch('firstMoveWhenUrgeHits', coachStylePrefs.firstMoveWhenUrgeHits === id ? null : id);

  const setDuration = (id: TacticDuration) => patch('preferredDuration', id);

  const SectionHeader = ({ title, sub }: { title: string; sub: string }) => (
    <View style={{ marginBottom: 14, marginTop: 6 }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>{title}</Text>
      <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2, lineHeight: 18 }}>{sub}</Text>
    </View>
  );

  const Divider = () => (
    <View style={{ height: 1, backgroundColor: theme.hairline, marginVertical: 24 }} />
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Pressable
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: theme.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ArrowLeft size={18} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>Coach Style</Text>
          <Text style={{ color: theme.muted, fontSize: 12 }}>
            How should I coach you?
          </Text>
        </View>
        {saved && (
          <View
            style={{
              backgroundColor: theme.success + '25',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Check size={12} color={theme.success} />
            <Text style={{ color: theme.success, fontSize: 11, fontWeight: '800' }}>Saved</Text>
          </View>
        )}
      </View>

      {/* Intro card */}
      <View
        style={{
          backgroundColor: theme.accent + '12',
          borderWidth: 1,
          borderColor: theme.accent + '40',
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <Sparkles size={20} color={theme.accent} style={{ marginTop: 2 }} />
        <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20, flex: 1 }}>
          Every answer here goes directly into the AI's system prompt. The more honest you are, the better the coach knows you. You can change any of this any time.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* SECTION 1: Coaching Approach */}
        <SectionHeader
          title="How should I talk to you?"
          sub="When you need me, which voice reaches you?"
        />
        {APPROACHES.map((a) => {
          const active = coachStylePrefs.coachingApproach === a.id;
          const Icon = a.icon;
          return (
            <Pressable
              key={a.id}
              onPress={() => toggleApproach(a.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: active ? theme.accent + '15' : theme.surface,
                borderWidth: 1.5,
                borderColor: active ? theme.accent : theme.hairline,
                borderRadius: 14,
                padding: 14,
                marginBottom: 8,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: active ? theme.accent : theme.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} color={active ? theme.onAccent : theme.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>{a.label}</Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2, lineHeight: 16 }}>{a.desc}</Text>
              </View>
              {active && <Check size={16} color={theme.accent} />}
            </Pressable>
          );
        })}

        <Divider />

        {/* SECTION 2: Mantra Style */}
        <SectionHeader
          title="What mantras speak to you?"
          sub="Select all that resonate. The AI will generate mantras in these styles."
        />
        {MANTRA_STYLES.map((s) => {
          const active = coachStylePrefs.mantraStyles.includes(s.id);
          return (
            <Pressable
              key={s.id}
              onPress={() => toggleMantraStyle(s.id)}
              style={{
                backgroundColor: active ? theme.accent + '15' : theme.surface,
                borderWidth: 1.5,
                borderColor: active ? theme.accent : theme.hairline,
                borderRadius: 14,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14, flex: 1 }}>{s.label}</Text>
                {active && <Check size={14} color={theme.accent} />}
              </View>
              <Text style={{ color: theme.muted, fontSize: 12, fontStyle: 'italic', lineHeight: 16 }}>{s.example}</Text>
            </Pressable>
          );
        })}

        <Divider />

        {/* SECTION 3: Tactic Preferences */}
        <SectionHeader
          title="What tactics actually work for you?"
          sub="Select all. The AI suggests these first and learns from your ratings."
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          {TACTICS.map((t) => {
            const active = coachStylePrefs.tacticPreferences.includes(t.id);
            const Icon = t.icon;
            return (
              <Pressable
                key={t.id}
                onPress={() => toggleTacticPref(t.id)}
                style={{
                  backgroundColor: active ? theme.accent + '20' : theme.surface,
                  borderWidth: 1.5,
                  borderColor: active ? theme.accent : theme.hairline,
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: '46%',
                  flex: 1,
                }}
              >
                <Icon size={14} color={active ? theme.accent : theme.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: active ? theme.text : theme.muted, fontWeight: '800', fontSize: 12 }}>{t.label}</Text>
                  <Text style={{ color: theme.muted, fontSize: 10, marginTop: 1 }}>{t.examples}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Divider />

        {/* SECTION 4: First Move */}
        <SectionHeader
          title="When urges hit — what's your first move?"
          sub="This becomes your emergency default in Danger Mode."
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TACTICS.map((t) => {
            const active = coachStylePrefs.firstMoveWhenUrgeHits === t.id;
            const Icon = t.icon;
            return (
              <Pressable
                key={t.id}
                onPress={() => setFirstMove(t.id)}
                style={{
                  backgroundColor: active ? theme.accent : theme.surface,
                  borderWidth: 1.5,
                  borderColor: active ? theme.accent : theme.hairline,
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: '46%',
                  flex: 1,
                }}
              >
                <Icon size={14} color={active ? theme.onAccent : theme.muted} />
                <Text style={{ color: active ? theme.onAccent : theme.muted, fontWeight: '800', fontSize: 12 }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Divider />

        {/* SECTION 5: Duration */}
        <SectionHeader
          title="How much time do you have in a crisis?"
          sub="Tactics will be calibrated to this length."
        />
        {DURATIONS.map((d) => {
          const active = coachStylePrefs.preferredDuration === d.id;
          return (
            <Pressable
              key={d.id}
              onPress={() => setDuration(d.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: active ? theme.accent + '15' : theme.surface,
                borderWidth: 1.5,
                borderColor: active ? theme.accent : theme.hairline,
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>{d.label}</Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{d.desc}</Text>
              </View>
              {active && <Check size={16} color={theme.accent} />}
            </Pressable>
          );
        })}

        <Divider />

        {/* SECTION 6: Go Hard */}
        <View
          style={{
            backgroundColor: coachStylePrefs.goHard ? 'rgba(192,57,43,0.12)' : theme.surface,
            borderWidth: 1.5,
            borderColor: coachStylePrefs.goHard ? 'rgba(192,57,43,0.5)' : theme.hairline,
            borderRadius: 16,
            padding: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Flame size={20} color={coachStylePrefs.goHard ? theme.danger : theme.muted} />
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, flex: 1, marginLeft: 10 }}>
              Don't go easy on me
            </Text>
            <Switch
              value={coachStylePrefs.goHard}
              onValueChange={(v) => patch('goHard', v)}
              trackColor={{ false: theme.hairline, true: theme.danger }}
              thumbColor="#ffffff"
            />
          </View>
          <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18 }}>
            When I ask for help, push back. Don't just comfort me. Call me out. Hold me to my vow and my commitments. I can handle it.
          </Text>
        </View>

        {/* Liked/Disliked summary */}
        {(coachStylePrefs.likedMantraTexts.length > 0 || coachStylePrefs.likedTacticIds.length > 0) && (
          <>
            <Divider />
            <SectionHeader
              title="What I've told you works"
              sub="Learned from your ratings in Mantras and Tactics"
            />
            {coachStylePrefs.likedMantraTexts.length > 0 && (
              <View
                style={{
                  backgroundColor: theme.success + '12',
                  borderWidth: 1,
                  borderColor: theme.success + '40',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: theme.success, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>
                  MANTRAS THAT RESONATED
                </Text>
                {coachStylePrefs.likedMantraTexts.slice(-5).map((m, i) => (
                  <Text key={i} style={{ color: theme.text, fontSize: 12, lineHeight: 18, marginBottom: 2 }}>
                    · {m.length > 80 ? m.slice(0, 80) + '…' : m}
                  </Text>
                ))}
              </View>
            )}
            {coachStylePrefs.likedTacticIds.length > 0 && (
              <View
                style={{
                  backgroundColor: theme.accent + '12',
                  borderWidth: 1,
                  borderColor: theme.accent + '40',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>
                  TACTICS MARKED AS WORKING
                </Text>
                <Text style={{ color: theme.text, fontSize: 12 }}>
                  {coachStylePrefs.likedTacticIds.length} tactics rated effective
                </Text>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </Screen>
  );
};
