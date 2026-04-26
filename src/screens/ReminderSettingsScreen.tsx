import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Switch, ScrollView, Alert } from 'react-native';
import { ArrowLeft, Bell, BellOff } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useStore } from '../store/useStore';
import { notificationService } from '../services/notificationService';
import { useTheme } from '../constants/theme';

interface Props {
  onBack: () => void;
}

const validateTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

export const ReminderSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const {
    notificationsEnabled,
    dailyReminderTime,
    dangerHour,
    updateNotificationSettings,
    personalityProfile,
    currentStreak,
  } = useStore();

  const [time, setTime] = useState(dailyReminderTime);
  const [timeError, setTimeError] = useState('');

  const commitTime = (t: string) => {
    if (!validateTime(t)) {
      setTimeError('Use 24h format HH:mm (e.g. 07:30)');
      return;
    }
    setTimeError('');
    updateNotificationSettings({ dailyReminderTime: t });
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        Alert.alert('Permission denied', 'Enable notifications in system settings to receive reminders.');
        return;
      }
      await notificationService.scheduleDailyReminder(time, personalityProfile.tone, currentStreak);
      await notificationService.scheduleUrgeAlert(dangerHour);
    } else {
      await notificationService.cancelAll();
    }
    updateNotificationSettings({ notificationsEnabled: value });
  };

  const setHour = (h: number) => {
    updateNotificationSettings({ dangerHour: h });
    if (notificationsEnabled) {
      notificationService.cancelAll().then(() => {
        notificationService.scheduleDailyReminder(time, personalityProfile.tone, currentStreak);
        notificationService.scheduleUrgeAlert(h);
      });
    }
  };

  const preview = (id: 'daily_reminder' | 'urge_alert') => {
    notificationService.triggerPreview(id);
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 || 12;
    return `${display}${period}`;
  };

  return (
    <Screen>
      <View className="flex-row items-center mb-6">
        <Pressable onPress={onBack} className="w-10 h-10 rounded-xl bg-guard-surface items-center justify-center mr-3">
          <ArrowLeft size={18} color={theme.text} />
        </Pressable>
        <Text className="text-2xl font-black text-white">Reminders</Text>
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {notificationsEnabled ? (
            <Bell size={20} color={theme.accent} />
          ) : (
            <BellOff size={20} color={theme.textDim} />
          )}
          <Text className="ml-3 text-white font-bold">Notifications</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: '#2C3E7A', true: '#E8A020' }}
          thumbColor="#F0F2FF"
        />
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mb-4">
        <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Daily reminder time</Text>
        <TextInput
          value={time}
          onChangeText={(t) => {
            setTime(t);
            if (validateTime(t)) commitTime(t);
          }}
          onBlur={() => commitTime(time)}
          placeholder="08:00"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="bg-guard-bg border border-guard-primary/30 rounded-2xl px-4 py-3 text-white text-xl font-black"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        {timeError ? <Text className="text-guard-danger text-xs mt-2">{timeError}</Text> : null}
        <Pressable
          onPress={() => preview('daily_reminder')}
          className="mt-3 py-2 rounded-xl bg-white/5 items-center"
        >
          <Text className="text-white/70 text-xs font-bold uppercase">Preview</Text>
        </Pressable>
      </View>

      <View className="bg-guard-surface border border-guard-primary/30 rounded-3xl p-5 mb-4">
        <Text className="text-guard-accent text-xs uppercase tracking-widest mb-3">Danger hour</Text>
        <Text className="text-white/50 text-xs mb-3">
          The hour you're most tempted — we'll send an alert then.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Array.from({ length: 24 }).map((_, h) => {
            const selected = dangerHour === h;
            return (
              <Pressable
                key={h}
                onPress={() => setHour(h)}
                className={`px-4 py-3 rounded-xl mr-2 ${
                  selected ? 'bg-guard-accent' : 'bg-guard-bg border border-guard-primary/30'
                }`}
              >
                <Text className={`font-black ${selected ? 'text-guard-on-accent' : 'text-white'}`}>
                  {formatHour(h)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable onPress={() => preview('urge_alert')} className="mt-3 py-2 rounded-xl bg-white/5 items-center">
          <Text className="text-white/70 text-xs font-bold uppercase">Preview</Text>
        </Pressable>
      </View>
    </Screen>
  );
};
