/**
 * VitrineX AI - Ollama Service
 * Provides integration with a locally running Ollama instance.
 * https://github.com/ollama/ollama/blob/main/docs/api.md
 */

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  numCtx?: number;
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaGenerateOptions {
  model?: string;
  temperature?: number;
  systemInstruction?: string;
}

const getOllamaConfig = (): OllamaConfig => {
  const raw = localStorage.getItem('vitrinex_ollama_config');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch { /* fall through */ }
  }
  return {
    baseUrl: 'http://localhost:11434',
    model: 'llama3',
    temperature: 0.7,
  };
};

export const saveOllamaConfig = (config: OllamaConfig): void => {
  localStorage.setItem('vitrinex_ollama_config', JSON.stringify(config));
};

export const testOllamaConnection = async (config?: OllamaConfig): Promise<{ success: boolean; message: string; models?: string[] }> => {
  const cfg = config || getOllamaConfig();
  try {
    const res = await fetch(`${cfg.baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models: string[] = (data.models || []).map((m: { name: string }) => m.name);
    return { success: true, message: `Conectado! ${models.length} modelo(s) disponível(is).`, models };
  } catch (e: any) {
    return { success: false, message: `Falha na conexão: ${e.message || 'Verifique se o Ollama está rodando.'}` };
  }
};

export const generateTextWithOllama = async (
  prompt: string,
  options?: OllamaGenerateOptions
): Promise<string> => {
  const cfg = getOllamaConfig();
  const model = options?.model || cfg.model;
  const baseUrl = cfg.baseUrl;

  const messages: OllamaMessage[] = [];
  if (options?.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const body = {
    model,
    messages,
    stream: false,
    options: {
      temperature: options?.temperature ?? cfg.temperature ?? 0.7,
      top_k: cfg.topK,
      top_p: cfg.topP,
      num_ctx: cfg.numCtx,
    },
  };

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama Error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.message?.content || data?.response || '';
};

export const listOllamaModels = async (baseUrl?: string): Promise<string[]> => {
  const url = baseUrl || getOllamaConfig().baseUrl;
  try {
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
};

export const embedTextWithOllama = async (prompt: string, model?: string): Promise<number[]> => {
  const cfg = getOllamaConfig();
  const m = model || cfg.model;
  const baseUrl = cfg.baseUrl;

  const res = await fetch(`${baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: m, prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama Embedding Error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.embedding || [];
};

export { getOllamaConfig };
