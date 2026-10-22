export interface LLMGenerateOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  tools?: any[];
  onChunk?: (text: string) => void;
  userId?: string;
}

export interface ILLMProvider {
  readonly name: 'gemini' | 'ollama';
  isAvailable(): Promise<boolean>;
  generateText(prompt: string, options?: LLMGenerateOptions): Promise<string>;
  countTokens(text: string): Promise<number>;
}
