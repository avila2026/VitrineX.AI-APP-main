import * as React from 'react';
import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  CpuChipIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ServerIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  StarIcon,
  SparklesIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import {
  testOllamaConnection,
  saveOllamaConfig,
  getOllamaConfig,
  listOllamaModels,
  type OllamaConfig,
} from '../../services/ai/ollama';
import {
  testMistralConnection,
  saveMistralConfig,
  getMistralConfig,
  MISTRAL_MODELS,
} from '../../services/ai/mistral';
import {
  getLLMSettings,
  saveLLMSettings,
  type AppFeature,
  type LLMProvider,
  type FeatureMapping,
} from '../../services/ai/llmRouter';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiKey {
  key: 'gemini' | 'openai' | 'anthropic' | 'mistral';
  label: string;
  placeholder: string;
  storageKey: string;
  docsUrl: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_KEYS_CONFIG: ApiKey[] = [
  {
    key: 'gemini',
    label: 'Google Gemini',
    placeholder: 'AIzaSy...',
    storageKey: 'vitrinex_gemini_api_key',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    key: 'mistral',
    label: 'Mistral AI',
    placeholder: '82a796bb...',
    storageKey: 'vitrinex_mistral_api_key',
    docsUrl: 'https://console.mistral.ai/api-keys/',
  },
  {
    key: 'openai',
    label: 'OpenAI',
    placeholder: 'sk-...',
    storageKey: 'vitrinex_openai_api_key',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    key: 'anthropic',
    label: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    storageKey: 'vitrinex_anthropic_api_key',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
];

const FEATURE_LABELS: Record<AppFeature, { label: string; icon: string }> = {
  content_generator: { label: 'Gerador de Conteúdo', icon: '📝' },
  ad_studio: { label: 'Estúdio de Anúncios', icon: '🎯' },
  campaign_builder: { label: 'Construtor de Campanhas', icon: '🚀' },
  chat: { label: 'Chat VitrineX', icon: '💬' },
  trend_hunter: { label: 'Trend Hunter', icon: '📡' },
  market_radar: { label: 'Market Radar', icon: '🔍' },
  default: { label: 'Padrão (Fallback)', icon: '⚙️' },
};

const PROVIDER_OPTIONS: { value: LLMProvider; label: string }[] = [
  { value: 'gemini', label: '🌟 Google Gemini' },
  { value: 'mistral', label: '🔥 Mistral AI' },
  { value: 'ollama', label: '🦙 Ollama (Local)' },
  { value: 'openai', label: '🤖 OpenAI' },
];

// ─── Model Advisor Data ──────────────────────────────────────────────────────

interface ModelProfile {
  id: string;
  name: string;
  provider: LLMProvider;
  providerLabel: string;
  tier: 'elite' | 'creative' | 'local';
  tierColor: string;
  tierLabel: string;
  icon: string;
  bestFor: { feature: AppFeature; label: string }[];
  mediumFor: string[];
  description: string;
  requirements: string;
}

const MODEL_PROFILES: ModelProfile[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    providerLabel: 'Google',
    tier: 'elite',
    tierColor: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    tierLabel: '⚡ Elite (Velocidade)',
    icon: '🌟',
    bestFor: [
      { feature: 'market_radar', label: 'Market Radar' },
      { feature: 'trend_hunter', label: 'Trend Hunter' },
      { feature: 'chat', label: 'Chat VitrineX' },
    ],
    mediumFor: ['Geração de artes (prompts de imagem)', 'Legendas longas para carrossel'],
    description: 'Resposta em milissegundos. Perfeito para análise em tempo real e interações de chat rápidas.',
    requirements: '🔑 Chave API Gemini',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    providerLabel: 'Google',
    tier: 'elite',
    tierColor: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30',
    tierLabel: '🧠 Elite (Raciocínio)',
    icon: '💎',
    bestFor: [
      { feature: 'campaign_builder', label: 'Campaign Builder' },
      { feature: 'market_radar', label: 'Market Radar' },
    ],
    mediumFor: ['Posts simples (muito "caro" para uso básico)', 'Chat casual'],
    description: 'Raciocínio profundo. Ideal para estratégias complexas, análise SWOT e construção de campanhas com ROI.',
    requirements: '🔑 Chave API Gemini',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    providerLabel: 'Mistral AI',
    tier: 'elite',
    tierColor: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
    tierLabel: '🏆 Elite (Copy)',
    icon: '🔥',
    bestFor: [
      { feature: 'ad_studio', label: 'Estúdio de Anúncios' },
      { feature: 'content_generator', label: 'Gerador de Conteúdo' },
    ],
    mediumFor: ['Lógica de programação', 'Cálculos matemáticos complexos'],
    description: 'Copywriting de elite. Produz textos persuasivos, headlines magnéticas e copies de direct response.',
    requirements: '🔑 Chave API Mistral',
  },
  {
    id: 'mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'mistral',
    providerLabel: 'Mistral AI',
    tier: 'creative',
    tierColor: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    tierLabel: '✨ Criativo',
    icon: '🎨',
    bestFor: [
      { feature: 'content_generator', label: 'Gerador de Conteúdo' },
    ],
    mediumFor: ['Análise SWOT', 'Pesquisa de Mercado profunda', 'Campanhas complexas'],
    description: 'Storytelling e engajamento. Cria legendas criativas, narrativas envolventes e posts virais.',
    requirements: '🔑 Chave API Mistral',
  },
  {
    id: 'llama3-local',
    name: 'Llama 3 (Local)',
    provider: 'ollama',
    providerLabel: 'Ollama',
    tier: 'local',
    tierColor: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    tierLabel: '🏠 Local (Privado)',
    icon: '🦙',
    bestFor: [
      { feature: 'chat', label: 'Chat VitrineX' },
    ],
    mediumFor: ['Copywriting persuasivo ultra-criativo', 'Análises que dependem de dados da web'],
    description: 'Privacidade total, custo zero. Forte em seguir instruções, categorizar dados e chat offline.',
    requirements: '🖥️ Ollama rodando localmente',
  },
  {
    id: 'mistral-local',
    name: 'Mistral (Local)',
    provider: 'ollama',
    providerLabel: 'Ollama',
    tier: 'local',
    tierColor: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30',
    tierLabel: '🏠 Local (Criativo)',
    icon: '🦙',
    bestFor: [
      { feature: 'content_generator', label: 'Gerador de Conteúdo' },
      { feature: 'chat', label: 'Chat VitrineX' },
    ],
    mediumFor: ['Campanhas estratégicas complexas', 'Pesquisas de tendências (sem acesso web)'],
    description: 'Copy criativa rodando na sua máquina. Boa qualidade para posts e legendas sem custo de API.',
    requirements: '🖥️ Ollama + modelo mistral baixado',
  },
  {
    id: 'deepseek-local',
    name: 'DeepSeek Coder (Local)',
    provider: 'ollama',
    providerLabel: 'Ollama',
    tier: 'local',
    tierColor: 'from-sky-500/20 to-blue-500/20 border-sky-500/30',
    tierLabel: '🏠 Local (Código)',
    icon: '💻',
    bestFor: [],
    mediumFor: ['Geração de conteúdo humanizado', 'Análise de marketing'],
    description: 'Especialista em código. Ideal para Flash Designer (geração de UI) e scripts de automação.',
    requirements: '🖥️ Ollama + modelo deepseek-coder baixado',
  },
];

// ─── Quality Rating Stars ────────────────────────────────────────────────────

const QualityStars: React.FC<{ level: 'optimal' | 'medium' }> = ({ level }) => (
  <div className="flex items-center gap-0.5">
    {level === 'optimal' ? (
      <>
        <StarIconSolid className="w-3.5 h-3.5 text-yellow-400" />
        <StarIconSolid className="w-3.5 h-3.5 text-yellow-400" />
        <StarIconSolid className="w-3.5 h-3.5 text-yellow-400" />
      </>
    ) : (
      <>
        <StarIconSolid className="w-3.5 h-3.5 text-gray-500" />
        <StarIconSolid className="w-3.5 h-3.5 text-gray-500" />
        <StarIcon className="w-3.5 h-3.5 text-gray-600" />
      </>
    )}
  </div>
);

// ─── Model Advisor Panel ─────────────────────────────────────────────────────

const ModelAdvisorPanel: React.FC<{
  onApplyRouting: (mappings: { feature: AppFeature; provider: LLMProvider }[]) => void;
}> = ({ onApplyRouting }) => {
  const [expandedModel, setExpandedModel] = React.useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 mb-2">
        Clique em um modelo para ver detalhes. Use o botão <strong className="text-purple-300">"Aplicar"</strong> para configurar automaticamente o roteamento para as funções onde o modelo é <strong className="text-yellow-400">ótimo</strong>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MODEL_PROFILES.map(model => {
          const isExpanded = expandedModel === model.id;
          return (
            <div
              key={model.id}
              className={`relative rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer ${
                isExpanded
                  ? `bg-gradient-to-br ${model.tierColor} shadow-lg`
                  : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]'
              }`}
              onClick={() => setExpandedModel(isExpanded ? null : model.id)}
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{model.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{model.name}</h4>
                      <p className="text-xs text-gray-400">{model.providerLabel}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    model.tier === 'elite' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                    model.tier === 'creative' ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' :
                    'bg-green-500/10 border-green-500/20 text-green-400'
                  }`}>
                    {model.tierLabel}
                  </span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{model.description}</p>

                {/* Quick view: best features tags */}
                {model.bestFor.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {model.bestFor.map(bf => (
                      <span key={bf.feature} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-yellow-500/10 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/15">
                        <StarIconSolid className="w-2.5 h-2.5" />
                        {bf.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3 animate-fade-in">
                  {/* Optimal Quality */}
                  {model.bestFor.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <QualityStars level="optimal" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Qualidade Ótima</span>
                      </div>
                      <ul className="space-y-1">
                        {model.bestFor.map(bf => (
                          <li key={bf.feature} className="text-xs text-gray-200 flex items-center gap-2">
                            <SparklesIcon className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                            {bf.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Medium Quality */}
                  {model.mediumFor.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <QualityStars level="medium" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Qualidade Mediana</span>
                      </div>
                      <ul className="space-y-1">
                        {model.mediumFor.map((mf, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                            <BoltIcon className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            {mf}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Requirements */}
                  <p className="text-[10px] text-gray-500 bg-black/20 px-3 py-1.5 rounded-lg">
                    {model.requirements}
                  </p>

                  {/* Apply Button */}
                  {model.bestFor.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyRouting(model.bestFor.map(bf => ({
                          feature: bf.feature,
                          provider: model.provider,
                        })));
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-500/40 text-purple-200 hover:from-purple-500/40 hover:to-indigo-500/40 transition-all active:scale-[0.98]"
                    >
                      <BoltIcon className="w-3.5 h-3.5" />
                      Aplicar {model.name} nas funções ótimas
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="glass-card p-6 rounded-2xl border border-white/10">
    <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
        {icon}
      </span>
      {title}
    </h3>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ApiSettingsSection: React.FC = () => {
  const { addToast } = useToast();

  // API Keys State
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  // Ollama State
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig>(getOllamaConfig());
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [ollamaMsg, setOllamaMsg] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaModelInput, setOllamaModelInput] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Mistral State
  const [mistralStatus, setMistralStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [mistralMsg, setMistralMsg] = useState('');
  const [mistralModel, setMistralModel] = useState(getMistralConfig().model || 'mistral-small-latest');

  // Feature Routing State
  const [featureMappings, setFeatureMappings] = useState<FeatureMapping[]>(getLLMSettings().featureMappings);

  // Load saved API Keys on mount + auto-save provided Mistral key
  useEffect(() => {
    const loaded: Record<string, string> = {};
    API_KEYS_CONFIG.forEach(cfg => {
      const val = localStorage.getItem(cfg.storageKey) || '';
      if (val) loaded[cfg.key] = val;
    });
    // Auto-fill the Mistral key provided by the user if not already set
    const MISTRAL_PROVIDED_KEY = '82a796bb92a44e98acc3f25413f22adc.f9DvbQC6e4UN-Jl3xLj-luAy';
    if (!loaded['mistral'] && !localStorage.getItem('vitrinex_mistral_api_key')) {
      loaded['mistral'] = MISTRAL_PROVIDED_KEY;
      localStorage.setItem('vitrinex_mistral_api_key', MISTRAL_PROVIDED_KEY);
      saveMistralConfig({ apiKey: MISTRAL_PROVIDED_KEY });
    }
    setApiKeys(loaded);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveApiKey = (keyConfig: ApiKey) => {
    const value = apiKeys[keyConfig.key] || '';
    if (!value.trim()) {
      addToast({ type: 'warning', message: `Insira uma chave para ${keyConfig.label}.` });
      return;
    }
    localStorage.setItem(keyConfig.storageKey, value.trim());
    setSavedKeys(prev => ({ ...prev, [keyConfig.key]: true }));
    addToast({ type: 'success', message: `Chave ${keyConfig.label} salva!` });
    setTimeout(() => setSavedKeys(prev => ({ ...prev, [keyConfig.key]: false })), 3000);
  };

  const handleClearApiKey = (keyConfig: ApiKey) => {
    localStorage.removeItem(keyConfig.storageKey);
    setApiKeys(prev => ({ ...prev, [keyConfig.key]: '' }));
    addToast({ type: 'info', message: `Chave ${keyConfig.label} removida.` });
  };

  const handleTestOllama = async () => {
    setOllamaStatus('testing');
    setOllamaMsg('');
    setOllamaModels([]);
    const result = await testOllamaConnection(ollamaConfig);
    setOllamaStatus(result.success ? 'ok' : 'error');
    setOllamaMsg(result.message);
    if (result.models?.length) setOllamaModels(result.models);
  };

  const handleSaveOllama = () => {
    saveOllamaConfig(ollamaConfig);
    addToast({ type: 'success', message: 'Configuração do Ollama salva!' });
  };

  const handleFetchOllamaModels = async () => {
    const models = await listOllamaModels(ollamaConfig.baseUrl);
    if (models.length > 0) {
      setOllamaModels(models);
      setShowModelDropdown(true);
    } else {
      addToast({ type: 'warning', message: 'Nenhum modelo encontrado. Verifique a conexão.' });
    }
  };

  const handleTestMistral = async () => {
    setMistralStatus('testing');
    setMistralMsg('');
    const key = apiKeys['mistral'] || '';
    const result = await testMistralConnection(key);
    setMistralStatus(result.success ? 'ok' : 'error');
    setMistralMsg(result.message);
    if (result.success) {
      // Save config with current model selection
      saveMistralConfig({ apiKey: key, model: mistralModel });
    }
  };

  const handleSaveMistral = () => {
    const key = apiKeys['mistral'] || '';
    saveMistralConfig({ apiKey: key, model: mistralModel });
    localStorage.setItem('vitrinex_mistral_api_key', key);
    addToast({ type: 'success', message: 'Configuração Mistral AI salva!' });
  };

  const handleMappingChange = (feature: AppFeature, provider: LLMProvider) => {
    setFeatureMappings(prev =>
      prev.map(m => m.feature === feature ? { ...m, provider } : m)
    );
  };

  const handleSaveMappings = () => {
    saveLLMSettings({ featureMappings });
    addToast({ type: 'success', message: 'Mapeamento de modelos salvo!' });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <section id="api-settings-section" className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CpuChipIcon className="w-6 h-6 text-purple-400" />
          Conexões de IA
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure suas chaves de API, integre modelos locais via Ollama e controle qual IA processa cada função do VitrineX.
        </p>
      </div>

      {/* ── API Keys ─────────────────────────────────────────────────────────── */}
      <SectionCard title="Chaves de API" icon={<KeyIcon className="w-4 h-4" />}>
        <div className="space-y-4">
          {API_KEYS_CONFIG.map(cfg => (
            <div key={cfg.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-300">{cfg.label}</label>
                <a
                  href={cfg.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <InformationCircleIcon className="w-3.5 h-3.5" />
                  Obter chave
                </a>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKeys[cfg.key] ? 'text' : 'password'}
                    value={apiKeys[cfg.key] || ''}
                    onChange={e => setApiKeys(prev => ({ ...prev, [cfg.key]: e.target.value }))}
                    placeholder={cfg.placeholder}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors pr-20 font-mono"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, [cfg.key]: !prev[cfg.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                  >
                    {showKeys[cfg.key] ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <button
                  onClick={() => handleSaveApiKey(cfg)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${savedKeys[cfg.key] ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'}`}
                >
                  {savedKeys[cfg.key] ? <CheckCircleIcon className="w-4 h-4" /> : 'Salvar'}
                </button>
                {apiKeys[cfg.key] && (
                  <button
                    onClick={() => handleClearApiKey(cfg)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Ollama ───────────────────────────────────────────────────────────── */}
      <SectionCard title="Ollama (Modelos Locais)" icon={<ServerIcon className="w-4 h-4" />}>
        <div className="space-y-4">

          {/* Ollama Status Banner */}
          {ollamaStatus !== 'idle' && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
              ollamaStatus === 'testing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
              ollamaStatus === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
              'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {ollamaStatus === 'testing'
                ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                : ollamaStatus === 'ok'
                ? <CheckCircleIcon className="w-4 h-4" />
                : <XCircleIcon className="w-4 h-4" />
              }
              <span>{ollamaStatus === 'testing' ? 'Testando conexão...' : ollamaMsg}</span>
            </div>
          )}

          {/* Base URL */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">URL do Servidor Ollama</label>
            <input
              type="url"
              value={ollamaConfig.baseUrl}
              onChange={e => setOllamaConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="http://localhost:11434"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 font-mono"
            />
          </div>

          {/* Model Name */}
          <div className="relative">
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">Modelo Padrão</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ollamaModelInput || ollamaConfig.model}
                onChange={e => {
                  setOllamaModelInput(e.target.value);
                  setOllamaConfig(prev => ({ ...prev, model: e.target.value }));
                }}
                placeholder="Ex: gavtoken/moltbot, llama3, mistral"
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 font-mono"
              />
              <button
                onClick={handleFetchOllamaModels}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1"
              >
                <ChevronDownIcon className="w-4 h-4" />
                Listar
              </button>
            </div>
            {showModelDropdown && ollamaModels.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {ollamaModels.map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setOllamaConfig(prev => ({ ...prev, model: m }));
                      setOllamaModelInput(m);
                      setShowModelDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-purple-500/20 transition-colors font-mono border-b border-white/5 last:border-0"
                  >
                    🦙 {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <details className="group">
            <summary className="text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors list-none flex items-center gap-1.5">
              <ChevronDownIcon className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
              Parâmetros Avançados
            </summary>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { key: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.1 },
                { key: 'topK', label: 'Top K', min: 1, max: 100, step: 1 },
                { key: 'topP', label: 'Top P', min: 0, max: 1, step: 0.05 },
              ].map(param => (
                <div key={param.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{param.label}</label>
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={(ollamaConfig as any)[param.key] ?? ''}
                    onChange={e => setOllamaConfig(prev => ({ ...prev, [param.key]: parseFloat(e.target.value) || undefined }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    placeholder="Auto"
                  />
                </div>
              ))}
            </div>
          </details>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTestOllama}
              disabled={ollamaStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${ollamaStatus === 'testing' ? 'animate-spin' : ''}`} />
              Testar Conexão
            </button>
            <button
              onClick={handleSaveOllama}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Salvar Configuração
            </button>
          </div>

          {/* Models list after successful connection */}
          {ollamaStatus === 'ok' && ollamaModels.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Modelos disponíveis</p>
              <div className="flex flex-wrap gap-2">
                {ollamaModels.map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setOllamaConfig(prev => ({ ...prev, model: m }));
                      setOllamaModelInput(m);
                      addToast({ type: 'info', message: `Modelo padrão alterado para ${m}` });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-medium border transition-all ${
                      ollamaConfig.model === m
                        ? 'bg-purple-500/30 border-purple-500/50 text-purple-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    🦙 {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Mistral AI ────────────────────────────────────────────────────────── */}
      <SectionCard title="Mistral AI" icon={<span className="text-sm">🔥</span>}>
        <div className="space-y-4">

          {/* Status Banner */}
          {mistralStatus !== 'idle' && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
              mistralStatus === 'testing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
              mistralStatus === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
              'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {mistralStatus === 'testing'
                ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                : mistralStatus === 'ok'
                ? <CheckCircleIcon className="w-4 h-4" />
                : <XCircleIcon className="w-4 h-4" />
              }
              <span>{mistralStatus === 'testing' ? 'Testando chave Mistral...' : mistralMsg}</span>
            </div>
          )}

          {/* Model Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">Modelo Mistral</label>
            <select
              value={mistralModel}
              onChange={e => setMistralModel(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 cursor-pointer"
            >
              {MISTRAL_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Info note */}
          <p className="text-xs text-gray-500 flex items-start gap-1.5 bg-orange-500/5 border border-orange-500/10 rounded-lg px-3 py-2">
            <InformationCircleIcon className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
            A chave Mistral AI foi detectada e salva automaticamente. Você pode trocar o modelo, testar a conexão e usar Mistral no Roteamento abaixo.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleTestMistral}
              disabled={mistralStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${mistralStatus === 'testing' ? 'animate-spin' : ''}`} />
              Testar Conexão
            </button>
            <button
              onClick={handleSaveMistral}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:bg-orange-500/30 transition-all"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Salvar Configuração
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── Feature Routing ───────────────────────────────────────────────────── */}

      <SectionCard title="Roteamento por Funcionalidade" icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}>
        <p className="text-xs text-gray-400 mb-4">
          Escolha qual provedor de IA processa cada módulo do VitrineX. O Ollama usa seu servidor local.
        </p>
        <div className="space-y-2">
          {featureMappings.map(mapping => {
            const meta = FEATURE_LABELS[mapping.feature];
            return (
              <div
                key={mapping.feature}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{meta.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{meta.label}</p>
                    {mapping.feature === 'default' && (
                      <p className="text-xs text-gray-500">Aplica-se às funcionalidades sem mapeamento específico</p>
                    )}
                  </div>
                </div>
                <select
                  value={mapping.provider}
                  onChange={e => handleMappingChange(mapping.feature, e.target.value as LLMProvider)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50 cursor-pointer min-w-[160px]"
                >
                  {PROVIDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveMappings}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-indigo-500/30 transition-all"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Salvar Roteamento
          </button>
        </div>
      </SectionCard>

    </section>
  );
};

export default ApiSettingsSection;
