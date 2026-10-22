# Ollama local setup

1. Install Ollama: https://ollama.com/download
2. Pull models: `ollama pull mistral && ollama pull neural-chat`
3. Allow browser access: `OLLAMA_ORIGINS=* ollama serve`
4. Copy `.env.ollama` values into `.env.local` (`VITE_AI_PROVIDER=ollama`).

## Usage
```ts
import { getLLMProvider, generateWithFallback } from './services/ai';
const text = await generateWithFallback('Olá!', { onChunk: t => console.log(t) });
```
`onChunk` enables NDJSON streaming. Token counts are a local estimate (~4 chars/token).
Gemini tool declarations are converted by `convertToolsToOllama`.
Model mapping lives in `OLLAMA_MODEL_MAP` (`src/constants.ts`).

## Fallback
If Ollama is down, Gemini is used (requires an API key); if Gemini fails, Ollama is tried.

## Troubleshooting
- `checkOllamaHealth()` (`src/lib/ollamaHealth.ts`) reports running state and missing models.
- CORS errors: start Ollama with `OLLAMA_ORIGINS=*`.
- 404 model not found: `ollama pull <model>`.
- Connection refused: ensure `ollama serve` runs on port 11434.
