/**
 * VitrineX AI - LLM Router
 * Reads user-defined feature-to-model mappings from localStorage and routes
 * text generation requests to the correct provider (Gemini or Ollama).
 */
import { generateTextWithOllama } from './ollama';
import { generateTextWithMistral } from './mistral';
import { generateText, type GenerateTextOptions } from './text';
import { logger } from '../../lib/logger';

export type LLMProvider = 'gemini' | 'ollama' | 'openai' | 'mistral';

export type AppFeature =
  | 'content_generator'
  | 'ad_studio'
  | 'campaign_builder'
  | 'chat'
  | 'trend_hunter'
  | 'market_radar'
  | 'default';

export interface FeatureMapping {
  feature: AppFeature;
  provider: LLMProvider;
  modelOverride?: string;
}

export interface LLMSettings {
  featureMappings: FeatureMapping[];
}

const DEFAULT_MAPPINGS: FeatureMapping[] = [
  { feature: 'content_generator', provider: 'gemini' },
  { feature: 'ad_studio', provider: 'gemini' },
  { feature: 'campaign_builder', provider: 'gemini' },
  { feature: 'chat', provider: 'ollama', modelOverride: 'llama3' },
  { feature: 'trend_hunter', provider: 'gemini' },
  { feature: 'market_radar', provider: 'gemini' },
  { feature: 'default', provider: 'gemini' },
];

export const getLLMSettings = (): LLMSettings => {
  const raw = localStorage.getItem('vitrinex_llm_settings');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch { /* fall through */ }
  }
  return { featureMappings: DEFAULT_MAPPINGS };
};

export const saveLLMSettings = (settings: LLMSettings): void => {
  localStorage.setItem('vitrinex_llm_settings', JSON.stringify(settings));
};

export const getProviderForFeature = (feature: AppFeature): FeatureMapping => {
  const settings = getLLMSettings();
  const mapping = settings.featureMappings.find(m => m.feature === feature);
  if (mapping) return mapping;
  const defaultMapping = settings.featureMappings.find(m => m.feature === 'default');
  return defaultMapping || { feature: 'default', provider: 'gemini' };
};

/**
 * Smart text generation that routes to the correct provider.
 * Falls back to Gemini if the configured provider fails.
 */
export const routedGenerateText = async (
  feature: AppFeature,
  prompt: string,
  options?: GenerateTextOptions
): Promise<string> => {
  const mapping = getProviderForFeature(feature);

  if (mapping.provider === 'ollama') {
    try {
      return await generateTextWithOllama(prompt, {
        model: mapping.modelOverride,
        systemInstruction: options?.systemInstruction,
        temperature: options?.temperature,
      });
    } catch (e) {
      logger.warn(`[LLM Router] Ollama failed for feature '${feature}', falling back to Gemini:`, { error: e });
    }
  }

  if (mapping.provider === 'mistral') {
    try {
      return await generateTextWithMistral(prompt, {
        model: mapping.modelOverride,
        systemInstruction: options?.systemInstruction,
        temperature: options?.temperature,
      });
    } catch (e) {
      logger.warn(`[LLM Router] Mistral failed for feature '${feature}', falling back to Gemini:`, { error: e });
    }
  }

  // Default: use Gemini (generateText)
  return generateText(prompt, options);
};
