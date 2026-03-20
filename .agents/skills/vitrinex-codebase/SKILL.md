---
name: vitrinex-codebase
description: >
  Use this skill when the user asks about the VitrineX codebase architecture,
  file locations, component structure, module navigation, state management,
  or how existing features work. Do NOT use for marketing content or deployment.
---

# VitrineX Codebase Navigator

Guide the user through the VitrineX AI codebase — a React 19 + Vite + TypeScript marketing platform.

## Tech Stack
- **Frontend:** React 19 (Vite), TypeScript, Tailwind CSS
- **UI:** Headless UI, Heroicons, Framer Motion
- **State:** React Context (Auth, Theme, Language), React Query (async data), Zustand
- **Backend:** Supabase (PostgreSQL + Auth), Node.js Express proxy
- **Payments:** Stripe
- **AI:** Multi-provider LLM Router (Gemini, Mistral, Ollama)

## Project Structure

```
src/
├── components/
│   ├── features/          # Feature-specific components
│   │   ├── FlashUI/       # Quick content generation UI
│   │   ├── CosmicStudio/  # Canvas-like image editor
│   │   └── ...
│   ├── layout/            # App shell, sidebar, header
│   └── ui/                # Shared UI primitives (shadcn-style)
├── services/
│   ├── ai/                # AI service layer (CRITICAL)
│   │   ├── text.ts        # Text generation & chat (generateText, sendMessageToChat)
│   │   ├── tools.ts       # Gemini function calling declarations & executor
│   │   ├── gemini.ts      # Gemini client factory
│   │   ├── llmRouter.ts   # Multi-provider routing logic
│   │   ├── mistral.ts     # Mistral AI provider
│   │   ├── ollama.ts      # Local Ollama provider
│   │   ├── vectorMemory.ts# Local vector store for RAG
│   │   ├── image.ts       # Image generation
│   │   ├── audio.ts       # Audio/TTS services
│   │   └── video.ts       # Video generation
│   └── core/
│       └── db.ts          # Supabase database service
├── contexts/              # React Context providers (Auth, Theme, Language)
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── constants/             # App constants & model IDs
└── lib/                   # Utilities (logger, etc.)
```

## Key Modules (Routes)
| Route | Module | Description |
|-------|--------|-------------|
| `/` | Dashboard | Metrics overview, quick actions, activity feed |
| `/cosmic-studio` | Cosmic Studio | Canvas editor (layers, resize, filters, carousel) |
| `/content-generator` | Content Generator | AI text generation with tone/hashtag controls |
| `/ad-studio` | Ad Studio | Ad creation with AIDA/PAS copywriting |
| `/trends` | Trend Hunter | Google Trends integration, battle mode |
| `/market-radar` | Market Radar | SWOT analysis, competitor gaps, sentiment |
| `/scheduler` | Smart Scheduler | Calendar drag-and-drop post scheduling |
| `/library` | Content Library | DAM with folders, tags, uploads |
| `/chat` | Chat VitrineX | Premium AI chat interface |

## Auth & Permissions
- Managed via `AuthContext.tsx` + Supabase
- Roles: `ADMIN` (full access + `/admin`), `PRO` (advanced features), `FREE` (limited)
- Mock mode available for development

## Important Conventions
- Logger utility at `src/lib/logger.ts` — use `logger.info/warn/error` instead of `console.log`
- AI model constants defined in `src/constants/`
- LLM Router in `src/services/ai/llmRouter.ts` handles provider fallback
