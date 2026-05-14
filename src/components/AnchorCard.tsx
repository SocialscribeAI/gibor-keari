import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Anchor } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../constants/theme';

/**
 * Anchor card — surfaces the user's identityStatement and one of their why
 * reasons on Home. The user explicitly called this out: their own words about
 * who they are should be in their face when they're weak, not buried in a
 * settings sub-screen.
 *
 * Rendered unconditionally on Home: if no identity statement is set yet, a
 * soft CTA points them at onboarding upgrade or About Me so the slot earns
 * its place by being useful even when empty.
 */
export const AnchorCard: React.FC = () => {
  const identityStatement = useStore((s) => s.identityStatement);
  const whyReasons = useStore((s) => s.whyReasons);
  const theme = useTheme();

  // Rotate the visible why-reason by minute so the same one isn't always
  // showing within a single session.
  const reason = useMemo(() => {
    if (!whyReasons.length) return null;
    const idx = Math.floor(Date.now() / 60_000) % whyReasons.length;
    return whyReasons[idx];
  }, [whyReasons]);

  const hasIdentity = !!identityStatement && identityStatement.trim().length > 0;

  if (!hasIdentity && !reason) {
    // No anchor data yet — minimal CTA. Single line so it doesn't dominate.
    return (
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.hairline,
        }}
      >
        <Anchor size={14} color={theme.muted} />
        <Text style={{ color: theme.muted, fontSize: 12, marginLeft: 8 }}>
          Set your "I am the kind of man who…" in About Me — it shows up here.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        padding: 14,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(232,160,32,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(232,160,32,0.35)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Anchor size={13} color={theme.accent} />
        <Text style={{ color: theme.accent, fontWeight: '900', letterSpacing: 2, fontSize: 10, marginLeft: 6 }}>
          YOUR ANCHOR
        </Text>
      </View>
      {hasIdentity && (
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', lineHeight: 22 }}>
          "I am the kind of man who {identityStatement!.replace(/^i am the kind of man who\s+/i, '')}."
        </Text>
      )}
      {reason && (
        <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: hasIdentity ? 8 : 0, fontStyle: 'italic' }}>
          Because: {reason}
        </Text>
      )}
    </View>
  );
};
