import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Share, Modal, TextInput } from 'react-native';
import { MotiView } from 'moti';
import {
  User,
  Bell,
  BookOpen,
  Zap,
  Smartphone,
  Shield,
  Trash2,
  RefreshCw,
  Download,
  ChevronRight,
  Award,
  Trophy,
  Flame,
  Lock,
  Sliders,
  ShieldAlert,
  Brain,
  Bot,
  Users,
  MessageCircle,
  Bug,
  Sparkles,
  ClipboardList,
  NotebookPen,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Avatar } from '../components/Avatar';
import { PrivacyNote } from '../components/PrivacyNote';
import { useStore } from '../store/useStore';
import { useStreak } from '../hooks/useStreak';
import { useTheme } from '../constants/theme';
import { sendFeedback, reportBug } from '../services/feedback';

interface Props {
  onNavigateToReminders: () => void;
  onNavigateToMantras: () => void;
  onNavigateToRituals: () => void;
  onNavigateToYourData: () => void;
  onNavigateToPersonalization: () => void;
  onNavigateToYourWhy: () => void;
  onNavigateToWatchlist: () => void;
  onNavigateToInsights: () => void;
  onNavigateToAiConfig: () => void;
  onNavigateToTactics: () => void;
  onNavigateToLearn: () => void;
  onNavigateToCommunity: () => void;
  onNavigateToCoachStyle: () => void;
  onNavigateToClinicalProfile: () => void;
  onNavigateToCoachKnowledgeBase: () => void;
  onNavigateToPinSettings: () => void;
}

const BADGES: { day: number; label: string }[] = [
  { day: 7, label: '7 Days' },
  { day: 14, label: '2 Weeks' },
  { day: 30, label: '30 Days' },
  { day: 60, label: '60 Days' },
  { day: 90, label: '90 Days' },
  { day: 180, label: '6 Months' },
  { day: 365, label: '1 Year' },
];

export const Profile: React.FC<Props> = ({
  onNavigateToReminders,
  onNavigateToMantras,
  onNavigateToRituals,
  onNavigateToYourData,
  onNavigateToPersonalization,
  onNavigateToYourWhy,
  onNavigateToWatchlist,
  onNavigateToInsights,
  onNavigateToAiConfig,
  onNavigateToTactics,
  onNavigateToLearn,
  onNavigateToCommunity,
  onNavigateToCoachStyle,
  onNavigateToClinicalProfile,
  onNavigateToCoachKnowledgeBase,
  onNavigateToPinSettings,
}) => {
  const {
    displayName,
    memberSince,
    totalFallCount,
    updateProfile,
    regenerateIdentity,
    resetData,
    checkInStreak,
    ritualStreak,
    clinicalAssessment,
    coachKnowledgeBase,
    pinEnabled,
    pinHashPresent,
  } = useStore();
  const lockOn = pinEnabled && pinHashPresent;

  // Quick stats for the "What Coach Knows" hub card.
  const assessmentSetCount = Object.values(clinicalAssessment).filter(
    (f) => f.value !== null && f.value !== undefined,
  ).length;
  const kbActiveCount = coachKnowledgeBase.entries.filter((e) => !e.archived).length;
  const openLoopsCount = coachKnowledgeBase.openLoops.length;
  const { currentStreak, longestStreak, formattedStartDate, level } = useStreak();
  const theme = useTheme();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState(displayName);

  const openRename = () => {
    setRenameDraft(displayName);
    setRenameOpen(true);
  };

  const saveRename = () => {
    const name = renameDraft.trim();
    if (name.length > 0) {
      updateProfile({ displayName: name });
    }
    setRenameOpen(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset all data?',
      'Your streak, logs, and toolkit will be cleared. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetData() },
      ]
    );
  };

  const handleExport = async () => {
    const data = useStore.getState();
    const json = JSON.stringify(
      {
        displayName: data.displayName,
        memberSince: data.memberSince,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        totalFallCount: data.totalFallCount,
        calendarLog: data.calendarLog,
        mantras: data.mantras,
        rituals: data.rituals,
        vows: data.vows,
        toolkit: data.toolkit,
      },
      null,
      2
    );
    try {
      await Share.share({ message: json });
    } catch {
      /* ignore */
    }
  };

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <View className="flex-1 bg-guard-surface border border-guard-primary/30 rounded-2xl p-4 items-center">
      <Text className="text-2xl font-black text-white">{value}</Text>
      <Text className="text-white/50 text-[10px] uppercase tracking-widest mt-1">{label}</Text>
    </View>
  );

  const Row = ({
    icon: Icon,
    label,
    onPress,
    danger,
  }: {
    icon: any;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-guard-surface border border-guard-primary/30 rounded-2xl p-4 mb-2"
    >
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
          danger ? 'bg-guard-danger/10' : 'bg-guard-primary/10'
        }`}
      >
        <Icon size={18} color={danger ? theme.danger : theme.accent} />
      </View>
      <Text className={`flex-1 font-bold ${danger ? 'text-guard-danger' : 'text-white'}`}>{label}</Text>
      <ChevronRight size={18} color={theme.textDim} />
    </Pressable>
  );

  return (
    <Screen>
      <View className="items-center mb-8 mt-2">
        <Avatar name={displayName} size={80} />
        <Pressable onPress={openRename} className="mt-4">
          <Text className="text-2xl font-black text-white">{displayName}</Text>
        </Pressable>
        <Text className="text-guard-accent text-xs font-black uppercase tracking-widest mt-1">{level}</Text>
        <Text className="text-white/40 text-xs mt-1">Member since {new Date(memberSince).toLocaleDateString()}</Text>
      </View>

      <View className="flex-row gap-2 mb-6">
        <Stat label="Current" value={currentStreak} />
        <Stat label="Longest" value={longestStreak} />
        <Stat label="Check-ins" value={checkInStreak} />
        <Stat label="Rituals" value={ritualStreak} />
      </View>

      <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Badges</Text>
      <View className="flex-row flex-wrap mb-6">
        {BADGES.map((b) => {
          const earned = longestStreak >= b.day;
          return (
            <View key={b.day} style={{ width: '25%' }} className="p-1">
              <MotiView
                animate={{ opacity: earned ? 1 : 0.3 }}
                className={`aspect-square rounded-2xl items-center justify-center ${
                  earned
                    ? 'bg-guard-accent/10 border border-guard-accent/40'
                    : 'bg-guard-surface border border-guard-primary/20'
                }`}
              >
                <Trophy size={22} color={earned ? theme.accent : theme.textDim} />
                <Text className={`text-[10px] mt-2 font-bold ${earned ? 'text-white' : 'text-white/30'}`}>
                  {b.label}
                </Text>
              </MotiView>
            </View>
          );
        })}
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mb-6">
        <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Records</Text>
        <View className="flex-row items-center mb-2">
          <Flame size={14} color={theme.accent} />
          <Text className="text-white ml-2 flex-1">Longest streak</Text>
          <Text className="text-white font-black">{longestStreak}d</Text>
        </View>
        <View className="flex-row items-center mb-2">
          <Award size={14} color={theme.accent} />
          <Text className="text-white ml-2 flex-1">Current streak start</Text>
          <Text className="text-white font-black">{formattedStartDate}</Text>
        </View>
        <View className="flex-row items-center">
          <Shield size={14} color={theme.danger} />
          <Text className="text-white ml-2 flex-1">Total falls logged</Text>
          <Text className="text-white font-black">{totalFallCount}</Text>
        </View>
      </View>

      {/* About Me — coach's picture of you + the chart */}
      <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">About me</Text>
      <Pressable
        onPress={onNavigateToCoachKnowledgeBase}
        className="rounded-3xl p-5 mb-3"
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.accent + '60',
        }}
      >
        <View className="flex-row items-center mb-2">
          <NotebookPen size={16} color={theme.accent} />
          <Text className="text-xs uppercase tracking-widest ml-2 font-black" style={{ color: theme.accent }}>
            What coach knows
          </Text>
        </View>
        <Text className="font-black text-lg mb-1" style={{ color: theme.text }}>
          {kbActiveCount === 0
            ? 'Nothing yet — coach starts learning as you talk.'
            : `${kbActiveCount} note${kbActiveCount === 1 ? '' : 's'}${
                openLoopsCount > 0 ? ` · ${openLoopsCount} open loop${openLoopsCount === 1 ? '' : 's'}` : ''
              }`}
        </Text>
        <Text className="text-xs" style={{ color: theme.muted }}>
          The therapist&apos;s chart — themes, events, breakthroughs. Yours to read, edit, or delete.
        </Text>
      </Pressable>
      <Pressable
        onPress={onNavigateToClinicalProfile}
        className="rounded-3xl p-5 mb-6"
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.accent + '60',
        }}
      >
        <View className="flex-row items-center mb-2">
          <ClipboardList size={16} color={theme.accent} />
          <Text className="text-xs uppercase tracking-widest ml-2 font-black" style={{ color: theme.accent }}>
            Coach&apos;s picture of you
          </Text>
        </View>
        <Text className="font-black text-lg mb-1" style={{ color: theme.text }}>
          {assessmentSetCount === 0
            ? 'Coach hasn’t formed a picture yet.'
            : `${assessmentSetCount} field${assessmentSetCount === 1 ? '' : 's'} filled in`}
        </Text>
        <Text className="text-xs" style={{ color: theme.muted }}>
          Ramchal stage, dominant yesod, identity frame, distortions, life context, working hypothesis. Edit anything that&apos;s wrong.
        </Text>
      </Pressable>

      <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Settings</Text>
      <Pressable
        onPress={onNavigateToYourData}
        className="flex-row items-center rounded-2xl p-4 mb-3"
        style={{
          backgroundColor: 'rgba(30, 138, 74, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(30, 138, 74, 0.35)',
        }}
      >
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: 'rgba(30, 138, 74, 0.25)' }}
        >
          <Lock size={18} color={theme.success} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold">Your Data · Privacy</Text>
          <Text className="text-white/60 text-xs mt-0.5">
            Everything stays on this phone. Export or delete anytime.
          </Text>
        </View>
        <ChevronRight size={18} color={theme.textDim} />
      </Pressable>
      <Pressable
        onPress={onNavigateToPinSettings}
        className="flex-row items-center bg-guard-surface border border-guard-primary/30 rounded-2xl p-4 mb-2"
      >
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{
            backgroundColor: lockOn ? `${theme.accent}20` : 'rgba(255,255,255,0.05)',
          }}
        >
          <Lock size={18} color={lockOn ? theme.accent : theme.muted} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold">Lock & PIN</Text>
          <Text className="text-white/60 text-xs mt-0.5">
            {lockOn ? 'On — PIN required at launch' : 'Off — anyone with your phone can open Guard'}
          </Text>
        </View>
        <ChevronRight size={18} color={theme.textDim} />
      </Pressable>
      <Row icon={Flame} label="Your Why (identity · costs · ladder)" onPress={onNavigateToYourWhy} />
      <Row icon={ShieldAlert} label="Watchlist (risk triggers)" onPress={onNavigateToWatchlist} />
      <Row icon={Brain} label="Pattern insights" onPress={onNavigateToInsights} />
      <Row icon={Zap} label="Tactics for the next urge" onPress={onNavigateToTactics ?? (() => {})} />
      <Row icon={BookOpen} label="Learn (videos, podcasts, books)" onPress={onNavigateToLearn} />
      <Row icon={Users} label="Community (partner, forums, leaderboard)" onPress={onNavigateToCommunity} />
      <Row icon={Bot} label="AI coach (bring your own key)" onPress={onNavigateToAiConfig} />
      <Row icon={Sparkles} label="Coach style (how the AI talks to you)" onPress={onNavigateToCoachStyle} />
      <Row icon={Sliders} label="Personalization (12 axes)" onPress={onNavigateToPersonalization} />
      <Row icon={Bell} label="Reminders" onPress={onNavigateToReminders} />
      <Row icon={BookOpen} label="Mantras" onPress={onNavigateToMantras} />
      <Row icon={Zap} label="Rituals" onPress={onNavigateToRituals} />
      <Row icon={User} label="Rename identity" onPress={openRename} />
      <Row icon={RefreshCw} label="Regenerate identity" onPress={regenerateIdentity} />
      <Row icon={Download} label="Export my data" onPress={handleExport} />

      <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3 mt-4">Feedback</Text>
      <Row icon={MessageCircle} label="Send feedback / feature idea" onPress={() => { void sendFeedback(); }} />
      <Row icon={Bug} label="Report a bug" onPress={() => { void reportBug(); }} />

      <Row icon={Trash2} label="Reset all data" onPress={handleReset} danger />

      <Modal visible={renameOpen} transparent animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="w-full bg-guard-surface rounded-3xl p-6 border border-guard-primary/30">
            <Text className="text-white font-black text-lg mb-4">Rename</Text>
            <TextInput
              value={renameDraft}
              onChangeText={setRenameDraft}
              autoFocus
              className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white mb-4"
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setRenameOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-white/5 items-center"
              >
                <Text className="text-white/70 font-bold">Cancel</Text>
              </Pressable>
              <Pressable onPress={saveRename} className="flex-1 py-3 rounded-2xl bg-guard-accent items-center">
                <Text className="text-guard-on-accent font-black">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};
