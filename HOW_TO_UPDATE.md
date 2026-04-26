# How to Edit & Update the App

This is your cheat sheet for shipping changes to the Gibor KeAri app **without waiting 15 minutes every time**.

---

## TL;DR — Two paths

| Type of change | Command | Time | New APK needed? |
|---|---|---|---|
| **JS / content / UI** (95% of edits) | `npm run push -- -m "what changed"` | ~30 sec | No |
| **Native** (deps, permissions, plugins) | `git push` + trigger CI | ~5 min | Yes |

---

## Path A — Fast updates (OTA via EAS Update)

Use this for **anything that doesn't touch native code**:
- Screens, components, content, copy, colors
- Logic in `src/services/`, `src/store/`, `src/utils/`, `src/hooks/`
- Tailwind classes, theme tweaks
- New screens, navigation changes

### One-time setup
```powershell
npm install -g eas-cli
eas login
```

### Every time you make a JS change
```powershell
npm run push -- --message "fix wording on Home screen"
```

That's it. The phone checks for updates on next app launch and gets the new JS in seconds. **No reinstall, no waiting.**

### How users get the update
- Open the app → it auto-checks `u.expo.dev` → downloads new bundle in background
- New JS runs on the **next** app launch (close & reopen)

### Pushing to production channel (for the client's stable build)
```powershell
npm run push:prod -- --message "v1.0.1 hotfix"
```
Preview and production are separate channels — they never cross-contaminate.

---

## Path B — Full APK rebuild (only when needed)

You only need a new APK when you change one of these:

### What requires a rebuild
- **`package.json` dependencies** — adding/removing/upgrading any `expo-*` or `react-native-*` package
- **`app.json`** — `plugins`, `permissions`, `package`, `version`, `android.*`, `ios.*`
- **Native code** in `android/` or `ios/` (you almost never touch these)
- **Assets bundled at build time** — splash screen, app icon, fonts in `app.json`

### How to rebuild
```powershell
git add -A
git commit -m "feat: add expo-camera"
git push
gh workflow run android-apk.yml
```

Then watch progress:
```powershell
gh run watch
```

When it finishes, download the APK from:
**https://github.com/SocialscribeAI/gibor-keari/releases/download/latest/gibor-keari.apk**

The `latest` tag always points to the most recent CI build.

### Build times
- **First build after changing the workflow:** ~12 min (populating caches)
- **Every subsequent build:** ~5–7 min (caches reused)

---

## Decision tree: "Do I need a new APK?"

```
Did you edit ONLY files inside src/, App.tsx, global.css, tailwind.config.js, or babel.config.js?
├── YES → npm run push                    (30 sec)
└── NO →  Did you change package.json deps, app.json, or anything in android/?
         ├── YES → Rebuild APK             (5–7 min)
         └── NO →  npm run push            (30 sec)
```

When in doubt: try `npm run push` first. If the change involves a native module, EAS will tell you it needs a rebuild.

---

## Common scenarios

### "I want to change some text on the Home screen"
→ Edit [src/screens/Home.tsx](src/screens/Home.tsx) → `npm run push -- -m "new home copy"`

### "I want to add a new screen"
→ Create file in [src/screens/](src/screens/) → register in [src/navigation/Navigator.tsx](src/navigation/Navigator.tsx) → `npm run push`

### "I want to add a new icon library / camera / new native package"
→ `npm install <package>` → commit → `gh workflow run android-apk.yml` → wait ~5 min → install new APK

### "I want to change the app icon or splash screen"
→ Replace asset → update [app.json](app.json) → rebuild APK

### "I want to push an emergency hotfix"
→ Edit JS → `npm run push -- -m "URGENT: <what>"` → users get it on next app open

---

## Checking what shipped

```powershell
# See your update history
eas update:list --branch preview

# See what version of the bundle is live
eas channel:view preview
```

Each update gets a unique ID. If something breaks, you can roll back:
```powershell
eas update:roll-back-to-embedded --branch preview
```
That instantly reverts users to the JS that's baked into the APK.

---

## Runtime version & compatibility

The app uses `runtimeVersion: { policy: "appVersion" }` (set in [app.json](app.json)).

This means: **OTA updates only reach APKs with the same `version` field**.

When you bump `app.json` → `version` from `"1.0.0"` to `"1.0.1"`, you MUST rebuild the APK. Old APKs (1.0.0) won't get updates meant for 1.0.1.

**Rule of thumb:** only bump `version` when you also rebuild the APK.

---

## If something goes wrong

### "npm run push" says "no changes detected"
You probably haven't saved the file. Or the change was in a non-bundled file (like a markdown doc).

### Phone never receives the update
1. Check Techloq has unblocked: `*.expo.dev`, `*.eascdn.net`, `u.expo.dev`
2. Force-close the app completely and reopen (not just background)
3. Check the update was published: `eas update:list --branch preview`
4. Check the app's runtimeVersion matches: it must equal the `version` in [app.json](app.json) at the time the APK was built

### CI build fails
Check the run log:
```powershell
gh run view --log-failed
```

### "I broke the JS and want to undo"
```powershell
eas update:roll-back-to-embedded --branch preview
```
Users immediately revert to the JS bundled in the APK.

---

## Speed comparison

| Scenario | Old way | New way |
|---|---|---|
| Fix typo on a screen | 15 min CI build + reinstall | **30 sec** (`npm run push`) |
| Add a new screen | 15 min CI build + reinstall | **30 sec** |
| Tweak Tailwind colors | 15 min CI build + reinstall | **30 sec** |
| Add `expo-camera` (native) | 15 min CI build + reinstall | ~5 min CI build + reinstall |
| Roll back a bad change | Rebuild from old commit (15 min) | **5 sec** (`eas update:roll-back-to-embedded`) |

---

## Files this doc references

- [.github/workflows/android-apk.yml](.github/workflows/android-apk.yml) — the CI workflow
- [app.json](app.json) — Expo config (updates URL, runtimeVersion, channel)
- [eas.json](eas.json) — EAS build profiles
- [package.json](package.json) — `npm run push` and `npm run push:prod` scripts
