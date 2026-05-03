import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { ChevronLeft, Plus, X, Check, Edit3, Flame, Heart, AlertTriangle, Shield } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useTheme } from '../constants/theme';
import { useStore, type MilestoneRung } from '../store/useStore';

// =============================================================================
// "Your Why" — identity statement + cost/benefit + milestone ladder (§2.10, §2.11)
// The motivational anchor. Read this before the urge, not during.
// =============================================================================

interface Props {
  onBack: () => void;
}

export const YourWhyScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const {
    identityStatement,
    costBenefit,
    milestoneLadder,
    currentStreak,
    setIdentityStatement,
    setCostBenefit,
    updateMilestone,
  } = useStore();

  const [identityDraft, setIdentityDraft] = useState(identityStatement ?? '');
  const [editingIdentity, setEditingIdentity] = useState(!identityStatement);
  const [costs, setCosts] = useState<string[]>(costBenefit?.costs ?? []);
  const [benefits, setBenefits] = useState<string[]>(costBenefit?.benefits ?? []);
  const [newCost, setNewCost] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  const saveIdentity = () => {
    setIdentityStatement(identityDraft.trim());
    setEditingIdentity(false);
  };

  const saveCostBenefit = () => {
    setCostBenefit({ costs, benefits });
  };

  const addCost = () => {
    if (!newCost.trim()) return;
    const next = [...costs, newCost.trim()];
    setCosts(next);
    setNewCost('');
    setCostBenefit({ costs: next, benefits });
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    const next = [...benefits, newBenefit.trim()];
    setBenefits(next);
    setNewBenefit('');
    setCostBenefit({ costs, benefits: next });
  };

  const removeCost = (i: number) => {
    const next = costs.filter((_, idx) => idx !== i);
    setCosts(next);
    setCostBenefit({ costs: next, benefits });
  };

  const removeBenefit = (i: number) => {
    const next = benefits.filter((_, idx) => idx !== i);
    setBenefits(next);
    setCostBenefit({ costs, benefits: next });
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-4 mt-2">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: theme.hairline }}
        >
          <ChevronLeft size={18} color="white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-guard-accent text-xs font-black uppercase tracking-widest">
            The anchor
          </Text>
          <Text className="text-2xl font-black text-white mt-0.5" style={{ fontFamily: 'Outfit' }}>
            Your Why
          </Text>
        </View>
        <Flame size={20} color="#E8A020" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Identity statement */}
        <Section title="I am" subtitle="One sentence that defines who you are becoming.">
          {editingIdentity ? (
            <>
              <TextInput
                value={identityDraft}
                onChangeText={setIdentityDraft}
                multiline
                placeholder="I am a man of my word. I am a father my kids can trust."
                placeholderTextColor={theme.textDim}
                className="text-white rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: '#E8A020',
                  minHeight: 80,
                  textAlignVertical: 'top',
                  fontSize: 16,
                  lineHeight: 24,
                  fontStyle: 'italic',
                }}
              />
              <Pressable
                onPress={saveIdentity}
                className="rounded-2xl py-3 items-center mt-3 flex-row justify-center"
                style={{ backgroundColor: theme.accent }}
              >
                <Check size={16} color="#0F1326" />
                <Text className="text-guard-on-accent font-black uppercase tracking-widest ml-2">Lock it in</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => setEditingIdentity(true)}
              className="rounded-2xl p-5"
              style={{
                backgroundColor: 'rgba(232,160,32,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(232,160,32,0.3)',
              }}
            >
              <Text
                className="text-white text-lg leading-8 italic"
                style={{ fontFamily: 'Outfit' }}
              >
                "{identityStatement}"
              </Text>
              <View className="flex-row items-center mt-3">
                <Edit3 size={12} color="rgba(255,255,255,0.5)" />
                <Text className="text-white/50 text-xs ml-2 uppercase tracking-widest">Tap to edit</Text>
              </View>
            </Pressable>
          )}
        </Section>

        {/* Cost/Benefit */}
        <Section
          title="Why I stand"
          subtitle="What it costs when I fall. What it gains when I hold."
        >
          <View className="flex-row gap-3">
            {/* Costs */}
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <AlertTriangle size={14} color="#C0392B" />
                <Text className="text-guard-danger text-xs font-black uppercase tracking-widest ml-2">
                  Costs
                </Text>
              </View>
              {costs.map((c, i) => (
                <View
                  key={i}
                  className="rounded-xl px-3 py-2 mb-2 flex-row items-start"
                  style={{
                    backgroundColor: 'rgba(192,57,43,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(192,57,43,0.25)',
                  }}
                >
                  <Text className="text-white text-xs flex-1 leading-5">{c}</Text>
                  <Pressable onPress={() => removeCost(i)} hitSlop={8}>
                    <X size={12} color="rgba(255,255,255,0.4)" />
                  </Pressable>
                </View>
              ))}
              <View className="flex-row items-center rounded-xl mt-1" style={{ backgroundColor: theme.surface }}>
                <TextInput
                  value={newCost}
                  onChangeText={setNewCost}
                  onSubmitEditing={addCost}
                  placeholder="Add..."
                  placeholderTextColor={theme.textDim}
                  className="flex-1 text-white px-3 py-2 text-xs"
                />
                <Pressable onPress={addCost} className="px-2">
                  <Plus size={14} color="#E8A020" />
                </Pressable>
              </View>
            </View>

            {/* Benefits */}
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Heart size={14} color="#1E8A4A" />
                <Text className="text-guard-success text-xs font-black uppercase tracking-widest ml-2">
                  Gains
                </Text>
              </View>
              {benefits.map((b, i) => (
                <View
                  key={i}
                  className="rounded-xl px-3 py-2 mb-2 flex-row items-start"
                  style={{
                    backgroundColor: 'rgba(30,138,74,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(30,138,74,0.25)',
                  }}
                >
                  <Text className="text-white text-xs flex-1 leading-5">{b}</Text>
                  <Pressable onPress={() => removeBenefit(i)} hitSlop={8}>
                    <X size={12} color="rgba(255,255,255,0.4)" />
                  </Pressable>
                </View>
              ))}
              <View className="flex-row items-center rounded-xl mt-1" style={{ backgroundColor: theme.surface }}>
                <TextInput
                  value={newBenefit}
                  onChangeText={setNewBenefit}
                  onSubmitEditing={addBenefit}
                  placeholder="Add..."
                  placeholderTextColor={theme.textDim}
                  className="flex-1 text-white px-3 py-2 text-xs"
                />
                <Pressable onPress={addBenefit} className="px-2">
                  <Plus size={14} color="#E8A020" />
                </Pressable>
              </View>
            </View>
          </View>
        </Section>

        {/* Milestone ladder */}
        <Section title="The ladder" subtitle="Each rung is a chapter of who you are becoming.">
          {milestoneLadder.map((rung, i) => (
            <MilestoneRungCard
              key={rung.day}
              rung={rung}
              currentStreak={currentStreak}
              isLast={i === milestoneLadder.length - 1}
              onEdit={(patch) => updateMilestone(rung.day, patch)}
            />
          ))}
        </Section>
      </ScrollView>
    </Screen>
  );
};

// =============================================================================
// Helpers
// =============================================================================

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <View className="mb-8">
    <Text className="text-white font-black text-xl mb-1" style={{ fontFamily: 'Outfit' }}>
      {title}
    </Text>
    {subtitle && <Text className="text-white/50 text-xs mb-4 leading-5">{subtitle}</Text>}
    {children}
  </View>
);

interface RungProps {
  rung: MilestoneRung;
  currentStreak: number;
  isLast: boolean;
  onEdit: (patch: Partial<MilestoneRung>) => void;
}

const MilestoneRungCard: React.FC<RungProps> = ({ rung, currentStreak, isLast, onEdit }) => {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(rung.label);
  const [meaningDraft, setMeaningDraft] = useState(rung.meaning);
  const [rewardDraft, setRewardDraft] = useState(rung.reward ?? '');

  const reached = currentStreak >= rung.day;
  const progress = Math.min(currentStreak / rung.day, 1);

  const save = () => {
    onEdit({
      label: labelDraft.trim() || rung.label,
      meaning: meaningDraft.trim() || rung.meaning,
      reward: rewardDraft.trim() || undefined,
    });
    setEditing(false);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: reached ? 'rgba(232,160,32,0.1)' : theme.surface,
        borderWidth: 1,
        borderColor: reached ? 'rgba(232,160,32,0.4)' : theme.hairline,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          style={{
            backgroundColor: reached ? 'rgba(232,160,32,0.25)' : 'rgba(255,255,255,0.05)',
          }}
        >
          {reached ? (
            <Shield size={20} color="#E8A020" />
          ) : (
            <Text className="text-white/60 font-black text-sm">{rung.day}d</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white font-black text-base">{rung.label}</Text>
          <Text className="text-white/50 text-xs mt-0.5 italic">{rung.meaning}</Text>
          {rung.reward && (
            <View
              className="mt-2 self-start rounded-full px-2 py-0.5"
              style={{ backgroundColor: 'rgba(232,160,32,0.15)' }}
            >
              <Text className="text-guard-accent text-[10px] font-bold">🎁 {rung.reward}</Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => setEditing(!editing)} hitSlop={8}>
          <Edit3 size={14} color="rgba(255,255,255,0.4)" />
        </Pressable>
      </View>

      {/* Progress bar toward this rung */}
      {!reached && !isLast && (
        <View className="mt-3">
          <View
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: theme.hairline }}
          >
            <View
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                backgroundColor: theme.accent,
              }}
            />
          </View>
          <Text className="text-white/40 text-[10px] mt-1">
            {currentStreak}/{rung.day} days ({Math.floor(progress * 100)}%)
          </Text>
        </View>
      )}

      {editing && (
        <MotiView
          from={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' as any }}
          className="mt-4 pt-4"
          style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Text className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Label</Text>
          <TextInput
            value={labelDraft}
            onChangeText={setLabelDraft}
            className="text-white rounded-xl px-3 py-2 mb-2"
            style={{
              backgroundColor: theme.hairline,
              borderWidth: 1,
              borderColor: 'rgba(232,160,32,0.3)',
              fontSize: 13,
            }}
          />
          <Text className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Meaning</Text>
          <TextInput
            value={meaningDraft}
            onChangeText={setMeaningDraft}
            className="text-white rounded-xl px-3 py-2 mb-2"
            style={{
              backgroundColor: theme.hairline,
              borderWidth: 1,
              borderColor: 'rgba(232,160,32,0.3)',
              fontSize: 13,
            }}
          />
          <Text className="text-white/50 text-[10px] uppercase tracking-widest mb-1">
            Reward (optional)
          </Text>
          <TextInput
            value={rewardDraft}
            onChangeText={setRewardDraft}
            placeholder="e.g. new book, dinner out"
            placeholderTextColor={theme.textDim}
            className="text-white rounded-xl px-3 py-2 mb-3"
            style={{
              backgroundColor: theme.hairline,
              borderWidth: 1,
              borderColor: 'rgba(232,160,32,0.3)',
              fontSize: 13,
            }}
          />
          <Pressable
            onPress={save}
            className="rounded-xl py-2 items-center"
            style={{ backgroundColor: theme.accent }}
          >
            <Text className="text-guard-on-accent font-black text-xs uppercase tracking-widest">Save</Text>
          </Pressable>
        </MotiView>
      )}
    </MotiView>
  );
};
