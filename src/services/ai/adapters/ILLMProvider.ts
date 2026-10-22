/**
 * Interface Genérica para Provedores LLM (Language Model Providers)
 * 
 * Engenharia Reversa: Abstrai a API Google Gemini e adapta para Ollama
 * Permite trocar de provider sem mudar código existente
 */

export interface ModelPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

export interface ModelContent {
  role: 'user' | 'model' | 'system';
  parts: ModelPart[];
}

export interface GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
  systemInstruction?: string;
  tools?: Record<string, unknown>[];
  thinkingConfig?: {
    budget?: number;
    thinking_level?: 'low' | 'high';
  };
}

export interface GenerateContentParams {
  model: string;
  contents: ModelContent[];
  config?: GenerationConfig;
}

export interface GenerateContentResponse {
  text?: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
  candidates?: Array<{
    content?: {
      parts?: ModelPart[];
      role?: string;
    };
  }>;
}

/**
 * Interface comum que todos os providers LLM devem implementar
 * Engenharia Reversa: Replica o comportamento de client.models
 */
export interface ILLMProvider {
  /**
   * Gera conteúdo com o modelo especificado
   * Equivalente a: client.models.generateContent()
   */
  generateContent(params: GenerateContentParams): Promise<GenerateContentResponse>;

  /**
   * Gera conteúdo com streaming
   * Equivalente a: client.models.generateContentStream()
   */
  generateContentStream(params: GenerateContentParams): AsyncGenerator<GenerateContentResponse>;

  /**
   * Conta tokens em um texto
   * Equivalente a: client.models.countTokens()
   */
  countTokens(params: {
    model: string;
    contents: ModelContent[];
  }): Promise<{ totalTokens: number }>;

  /**
   * Verifica se o provider está disponível/saudável
   */
  healthCheck(): Promise<boolean>;

  /**
   * Retorna o nome do provider (para logging)
   */
  getName(): string;
}
