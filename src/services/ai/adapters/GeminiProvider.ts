import type { ILLMProvider, LLMGenerateOptions } from './ILLMProvider';
import { generateText } from '../text';
import { getApiKey } from '../gemini';

export class GeminiProvider implements ILLMProvider {
  readonly name = 'gemini' as const;

  async isAvailable(): Promise<boolean> {
    try {
      await getApiKey();
      return true;
    } catch {
      return false;
    }
  }

  async generateText(prompt: string, options?: LLMGenerateOptions): Promise<string> {
    const text = await generateText(prompt, {
      model: options?.model,
      systemInstruction: options?.systemInstruction,
      temperature: options?.temperature,
      tools: options?.tools,
      userId: options?.userId,
    });
    if (text) options?.onChunk?.(text);
    return text;
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil((text || '').length / 4);
  }
}
