import { getOllamaConfig } from '../services/ai/ollama';

export interface OllamaHealth {
  running: boolean;
  baseUrl: string;
  models: string[];
  missingModels: string[];
  error?: string;
}

/** Checks if Ollama is reachable and which of the wanted models are installed. */
export const checkOllamaHealth = async (wantedModels: string[] = []): Promise<OllamaHealth> => {
  const { baseUrl } = getOllamaConfig();
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models: string[] = (data.models || []).map((m: { name: string }) => m.name);
    const missingModels = wantedModels.filter(w => !models.some(m => m === w || m.startsWith(`${w}:`)));
    return { running: true, baseUrl, models, missingModels };
  } catch (e: any) {
    return { running: false, baseUrl, models: [], missingModels: wantedModels, error: e?.message || String(e) };
  }
};
