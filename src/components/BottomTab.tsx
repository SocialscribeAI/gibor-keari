import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { Home, Calendar, Sparkles, BookOpen, User, Zap, Users } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

export type TabType = 'home' | 'calendar' | 'tactics' | 'coach' | 'learn' | 'community' | 'profile';

interface BottomTabProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomTab: React.FC<BottomTabProps> = ({ activeTab, onTabChange }) => {
  const { hasNewCoachMessage, setHasNewCoachMessage } = useStore();
  const theme = useTheme();

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tactics', label: 'Tactics', icon: Zap },
    { id: 'coach', label: 'Coach', icon: Sparkles },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleTabPress = (id: TabType) => {
    onTabChange(id);
    if (id === 'coach') setHasNewCoachMessage(false);
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-guard-bg border-t border-guard-primary/30 pb-6"
      style={{ elevation: 20 }}
    >
      <View className="flex-row justify-around items-center h-20 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === 'coach' && hasNewCoachMessage;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              className="items-center justify-center flex-1"
            >
              <View className="relative">
                <Icon size={20} color={isActive ? theme.accent : theme.textDim} />
                {showBadge && (
                  <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-guard-bg"
                  />
                )}
              </View>
              <Text
                className="text-[8px] font-black uppercase mt-1.5"
                style={{ color: isActive ? theme.accent : theme.textDim, letterSpacing: 1.5 }}
              >
                {tab.label}
              </Text>
              {isActive && <View className="w-1 h-1 bg-guard-accent rounded-full mt-1" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

