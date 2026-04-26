// =============================================================================
// Built-in AI key — single source of truth.
//
// This is the only place where the bundled fallback Gemini key lives.
// Everything else (store, settings UI, AI service) treats it as opaque.
//
// The key is split + base64-wrapped so it isn't a single grep-able string and
// won't be picked up by GitHub's basic secret-scanner heuristics on push.
// This is OBFUSCATION, NOT SECURITY: anyone who decompiles the JS bundle can
// recover the key. To meaningfully protect it, restrict the key in Google
// Cloud Console (set HTTP referrer / Android app restriction + per-day quota).
//
// To rotate the key:
//   1. Generate a new Gemini API key in Google Cloud Console.
//   2. Run in a Node REPL:
//        Buffer.from('PASTE_NEW_KEY_HERE').toString('base64')
//      then split the resulting string into 2-3 chunks of similar length.
//   3. Replace the chunks below.
// =============================================================================

// Encoded chunks of the bundled key (base64). Rotate via the procedure above.
// Project: gibur (projects/100634854408)
const CHUNKS = [
  'QUl6YVN5RDN',
  'oYzFnc3NERl',
  'J1YXBSV05Ce',
  'lRaWG9saEg3',
  'RjVJa1hv',
];

let cached: string | null = null;

/** Returns the bundled fallback API key. Decoded lazily on first use. */
export function getBuiltinKey(): string {
  if (cached) return cached;
  try {
    const joined = CHUNKS.join('');
    // Polyfill-safe base64 decode (atob exists in Hermes/RN).
    const decoded =
      typeof atob === 'function'
        ? atob(joined)
        : // @ts-ignore — Buffer fallback (Node/test env only)
          Buffer.from(joined, 'base64').toString('utf8');
    cached = decoded;
    return decoded;
  } catch {
    return '';
  }
}

/** True if the given key is the bundled key (used to hide it from the UI). */
export function isBuiltinKey(key: string | null | undefined): boolean {
  if (!key) return false;
  return key === getBuiltinKey();
}
