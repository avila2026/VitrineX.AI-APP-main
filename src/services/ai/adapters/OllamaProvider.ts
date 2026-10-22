import type { ILLMProvider, LLMGenerateOptions } from './ILLMProvider';
import { generateTextWithOllama, estimateTokens } from '../ollama';
import { checkOllamaHealth } from '../../../lib/ollamaHealth';
import { OLLAMA_MODEL_MAP, OLLAMA_DEFAULT_MODEL } from '../../../constants';

export class OllamaProvider implements ILLMProvider {
  readonly name = 'ollama' as const;

  isAvailable = async () => (await checkOllamaHealth()).running;

  generateText(prompt: string, options?: LLMGenerateOptions): Promise<string> {
    const configured = import.meta.env?.VITE_OLLAMA_MODEL as string | undefined;
    const model = (options?.model && OLLAMA_MODEL_MAP[options.model]) || options?.model || configured || OLLAMA_DEFAULT_MODEL;
    return generateTextWithOllama(prompt, {
      model,
      systemInstruction: options?.systemInstruction,
      temperature: options?.temperature,
      onChunk: options?.onChunk,
    });
  }

  async countTokens(text: string): Promise<number> {
    return estimateTokens(text);
  }
}
