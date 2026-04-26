import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Smile,
  Brain,
  Utensils,
  Flame,
  HeartCrack,
  Moon,
  ShieldCheck,
  Sparkles,
  Plus,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { useStore } from '../store/useStore';
import { analyzeDangerTimes, buildTimeTuples } from '../services/aiActions';
import { isAiConfigured } from '../services/aiService';

// =============================================================================
// Pattern Insights (§2.13) — synthesize fall / close-call / check-in events
// into what drives the user's falls and what saves them.
// Read-only. No advice. Just the pattern.
// =============================================================================

interface Props {
  onBack: () => void;
}

const TOP_N = 5;

export const PatternInsightsScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const fallEvents = useStore((s) => s.fallEvents);
  const closeCallEvents = useStore((s) => s.closeCallEvents);
  const checkInEvents = useStore((s) => s.checkInEvents);
  const currentStreak = useStore((s) => s.currentStreak);
  const bestStreak = useStore((s) => s.longestStreak);
  const personalityProfile = useStore((s) => s.personalityProfile);
  const aiProvider = useStore((s) => s.aiProvider);
  const aiApiKey = useStore((s) => s.aiApiKey);
  const aiModel = useStore((s) => s.aiModel);
  const aiCustomEndpoint = useStore((s) => s.aiCustomEndpoint);
  const aiDangerAnalysis = useStore((s) => s.aiDangerAnalysis);
  const setAiDangerAnalysis = useStore((s) => s.setAiDangerAnalysis);
  const addWatchItem = useStore((s) => s.addWatchItem);

  const aiCfg = useMemo(
    () => ({
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      customEndpoint: aiCustomEndpoint,
    }),
    [aiProvider, aiApiKey, aiModel, aiCustomEndpoint],
  );

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const runDangerAnalysis = async () => {
    if (!isAiConfigured(aiCfg)) {
      Alert.alert('AI not configured', 'Profile → AI coach → Groq (free).');
      return;
    }
    setAiError(null);
    setAiLoading(true);
    const tuples = buildTimeTuples(fallEvents, closeCallEvents);
    const res = await analyzeDangerTimes(aiCfg, personalityProfile, tuples);
    setAiLoading(false);
    if (!res.ok) {
      setAiError(res.error);
      return;
    }
    setAiDangerAnalysis({
      riskWindows: res.data.riskWindows,
      summary: res.data.summary,
      suggestions: res.data.suggestions,
    });
  };

  const addWindowToWatchlist = (w: { start: string; end: string; weekdays: number[]; reason: string }) => {
    addWatchItem({
      type: 'time',
      label: `Risk window ${w.start}–${w.end}`,
      detector: { kind: 'time-window', value: `${w.start}-${w.end}` },
      level: 'mantra-gate',
      schedule: { start: w.start, end: w.end, days: w.weekdays },
      suggestedBy: 'pattern-engine',
    });
    Alert.alert('Added to watchlist', w.reason);
  };

  const hasData = fallEvents.length + closeCallEvents.length + checkInEvents.length > 0;

  const stats = useMemo(() => {
    // Top triggers across falls
    const emotional = new Map<string, number>();
    const situational = new Map<string, number>();
    const digital = new Map<string, number>();
    const precursors = new Map<string, number>();

    fallEvents.forEach((f) => {
      f.emotionalTriggers.forEach((t) => emotional.set(t, (emotional.get(t) ?? 0) + 1));
      f.situationalTriggers.forEach((t) => situational.set(t, (situational.get(t) ?? 0) + 1));
      f.digitalTriggers.forEach((t) => digital.set(t, (digital.get(t) ?? 0) + 1));
      f.precursors.forEach((t) => precursors.set(t, (precursors.get(t) ?? 0) + 1));
    });

    // Risk hour distribution (0-23)
    const hours = new Array(24).fill(0);
    fallEvents.forEach((f) => {
      const h = new Date(f.date).getHours();
      hours[h]++;
    });
    const peakHour = hours.indexOf(Math.max(...hours));
    const peakHourCount = hours[peakHour];

    // HALT frequency across check-ins
    const halt = { hungry: 0, angry: 0, lonely: 0, tired: 0 };
    checkInEvents.forEach((c) => {
      if (c.halt.hungry) halt.hungry++;
      if (c.halt.angry) halt.angry++;
      if (c.halt.lonely) halt.lonely++;
      if (c.halt.tired) halt.tired++;
    });

    // Recent mood trend — last 14 check-ins
    const recent = checkInEvents.slice(0, 14);
    const avgMood = recent.length
      ? recent.reduce((sum, c) => sum + c.mood, 0) / recent.length
      : null;

    // Save rate — close-calls vs (close-calls + falls)
    const totalRisk = closeCallEvents.length + fallEvents.length;
    const saveRate = totalRisk > 0 ? Math.round((closeCallEvents.length / totalRisk) * 100) : null;

    // Best tactics — avg workedRating by tactic
    const tacticRatings = new Map<string, { total: number; count: number }>();
    closeCallEvents.forEach((c) => {
      if (!c.tacticUsed) return;
      const cur = tacticRatings.get(c.tacticUsed) ?? { total: 0, count: 0 };
      cur.total += c.workedRating;
      cur.count++;
      tacticRatings.set(c.tacticUsed, cur);
    });
    const tactics = Array.from(tacticRatings.entries())
      .map(([name, { total, count }]) => ({ name, avg: total / count, count }))
      .filter((t) => t.count >= 1)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, TOP_N);

    return {
      emotional: topEntries(emotional),
      situational: topEntries(situational),
      digital: topEntries(digital),
      precursors: topEntries(precursors),
      peakHour,
      peakHourCount,
      hours,
      halt,
      avgMood,
      saveRate,
      tactics,
    };
  }, [fallEvents, closeCallEvents, checkInEvents]);

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        <Pressable onPress={onBack} style={{ padding: 6 }}>
          <ChevronLeft size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>
            Pattern insights
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
            What your data shows. No judgment, just patterns.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* Overview cards */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <OverviewCard
                icon={ShieldCheck}
                label="Current streak"
                value={`${currentStreak}d`}
                color={theme.success}
              />
              <OverviewCard
                icon={TrendingUp}
                label="Best streak"
                value={`${bestStreak}d`}
                color={theme.accent}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <OverviewCard
                icon={stats.saveRate !== null && stats.saveRate >= 50 ? TrendingUp : TrendingDown}
                label="Save rate"
                value={stats.saveRate !== null ? `${stats.saveRate}%` : '—'}
                color={
                  stats.saveRate === null
                    ? theme.muted
                    : stats.saveRate >= 70
                      ? theme.success
                      : stats.saveRate >= 40
                        ? theme.accent
                        : theme.danger
                }
                sub="close-calls vs risk events"
              />
              <OverviewCard
                icon={Smile}
                label="Avg mood (14d)"
                value={stats.avgMood !== null ? stats.avgMood.toFixed(1) : '—'}
                color={
                  stats.avgMood === null
                    ? theme.muted
                    : stats.avgMood >= 7
                      ? theme.success
                      : stats.avgMood >= 4
                        ? theme.accent
                        : theme.danger
                }
              />
            </View>

            {/* AI danger-time analysis */}
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: theme.accent + '55',
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={14} color={theme.accent} />
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800', flex: 1 }}>
                  AI danger-time analysis
                </Text>
                {aiDangerAnalysis && (
                  <Text style={{ color: theme.muted, fontSize: 10 }}>
                    {new Date(aiDangerAnalysis.updatedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {aiDangerAnalysis ? (
                <>
                  <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 17, marginBottom: 10 }}>
                    {aiDangerAnalysis.summary}
                  </Text>
                  {aiDangerAnalysis.riskWindows.map((w, i) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: (w.riskLevel === 'high' ? theme.danger : theme.accent) + '15',
                        borderWidth: 1,
                        borderColor: (w.riskLevel === 'high' ? theme.danger : theme.accent) + '60',
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <Clock size={11} color={w.riskLevel === 'high' ? theme.danger : theme.accent} />
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '800' }}>
                          {w.start}–{w.end}
                        </Text>
                        <Text style={{ color: theme.muted, fontSize: 10 }}>
                          · {w.weekdays.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                        </Text>
                        <View style={{ flex: 1 }} />
                        <Text
                          style={{
                            color: w.riskLevel === 'high' ? theme.danger : theme.accent,
                            fontSize: 9,
                            fontWeight: '800',
                            letterSpacing: 1,
                          }}
                        >
                          {w.riskLevel.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ color: theme.muted, fontSize: 11, lineHeight: 15, marginBottom: 6 }}>
                        {w.reason}
                      </Text>
                      <Pressable
                        onPress={() => addWindowToWatchlist(w)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: theme.bg,
                          gap: 4,
                        }}
                      >
                        <Plus size={11} color={theme.text} />
                        <Text style={{ color: theme.text, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                          ADD TO WATCHLIST
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                  {aiDangerAnalysis.suggestions.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 }}>
                        SUGGESTIONS
                      </Text>
                      {aiDangerAnalysis.suggestions.map((s, i) => (
                        <Text key={i} style={{ color: theme.muted, fontSize: 12, lineHeight: 17, marginBottom: 3 }}>
                          • {s}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 17, marginBottom: 10 }}>
                  Let AI find the tightest windows when you're most at risk. Only hour + weekday +
                  event type are sent — never note content.
                </Text>
              )}

              {aiError && (
                <Text style={{ color: theme.danger, fontSize: 11, marginBottom: 8 }}>{aiError}</Text>
              )}

              <Pressable
                onPress={runDangerAnalysis}
                disabled={aiLoading}
                style={{
                  backgroundColor: theme.accent,
                  paddingVertical: 10,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 8,
                  opacity: aiLoading ? 0.6 : 1,
                }}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color={theme.onAccent} />
                ) : (
                  <Sparkles size={13} color={theme.onAccent} />
                )}
                <Text style={{ color: theme.onAccent, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
                  {aiLoading ? 'ANALYZING…' : aiDangerAnalysis ? 'RE-RUN ANALYSIS' : 'ANALYZE MY DANGER TIMES'}
                </Text>
              </Pressable>
            </View>

            {/* Risk time */}
            {stats.peakHourCount > 0 && (
              <InsightCard
                icon={Clock}
                title="Peak risk hour"
                subtitle={`${stats.peakHourCount} fall${stats.peakHourCount === 1 ? '' : 's'} logged around ${formatHour(stats.peakHour)}`}
              >
                <HourStrip hours={stats.hours} peak={stats.peakHour} />
              </InsightCard>
            )}

            {/* HALT */}
            {checkInEvents.length > 0 && (
              <InsightCard
                icon={Brain}
                title="HALT flags"
                subtitle="How often each shows up in check-ins"
              >
                <BarList
                  items={[
                    { label: 'Hungry', value: stats.halt.hungry, icon: Utensils },
                    { label: 'Angry', value: stats.halt.angry, icon: Flame },
                    { label: 'Lonely', value: stats.halt.lonely, icon: HeartCrack },
                    { label: 'Tired', value: stats.halt.tired, icon: Moon },
                  ]}
                  total={checkInEvents.length}
                />
              </InsightCard>
            )}

            {/* Emotional triggers */}
            {stats.emotional.length > 0 && (
              <InsightCard
                icon={HeartCrack}
                title="Emotional triggers"
                subtitle="Feelings present during falls"
              >
                <BarList items={stats.emotional} total={fallEvents.length} />
              </InsightCard>
            )}

            {/* Situational */}
            {stats.situational.length > 0 && (
              <InsightCard
                icon={AlertTriangle}
                title="Situational triggers"
                subtitle="Contexts present during falls"
              >
                <BarList items={stats.situational} total={fallEvents.length} />
              </InsightCard>
            )}

            {/* Digital */}
            {stats.digital.length > 0 && (
              <InsightCard
                icon={AlertTriangle}
                title="Digital triggers"
                subtitle="Apps / content preceding falls"
              >
                <BarList items={stats.digital} total={fallEvents.length} />
              </InsightCard>
            )}

            {/* Precursors */}
            {stats.precursors.length > 0 && (
              <InsightCard
                icon={AlertTriangle}
                title="Common precursors"
                subtitle="Early-warning signals"
              >
                <BarList items={stats.precursors} total={fallEvents.length} />
              </InsightCard>
            )}

            {/* Tactics */}
            {stats.tactics.length > 0 && (
              <InsightCard
                icon={ShieldCheck}
                title="Tactics that work"
                subtitle="Highest-rated close-call saves"
              >
                <View style={{ gap: 8 }}>
                  {stats.tactics.map((t) => (
                    <View
                      key={t.name}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>{t.name}</Text>
                      <Text style={{ color: theme.muted, fontSize: 11 }}>
                        {t.count}× · {t.avg.toFixed(1)}/5
                      </Text>
                      <View
                        style={{
                          width: 44,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: theme.surface2,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: `${(t.avg / 5) * 100}%`,
                            height: '100%',
                            backgroundColor: theme.success,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </InsightCard>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

// =============================================================================
// Helpers
// =============================================================================

function topEntries(map: Map<string, number>): { label: string; value: number }[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([label, value]) => ({ label: prettifyTag(label), value }));
}

function prettifyTag(raw: string): string {
  return raw
    .replace(/^halt-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatHour(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

// =============================================================================
// Sub-components
// =============================================================================

const EmptyState: React.FC = () => {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.hairline,
        marginTop: 24,
      }}
    >
      <Brain size={32} color={theme.muted} />
      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 12 }}>
        Not enough data yet
      </Text>
      <Text
        style={{
          color: theme.muted,
          fontSize: 13,
          textAlign: 'center',
          marginTop: 6,
          lineHeight: 18,
        }}
      >
        Log check-ins, close-calls, and (if they happen) falls. Patterns emerge after ~5 entries.
      </Text>
    </View>
  );
};

const OverviewCard: React.FC<{
  icon: any;
  label: string;
  value: string;
  color: string;
  sub?: string;
}> = ({ icon: Icon, label, value, color, sub }) => {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon size={12} color={color} />
        <Text style={{ color: theme.muted, fontSize: 11 }}>{label}</Text>
      </View>
      <Text style={{ color, fontSize: 22, fontWeight: '700', marginTop: 4 }}>{value}</Text>
      {sub && <Text style={{ color: theme.muted, fontSize: 10, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
};

const InsightCard: React.FC<{
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, children }) => {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={16} color={theme.accent} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{title}</Text>
          {subtitle && (
            <Text style={{ color: theme.muted, fontSize: 11, marginTop: 1 }}>{subtitle}</Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );
};

const BarList: React.FC<{
  items: { label: string; value: number; icon?: any }[];
  total: number;
}> = ({ items, total }) => {
  const theme = useTheme();
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => {
        const Icon = item.icon;
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <View
            key={item.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            {Icon && <Icon size={12} color={theme.muted} />}
            <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>{item.label}</Text>
            <Text style={{ color: theme.muted, fontSize: 11, minWidth: 48, textAlign: 'right' }}>
              {item.value}× · {pct}%
            </Text>
            <View
              style={{
                width: 44,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.surface2,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${(item.value / max) * 100}%`,
                  height: '100%',
                  backgroundColor: theme.accent,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const HourStrip: React.FC<{ hours: number[]; peak: number }> = ({ hours, peak }) => {
  const theme = useTheme();
  const max = Math.max(...hours, 1);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 44, gap: 2 }}>
        {hours.map((count, h) => (
          <View
            key={h}
            style={{
              flex: 1,
              height: `${Math.max((count / max) * 100, 2)}%`,
              backgroundColor: h === peak ? theme.danger : theme.surface2,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: theme.muted, fontSize: 10 }}>12a</Text>
        <Text style={{ color: theme.muted, fontSize: 10 }}>6a</Text>
        <Text style={{ color: theme.muted, fontSize: 10 }}>12p</Text>
        <Text style={{ color: theme.muted, fontSize: 10 }}>6p</Text>
        <Text style={{ color: theme.muted, fontSize: 10 }}>11p</Text>
      </View>
    </View>
  );
};
