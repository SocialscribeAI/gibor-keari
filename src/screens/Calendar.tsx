import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { ChevronLeft, ChevronRight, Check, X, AlertTriangle, Shield, Edit3, Trash2 } from 'lucide-react-native';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isToday,
  isSameMonth,
  isFuture,
} from 'date-fns';
import { Screen } from '../components/Screen';
import { useStore, type LogEntry } from '../store/useStore';
import { getInsightMessage, getMonthSummary } from '../utils/patternEngine';
import { useTheme } from '../constants/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Layer = 'status' | 'events' | 'notes' | 'heatmap';

export const Calendar: React.FC = () => {
  const { calendarLog, calendarNotes, closeCallEvents, fallEvents, setCalendarEntry, setCalendarNote } =
    useStore();
  const theme = useTheme();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [layer, setLayer] = useState<Layer>('status');

  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const all = eachDayOfInterval({ start, end });
    const padStart = getDay(start);
    return { padStart, all };
  }, [cursor]);

  const summary = useMemo(
    () => getMonthSummary(calendarLog, cursor.getFullYear(), cursor.getMonth()),
    [calendarLog, cursor]
  );

  const insight = useMemo(() => getInsightMessage(calendarLog), [calendarLog]);

  const closeCallByDay = useMemo(() => {
    const map: Record<string, number> = {};
    closeCallEvents.forEach((e) => {
      const k = e.dayKey;
      map[k] = (map[k] ?? 0) + 1;
    });
    return map;
  }, [closeCallEvents]);

  const fallsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    fallEvents.forEach((e) => {
      const k = e.dayKey;
      map[k] = (map[k] ?? 0) + 1;
    });
    return map;
  }, [fallEvents]);

  const statusColor = (status?: LogEntry) => {
    if (status === 'win') return 'rgba(30, 138, 74, 0.7)';
    if (status === 'fall') return 'rgba(192, 57, 43, 0.7)';
    if (status === 'medium') return 'rgba(232, 160, 32, 0.7)';
    if (status === 'close-call') return 'rgba(232, 160, 32, 0.35)';
    // Subtle "empty cell" tint that shows in BOTH themes (theme.hairline is
    // alpha-blended over guard-bg).
    return theme.hairline;
  };

  const handleDayPress = (key: string, d: Date) => {
    if (isFuture(d)) return;
    setSelected(key);
    setNoteDraft(calendarNotes[key] ?? '');
  };

  const openEditor = () => {
    if (!selected) return;
    setEditorOpen(true);
  };

  const applyStatus = (next: LogEntry | null) => {
    if (!selected) return;
    setCalendarEntry(selected, next);
  };

  const saveNote = () => {
    if (!selected) return;
    setCalendarNote(selected, noteDraft);
    setEditorOpen(false);
  };

  const clearDay = () => {
    if (!selected) return;
    setCalendarEntry(selected, null);
    setCalendarNote(selected, '');
    setNoteDraft('');
    setEditorOpen(false);
  };

  const selectedEntry = selected ? calendarLog[selected] : undefined;
  const selectedNote = selected ? calendarNotes[selected] : undefined;

  const statusLabel = (s?: LogEntry) => {
    if (s === 'win') return '✓ Win';
    if (s === 'fall') return '✕ Fall';
    if (s === 'medium') return '~ Struggled';
    if (s === 'close-call') return '◇ Close call';
    return 'No entry yet';
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={() => setCursor(subMonths(cursor, 1))}
          className="p-2 rounded-xl bg-guard-surface"
        >
          <ChevronLeft size={20} color={theme.text} />
        </Pressable>
        <Text className="text-2xl font-black text-white">{format(cursor, 'MMMM yyyy')}</Text>
        <Pressable
          onPress={() => setCursor(addMonths(cursor, 1))}
          className="p-2 rounded-xl bg-guard-surface"
        >
          <ChevronRight size={20} color={theme.text} />
        </Pressable>
      </View>

      <View className="flex-row mb-4 gap-2">
        {([
          { k: 'status', label: 'Status' },
          { k: 'events', label: 'Events' },
          { k: 'heatmap', label: 'Heatmap' },
          { k: 'notes', label: 'Notes' },
        ] as const).map((o) => (
          <Pressable
            key={o.k}
            onPress={() => setLayer(o.k)}
            className="flex-1 rounded-xl py-2 items-center"
            style={{
              backgroundColor: layer === o.k ? theme.accent : theme.surface,
              borderWidth: 1,
              borderColor: layer === o.k ? theme.accent : theme.hairline,
            }}
          >
            <Text
              className="text-[11px] font-bold"
              style={{ color: layer === o.k ? theme.onAccent : theme.mutedStrong }}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row mb-2">
        {WEEKDAYS.map((w, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-white/40 text-[10px] font-bold">{w}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {Array.from({ length: days.padStart }).map((_, i) => (
          <View key={`pad-${i}`} style={{ width: '14.2857%' }} className="aspect-square p-1" />
        ))}
        {days.all.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const status = calendarLog[key];
          const hasNote = !!calendarNotes[key];
          const closeCalls = closeCallByDay[key] ?? 0;
          const falls = fallsByDay[key] ?? 0;
          const isSel = selected === key;
          const disabled = isFuture(d);

          let bg = statusColor(status);
          if (layer === 'heatmap') {
            if (status === 'fall') bg = 'rgba(192,57,43,0.7)';
            else if (status === 'win') bg = 'rgba(30,138,74,0.5)';
            else if (closeCalls > 0) bg = 'rgba(232,160,32,0.3)';
            else bg = theme.hairline;
          } else if (layer === 'notes' && !hasNote) {
            bg = theme.hairline;
          } else if (layer === 'events') {
            bg = theme.hairline;
          }

          return (
            <Pressable
              key={key}
              onPress={() => handleDayPress(key, d)}
              style={{ width: '14.2857%' }}
              className="aspect-square p-1"
              disabled={disabled}
            >
              <View
                className={`flex-1 rounded-xl items-center justify-center ${
                  isSel ? 'border-2 border-guard-accent' : ''
                } ${isToday(d) && !isSel ? 'border border-white/40' : ''}`}
                style={{ backgroundColor: bg, opacity: disabled ? 0.25 : 1 }}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSameMonth(d, cursor) ? 'text-white' : 'text-white/30'
                  }`}
                >
                  {format(d, 'd')}
                </Text>
                {(layer === 'events' || layer === 'status') && (
                  <View className="flex-row absolute bottom-1 gap-0.5">
                    {Array.from({ length: Math.min(closeCalls, 3) }).map((_, i) => (
                      <View
                        key={`cc-${i}`}
                        style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.accent }}
                      />
                    ))}
                    {Array.from({ length: Math.min(falls, 3) }).map((_, i) => (
                      <View
                        key={`f-${i}`}
                        style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.danger }}
                      />
                    ))}
                  </View>
                )}
                {hasNote && layer === 'notes' && (
                  <View
                    className="absolute top-1 right-1 rounded-full"
                    style={{ width: 6, height: 6, backgroundColor: theme.primary }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-4 px-1">
        <LegendDot color="rgba(30,138,74,0.7)" label="Win" />
        <LegendDot color="rgba(232,160,32,0.7)" label="Struggled" />
        <LegendDot color="rgba(232,160,32,0.35)" label="Close call" />
        <LegendDot color="rgba(192,57,43,0.7)" label="Fall" />
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mt-6">
        <Text className="text-white/50 text-xs uppercase tracking-widest mb-3">This Month</Text>
        <View className="flex-row justify-between">
          <SummaryCell value={summary.wins} label="wins" color="text-guard-success" />
          <SummaryCell value={summary.mediums} label="mediums" color="text-guard-accent" />
          <SummaryCell value={summary.falls} label="falls" color="text-guard-danger" />
          <SummaryCell value={summary.percentClean} label="clean" color="text-white" suffix="%" />
        </View>
      </View>

      <View className="bg-guard-primary/10 border border-guard-primary/30 rounded-3xl p-5 mt-4">
        <Text className="text-guard-accent text-xs uppercase tracking-widest mb-2">Pattern Insight</Text>
        <Text className="text-white/80 leading-6">{insight}</Text>
      </View>

      {selected && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mt-4 mb-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/50 text-xs uppercase tracking-widest">
              {format(new Date(selected), 'EEEE, MMM d')}
            </Text>
            <Pressable
              onPress={openEditor}
              className="flex-row items-center rounded-full px-3 py-1"
              style={{ backgroundColor: 'rgba(232,160,32,0.15)' }}
            >
              <Edit3 size={12} color="#E8A020" />
              <Text className="text-guard-accent text-[11px] font-bold ml-1.5">EDIT</Text>
            </Pressable>
          </View>
          <Text className="text-white font-black text-lg mb-1">{statusLabel(selectedEntry)}</Text>
          {(closeCallByDay[selected] ?? 0) > 0 && (
            <Text className="text-white/60 text-xs">
              {closeCallByDay[selected]} close call{closeCallByDay[selected] > 1 ? 's' : ''} intercepted — those are wins.
            </Text>
          )}

          {/* Event timeline with time-of-day — §calendar-time-tracking */}
          {(() => {
            const timeline = [
              ...fallEvents
                .filter((e) => e.dayKey === selected)
                .map((e) => ({ kind: 'fall' as const, date: e.date, id: e.id })),
              ...closeCallEvents
                .filter((e) => e.dayKey === selected)
                .map((e) => ({
                  kind: 'close-call' as const,
                  date: e.date,
                  id: e.id,
                  trigger: e.trigger,
                })),
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (timeline.length === 0) return null;
            return (
              <View className="mt-3">
                <Text className="text-white/40 text-[10px] uppercase tracking-widest mb-2">
                  When it happened
                </Text>
                {timeline.map((ev) => (
                  <View
                    key={ev.id}
                    className="flex-row items-center rounded-xl px-3 py-2 mb-1"
                    style={{ backgroundColor: theme.surface }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: ev.kind === 'fall' ? '#C0392B' : '#E8A020',
                        marginRight: 10,
                      }}
                    />
                    <Text className="text-white/80 font-mono text-xs" style={{ width: 60 }}>
                      {format(new Date(ev.date), 'h:mm a')}
                    </Text>
                    <Text className="text-white/70 text-xs flex-1">
                      {ev.kind === 'fall' ? 'Fall logged' : `Close call — ${(ev as any).trigger ?? 'urge'}`}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })()}

          {selectedNote ? (
            <View className="mt-3 rounded-xl p-3" style={{ backgroundColor: theme.surface }}>
              <Text className="text-white/80 leading-6 text-sm">{selectedNote}</Text>
            </View>
          ) : (
            <Text className="text-white/30 text-xs mt-2 italic">No note for this day yet.</Text>
          )}
        </MotiView>
      )}

      <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => setEditorOpen(false)}>
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-guard-bg rounded-t-3xl px-6 pt-6 pb-10"
            style={{ borderTopWidth: 1, borderColor: theme.hairline }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit' }}>
                {selected ? format(new Date(selected), 'EEEE, MMM d') : ''}
              </Text>
              <Pressable
                onPress={() => setEditorOpen(false)}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: theme.surface }}
              >
                <X size={16} color={theme.text} />
              </Pressable>
            </View>

            <Text className="text-white/50 text-xs uppercase tracking-widest mb-3">Status</Text>
            <View className="flex-row gap-2 mb-5">
              <StatusChip label="Win" icon={Check} color="#1E8A4A" active={selectedEntry === 'win'} onPress={() => applyStatus('win')} />
              <StatusChip label="Struggle" icon={AlertTriangle} color="#E8A020" active={selectedEntry === 'medium'} onPress={() => applyStatus('medium')} />
              <StatusChip label="Close call" icon={Shield} color="#E8A020" active={selectedEntry === 'close-call'} onPress={() => applyStatus('close-call')} />
              <StatusChip label="Fall" icon={X} color="#C0392B" active={selectedEntry === 'fall'} onPress={() => applyStatus('fall')} />
            </View>

            <Text className="text-white/50 text-xs uppercase tracking-widest mb-2">Note</Text>
            <ScrollView style={{ maxHeight: 160 }}>
              <TextInput
                value={noteDraft}
                onChangeText={setNoteDraft}
                multiline
                placeholder="What happened? What did you learn?"
                placeholderTextColor={theme.textDim}
                className="rounded-2xl px-4 py-3"
                style={{
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.hairline,
                  minHeight: 100,
                  textAlignVertical: 'top',
                  fontSize: 14,
                  lineHeight: 22,
                }}
              />
            </ScrollView>

            <Pressable
              onPress={saveNote}
              className="rounded-2xl py-4 items-center mt-5"
              style={{ backgroundColor: theme.accent }}
            >
              <Text className="text-guard-on-accent font-black uppercase tracking-widest">Save</Text>
            </Pressable>

            <Pressable onPress={clearDay} className="flex-row items-center justify-center py-3 mt-2">
              <Trash2 size={14} color="rgba(192,57,43,0.8)" />
              <Text className="text-guard-danger/80 font-bold ml-2 text-xs uppercase tracking-widest">
                Clear this day
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View className="flex-row items-center">
    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
    <Text className="text-white/50 text-[11px] ml-2">{label}</Text>
  </View>
);

const SummaryCell: React.FC<{ value: number; label: string; color: string; suffix?: string }> = ({
  value,
  label,
  color,
  suffix,
}) => (
  <View>
    <Text className={`text-3xl font-black ${color}`}>
      {value}
      {suffix}
    </Text>
    <Text className="text-white/50 text-xs">{label}</Text>
  </View>
);

const StatusChip: React.FC<{
  label: string;
  icon: any;
  color: string;
  active: boolean;
  onPress: () => void;
}> = ({ label, icon: Icon, color, active, onPress }) => {
  const theme = useTheme();
  // Pick a readable foreground for the active (filled) state. Gold needs dark
  // text; red/green are dark enough that white reads cleanly.
  const isLightFill = color.toLowerCase() === '#e8a020';
  const onActive = isLightFill ? '#0F1120' : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-2xl py-3 items-center"
      style={{
        backgroundColor: active ? color : theme.surface,
        borderWidth: 1,
        borderColor: active ? color : theme.hairline,
      }}
    >
      <Icon size={16} color={active ? onActive : theme.mutedStrong} />
      <Text className="text-[10px] font-bold mt-1" style={{ color: active ? onActive : theme.mutedStrong }}>
        {label}
      </Text>
    </Pressable>
  );
};
