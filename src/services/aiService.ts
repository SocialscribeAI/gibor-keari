// =============================================================================
// AI service — unified client for Groq (default free), OpenAI, Anthropic,
// Ollama (local), and custom OpenAI-compatible endpoints.
//
// Design notes:
// - BYOK. No Guard-operated server. Keys are passed in from the store.
// - Returns either plain text or parsed JSON (when `json: true`).
// - Never throws on parse failure — returns { ok: false, error } so UI can
//   surface it without crashing.
// =============================================================================

export type AiProvider = 'none' | 'anthropic' | 'openai' | 'groq' | 'gemini' | 'local-ollama' | 'custom';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string | null;
  model: string | null;
  customEndpoint: string | null;
}

export interface CallOptions {
  system: string;
  user: string;
  /** When true, ask the model to return JSON and parse it. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

export type CallResult<T = string> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const DEFAULT_MODELS: Record<AiProvider, string> = {
  none: '',
  anthropic: 'claude-3-5-haiku-latest',
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemma-3-27b-it',
  'local-ollama': 'llama3.2',
  custom: '',
};

// ---------------------------------------------------------------------------
// Built-in fallback — private app, user opted in to bundling a key.
// If the user hasn't configured anything, we auto-use Gemini/Gemma.
// Key lives in `_builtinKey.ts` (obfuscated). Rotate it there.
// ---------------------------------------------------------------------------
import { getBuiltinKey } from './_builtinKey';

const BUILTIN_AI: AiConfig = {
  provider: 'gemini',
  get apiKey() {
    return getBuiltinKey();
  },
  model: 'gemma-3-27b-it',
  customEndpoint: null,
} as AiConfig;

function resolveConfig(cfg: AiConfig): AiConfig {
  // If user picked 'none' or left the key blank on a key-requiring provider, fall back to builtin.
  if (cfg.provider === 'none') return BUILTIN_AI;
  if (cfg.provider === 'local-ollama' || cfg.provider === 'custom') {
    return cfg.customEndpoint ? cfg : BUILTIN_AI;
  }
  return cfg.apiKey ? cfg : BUILTIN_AI;
}

export function isAiConfigured(cfg: AiConfig): boolean {
  // With BUILTIN_AI fallback, AI is always configured.
  // (Kept the fn so callers don't need to change.)
  return true;
}

function isAiConfiguredStrict(cfg: AiConfig): boolean {
  if (cfg.provider === 'none') return false;
  if (cfg.provider === 'local-ollama') return !!cfg.customEndpoint;
  if (cfg.provider === 'custom') return !!cfg.customEndpoint;
  return !!cfg.apiKey;
}

export function providerLabel(p: AiProvider): string {
  switch (p) {
    case 'groq':
      return 'Groq (free · open-source)';
    case 'gemini':
      return 'Google Gemini (free)';
    case 'anthropic':
      return 'Anthropic Claude';
    case 'openai':
      return 'OpenAI';
    case 'local-ollama':
      return 'Ollama (local)';
    case 'custom':
      return 'Custom endpoint';
    default:
      return 'Not configured';
  }
}

// ---------------------------------------------------------------------------

export async function callAI(cfg: AiConfig, opts: CallOptions): Promise<CallResult<string>> {
  const resolved = resolveConfig(cfg);
  const model = resolved.model || DEFAULT_MODELS[resolved.provider];
  try {
    if (resolved.provider === 'anthropic') return await callAnthropic(resolved, model, opts);
    if (resolved.provider === 'local-ollama') return await callOllama(resolved, model, opts);
    // groq / openai / gemini / custom all use an OpenAI-compatible /chat/completions shape.
    return await callOpenAICompatible(resolved, model, opts);
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Network error' };
  }
}

export async function callAIJson<T = unknown>(
  cfg: AiConfig,
  opts: CallOptions,
): Promise<CallResult<T>> {
  const res = await callAI(cfg, { ...opts, json: true });
  if (!res.ok) return res;
  try {
    const trimmed = stripFences(res.data);
    const parsed = JSON.parse(trimmed) as T;
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: 'AI returned invalid JSON. Try again.' };
  }
}

// ---------------------------------------------------------------------------

function endpointFor(cfg: AiConfig): string {
  switch (cfg.provider) {
    case 'groq':
      return 'https://api.groq.com/openai/v1/chat/completions';
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    case 'custom':
      return (cfg.customEndpoint || '').replace(/\/$/, '') + '/chat/completions';
    case 'local-ollama':
      return (cfg.customEndpoint || 'http://localhost:11434').replace(/\/$/, '') + '/api/chat';
    case 'anthropic':
      return 'https://api.anthropic.com/v1/messages';
    default:
      return '';
  }
}

async function callOpenAICompatible(
  cfg: AiConfig,
  model: string,
  opts: CallOptions,
): Promise<CallResult<string>> {
  // Gemma models (served via Gemini API) don't accept the `system` role.
  // Detect and fold system content into the user message.
  const isGemma = cfg.provider === 'gemini' && /gemma/i.test(model);
  const messages = isGemma
    ? [{ role: 'user', content: `${opts.system}\n\n---\n\n${opts.user}` }]
    : [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ];

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 800,
  };
  // Gemma via Gemini's OpenAI-compat shim doesn't support response_format either.
  if (opts.json && !isGemma) body.response_format = { type: 'json_object' };
  if (opts.json && isGemma) {
    // Ask the model directly for JSON in the prompt.
    (messages[0] as { content: string }).content +=
      '\n\nRespond with ONLY valid JSON. No prose, no markdown fences.';
  }

  const res = await fetch(endpointFor(cfg), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey ?? ''}`,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `HTTP ${res.status}: ${truncate(text, 200)}` };
  }
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  if (!content) return { ok: false, error: 'Empty response from AI.' };
  return { ok: true, data: content };
}

async function callAnthropic(
  cfg: AiConfig,
  model: string,
  opts: CallOptions,
): Promise<CallResult<string>> {
  const res = await fetch(endpointFor(cfg), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey ?? '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 800,
      temperature: opts.temperature ?? 0.7,
      system: opts.system + (opts.json ? '\n\nRespond with a single valid JSON object. No prose.' : ''),
      messages: [{ role: 'user', content: opts.user }],
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `HTTP ${res.status}: ${truncate(text, 200)}` };
  }
  const data = await res.json();
  const content: string = data?.content?.[0]?.text ?? '';
  if (!content) return { ok: false, error: 'Empty response from Claude.' };
  return { ok: true, data: content };
}

async function callOllama(
  cfg: AiConfig,
  model: string,
  opts: CallOptions,
): Promise<CallResult<string>> {
  const res = await fetch(endpointFor(cfg), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: opts.system + (opts.json ? '\n\nReturn only a valid JSON object.' : '') },
        { role: 'user', content: opts.user },
      ],
      stream: false,
      options: { temperature: opts.temperature ?? 0.7 },
      ...(opts.json ? { format: 'json' } : {}),
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `HTTP ${res.status}: ${truncate(text, 200)}` };
  }
  const data = await res.json();
  const content: string = data?.message?.content ?? '';
  if (!content) return { ok: false, error: 'Empty response from Ollama.' };
  return { ok: true, data: content };
}

// ---------------------------------------------------------------------------

function stripFences(s: string): string {
  const t = s.trim();
  if (t.startsWith('```')) {
    return t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  // If the model wrapped JSON in prose, grab the first { ... } block.
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first >= 0 && last > first) return t.slice(first, last + 1);
  return t;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
