import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { BUILD_COMMIT } from '../buildInfo';

const LOCAL_COMMIT: string = BUILD_COMMIT;

const GITHUB_RELEASES_API =
  'https://api.github.com/repos/SocialscribeAI/gibor-keari/releases/latest';
const RELEASE_PAGE_URL =
  'https://github.com/SocialscribeAI/gibor-keari/releases/tag/latest';

type LatestRelease = {
  commitSha: string | null;
  apkUrl: string;
};

function parseBuildCommit(body: unknown): string | null {
  if (typeof body !== 'string') return null;
  const m = body.match(/Build commit:\s*([0-9a-f]{7,40})/i);
  return m ? m[1].toLowerCase() : null;
}

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
      commitSha: parseBuildCommit(json?.body),
      apkUrl: apkAsset?.browser_download_url ?? RELEASE_PAGE_URL,
    };
  } catch {
    return null;
  }
}

export function UpdateBanner() {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  useEffect(() => {
    // Local/dev builds have LOCAL_COMMIT === 'dev' — never nag.
    if (!LOCAL_COMMIT || LOCAL_COMMIT === 'dev') return;

    let cancelled = false;
    (async () => {
      const latest = await fetchLatestRelease();
      if (cancelled || !latest) return;
      // If we couldn't read a SHA from the release, stay silent rather than
      // nag — better to miss an update than to falsely advertise one.
      if (!latest.commitSha) return;
      const localSha = LOCAL_COMMIT.toLowerCase();
      const isSameBuild =
        latest.commitSha.startsWith(localSha) || localSha.startsWith(latest.commitSha);
      if (!isSameBuild) setUpdateUrl(latest.apkUrl);
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
