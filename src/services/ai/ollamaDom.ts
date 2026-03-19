/**
 * VitrineX AI - Ollama DOM Analysis Service
 * Provides utilities to translate DOM structures into text for LLM analysis.
 */
import { generateTextWithOllama } from './ollama';

/**
 * Serializes a DOM element into a concise text representation.
 * Focuses on IDs, classes, roles, and text content while ignoring noise.
 */
export const serializeDOM = (element: HTMLElement): string => {
  if (!element) return '';

  const walk = (node: Node, depth: number = 0): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      return text ? `${' '.repeat(depth * 2)}" ${text} "\n` : '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    
    // Ignore script and style tags
    if (tagName === 'script' || tagName === 'style') return '';

    const id = el.id ? `#${el.id}` : '';
    const classes = el.className && typeof el.className === 'string' 
      ? `.${el.className.split(' ').join('.')}` 
      : '';
    const role = el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : '';
    const ariaLabel = el.getAttribute('aria-label') ? `[label="${el.getAttribute('aria-label')}"]` : '';

    let result = `${' '.repeat(depth * 2)}<${tagName}${id}${classes}${role}${ariaLabel}>\n`;

    for (const child of Array.from(node.childNodes)) {
      result += walk(child, depth + 1);
    }

    return result;
  };

  return walk(element);
};

/**
 * Sends a DOM tree to Ollama for analysis based on a task.
 */
export const analyzeDOMWithOllama = async (
  element: HTMLElement,
  task: string = 'Descreva o que este componente faz e identifique os principais elementos de interação.'
): Promise<string> => {
  const domText = serializeDOM(element);
  
  const systemInstruction = `Você é um Analista de interface de usuário. 
Sua tarefa é analisar a estrutura DOM fornecida e responder à solicitação do usuário.
A estrutura DOM está em um formato simplificado: <tag#id.classe[role][label]>.
Seja conciso e técnico.`;

  const prompt = `Estrutura DOM:\n\`\`\`\n${domText}\n\`\`\`\n\nTarefa: ${task}`;

  return generateTextWithOllama(prompt, { systemInstruction });
};
