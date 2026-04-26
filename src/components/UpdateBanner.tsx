import React, { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { BUILD_TIME_ISO } from '../buildInfo';

const GITHUB_RELEASES_API =
  'https://api.github.com/repos/SocialscribeAI/gibor-keari/releases/latest';
const RELEASE_PAGE_URL =
  'https://github.com/SocialscribeAI/gibor-keari/releases/tag/latest';

type LatestRelease = {
  publishedAt: string;
  apkUrl: string;
};

async function fetchLatestRelease(): Promise<LatestRelease | null> {
  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const apkAsset = (json?.assets ?? []).find(
      (a: { name?: string; browser_download_url?: string }) =>
        typeof a?.name === 'string' && a.name.endsWith('.apk'),
    );
    return {
      publishedAt: json?.published_at ?? json?.created_at ?? '',
      apkUrl: apkAsset?.browser_download_url ?? RELEASE_PAGE_URL,
    };
  } catch {
    return null;
  }
}

export function UpdateBanner() {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const latest = await fetchLatestRelease();
      if (cancelled || !latest?.publishedAt) return;
      const built = Date.parse(BUILD_TIME_ISO);
      const published = Date.parse(latest.publishedAt);
      // Treat as update only if release is at least 60s newer than this build
      // (avoids self-triggering on the very build that produced the release).
      if (Number.isFinite(built) && Number.isFinite(published) && published - built > 60_000) {
        setUpdateUrl(latest.apkUrl);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!updateUrl) return null;

  return (
    <Pressable
      onPress={() => Linking.openURL(updateUrl)}
      className="bg-guard-accent/95 px-4 py-2"
      accessibilityRole="button"
      accessibilityLabel="A new version of Gibor KeAri is available — tap to download"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-guard-on-accent font-semibold">New version available</Text>
        <Text className="text-guard-on-accent underline">Tap to update</Text>
      </View>
    </Pressable>
  );
}
