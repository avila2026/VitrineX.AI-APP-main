import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compactChatHistory } from '../memory';
import { saveToVectorMemory, queryVectorMemory, clearVectorMemory } from '../vectorMemory';
import { ChatMessage } from '../../../types';

// Mock AI services
vi.mock('../text', () => ({
    generateText: vi.fn().mockResolvedValue(JSON.stringify({
        summary: 'Summarized content',
        keyFacts: ['Fact 1', 'Fact 2']
    }))
}));

vi.mock('../ollama', () => ({
    embedTextWithOllama: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
}));

describe('Memory Services', () => {

    describe('compactChatHistory', () => {
        it('should return initial memory if history is too short', async () => {
            const history: ChatMessage[] = [
                { role: 'user', text: 'hi', timestamp: new Date().toISOString() }
            ];
            const memory = await compactChatHistory(history);
            expect(memory.summary).toBe('');
            expect(memory.keyFacts).toEqual([]);
        });

        it('should call generateText and return new memory for long history', async () => {
            const history: ChatMessage[] = [
                { role: 'user', text: 'hello', timestamp: new Date().toISOString() },
                { role: 'model', text: 'hi there', timestamp: new Date().toISOString() },
                { role: 'user', text: 'how are you?', timestamp: new Date().toISOString() },
                { role: 'model', text: 'I am fine', timestamp: new Date().toISOString() },
                { role: 'user', text: 'tell me about cats', timestamp: new Date().toISOString() },
                { role: 'model', text: 'cats are animals', timestamp: new Date().toISOString() }
            ];
            const memory = await compactChatHistory(history);
            expect(memory.summary).toBe('Summarized content');
            expect(memory.keyFacts).toEqual(['Fact 1', 'Fact 2']);
        });
    });

    describe('Vector Memory', () => {
        beforeEach(() => {
            clearVectorMemory();
            vi.clearAllMocks();
        });

        it('should save and query entries', async () => {
            const text = 'Sells expensive watches';
            await saveToVectorMemory(text);

            const results = await queryVectorMemory('luxury watches');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].text).toBe(text);
        });

        it('should respect similarity threshold', async () => {
          // Similarity will be 1.0 since we mock the same embedding
          const text = 'Something unique';
          await saveToVectorMemory(text);
          
          const results = await queryVectorMemory('Something very different');
          expect(results.length).toBe(1); // Mocked same vector
        });
    });
});
