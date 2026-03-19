import { embedTextWithOllama } from './ollama';
import { logger } from '../../lib/logger';

export interface VectorEntry {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
  timestamp: string;
}

const STORAGE_KEY = 'vitrinex_vector_memory';

/**
 * Simple Cosine Similarity implementation
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  if (mA * mB === 0) return 0;
  return dotProduct / (mA * mB);
};

export const saveToVectorMemory = async (text: string, metadata: Record<string, any> = {}): Promise<void> => {
  try {
    const embedding = await embedTextWithOllama(text);
    const entry: VectorEntry = {
      id: crypto.randomUUID(),
      text,
      embedding,
      metadata,
      timestamp: new Date().toISOString(),
    };

    const current = localStorage.getItem(STORAGE_KEY);
    const data: VectorEntry[] = current ? JSON.parse(current) : [];
    data.push(entry);
    
    // Keep only last 100 entries to avoid localStorage bloating
    if (data.length > 100) data.shift();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    logger.info('Saved to vector memory', { id: entry.id });
  } catch (error) {
    logger.error('Failed to save to vector memory', { error });
  }
};

export const queryVectorMemory = async (query: string, limit: number = 3): Promise<VectorEntry[]> => {
  try {
    const queryEmbedding = await embedTextWithOllama(query);
    const current = localStorage.getItem(STORAGE_KEY);
    if (!current) return [];

    const data: VectorEntry[] = JSON.parse(current);
    
    // Sort by similarity
    const results = data
      .map(entry => ({
        entry,
        similarity: cosineSimilarity(queryEmbedding, entry.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter(r => r.similarity > 0.7) // Threshold
      .map(r => r.entry);

    return results;
  } catch (error) {
    logger.error('Failed to query vector memory', { error });
    return [];
  }
};

export const clearVectorMemory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
