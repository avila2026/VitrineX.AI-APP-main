/**
 * VitrineX AI - Mistral AI Service
 * Provides integration with Mistral AI API (https://mistral.ai)
 * Supports text generation via chat completions endpoint.
 */

export interface MistralConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export interface MistralMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type MistralModel =
  | 'mistral-small-latest'
  | 'mistral-medium-latest'
  | 'mistral-large-latest'
  | 'open-mistral-7b'
  | 'open-mixtral-8x7b'
  | 'open-mixtral-8x22b'
  | string;

export const MISTRAL_MODELS: { value: MistralModel; label: string }[] = [
  { value: 'mistral-small-latest', label: 'Mistral Small (Rápido)' },
  { value: 'mistral-medium-latest', label: 'Mistral Medium (Balanceado)' },
  { value: 'mistral-large-latest', label: 'Mistral Large (Avançado)' },
  { value: 'open-mistral-7b', label: 'Open Mistral 7B (Open Source)' },
  { value: 'open-mixtral-8x7b', label: 'Open Mixtral 8x7B (Open Source)' },
];

const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';

const getMistralConfig = (): MistralConfig => {
  const apiKey = localStorage.getItem('vitrinex_mistral_api_key') || '';
  const raw = localStorage.getItem('vitrinex_mistral_config');
  let config: Partial<MistralConfig> = {};
  if (raw) {
    try { config = JSON.parse(raw); } catch { /* ignore */ }
  }
  return {
    apiKey,
    model: config.model || 'mistral-small-latest',
    temperature: config.temperature ?? 0.7,
    topP: config.topP ?? 1.0,
    maxTokens: config.maxTokens,
  };
};

export const saveMistralConfig = (config: Partial<MistralConfig>): void => {
  if (config.apiKey !== undefined) {
    localStorage.setItem('vitrinex_mistral_api_key', config.apiKey);
  }
  const existing = getMistralConfig();
  const merged = { ...existing, ...config };
  const { apiKey: _, ...rest } = merged; // store config separately from key
  localStorage.setItem('vitrinex_mistral_config', JSON.stringify(rest));
};

export const testMistralConnection = async (
  apiKey?: string
): Promise<{ success: boolean; message: string; models?: string[] }> => {
  const key = apiKey || getMistralConfig().apiKey;
  if (!key) return { success: false, message: 'Chave de API não configurada.' };

  try {
    const res = await fetch(`${MISTRAL_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401) return { success: false, message: 'Chave inválida ou expirada.' };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const models: string[] = (data.data || []).map((m: { id: string }) => m.id);
    return {
      success: true,
      message: `Conectado! ${models.length} modelo(s) disponível(is).`,
      models,
    };
  } catch (e: any) {
    if (e.name === 'TimeoutError') return { success: false, message: 'Timeout: API demorou demais para responder.' };
    return { success: false, message: `Falha: ${e.message}` };
  }
};

export const generateTextWithMistral = async (
  prompt: string,
  options?: {
    model?: string;
    systemInstruction?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> => {
  const cfg = getMistralConfig();
  if (!cfg.apiKey) throw new Error('Chave Mistral AI não configurada.');

  const messages: MistralMessage[] = [];
  if (options?.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const body = {
    model: options?.model || cfg.model,
    messages,
    temperature: options?.temperature ?? cfg.temperature ?? 0.7,
    top_p: cfg.topP,
    max_tokens: options?.maxTokens || cfg.maxTokens,
  };

  const res = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral Error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
};

export { getMistralConfig };
