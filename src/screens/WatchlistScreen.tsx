import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import {
  ChevronLeft,
  Plus,
  Eye,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Lock,
  X,
  Trash2,
  MessageSquareWarning,
  Smartphone,
  Globe,
  MapPin,
  User,
  HeartCrack,
  CalendarClock,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import {
  useStore,
  type WatchType,
  type WatchLevel,
  type DangerWatchItem,
} from '../store/useStore';

// =============================================================================
// Watchlist (§2.12) — CRUD over dangerWatchlist.
// Users add things that put them at risk, set a response level, see what
// actually precedes falls vs. close-calls vs. clean days.
// =============================================================================

interface Props {
  onBack: () => void;
}

const TYPE_META: Record<WatchType, { label: string; icon: any; placeholder: string }> = {
  app: { label: 'App', icon: Smartphone, placeholder: 'Instagram, Reddit, Snapchat…' },
  website: { label: 'Website', icon: Globe, placeholder: 'example.com' },
  time: { label: 'Time', icon: Clock, placeholder: 'late night, post-lunch…' },
  location: { label: 'Location', icon: MapPin, placeholder: 'alone in bedroom, hotel…' },
  person: { label: 'Person', icon: User, placeholder: 'a name / role' },
  emotion: { label: 'Emotion', icon: HeartCrack, placeholder: 'lonely, bored, angry…' },
  event: { label: 'Event', icon: CalendarClock, placeholder: 'argument, rejection…' },
  custom: { label: 'Custom', icon: Sparkles, placeholder: 'anything else' },
};

const LEVELS: { id: WatchLevel; label: string; sub: string; icon: any }[] = [
  { id: 'notice', label: 'Notice', sub: 'Just flag it.', icon: Eye },
  { id: 'warn', label: 'Warn', sub: 'Visual nudge.', icon: AlertTriangle },
  { id: 'delay', label: 'Delay', sub: '10s pause first.', icon: Clock },
  { id: 'mantra-gate', label: 'Mantra gate', sub: 'Type mantra to pass.', icon: MessageSquareWarning },
  { id: 'partner-alert', label: 'Partner alert', sub: 'Notify partner.', icon: ShieldAlert },
  { id: 'hard-block', label: 'Hard block', sub: 'Full stop.', icon: Lock },
];

export const WatchlistScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const dangerWatchlist = useStore((s) => s.dangerWatchlist);
  const addWatchItem = useStore((s) => s.addWatchItem);
  const updateWatchItem = useStore((s) => s.updateWatchItem);
  const removeWatchItem = useStore((s) => s.removeWatchItem);

  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | WatchType>('all');

  const visible = useMemo(
    () => (filter === 'all' ? dangerWatchlist : dangerWatchlist.filter((w) => w.type === filter)),
    [dangerWatchlist, filter],
  );

  const totals = useMemo(() => {
    return dangerWatchlist.reduce(
      (acc, w) => {
        acc.triggered += w.stats.timesTriggered;
        acc.falls += w.stats.timesFollowedByFall;
        acc.clean += w.stats.timesSurvivedClean;
        return acc;
      },
      { triggered: 0, falls: 0, clean: 0 },
    );
  }, [dangerWatchlist]);

  return (
    <Screen>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        <Pressable onPress={onBack} style={{ padding: 6 }}>
          <ChevronLeft size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>Watchlist</Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
            Things that put you at risk — and how Guard should respond.
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAdd(true)}
          style={{
            backgroundColor: theme.accent,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={16} color={theme.onAccent} />
          <Text style={{ color: theme.onAccent, fontWeight: '700', fontSize: 13 }}>Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Stats summary */}
        {dangerWatchlist.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <StatBox label="Triggers" value={totals.triggered} color={theme.muted} />
            <StatBox label="Clean wins" value={totals.clean} color="#22c55e" icon={TrendingUp} />
            <StatBox label="Falls" value={totals.falls} color="#ef4444" icon={TrendingDown} />
          </View>
        )}

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingBottom: 4 }}
          style={{ marginBottom: 12 }}
        >
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          {(Object.keys(TYPE_META) as WatchType[]).map((t) => (
            <FilterChip
              key={t}
              label={TYPE_META[t].label}
              active={filter === t}
              onPress={() => setFilter(t)}
            />
          ))}
        </ScrollView>

        {/* List */}
        {visible.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          visible.map((w) => (
            <WatchCard
              key={w.id}
              item={w}
              onUpdate={(patch) => updateWatchItem(w.id, patch)}
              onRemove={() => removeWatchItem(w.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <AddWatchOverlay
            onCancel={() => setShowAdd(false)}
            onSave={(item) => {
              addWatchItem(item);
              setShowAdd(false);
            }}
          />
        )}
      </AnimatePresence>
    </Screen>
  );
};

// =============================================================================
// Sub-components
// =============================================================================

const StatBox: React.FC<{ label: string; value: number; color: string; icon?: any }> = ({
  label,
  value,
  color,
  icon: Icon,
}) => {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.surface,
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: theme.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {Icon && <Icon size={12} color={color} />}
        <Text style={{ color: theme.muted, fontSize: 11 }}>{label}</Text>
      </View>
      <Text style={{ color, fontSize: 20, fontWeight: '700', marginTop: 2 }}>{value}</Text>
    </View>
  );
};

const FilterChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label,
  active,
  onPress,
}) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: active ? theme.accent : theme.surface,
        borderWidth: 1,
        borderColor: active ? theme.accent : theme.hairline,
      }}
    >
      <Text style={{ color: active ? theme.onAccent : theme.text, fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
};

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
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
        marginTop: 8,
      }}
    >
      <ShieldAlert size={32} color={theme.muted} />
      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginTop: 12 }}>
        Your watchlist is empty
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
        Add the apps, times, places, and emotions that put you at risk. Guard will warn you, delay
        you, or block you — your choice, per item.
      </Text>
      <Pressable
        onPress={onAdd}
        style={{
          marginTop: 16,
          backgroundColor: theme.accent,
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Plus size={16} color={theme.onAccent} />
        <Text style={{ color: theme.onAccent, fontWeight: '700' }}>Add first item</Text>
      </Pressable>
    </View>
  );
};

const WatchCard: React.FC<{
  item: DangerWatchItem;
  onUpdate: (patch: Partial<DangerWatchItem>) => void;
  onRemove: () => void;
}> = ({ item, onUpdate, onRemove }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const Icon = TYPE_META[item.type].icon;
  const levelMeta = LEVELS.find((l) => l.id === item.level)!;
  const LevelIcon = levelMeta.icon;

  const survivalRate = (() => {
    const total = item.stats.timesFollowedByFall + item.stats.timesSurvivedClean;
    if (total === 0) return null;
    return Math.round((item.stats.timesSurvivedClean / total) * 100);
  })();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={{
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.hairline,
      }}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: theme.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={theme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>{item.label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <LevelIcon size={10} color={theme.muted} />
            <Text style={{ color: theme.muted, fontSize: 11 }}>{levelMeta.label}</Text>
            {survivalRate !== null && (
              <>
                <Text style={{ color: theme.muted, fontSize: 11 }}>·</Text>
                <Text
                  style={{
                    color: survivalRate >= 70 ? '#22c55e' : survivalRate >= 40 ? theme.accent : '#ef4444',
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {survivalRate}% clean
                </Text>
              </>
            )}
          </View>
        </View>
      </Pressable>

      <AnimatePresence>
        {expanded && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' as any }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 12, overflow: 'hidden' }}
          >
            <Text style={{ color: theme.muted, fontSize: 11, marginBottom: 6 }}>Response</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {LEVELS.map((l) => {
                const active = l.id === item.level;
                const LIcon = l.icon;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => onUpdate({ level: l.id })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: active ? theme.accent : theme.bg,
                      borderWidth: 1,
                      borderColor: active ? theme.accent : theme.hairline,
                    }}
                  >
                    <LIcon size={10} color={active ? theme.onAccent : theme.muted} />
                    <Text
                      style={{
                        color: active ? theme.onAccent : theme.text,
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      {l.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Stats detail */}
            <View
              style={{
                flexDirection: 'row',
                gap: 6,
                marginTop: 14,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: theme.hairline,
              }}
            >
              <MiniStat label="Triggers" value={item.stats.timesTriggered} />
              <MiniStat label="Clean" value={item.stats.timesSurvivedClean} color="#22c55e" />
              <MiniStat label="Close" value={item.stats.timesFollowedByCloseCall} color={theme.accent} />
              <MiniStat label="Fall" value={item.stats.timesFollowedByFall} color="#ef4444" />
            </View>

            {/* Remove */}
            <Pressable
              onPress={() => {
                if (confirmRemove) onRemove();
                else setConfirmRemove(true);
              }}
              style={{
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: confirmRemove ? '#ef4444' : theme.bg,
                borderWidth: 1,
                borderColor: confirmRemove ? '#ef4444' : theme.hairline,
              }}
            >
              <Trash2 size={12} color={confirmRemove ? '#fff' : theme.muted} />
              <Text
                style={{
                  color: confirmRemove ? '#fff' : theme.muted,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {confirmRemove ? 'Tap again to confirm' : 'Remove'}
              </Text>
            </Pressable>
          </MotiView>
        )}
      </AnimatePresence>
    </MotiView>
  );
};

const MiniStat: React.FC<{ label: string; value: number; color?: string }> = ({
  label,
  value,
  color,
}) => {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: color ?? theme.text, fontSize: 16, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: theme.muted, fontSize: 10, marginTop: 1 }}>{label}</Text>
    </View>
  );
};

// =============================================================================
// Add watch item overlay
// =============================================================================

const AddWatchOverlay: React.FC<{
  onCancel: () => void;
  onSave: (item: Omit<DangerWatchItem, 'id' | 'createdAt' | 'stats'>) => void;
}> = ({ onCancel, onSave }) => {
  const theme = useTheme();
  const [type, setType] = useState<WatchType>('app');
  const [label, setLabel] = useState('');
  const [detectorValue, setDetectorValue] = useState('');
  const [level, setLevel] = useState<WatchLevel>('warn');

  const canSave = label.trim().length > 0;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
      }}
    >
      <MotiView
        from={{ translateY: 400 }}
        animate={{ translateY: 0 }}
        exit={{ translateY: 400 }}
        style={{
          backgroundColor: theme.bg,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: 20,
          maxHeight: '85%',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', flex: 1 }}>
            Add to watchlist
          </Text>
          <Pressable onPress={onCancel} style={{ padding: 6 }}>
            <X size={20} color={theme.muted} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Type picker */}
          <Text style={{ color: theme.muted, fontSize: 11, marginBottom: 6 }}>Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {(Object.keys(TYPE_META) as WatchType[]).map((t) => {
              const meta = TYPE_META[t];
              const active = t === type;
              const TIcon = meta.icon;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: active ? theme.accent : theme.surface,
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.hairline,
                  }}
                >
                  <TIcon size={12} color={active ? theme.onAccent : theme.muted} />
                  <Text
                    style={{
                      color: active ? theme.onAccent : theme.text,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Label */}
          <Text style={{ color: theme.muted, fontSize: 11, marginBottom: 6 }}>Name</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder={TYPE_META[type].placeholder}
            placeholderTextColor={theme.muted}
            style={{
              backgroundColor: theme.surface,
              color: theme.text,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.hairline,
              fontSize: 14,
              marginBottom: 14,
            }}
          />

          {/* Detector (optional further detail) */}
          <Text style={{ color: theme.muted, fontSize: 11, marginBottom: 6 }}>
            Detail (optional)
          </Text>
          <TextInput
            value={detectorValue}
            onChangeText={setDetectorValue}
            placeholder="e.g. specific handle, url, time range…"
            placeholderTextColor={theme.muted}
            style={{
              backgroundColor: theme.surface,
              color: theme.text,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.hairline,
              fontSize: 14,
              marginBottom: 14,
            }}
          />

          {/* Level picker */}
          <Text style={{ color: theme.muted, fontSize: 11, marginBottom: 6 }}>
            Response level
          </Text>
          <View style={{ gap: 6, marginBottom: 18 }}>
            {LEVELS.map((l) => {
              const active = l.id === level;
              const LIcon = l.icon;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => setLevel(l.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: active ? theme.accent : theme.surface,
                    borderWidth: 1,
                    borderColor: active ? theme.accent : theme.hairline,
                  }}
                >
                  <LIcon size={16} color={active ? theme.onAccent : theme.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: active ? theme.onAccent : theme.text, fontSize: 13, fontWeight: '600' }}>
                      {l.label}
                    </Text>
                    <Text style={{ color: active ? theme.onAccent : theme.muted, opacity: active ? 0.8 : 1, fontSize: 11, marginTop: 1 }}>
                      {l.sub}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            disabled={!canSave}
            onPress={() =>
              onSave({
                type,
                label: label.trim(),
                detector: { kind: type, value: detectorValue.trim() || label.trim() },
                level,
                suggestedBy: 'user',
              })
            }
            style={{
              backgroundColor: canSave ? theme.accent : theme.surface,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              opacity: canSave ? 1 : 0.5,
            }}
          >
            <Text style={{ color: canSave ? theme.onAccent : theme.muted, fontWeight: '700', fontSize: 15 }}>
              Save to watchlist
            </Text>
          </Pressable>
        </ScrollView>
      </MotiView>
    </MotiView>
  );
};
