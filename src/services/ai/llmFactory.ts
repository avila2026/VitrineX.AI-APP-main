import type { ILLMProvider, LLMGenerateOptions } from './adapters/ILLMProvider';
import { OllamaProvider } from './adapters/OllamaProvider';
import { GeminiProvider } from './adapters/GeminiProvider';
import { OLLAMA_FALLBACK_MODEL } from '../../constants';
import { logger } from '../../lib/logger';

export type AIProviderName = 'ollama' | 'gemini';

export const getPreferredProvider = (): AIProviderName =>
  import.meta.env?.VITE_AI_PROVIDER === 'ollama' ? 'ollama' : 'gemini';

const create = (n: AIProviderName): ILLMProvider => (n === 'ollama' ? new OllamaProvider() : new GeminiProvider());

/**
 * Returns the preferred provider if available, otherwise the other one.
 * Throws if neither is available.
 */
export const getLLMProvider = async (preferred: AIProviderName = getPreferredProvider()): Promise<ILLMProvider> => {
  const order: AIProviderName[] = preferred === 'ollama' ? ['ollama', 'gemini'] : ['gemini', 'ollama'];
  for (const name of order) {
    const provider = create(name);
    if (await provider.isAvailable()) {
      logger.info(`[LLM Factory] Using provider '${name}' (preferred: '${preferred}')`);
      return provider;
    }
    logger.warn(`[LLM Factory] Provider '${name}' unavailable`);
  }
  throw new Error('Nenhum provedor de IA disponível (Ollama offline e sem chave Gemini).');
};

/** Generates text with automatic cross-provider fallback on failure. */
export const generateWithFallback = async (prompt: string, options?: LLMGenerateOptions): Promise<string> => {
  const preferred = getPreferredProvider();
  const primary = await getLLMProvider(preferred);
  try {
    return await primary.generateText(prompt, options);
  } catch (e) {
    logger.warn(`[LLM Factory] '${primary.name}' failed, trying fallback`, { error: (e as Error).message });
    const otherName: AIProviderName = primary.name === 'ollama' ? 'gemini' : 'ollama';
    const other = create(otherName);
    if (!(await other.isAvailable())) throw e;
    const model = otherName === 'ollama' ? OLLAMA_FALLBACK_MODEL : undefined;
    return other.generateText(prompt, { ...options, model: model ?? options?.model });
  }
};
