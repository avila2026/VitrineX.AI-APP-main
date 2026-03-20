import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    SparklesIcon,
    TrashIcon,
    ArrowPathIcon,
    CommandLineIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    PaperClipIcon,
    DocumentIcon,
    PhotoIcon,
    PresentationChartLineIcon,
    PaintBrushIcon,
    CpuChipIcon,
    LightBulbIcon,
} from '@heroicons/react/24/outline';
import { routedGenerateText } from '../../services/ai/llmRouter';

type AgentId = 'orquestrador' | 'estrategista' | 'criativo' | 'tecnico';

interface Agent {
    id: AgentId;
    name: string;
    role: string;
    icon: any;
    color: string;
    glow: string;
    description: string;
}

const AGENTS: Record<AgentId, Agent> = {
    orquestrador: {
        id: 'orquestrador',
        name: 'V-Zero',
        role: 'SISTEMA',
        icon: CpuChipIcon,
        color: 'from-blue-500 to-cyan-400',
        glow: 'shadow-blue-500/40',
        description: 'Coordenação e Inteligência Central',
    },
    estrategista: {
        id: 'estrategista',
        name: 'Clara',
        role: 'ESTRATÉGIA',
        icon: PresentationChartLineIcon,
        color: 'from-purple-500 to-pink-500',
        glow: 'shadow-purple-500/40',
        description: 'Marketing, ROI e Tendências',
    },
    criativo: {
        id: 'criativo',
        name: 'Lucas',
        role: 'CRIATIVO',
        icon: PaintBrushIcon,
        color: 'from-orange-500 to-amber-500',
        glow: 'shadow-orange-500/40',
        description: 'Copywriting e Design de Ideias',
    },
    tecnico: {
        id: 'tecnico',
        name: 'Dev-X',
        role: 'TÉCNICO',
        icon: CommandLineIcon,
        color: 'from-emerald-500 to-teal-500',
        glow: 'shadow-emerald-500/40',
        description: 'Código, Bug-fix e Arquitetura',
    },
};

interface Attachment {
    id: string;
    name: string;
    type: string;
    url: string;
    file: File;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    agentId?: AgentId;
    text: string;
    timestamp: Date;
    attachments?: { name: string; type: string }[];
}

const MULTI_AGENT_SYSTEM_PROMPT = `Você é o sistema multi-agentes da VitrineX AI.
Você possui 4 especialistas internos:
- V-Zero (Orquestrador): Coordenador, direto, polido.
- Clara (Estrategista): Expert em marketing, vendas, ROI.
- Lucas (Criativo): Expert em copywriting, branding, ideias "fora da caixa".
- Dev-X (Técnico): Expert em código (React, TS, Node), DOM, arquitetura.

REGRAS DE RESPOSTA:
1. Analise o contexto e os arquivos enviados.
2. Decida qual dos 4 agentes deve dar a resposta final baseada no contexto dominante.
3. Se for algo técnico, use Dev-X. Se for marketing, use Clara. Se for ideias/texto, use Lucas. Se for geral, use V-Zero.
4. Sua resposta DEVE começar OBRIGATORIAMENTE com uma TAG identificadora do agente: [AGENT:id], onde id é orquestrador, estrategista, criativo ou tecnico.
5. Exemplo: "[AGENT:tecnico] Seu código está bugado porque..." ou "[AGENT:estrategista] Para aumentar o ROI, você deve..."
6. Responda sempre em Português do Brasil usando Markdown.`;

const FloatingChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBrainstorming, setIsBrainstorming] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [activeBrainstormAgent, setActiveBrainstormAgent] = useState<AgentId>('orquestrador');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Collaboration Animation Cycles
    useEffect(() => {
        if (isBrainstorming) {
            const agentIds: AgentId[] = ['orquestrador', 'estrategista', 'criativo', 'tecnico'];
            let i = 0;
            const interval = setInterval(() => {
                setActiveBrainstormAgent(agentIds[i % agentIds.length]);
                i++;
            }, 800);
            return () => clearInterval(interval);
        }
    }, [isBrainstorming]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, attachments, isBrainstorming]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
            setHasUnread(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const saved = sessionStorage.getItem('vtx_multi_chat');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
            } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('vtx_multi_chat', JSON.stringify(messages));
        }
    }, [messages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newAttachments: Attachment[] = files.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.type,
                url: URL.createObjectURL(file),
                file: file
            }));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => {
            const att = prev.find(a => a.id === id);
            if (att) URL.revokeObjectURL(att.url);
            return prev.filter(a => a.id !== id);
        });
    };

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if ((!text && attachments.length === 0) || isLoading) return;

        const currentAttachments = [...attachments];
        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            text: text || (currentAttachments.length > 0 ? `Enviou ${currentAttachments.length} arquivo(s)` : ''),
            timestamp: new Date(),
            attachments: currentAttachments.map(a => ({ name: a.name, type: a.type })),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachments([]);
        setIsLoading(true);
        setIsBrainstorming(true);

        try {
            const recentMessages = [...messages.slice(-10), userMsg];
            let attachmentCtx = "";
            if (currentAttachments.length > 0) {
                attachmentCtx = `\n[ARQUIVOS: ${currentAttachments.map(a => `${a.name}(${a.type})`).join(', ')}]`;
            }

            const contextPrompt = recentMessages
                .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'} (${m.agentId || 'V' }): ${m.text}`)
                .join('\n');

            const fullPrompt = `${contextPrompt}${attachmentCtx}\n\nEscolha o agente e responda:`;

            const response = await routedGenerateText('chat', fullPrompt, {
                systemInstruction: MULTI_AGENT_SYSTEM_PROMPT,
                temperature: 0.7,
            });

            // Parse Agent Tag: [AGENT:id] Text
            let finalAgent: AgentId = 'orquestrador';
            let finalText = response || '';
            const tagMatch = response?.match(/\[AGENT:(\w+)\]/);
            
            if (tagMatch) {
                const potentialId = tagMatch[1] as AgentId;
                if (AGENTS[potentialId]) {
                    finalAgent = potentialId;
                    finalText = response.replace(tagMatch[0], '').trim();
                }
            }

            const assistantMsg: ChatMessage = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                agentId: finalAgent,
                text: finalText || 'Desculpe, falhei na resposta.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
            if (!isOpen) setHasUnread(true);

        } catch (error: any) {
            const errorMsg: ChatMessage = {
                id: `e-${Date.now()}`,
                role: 'assistant',
                agentId: 'orquestrador',
                text: `⚠️ Erro: ${error.message || 'Falha na colobaração.'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            setIsBrainstorming(false);
        }
    }, [input, isLoading, messages, isOpen, attachments]);

    const clearChat = () => {
        setMessages([]);
        sessionStorage.removeItem('vtx_multi_chat');
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="fixed bottom-24 right-6 z-[9998] w-[400px] md:w-[440px] h-[600px] md:h-[680px] flex flex-col rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        style={{
                            background: 'linear-gradient(165deg, rgba(12,12,22,0.98), rgba(8,8,15,1))',
                            backdropFilter: 'blur(40px)',
                        }}
                    >
                        {/* ═══ Header: Agents Display ═══ */}
                        <div className="relative pt-6 pb-4 px-6 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Multi-Agent System</h3>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={clearChat} title="Reiniciar" className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-red-400 transition-all"><TrashIcon className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setIsOpen(false)} title="Minimizar" className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-all"><XMarkIcon className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center px-2">
                                {(Object.keys(AGENTS) as AgentId[]).map(id => {
                                    const agent = AGENTS[id];
                                    const isActive = isBrainstorming && activeBrainstormAgent === id;
                                    return (
                                        <div key={id} className="flex flex-col items-center gap-2 group">
                                            <motion.div
                                                animate={isActive ? {
                                                    scale: [1, 1.2, 1],
                                                    boxShadow: [
                                                        '0 0 0px rgba(0,0,0,0)',
                                                        '0 0 20px var(--tw-shadow-color)',
                                                        '0 0 0px rgba(0,0,0,0)'
                                                    ]
                                                } : {}}
                                                transition={{ duration: 0.8, repeat: Infinity }}
                                                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center border border-white/10 shadow-lg ${isActive ? agent.glow : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100'} transition-all duration-500`}
                                                title={`${agent.name}: ${agent.description}`}
                                            >
                                                <agent.icon className="w-6 h-6 text-white" />
                                            </motion.div>
                                            <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-white/20'}`}>
                                                {agent.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {isBrainstorming && (
                                <motion.div
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 origin-left"
                                />
                            )}
                        </div>

                        {/* ═══ Messages Area ═══ */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                                        <CpuChipIcon className="w-16 h-16 text-blue-500/50 relative z-10 animate-pulse" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">VitrineX Agents</h2>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Clique em um dos agentes acima para conhecê-los ou envie uma mensagem para começarmos a colaborar.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar Column */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                            msg.role === 'user' 
                                                ? 'bg-white/10 border border-white/20' 
                                                : `bg-gradient-to-br ${AGENTS[msg.agentId || 'orquestrador'].color} shadow-lg`
                                        }`}>
                                            {msg.role === 'user' ? (
                                                <span className="text-[10px] font-black text-white">EU</span>
                                            ) : (
                                                React.createElement(AGENTS[msg.agentId || 'orquestrador'].icon, { className: "w-5 h-5 text-white" })
                                            )}
                                        </div>
                                        {!msg.agentId && msg.role === 'assistant' && (
                                            <span className="text-[7px] text-white/30 uppercase font-black">AI</span>
                                        )}
                                    </div>

                                    {/* Bubble Column */}
                                    <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        {msg.role === 'assistant' && msg.agentId && (
                                            <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 bg-clip-text text-transparent bg-gradient-to-r ${AGENTS[msg.agentId].color}`}>
                                                {AGENTS[msg.agentId].name} • {AGENTS[msg.agentId].role}
                                            </span>
                                        )}
                                        
                                        <div className={`px-4 py-3 rounded-3xl ${
                                            msg.role === 'user'
                                                ? 'bg-white/10 border border-white/5 rounded-tr-none text-white/90'
                                                : `bg-white/[0.04] border border-white/5 rounded-tl-none text-gray-200 shadow-xl`
                                        }`}>
                                            <div className="prose prose-invert prose-sm max-w-none text-[13px] leading-relaxed 
                                                [&_p]:mb-3 [&_p:last-child]:mb-0 
                                                [&_pre]:bg-black/50 [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:my-3
                                                [&_code]:text-cyan-400 [&_code]:font-mono [&_code]:text-[12px]
                                                [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1">
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>

                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                                    {msg.attachments.map((att, i) => (
                                                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg text-[9px] text-white/50 border border-white/5">
                                                            {att.type.startsWith('image/') ? <PhotoIcon className="w-3 h-3" /> : <DocumentIcon className="w-3 h-3" />}
                                                            <span className="truncate max-w-[80px]">{att.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[8px] text-white/20 mt-1.5 px-1 font-mono">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Brainstorming Indicator */}
                            {isBrainstorming && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                    <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${AGENTS[activeBrainstormAgent].color} flex items-center justify-center shadow-lg transition-colors duration-500`}>
                                        <ArrowPathIcon className="w-5 h-5 text-white animate-spin" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex gap-1 items-center">
                                            {[0, 1, 2, 3].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ 
                                                        scale: i === ['orquestrador', 'estrategista', 'criativo', 'tecnico'].indexOf(activeBrainstormAgent) ? 1.5 : 1,
                                                        opacity: i === ['orquestrador', 'estrategista', 'criativo', 'tecnico'].indexOf(activeBrainstormAgent) ? 1 : 0.3
                                                    }}
                                                    className={`w-1.5 h-1.5 rounded-full ${AGENTS[['orquestrador', 'estrategista', 'criativo', 'tecnico'][i] as AgentId].color.replace('from-', 'bg-')}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="bg-white/[0.03] px-3 py-2 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-bold text-white/50 animate-pulse">
                                                {activeBrainstormAgent === 'orquestrador' && 'Analisando contexto...'}
                                                {activeBrainstormAgent === 'estrategista' && 'Validando ROI...'}
                                                {activeBrainstormAgent === 'criativo' && 'Gerando ideias...'}
                                                {activeBrainstormAgent === 'tecnico' && 'Verificando implementação...'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} className="h-1" />
                        </div>

                        {/* ═══ Input Area ═══ */}
                        <div className="p-6 bg-white/[0.02] border-t border-white/5">
                            {/* Attachments Preview */}
                            <AnimatePresence>
                                {attachments.length > 0 && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                                        {attachments.map(att => (
                                            <motion.div key={att.id} className="relative group flex-shrink-0">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {att.type.startsWith('image/') ? <img src={att.url} alt="p" className="w-full h-full object-cover" /> : <DocumentIcon className="w-8 h-8 text-white/20" />}
                                                </div>
                                                <button onClick={() => removeAttachment(att.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"><XMarkIcon className="w-3 h-3" /></button>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative group">
                                <div className="flex items-end gap-2 bg-white/[0.05] border border-white/10 rounded-[2rem] p-2 focus-within:border-white/20 focus-within:bg-white/[0.08] transition-all shadow-inner">
                                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-white/30 hover:text-white transition-all"><PaperClipIcon className="w-5 h-5" /><input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} /></button>
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Mensagem para os agentes..."
                                        className="flex-1 bg-transparent border-none text-[14px] text-white placeholder-white/20 resize-none focus:outline-none focus:ring-0 px-1 py-3 max-h-32"
                                        rows={1}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSend}
                                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                                        className="p-3.5 rounded-full bg-blue-500 text-white shadow-[0_10px_20px_rgba(59,130,246,0.3)] disabled:opacity-20 disabled:shadow-none transition-all"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Floating Action Button ═══ */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 right-8 z-[9999]"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Sistemas VitrineX"
            >
                {/* Rings */}
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute inset-0 rounded-full bg-blue-500/30 blur-md" />
                <motion.div animate={{ scale: [1, 2, 1], opacity: [0.1, 0, 0.1] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }} className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl" />

                <div className={`relative w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden`}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }} className="absolute inset-0 opacity-20"><div className="w-full h-full border-[10px] border-dashed border-white rounded-full scale-150" /></motion.div>
                    
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><XMarkIcon className="w-8 h-8 text-white relative z-10" /></motion.div>
                        ) : (
                            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
                                <ChatBubbleLeftRightIcon className="w-8 h-8 text-white relative z-10" />
                                {hasUnread && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-indigo-600 shadow-lg" />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>
        </>
    );
};

export default FloatingChat;
