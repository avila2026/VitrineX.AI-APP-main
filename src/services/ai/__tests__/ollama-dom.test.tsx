import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { serializeDOM, analyzeDOMWithOllama } from '../ollamaDom';
import * as ollamaService from '../ollama';

// Mock the ollama service
vi.mock('../ollama', () => ({
  generateTextWithOllama: vi.fn(),
  getOllamaConfig: vi.fn(() => ({ baseUrl: 'http://localhost:11434', model: 'llama3' })),
}));

describe('Ollama DOM Services', () => {
  it('should serialize a simple DOM structure correctly', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="main" class="container">
        <h1 role="heading">Hello World</h1>
        <button aria-label="Submit Form">Click Me</button>
      </div>
    `;

    const result = serializeDOM(container);
    
    expect(result).toContain('<div#main.container>');
    expect(result).toContain('<h1[role="heading"]>');
    expect(result).toContain('" Hello World "');
    expect(result).toContain('<button[label="Submit Form"]>');
    expect(result).toContain('" Click Me "');
  });

  it('should call Ollama with serialized DOM', async () => {
    const mockGenerate = vi.spyOn(ollamaService, 'generateTextWithOllama');
    mockGenerate.mockResolvedValue('Este é um componente de cabeçalho com um botão.');

    const container = document.createElement('div');
    container.innerHTML = '<div class="header"><h1>Title</h1></div>';

    const result = await analyzeDOMWithOllama(container, 'O que é isso?');

    expect(mockGenerate).toHaveBeenCalled();
    const [prompt] = mockGenerate.mock.calls[0];
    expect(prompt).toContain('<div.header>');
    expect(prompt).toContain('<h1>');
    expect(prompt).toContain('" Title "');
    expect(result).toBe('Este é um componente de cabeçalho com um botão.');
  });
});
