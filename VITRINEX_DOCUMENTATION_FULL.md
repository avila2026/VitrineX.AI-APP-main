# Documentação Completa do Sistema VitrineX AI

Este documento serve como a "Memória Central" para agentes de IA, desenvolvedores e administradores. Ele contém detalhes técnicos, funcionais e estratégicos sobre a plataforma VitrineX AI.

---

## 1. Visão Geral do Produto

**Nome:** VitrineX AI
**Versão Atual:** 4.0.1 Premium
**Descrição:** Plataforma All-in-One de Marketing e Criação de Conteúdo impulsionada por Inteligência Artificial. Focada em automação, design de alta qualidade e insights de mercado.

### Público-Alvo
- EmpreendedoresDigitais
- Gestores de Tráfego
- Criadores de Conteúdo
- Pequenas e Médias Empresas (PME)

### Proposta de Valor
"Automatize seu marketing com design premium e inteligência artificial."

---

## 2. Arquitetura Técnica

### Frontend
- **Framework:** React 19 (Vite)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS (com design tokens personalizados em `index.css`)
- **Bibliotecas de UI:** Headless UI, Heroicons, Framer Motion (para animações complexas).
- **Gerenciamento de Estado:** React Context API (Auth, Theme, Language), React Query (Dados assíncronos).

### Backend & Serviços
- **Autenticação & Banco de Dados:** Supabase (PostgreSQL + Auth).
- **Proxy/API Server:** Node.js (Express) - atua como middleware para chamadas de IA (Tess AI, Gemini) e integrações (Google).
- **Hospedagem:** Hostinger (Arquivos estáticos na pasta `dist`).
- **Pagamentos:** Stripe (Checkout e Webhooks).

### Integrações de IA
- **LLM Multi-Engine Router:** Sistema inteligente que distribui tarefas entre modelos baseados na configuração do usuário.
- **Provider: Google Gemini:**
  - **Modelos:** Gemini 2.0 Flash, Gemini 1.5 Pro, Thinking Model.
  - **Uso:** Raciocínio complexo, Multimodal, Pesquisa Google.
- **Provider: Mistral AI:**
  - **Modelos:** Mistral Small, Medium, Large.
  - **Uso:** Alternativa de alto desempenho para geração de texto.
- **Provider: Ollama (Local):**
  - **Modelos:** Mistral, Llama 3, custom models.
  - **Uso:** Privacidade total, custo zero, processamento local.

---

## 3. Módulos e Funcionalidades

### A. Dashboard (`/`)
- Visão geral em tempo real.
- **Métricas:** Total de conteúdos, campanhas, agendamentos e tendências.
- **Ações Rápidas:** Botões para criar conteúdo, verificar API, acessar estúdio.
- **Activity Feed:** Histórico recente de criações e agendamentos.

### B. Cosmic Studio (`/cosmic-studio`)
O coração criativo da plataforma.
- **Modo Editor:** Ferramenta estilo "Canva" para manipulação de imagens, textos e overlays.
  - Suporta camadas (Layers), redimensionamento, rotação e filtros.
- **Modo Carrossel:** Criação de sequências de slides para Instagram/LinkedIn.
- **Transformer:** Componente de manipulação visual (Resize/Rotate handles).

### C. Content Generator (`/content-generator`)
- Geração de textos para posts, blogs e roteiros.
- Usa IA para criar legendas otimizadas com hashtags.
- Opção de "Humanizar Texto" e tom de voz ajustável.

### D. Ad Studio (`/ad-studio`)
- Criação focada em Anúncios (Ads).
- Templates para Facebook, Instagram, Google Ads.
- Geração de Copywriting persuasivo (AIDA, PAS).

### E. Trend Hunter (`/trends`)
- Pesquisa de tendências de mercado.
- **Integração:** Google Trends e buscas em tempo real (SerpApi).
- Exibe gráficos de interesse ao longo do tempo.
- "Battle Mode": Compara dois termos de pesquisa.

### F. Market Radar (`/market-radar`)
- Análise profunda de nicho e concorrentes.
- Gera relatórios SWOT (Forças, Fraquezas, Oportunidades, Ameaças).
- Análise de Sentimento de marca.

### G. Smart Scheduler (`/scheduler`) 📅
- Calendário interativo para agendamento de posts.
- Drag-and-drop de itens da biblioteca para o calendário.
- Suporte a múltiplas plataformas (Instagram, TikTok, LinkedIn).

### H. Content Library (`/library`)
- Gerenciador de arquivos (DAM).
- Upload, organização por pastas e tags.
- Visualização de imagens, vídeos e documentos.

### I. Chat VitrineX (`/chat`) 🤖
- Interface de chat premium para o usuário final.
- **Conectado ao Agente 37393.**
- Suporte a contexto de conversa e (futuramente) envio de arquivos para análise.
- Design fluido com animações `framer-motion`.

---

## 4. Fluxos de Autenticação e Permissões

### Contexto: `AuthContext.tsx`
- Gerencia sessão do usuário via Supabase.
- **Modo Mock (Desenvolvimento):** Se o Supabase não estiver configurado, usa um login simulado (`jeancarlosmedvet97@outlook.com` vira ADMIN).
- **Perfis de Usuário:**
  - `ADMIN`: Acesso total, incluindo painel `/admin` e configurações sensíveis.
  - `VIEWER/FREE`: Acesso limitado, com restrições em gerações de IA.
  - `PRO`: Acesso a recursos avançados (Cosmic Studio, Trends).

---

## 5. Instruções Técnicas para Manutenção

### Comandos Principais
- **Instalar Dependências:** `npm install`
- **Rodar Localmente:** `npm run dev` (Frontend) e `node proxy_server.js` (Backend Proxy).
- **Build de Produção:** `npm run build` (Gera pasta `dist`).
- **Verificar Tipos:** `npx tsc --noEmit`

### Deploy (Hostinger)
1. Rodar `npm run build`.
2. Compactar o conteúdo da pasta `dist`.
3. Subir e extrair na pasta `public_html` do servidor.
4. **Nota:** Se houver erros de carregamento (`Failed to fetch module`), é necessário limpar o cache do navegador após o deploy.

### Proxy Server
- O arquivo `proxy_server.js` (Porta 3001) é CRUCIAL para evitar erros de CORS ao chamar a API da Tess (Pareto.io).
- Ele encaminha as requisições do Frontend (`localhost:5173`) para a Tess AI, injetando a API Key se necessário.

---

## 6. Configurações de IA

### LLM Router Logic
- **Serviço:** `src/services/ai/llmRouter.ts`
- **Fallback:** Se um provedor (Mistral/Ollama) falhar ou não estiver configurado, o sistema faz fallback automático para o Gemini se a chave API estiver ativa.
- **Configuração:** Armazenada no `localStorage` sob as chaves `vitrinex_llm_mappings` e chaves específicas de API.

### Google Integrations (Backend)
- Serviço configurado em `server/services/agent_service.ts`.
- Capaz de realizar buscas no Google, ler planilhas e enviar e-mails (Gmail) quando ativado com credenciais de Service Account.

---

## 7. Roadmap e Futuro

- **Mobile App:** Converter o PWA atual em um app nativo ou híbrido (Capacitor/Electron).
- **Automação Total:** Conectar o `Scheduler` diretamente às APIs das redes sociais para postagem automática (atualmente é planejamento).
- **Multi-Agentes:** Permitir que o usuário crie seus próprios agentes personalizados dentro da plataforma.
