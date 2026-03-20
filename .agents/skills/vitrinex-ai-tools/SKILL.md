---
name: vitrinex-ai-tools
description: >
  Use this skill when the user asks about adding new AI tools or function calls,
  modifying the Gemini/Mistral/Ollama integrations, working with the LLM Router,
  vector memory, or developing the AI service layer. Do NOT use for marketing
  strategy or deployment questions.
---

# VitrineX AI Tools Development Guide

Guide for developing and extending the AI service layer in VitrineX.

## Architecture Overview

The AI layer lives in `src/services/ai/` and uses a multi-provider architecture:

```
text.ts          → Core text generation (generateText, sendMessageToChat)
tools.ts         → Gemini function calling declarations + executor
gemini.ts        → Google Gemini client factory (@google/genai SDK)
llmRouter.ts     → Multi-provider routing with automatic fallback
mistral.ts       → Mistral AI provider
ollama.ts        → Local Ollama provider
vectorMemory.ts  → Local vector store for RAG context injection
```

## Adding a New Gemini Tool

### Step 1: Declare the tool in `tools.ts`

Add a new entry to the `vitrinexTools[0].functionDeclarations` array:

```typescript
{
    name: 'your_tool_name',
    description: 'Clear description of what this tool does and when to use it.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            param_name: {
                type: Type.STRING,
                description: 'What this parameter does.',
            },
        },
        required: ['param_name'],
    },
}
```

### Step 2: Implement the executor in `executeTool`

Add a case to the switch statement in `executeTool()`:

```typescript
case 'your_tool_name':
    // Implementation here
    // Use dynamic imports to avoid circular dependencies:
    const { someFunction } = await import('./someModule');
    return await someFunction(args.param_name);
```

### Step 3: The agent loop in `text.ts` handles everything else

The `generateText()` function already has an autonomous agent loop (max 5 iterations) that:
1. Detects `functionCalls` in the response
2. Calls `executeTool()` for each
3. Sends results back to the model
4. Repeats until the model returns text

## LLM Router Pattern

`llmRouter.ts` maps features to providers. Config stored in `localStorage` under `vitrinex_llm_mappings`.

**Fallback chain:** Configured Provider → Gemini (if API key exists)

## Vector Memory (RAG)

`vectorMemory.ts` provides local vector storage. Used in `sendMessageToChat` when `useKnowledgeBase: true`:
- Queries relevant memories based on the user's message
- Injects them into the system instruction as context

## Key Constants

Model IDs are defined in `src/constants/`:
- `GEMINI_FLASH_MODEL`
- `GEMINI_PRO_MODEL`
- `GEMINI_THINKING_MODEL`

## Rules

1. **Use `logger` from `src/lib/logger.ts`** — never use `console.log`.
2. **Use dynamic imports** in `executeTool` to avoid circular dependencies.
3. **Type imports** from `@google/genai` — use `Type.OBJECT`, `Type.STRING`, etc.
