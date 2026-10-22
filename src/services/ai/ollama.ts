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
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

const getOllamaConfig = (): OllamaConfig => {
  const raw = localStorage.getItem('vitrinex_ollama_config');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch { /* fall through */ }
  }
  return {
    baseUrl: import.meta.env?.VITE_OLLAMA_BASE_URL || 'http://localhost:11434',
    model: import.meta.env?.VITE_OLLAMA_MODEL || 'llama3',
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

/**
 * Parses Ollama's NDJSON streaming response, invoking onChunk for each token
 * piece (same contract as the Gemini generateContentStream handlers).
 */
export const readOllamaStream = async (
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void
): Promise<string> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  const handleLine = (line: string) => {
    if (!line.trim()) return;
    try {
      const json = JSON.parse(line);
      const piece: string = json?.message?.content ?? json?.response ?? '';
      if (piece) {
        full += piece;
        onChunk(piece);
      }
    } catch { /* ignore partial/invalid line */ }
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(handleLine);
  }
  handleLine(buffer);
  return full;
};

/** Local token estimate (~4 chars/token) replacing Gemini's countTokens. */
export const estimateTokens = (text: string): number => Math.ceil((text || '').length / 4);

/**
 * Converts Gemini functionDeclarations (Type.OBJECT => 'OBJECT') into
 * Ollama's tools format (JSON-schema lowercase types).
 */
export const convertToolsToOllama = (tools: any[] = []): any[] => {
  const lower = (schema: any): any => {
    if (Array.isArray(schema)) return schema.map(lower);
    if (schema && typeof schema === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(schema)) {
        out[k] = k === 'type' && typeof v === 'string' ? v.toLowerCase() : lower(v);
      }
      return out;
    }
    return schema;
  };
  return tools.flatMap(t => (t.functionDeclarations || []).map((fd: any) => ({
    type: 'function',
    function: { name: fd.name, description: fd.description, parameters: lower(fd.parameters) },
  })));
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

  const stream = !!options?.onChunk;
  const body = {
    model,
    messages,
    stream,
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
    signal: options?.signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama Error ${res.status}: ${err}`);
  }

  if (stream && res.body) {
    return readOllamaStream(res.body, options!.onChunk!);
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
