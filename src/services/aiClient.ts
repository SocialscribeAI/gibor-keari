// =============================================================================
// AI client — unified interface over OpenAI-compatible, Anthropic, and Ollama APIs.
// All calls are made directly from the device to the user's chosen provider.
// Nothing passes through Guard's servers because Guard has no servers.
// =============================================================================

export type AiProvider = 'none' | 'anthropic' | 'openai' | 'groq' | 'local-ollama' | 'custom';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string | null;
  model: string | null;
  customEndpoint: string | null;
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AiClientError extends Error {
  constructor(
    message: string,
    public kind: 'not-configured' | 'missing-key' | 'network' | 'provider',
    public status?: number,
  ) {
    super(message);
    this.name = 'AiClientError';
  }
}

/**
 * Send a chat message to the configured provider and return the assistant reply.
 */
export async function chat(config: AiConfig, messages: AiMessage[]): Promise<string> {
  if (config.provider === 'none') {
    throw new AiClientError('No AI provider configured.', 'not-configured');
  }
  if (
    (config.provider === 'anthropic' ||
      config.provider === 'openai' ||
      config.provider === 'groq' ||
      config.provider === 'custom') &&
    !config.apiKey
  ) {
    throw new AiClientError('API key missing.', 'missing-key');
  }

  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(config, messages);
    case 'openai':
      return callOpenAI(config, messages, 'https://api.openai.com/v1');
    case 'groq':
      return callOpenAI(config, messages, 'https://api.groq.com/openai/v1');
    case 'local-ollama':
      return callOllama(config, messages);
    case 'custom':
      return callOpenAI(config, messages, normalizeEndpoint(config.customEndpoint));
    default:
      throw new AiClientError('Unknown provider.', 'not-configured');
  }
}

function normalizeEndpoint(endpoint: string | null): string {
  if (!endpoint) throw new AiClientError('Custom endpoint missing.', 'not-configured');
  return endpoint.replace(/\/+$/, '');
}

// =============================================================================
// Anthropic
// =============================================================================
async function callAnthropic(config: AiConfig, messages: AiMessage[]): Promise<string> {
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const chatMsgs = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey!,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system,
      messages: chatMsgs,
    }),
  }).catch((e) => {
    throw new AiClientError(`Network error: ${e.message}`, 'network');
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AiClientError(`Anthropic error ${res.status}: ${text}`, 'provider', res.status);
  }

  const data = await res.json();
  const content = data?.content?.[0]?.text;
  if (typeof content !== 'string') {
    throw new AiClientError('Malformed Anthropic response.', 'provider');
  }
  return content.trim();
}

// =============================================================================
// OpenAI-compatible (OpenAI, Groq, custom)
// =============================================================================
async function callOpenAI(
  config: AiConfig,
  messages: AiMessage[],
  baseUrl: string,
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  }).catch((e) => {
    throw new AiClientError(`Network error: ${e.message}`, 'network');
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AiClientError(`Provider error ${res.status}: ${text}`, 'provider', res.status);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new AiClientError('Malformed provider response.', 'provider');
  }
  return content.trim();
}

// =============================================================================
// Ollama (local)
// =============================================================================
async function callOllama(config: AiConfig, messages: AiMessage[]): Promise<string> {
  const baseUrl = normalizeEndpoint(config.customEndpoint || 'http://localhost:11434');
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model || 'llama3.2',
      messages,
      stream: false,
    }),
  }).catch((e) => {
    throw new AiClientError(
      `Cannot reach Ollama at ${baseUrl}: ${e.message}`,
      'network',
    );
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AiClientError(`Ollama error ${res.status}: ${text}`, 'provider', res.status);
  }

  const data = await res.json();
  const content = data?.message?.content;
  if (typeof content !== 'string') {
    throw new AiClientError('Malformed Ollama response.', 'provider');
  }
  return content.trim();
}
