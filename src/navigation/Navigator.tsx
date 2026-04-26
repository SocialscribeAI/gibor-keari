import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useStore } from '../store/useStore';
import { bootstrapSupabase } from '../store/useCommunityStore';

import { Home } from '../screens/Home';
import { Calendar } from '../screens/Calendar';
import { Coach } from '../screens/Coach';
import { Learn } from '../screens/Learn';
import { Profile } from '../screens/Profile';
import { Onboarding } from '../screens/Onboarding';
import { ReminderSettingsScreen } from '../screens/ReminderSettingsScreen';
import { MantraBuilder } from '../screens/MantraBuilder';
import { RitualBuilder } from '../screens/RitualBuilder';
import { YourDataScreen } from '../screens/YourDataScreen';
import { PersonalizationScreen } from '../screens/PersonalizationScreen';
import { YourWhyScreen } from '../screens/YourWhyScreen';
import { WatchlistScreen } from '../screens/WatchlistScreen';
import { PatternInsightsScreen } from '../screens/PatternInsightsScreen';
import { AiCoachConfigScreen } from '../screens/AiCoachConfigScreen';
import { TacticsSettingsScreen } from '../screens/TacticsSettingsScreen';

import { CommunityHubScreen } from '../screens/CommunityHubScreen';
import { CommunitySetupScreen } from '../screens/CommunitySetupScreen';
import { CommunitySettingsScreen } from '../screens/CommunitySettingsScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { PartnerScreen } from '../screens/PartnerScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ForumsListScreen } from '../screens/ForumsListScreen';
import { ForumThreadScreen } from '../screens/ForumThreadScreen';
import { ForumComposeScreen } from '../screens/ForumComposeScreen';

import { BottomTab, TabType } from '../components/BottomTab';

type Overlay =
  | null
  | 'reminders' | 'mantras' | 'rituals' | 'data' | 'personalization'
  | 'why' | 'watchlist' | 'insights' | 'aiconfig' | 'tactics'
  | 'community' | 'community-setup' | 'community-settings' | 'auth'
  | 'partner' | 'leaderboard' | 'forums' | 'forum-thread' | 'forum-compose';

export const Navigator: React.FC = () => {
  const { hasCompletedOnboarding } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);

  const [threadPostId, setThreadPostId] = useState<string | null>(null);
  const [composeMode, setComposeMode] = useState<'forum' | 'post'>('post');
  const [composeForumId, setComposeForumId] = useState<string | null>(null);

  useEffect(() => { bootstrapSupabase(); }, []);

  if (!hasCompletedOnboarding) return <Onboarding />;

  const open = (o: Overlay) => setOverlay(o);
  const close = () => setOverlay(null);

  const renderOverlay = () => {
    switch (overlay) {
      case 'reminders': return <ReminderSettingsScreen onBack={close} />;
      case 'mantras': return <MantraBuilder onBack={close} />;
      case 'rituals': return <RitualBuilder onBack={close} />;
      case 'data': return <YourDataScreen onBack={close} />;
      case 'personalization': return <PersonalizationScreen onBack={close} />;
      case 'why': return <YourWhyScreen onBack={close} />;
      case 'watchlist': return <WatchlistScreen onBack={close} />;
      case 'insights': return <PatternInsightsScreen onBack={close} />;
      case 'aiconfig': return <AiCoachConfigScreen onBack={close} />;
      case 'tactics': return <TacticsSettingsScreen onBack={close} />;

      case 'community':
        return <CommunityHubScreen
          onBack={close}
          onOpenAuth={() => open('auth')}
          onOpenSetup={() => open('community-setup')}
          onOpenSettings={() => open('community-settings')}
          onOpenPartner={() => open('partner')}
          onOpenForums={() => open('forums')}
          onOpenLeaderboard={() => open('leaderboard')} />;
      case 'community-setup':
        return <CommunitySetupScreen onBack={() => open('community')} />;
      case 'community-settings':
        return <CommunitySettingsScreen onBack={() => open('community')} onOpenSetup={() => open('community-setup')} />;
      case 'auth':
        return <AuthScreen
          onBack={() => open('community')}
          onAuthed={() => open('community')} />;
      case 'partner':
        return <PartnerScreen onBack={() => open('community')} />;
      case 'leaderboard':
        return <LeaderboardScreen onBack={() => open('community')} />;
      case 'forums':
        return <ForumsListScreen
          onBack={() => open('community')}
          onOpenPost={(id) => { setThreadPostId(id); open('forum-thread'); }}
          onOpenCompose={(mode, forumId) => { setComposeMode(mode); setComposeForumId(forumId ?? null); open('forum-compose'); }} />;
      case 'forum-thread':
        return threadPostId
          ? <ForumThreadScreen postId={threadPostId} onBack={() => open('forums')} />
          : null;
      case 'forum-compose':
        return <ForumComposeScreen
          mode={composeMode}
          forumId={composeForumId ?? undefined}
          onBack={() => open('forums')}
          onCreated={() => open('forums')} />;
      default: return null;
    }
  };

  const renderActiveScreen = () => {
    const overlayEl = renderOverlay();
    if (overlayEl) return overlayEl;

    switch (activeTab) {
      case 'home': return <Home />;
      case 'calendar': return <Calendar />;
      case 'tactics': return <TacticsSettingsScreen />;
      case 'coach': return <Coach />;
      case 'learn': return <Learn />;
      case 'community':
        return (
          <CommunityHubScreen
            onBack={() => setActiveTab('home')}
            onOpenAuth={() => open('auth')}
            onOpenSetup={() => open('community-setup')}
            onOpenSettings={() => open('community-settings')}
            onOpenPartner={() => open('partner')}
            onOpenForums={() => open('forums')}
            onOpenLeaderboard={() => open('leaderboard')}
          />
        );
      case 'profile':
        return (
          <Profile
            onNavigateToReminders={() => open('reminders')}
            onNavigateToMantras={() => open('mantras')}
            onNavigateToRituals={() => open('rituals')}
            onNavigateToYourData={() => open('data')}
            onNavigateToPersonalization={() => open('personalization')}
            onNavigateToYourWhy={() => open('why')}
            onNavigateToWatchlist={() => open('watchlist')}
            onNavigateToInsights={() => open('insights')}
            onNavigateToAiConfig={() => open('aiconfig')}
            onNavigateToTactics={() => open('tactics')}
            onNavigateToCommunity={() => open('community')}
          />
        );
      default: return <Home />;
    }
  };

  const isOverlayOpen = overlay !== null;
  const key = isOverlayOpen ? `overlay-${overlay}` : activeTab;

  return (
    <View className="flex-1 bg-guard-bg">
      <View className="flex-1">
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={key}
            from={{ opacity: 0, translateX: 10 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -10 }}
            transition={{ type: 'timing', duration: 300 }}
            className="flex-1"
          >
            {renderActiveScreen()}
          </MotiView>
        </AnimatePresence>
      </View>
      {!isOverlayOpen && <BottomTab activeTab={activeTab} onTabChange={setActiveTab} />}
    </View>
  );
};
