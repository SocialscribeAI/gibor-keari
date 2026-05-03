import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  Brain,
  Target,
  CircleDot,
  AlertTriangle,
  Plus,
  X,
  Edit3,
  Archive,
  Trash2,
  RefreshCcw,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import type {
  KbCategory,
  KbImportance,
  KnowledgeBaseEntry,
  AssessmentSource,
  InferenceMode,
} from '../store/useStore';
import { useTheme } from '../constants/theme';

// =============================================================================
// CoachKnowledgeBaseScreen — "What Coach Knows About You"
//
// The therapist's chart, fully visible to the user. Coach writes here via
// kb_* tools while you talk. Every entry shows where it came from
// (`coach picked up on this` / `you said this` / `from your activity`) so
// you can correct anything that's wrong. Auto-write vs Confirm-first is
// togglable here too.
// =============================================================================

interface Props {
  onBack: () => void;
}

const CATEGORY_LABEL: Record<KbCategory, string> = {
  theme: 'Themes',
  event: 'Events',
  pattern: 'Patterns',
  commitment: 'Commitments',
  'identity-statement': 'Identity statements',
  relationship: 'Relationships',
  breakthrough: 'Breakthroughs',
  concern: 'Concerns',
  preference: 'Preferences',
};

const CATEGORY_ORDER: KbCategory[] = [
  'identity-statement',
  'commitment',
  'breakthrough',
  'theme',
  'pattern',
  'relationship',
  'event',
  'concern',
  'preference',
];

const IMPORTANCE_RANK: Record<KbImportance, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const SOURCE_LABEL: Record<AssessmentSource, string> = {
  'user-stated': 'you said this',
  'coach-inferred': 'coach picked up on this',
  'pattern-detected': 'from your activity',
  'event-derived': 'from a logged event',
  unknown: 'unknown source',
};

export const CoachKnowledgeBaseScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const {
    coachKnowledgeBase,
    inferenceMode,
    setInferenceMode,
    kbUpdateEntry,
    kbArchiveEntry,
    kbDeleteEntry,
    kbAddEntry,
    kbSetCurrentAvodah,
    kbAddOpenLoop,
    kbResolveOpenLoop,
    kbAddRedFlag,
    kbClearRedFlag,
  } = useStore();

  const [editingEntry, setEditingEntry] = useState<KnowledgeBaseEntry | null>(null);
  const [composingNew, setComposingNew] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [avodahDraft, setAvodahDraft] = useState(coachKnowledgeBase.currentAvodah);
  const [newLoop, setNewLoop] = useState('');
  const [newFlag, setNewFlag] = useState('');

  // Group entries by category, importance-sorted within each.
  const grouped = useMemo(() => {
    const out: Partial<Record<KbCategory, KnowledgeBaseEntry[]>> = {};
    for (const e of coachKnowledgeBase.entries) {
      if (!showArchived && e.archived) continue;
      (out[e.category] = out[e.category] ?? []).push(e);
    }
    for (const cat of Object.keys(out) as KbCategory[]) {
      out[cat]!.sort((a, b) => {
        const diff = IMPORTANCE_RANK[b.importance] - IMPORTANCE_RANK[a.importance];
        if (diff !== 0) return diff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }
    return out;
  }, [coachKnowledgeBase.entries, showArchived]);

  const totalActive = coachKnowledgeBase.entries.filter((e) => !e.archived).length;
  const totalArchived = coachKnowledgeBase.entries.length - totalActive;

  const saveAvodah = () => {
    if (avodahDraft !== coachKnowledgeBase.currentAvodah) {
      kbSetCurrentAvodah(avodahDraft);
    }
  };

  const handleAddLoop = () => {
    if (!newLoop.trim()) return;
    kbAddOpenLoop(newLoop);
    setNewLoop('');
  };

  const handleAddFlag = () => {
    if (!newFlag.trim()) return;
    kbAddRedFlag(newFlag);
    setNewFlag('');
  };

  const confirmDelete = (entry: KnowledgeBaseEntry) => {
    Alert.alert(
      'Delete this note?',
      `"${entry.title}"\n\nThis is permanent — coach will lose this context. Use Archive instead if you want to keep it on file.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            kbDeleteEntry(entry.id);
            setEditingEntry(null);
          },
        },
      ],
    );
  };

  return (
    <Screen>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={onBack} className="flex-row items-center">
          <ChevronLeft size={20} color={theme.muted} />
          <Text className="text-sm ml-1" style={{ color: theme.muted }}>
            About Me
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setComposingNew(true)}
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: theme.accent }}
        >
          <Plus size={14} color={theme.onAccent} />
          <Text className="text-xs font-black ml-1" style={{ color: theme.onAccent }}>
            ADD NOTE
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-2">
          <Text className="text-3xl font-black mb-2" style={{ color: theme.text, fontFamily: 'Outfit' }}>
            What Coach knows
          </Text>
          <Text className="leading-6 mb-4" style={{ color: theme.muted }}>
            The therapist&apos;s chart. Coach writes here while you talk. Every entry is yours
            to edit or delete — if anything is wrong, fix it.
          </Text>
          <View className="flex-row gap-2 mb-4">
            <View
              className="flex-1 rounded-2xl p-3 items-center"
              style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
            >
              <Text className="text-2xl font-black" style={{ color: theme.text }}>
                {totalActive}
              </Text>
              <Text className="text-[10px] uppercase tracking-widest mt-1" style={{ color: theme.muted }}>
                Active notes
              </Text>
            </View>
            <View
              className="flex-1 rounded-2xl p-3 items-center"
              style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
            >
              <Text className="text-2xl font-black" style={{ color: theme.text }}>
                {coachKnowledgeBase.openLoops.length}
              </Text>
              <Text className="text-[10px] uppercase tracking-widest mt-1" style={{ color: theme.muted }}>
                Open loops
              </Text>
            </View>
            <View
              className="flex-1 rounded-2xl p-3 items-center"
              style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
            >
              <Text className="text-2xl font-black" style={{ color: theme.text }}>
                {coachKnowledgeBase.redFlags.length}
              </Text>
              <Text className="text-[10px] uppercase tracking-widest mt-1" style={{ color: theme.muted }}>
                Red flags
              </Text>
            </View>
          </View>
        </View>

        {/* Inference mode toggle */}
        <SectionHeader icon={Brain} title="How Coach takes notes" theme={theme} />
        <View className="flex-row gap-2 mb-6">
          <ModeButton
            mode="auto"
            active={inferenceMode === 'auto'}
            onPress={() => setInferenceMode('auto')}
            theme={theme}
          />
          <ModeButton
            mode="confirm"
            active={inferenceMode === 'confirm'}
            onPress={() => setInferenceMode('confirm')}
            theme={theme}
          />
        </View>

        {/* Current avodah */}
        <SectionHeader icon={Target} title="Current avodah" theme={theme} />
        <Text className="text-xs mb-2" style={{ color: theme.textDim }}>
          What you&apos;re working on right now. Coach updates this as your focus shifts.
        </Text>
        <TextInput
          value={avodahDraft}
          onChangeText={setAvodahDraft}
          onBlur={saveAvodah}
          placeholder="Nothing set yet — coach will fill this in as you talk."
          placeholderTextColor={theme.textDim}
          multiline
          className="rounded-2xl px-4 py-3 mb-6"
          style={{
            backgroundColor: theme.surface2,
            borderWidth: 1,
            borderColor: theme.hairline,
            color: theme.text,
            minHeight: 60,
          }}
        />

        {/* Last session focus (read-only) */}
        {coachKnowledgeBase.lastSessionFocus.length > 0 && (
          <>
            <SectionHeader icon={RefreshCcw} title="Last session focus" theme={theme} />
            <View
              className="rounded-2xl p-4 mb-6"
              style={{
                backgroundColor: theme.surface2,
                borderWidth: 1,
                borderColor: theme.hairline,
              }}
            >
              <Text style={{ color: theme.text }}>{coachKnowledgeBase.lastSessionFocus}</Text>
            </View>
          </>
        )}

        {/* Open loops */}
        <SectionHeader icon={CircleDot} title="Open loops" theme={theme} />
        <Text className="text-xs mb-2" style={{ color: theme.textDim }}>
          Things coach plans to follow up on next time.
        </Text>
        {coachKnowledgeBase.openLoops.map((loop, i) => (
          <ListChip
            key={`${i}-${loop.slice(0, 20)}`}
            text={loop}
            onRemove={() => kbResolveOpenLoop(loop)}
            theme={theme}
          />
        ))}
        <View className="flex-row items-center mb-6 mt-1">
          <TextInput
            value={newLoop}
            onChangeText={setNewLoop}
            placeholder="Add a follow-up…"
            placeholderTextColor={theme.textDim}
            onSubmitEditing={handleAddLoop}
            returnKeyType="done"
            className="flex-1 rounded-2xl px-4 py-3 mr-2"
            style={{
              backgroundColor: theme.surface2,
              borderWidth: 1,
              borderColor: theme.hairline,
              color: theme.text,
            }}
          />
          <Pressable
            onPress={handleAddLoop}
            disabled={!newLoop.trim()}
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: newLoop.trim() ? theme.accent : theme.surface2 }}
          >
            <Plus size={16} color={newLoop.trim() ? theme.onAccent : theme.muted} />
          </Pressable>
        </View>

        {/* Red flags */}
        <SectionHeader icon={AlertTriangle} title="Red flags" theme={theme} />
        <Text className="text-xs mb-2" style={{ color: theme.textDim }}>
          Patterns coach is watching for quietly. Won&apos;t be announced to you mid-session.
        </Text>
        {coachKnowledgeBase.redFlags.map((flag, i) => (
          <ListChip
            key={`${i}-${flag.slice(0, 20)}`}
            text={flag}
            onRemove={() => kbClearRedFlag(flag)}
            theme={theme}
            tone="warn"
          />
        ))}
        <View className="flex-row items-center mb-8 mt-1">
          <TextInput
            value={newFlag}
            onChangeText={setNewFlag}
            placeholder="Add a watch-for…"
            placeholderTextColor={theme.textDim}
            onSubmitEditing={handleAddFlag}
            returnKeyType="done"
            className="flex-1 rounded-2xl px-4 py-3 mr-2"
            style={{
              backgroundColor: theme.surface2,
              borderWidth: 1,
              borderColor: theme.hairline,
              color: theme.text,
            }}
          />
          <Pressable
            onPress={handleAddFlag}
            disabled={!newFlag.trim()}
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: newFlag.trim() ? theme.accent : theme.surface2 }}
          >
            <Plus size={16} color={newFlag.trim() ? theme.onAccent : theme.muted} />
          </Pressable>
        </View>

        {/* Entries grouped by category */}
        <View className="flex-row items-center justify-between mb-3 mt-2">
          <Text className="text-xs uppercase tracking-widest" style={{ color: theme.accent }}>
            Notes ({totalActive}{totalArchived > 0 ? ` · ${totalArchived} archived` : ''})
          </Text>
          {totalArchived > 0 && (
            <Pressable onPress={() => setShowArchived((v) => !v)}>
              <Text className="text-xs" style={{ color: theme.muted }}>
                {showArchived ? 'Hide archived' : 'Show archived'}
              </Text>
            </Pressable>
          )}
        </View>

        {totalActive === 0 && !showArchived && (
          <View
            className="rounded-2xl p-6 items-center mb-6"
            style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline, borderStyle: 'dashed' }}
          >
            <Text className="text-center mb-2" style={{ color: theme.muted }}>
              No notes yet.
            </Text>
            <Text className="text-center text-xs" style={{ color: theme.textDim }}>
              Coach will start filling this as you talk. You can also tap ADD NOTE above.
            </Text>
          </View>
        )}

        {CATEGORY_ORDER.map((cat) => {
          const entries = grouped[cat];
          if (!entries || entries.length === 0) return null;
          return (
            <View key={cat} className="mb-4">
              <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.muted }}>
                {CATEGORY_LABEL[cat]}
              </Text>
              {entries.map((e) => (
                <EntryCard key={e.id} entry={e} onPress={() => setEditingEntry(e)} theme={theme} />
              ))}
            </View>
          );
        })}

        <View className="h-12" />
      </ScrollView>

      {/* Edit modal */}
      <EntryEditorModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={(patch) => {
          if (!editingEntry) return;
          kbUpdateEntry(editingEntry.id, patch);
          setEditingEntry(null);
        }}
        onArchive={() => {
          if (!editingEntry) return;
          kbArchiveEntry(editingEntry.id);
          setEditingEntry(null);
        }}
        onDelete={() => {
          if (editingEntry) confirmDelete(editingEntry);
        }}
        theme={theme}
      />

      {/* Compose-new modal */}
      <ComposeNewModal
        visible={composingNew}
        onClose={() => setComposingNew(false)}
        onSave={(payload) => {
          kbAddEntry({
            ...payload,
            source: 'user-stated',
          });
          setComposingNew(false);
        }}
        theme={theme}
      />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SectionHeader: React.FC<{ icon: any; title: string; theme: any }> = ({ icon: Icon, title, theme }) => (
  <View className="flex-row items-center mb-2 mt-2">
    <Icon size={14} color={theme.accent} />
    <Text className="text-xs uppercase tracking-widest ml-2" style={{ color: theme.accent }}>
      {title}
    </Text>
  </View>
);

const ModeButton: React.FC<{
  mode: InferenceMode;
  active: boolean;
  onPress: () => void;
  theme: any;
}> = ({ mode, active, onPress, theme }) => {
  const isAuto = mode === 'auto';
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-2xl p-4"
      style={{
        backgroundColor: active ? theme.accent : theme.surface2,
        borderWidth: 1,
        borderColor: active ? theme.accent : theme.hairline,
      }}
    >
      <Text
        className="font-black text-sm mb-1"
        style={{ color: active ? theme.onAccent : theme.text }}
      >
        {isAuto ? 'Auto' : 'Confirm first'}
      </Text>
      <Text
        className="text-xs leading-5"
        style={{ color: active ? theme.onAccent : theme.muted, opacity: active ? 0.85 : 1 }}
      >
        {isAuto
          ? 'Coach takes notes silently while you talk. You see and edit them here.'
          : 'Coach asks before saving anything. Tighter control, slower flow.'}
      </Text>
    </Pressable>
  );
};

const ListChip: React.FC<{
  text: string;
  onRemove: () => void;
  theme: any;
  tone?: 'normal' | 'warn';
}> = ({ text, onRemove, theme, tone = 'normal' }) => {
  const bg = tone === 'warn' ? 'rgba(232, 80, 80, 0.10)' : theme.surface2;
  const border = tone === 'warn' ? 'rgba(232, 80, 80, 0.35)' : theme.hairline;
  return (
    <View
      className="flex-row items-center rounded-2xl p-3 mb-2"
      style={{ backgroundColor: bg, borderWidth: 1, borderColor: border }}
    >
      <Text className="flex-1 text-sm" style={{ color: theme.text }}>
        {text}
      </Text>
      <Pressable onPress={onRemove} hitSlop={8}>
        <X size={16} color={theme.muted} />
      </Pressable>
    </View>
  );
};

const importanceColor = (imp: KbImportance, theme: any): string => {
  if (imp === 'critical') return '#E85050';
  if (imp === 'high') return theme.accent;
  if (imp === 'medium') return theme.muted;
  return theme.textDim;
};

const EntryCard: React.FC<{
  entry: KnowledgeBaseEntry;
  onPress: () => void;
  theme: any;
}> = ({ entry, onPress, theme }) => {
  const dim = entry.archived ? 0.5 : 1;
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-4 mb-2"
      style={{
        backgroundColor: theme.surface2,
        borderWidth: 1,
        borderColor: theme.hairline,
        opacity: dim,
      }}
    >
      <View className="flex-row items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="font-black text-sm" style={{ color: theme.text }}>
            {entry.title}
          </Text>
        </View>
        <View
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${importanceColor(entry.importance, theme)}20` }}
        >
          <Text
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: importanceColor(entry.importance, theme) }}
          >
            {entry.importance}
          </Text>
        </View>
      </View>
      <Text className="text-sm leading-5 mb-3" style={{ color: theme.muted }} numberOfLines={4}>
        {entry.content}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] italic" style={{ color: theme.textDim }}>
          {SOURCE_LABEL[entry.source]}
          {entry.archived ? ' · archived' : ''}
        </Text>
        <Edit3 size={14} color={theme.textDim} />
      </View>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Entry editor modal — edit title, content, importance; archive or delete
// ---------------------------------------------------------------------------

interface EntryEditPatch {
  title?: string;
  content?: string;
  importance?: KbImportance;
}

const EntryEditorModal: React.FC<{
  entry: KnowledgeBaseEntry | null;
  onClose: () => void;
  onSave: (patch: EntryEditPatch) => void;
  onArchive: () => void;
  onDelete: () => void;
  theme: any;
}> = ({ entry, onClose, onSave, onArchive, onDelete, theme }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState<KbImportance>('medium');

  React.useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setImportance(entry.importance);
    }
  }, [entry]);

  if (!entry) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View
          className="rounded-t-3xl p-6"
          style={{ backgroundColor: theme.surface, maxHeight: '90%' }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
              Edit note
            </Text>
            <Text className="text-[10px] italic mb-4" style={{ color: theme.textDim }}>
              {SOURCE_LABEL[entry.source]}
              {entry.evidence ? ` · "${entry.evidence}"` : ''}
            </Text>

            <Text className="text-xs uppercase tracking-widest mb-1" style={{ color: theme.muted }}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              className="rounded-2xl px-4 py-3 mb-4"
              style={{
                backgroundColor: theme.surface2,
                borderWidth: 1,
                borderColor: theme.hairline,
                color: theme.text,
              }}
            />

            <Text className="text-xs uppercase tracking-widest mb-1" style={{ color: theme.muted }}>
              Content
            </Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              maxLength={1500}
              multiline
              className="rounded-2xl px-4 py-3 mb-4"
              style={{
                backgroundColor: theme.surface2,
                borderWidth: 1,
                borderColor: theme.hairline,
                color: theme.text,
                minHeight: 120,
              }}
            />

            <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.muted }}>
              Importance
            </Text>
            <View className="flex-row gap-2 mb-6">
              {(['low', 'medium', 'high', 'critical'] as KbImportance[]).map((imp) => {
                const active = importance === imp;
                return (
                  <Pressable
                    key={imp}
                    onPress={() => setImportance(imp)}
                    className="flex-1 rounded-2xl py-2 items-center"
                    style={{
                      backgroundColor: active ? theme.accent : theme.surface2,
                      borderWidth: 1,
                      borderColor: active ? theme.accent : theme.hairline,
                    }}
                  >
                    <Text
                      className="text-xs font-black uppercase"
                      style={{ color: active ? theme.onAccent : theme.text }}
                    >
                      {imp}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => onSave({ title, content, importance })}
              className="rounded-2xl py-4 items-center mb-2"
              style={{ backgroundColor: theme.accent }}
            >
              <Text className="font-black uppercase tracking-widest" style={{ color: theme.onAccent }}>
                Save changes
              </Text>
            </Pressable>

            <View className="flex-row gap-2 mb-2">
              <Pressable
                onPress={onArchive}
                className="flex-1 rounded-2xl py-3 flex-row items-center justify-center"
                style={{ backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}
              >
                <Archive size={14} color={theme.muted} />
                <Text className="ml-2 text-xs font-bold" style={{ color: theme.muted }}>
                  Archive
                </Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                className="flex-1 rounded-2xl py-3 flex-row items-center justify-center"
                style={{ backgroundColor: 'rgba(232,80,80,0.1)', borderWidth: 1, borderColor: 'rgba(232,80,80,0.35)' }}
              >
                <Trash2 size={14} color="#E85050" />
                <Text className="ml-2 text-xs font-bold" style={{ color: '#E85050' }}>
                  Delete
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={onClose} className="py-3 items-center">
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

// ---------------------------------------------------------------------------
// Compose-new modal — manually add a note (rare path; coach handles most)
// ---------------------------------------------------------------------------

const ComposeNewModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (payload: {
    category: KbCategory;
    title: string;
    content: string;
    importance: KbImportance;
  }) => void;
  theme: any;
}> = ({ visible, onClose, onSave, theme }) => {
  const [category, setCategory] = useState<KbCategory>('theme');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState<KbImportance>('medium');

  const reset = () => {
    setCategory('theme');
    setTitle('');
    setContent('');
    setImportance('medium');
  };

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View
          className="rounded-t-3xl p-6"
          style={{ backgroundColor: theme.surface, maxHeight: '90%' }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-xs uppercase tracking-widest mb-1" style={{ color: theme.accent }}>
              New note for Coach
            </Text>
            <Text className="text-xs mb-4" style={{ color: theme.textDim }}>
              Anything you want Coach to remember. This is yours — coach treats it as fact.
            </Text>

            <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.muted }}>
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {CATEGORY_ORDER.map((c) => {
                const active = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    className="rounded-full px-3 py-1.5"
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
                      {CATEGORY_LABEL[c]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-xs uppercase tracking-widest mb-1" style={{ color: theme.muted }}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              placeholder="e.g. Late-night phone is the main fall trigger"
              placeholderTextColor={theme.textDim}
              className="rounded-2xl px-4 py-3 mb-4"
              style={{
                backgroundColor: theme.surface2,
                borderWidth: 1,
                borderColor: theme.hairline,
                color: theme.text,
              }}
            />

            <Text className="text-xs uppercase tracking-widest mb-1" style={{ color: theme.muted }}>
              Content
            </Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              maxLength={1500}
              multiline
              placeholder="Tell Coach what to remember…"
              placeholderTextColor={theme.textDim}
              className="rounded-2xl px-4 py-3 mb-4"
              style={{
                backgroundColor: theme.surface2,
                borderWidth: 1,
                borderColor: theme.hairline,
                color: theme.text,
                minHeight: 120,
              }}
            />

            <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.muted }}>
              Importance
            </Text>
            <View className="flex-row gap-2 mb-6">
              {(['low', 'medium', 'high', 'critical'] as KbImportance[]).map((imp) => {
                const active = importance === imp;
                return (
                  <Pressable
                    key={imp}
                    onPress={() => setImportance(imp)}
                    className="flex-1 rounded-2xl py-2 items-center"
                    style={{
                      backgroundColor: active ? theme.accent : theme.surface2,
                      borderWidth: 1,
                      borderColor: active ? theme.accent : theme.hairline,
                    }}
                  >
                    <Text
                      className="text-xs font-black uppercase"
                      style={{ color: active ? theme.onAccent : theme.text }}
                    >
                      {imp}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => {
                if (!canSave) return;
                onSave({ category, title: title.trim(), content: content.trim(), importance });
                reset();
              }}
              disabled={!canSave}
              className="rounded-2xl py-4 items-center mb-2"
              style={{ backgroundColor: canSave ? theme.accent : theme.surface2 }}
            >
              <Text
                className="font-black uppercase tracking-widest"
                style={{ color: canSave ? theme.onAccent : theme.muted }}
              >
                Save note
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                reset();
                onClose();
              }}
              className="py-3 items-center"
            >
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
