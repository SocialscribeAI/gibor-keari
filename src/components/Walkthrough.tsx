import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import {
  Home,
  Calendar as CalendarIcon,
  Sparkles,
  Users,
  User,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
} from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';
import { LionMark } from './LionMark';

// =============================================================================
// First-run walkthrough — one-time tour that appears after the user completes
// onboarding. Five cards, each pointing at a tab or feature. Built deliberately
// last in Phase 4 so it points at stable surfaces.
//
// Skippable. Marked complete on either finishing or skipping; never re-prompted.
// =============================================================================

interface Stop {
  icon: any;
  title: string;
  body: string;
  accent?: 'gold' | 'red';
}

const STOPS: Stop[] = [
  {
    icon: Home,
    title: 'Home is your anchor',
    body: 'The three buttons — Stood, Danger, Fell — log your day in one tap. The streak ring tracks the days you stood. Your anchor card shows your own words back when you need them.',
  },
  {
    icon: AlertTriangle,
    title: 'Danger Mode is your commitment device',
    body: 'When the urge hits, tap Danger. The app locks you in for 60 seconds. You can still call or open contacts — but everything else is paused. Type your promise to override early.',
    accent: 'red',
  },
  {
    icon: CalendarIcon,
    title: 'Calendar is your memory',
    body: 'Every day shows up here. Tap a square to add a note or correct the status. The pattern engine reads what worked for you and tells you the truth.',
  },
  {
    icon: Sparkles,
    title: 'Coach is your sounding board',
    body: 'Private chat — never leaves your phone. Thumbs up or down on a reply trains the coach\'s voice over time. Coach keeps notes on what works for you in About Me.',
  },
  {
    icon: User,
    title: 'Profile is your control panel',
    body: 'About You holds your identity, mantras, rituals, and discipline rule. Coach holds AI config and tactics. Settings holds the technical knobs. Everything\'s editable, always.',
  },
];

export const Walkthrough: React.FC = () => {
  const theme = useTheme();
  const hasCompletedOnboarding = useStore((s) => s.hasCompletedOnboarding);
  const walkthroughCompleted = useStore((s) => s.walkthroughCompleted);
  const completeWalkthrough = useStore((s) => s.completeWalkthrough);

  const [index, setIndex] = useState(0);

  const shouldShow = hasCompletedOnboarding && !walkthroughCompleted;
  if (!shouldShow) return null;

  const stop = STOPS[index];
  const isLast = index === STOPS.length - 1;
  const Icon = stop.icon;

  const next = () => {
    if (isLast) {
      completeWalkthrough();
    } else {
      setIndex(index + 1);
    }
  };

  const skip = () => completeWalkthrough();

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15,17,32,0.95)',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 28,
            padding: 28,
            borderWidth: 1,
            borderColor: theme.hairline,
          }}
        >
          <Pressable
            onPress={skip}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: theme.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <X size={14} color={theme.muted} />
          </Pressable>

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'center', marginBottom: 24 }}>
            {STOPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === index ? 24 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i <= index ? theme.accent : theme.hairline,
                }}
              />
            ))}
          </View>

          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: 12 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -12 }}
              transition={{ type: 'timing', duration: 220 }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  backgroundColor:
                    stop.accent === 'red'
                      ? 'rgba(192,57,43,0.18)'
                      : 'rgba(232,160,32,0.15)',
                  borderWidth: 1,
                  borderColor:
                    stop.accent === 'red'
                      ? 'rgba(192,57,43,0.45)'
                      : 'rgba(232,160,32,0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  alignSelf: 'center',
                }}
              >
                {index === 0 ? (
                  <LionMark size={36} color={theme.accent} accentColor={theme.text} />
                ) : (
                  <Icon size={28} color={stop.accent === 'red' ? theme.danger : theme.accent} />
                )}
              </View>

              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: '900',
                  textAlign: 'center',
                  marginBottom: 12,
                  fontFamily: 'Outfit',
                }}
              >
                {stop.title}
              </Text>
              <Text
                style={{
                  color: theme.muted,
                  fontSize: 14,
                  lineHeight: 22,
                  textAlign: 'center',
                  marginBottom: 24,
                }}
              >
                {stop.body}
              </Text>
            </MotiView>
          </AnimatePresence>

          <Pressable
            onPress={next}
            style={{
              backgroundColor: theme.accent,
              paddingVertical: 16,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLast ? (
              <>
                <Check size={16} color={theme.onAccent} />
                <Text
                  style={{
                    color: theme.onAccent,
                    fontWeight: '900',
                    letterSpacing: 1.5,
                    fontSize: 13,
                  }}
                >
                  STAND STRONG
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    color: theme.onAccent,
                    fontWeight: '900',
                    letterSpacing: 1.5,
                    fontSize: 13,
                  }}
                >
                  {`NEXT (${index + 1}/${STOPS.length})`}
                </Text>
                <ArrowRight size={16} color={theme.onAccent} />
              </>
            )}
          </Pressable>

          <Pressable onPress={skip} hitSlop={6} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text
              style={{
                color: theme.textDim,
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Skip the tour
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
