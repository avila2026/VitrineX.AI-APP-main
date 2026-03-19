import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { serializeDOM, analyzeDOMWithOllama } from '../../services/ai/ollamaDom';
import { BeakerIcon, XMarkIcon, CommandLineIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

const OllamaDOMInspector: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [task, setTask] = useState('Descreva a estrutura desta página e identifique elementos de interação.');
    
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setResult(null);
        try {
            // We capture the main content area
            const mainElement = document.querySelector('main') || document.body;
            const response = await analyzeDOMWithOllama(mainElement, task);
            setResult(response);
        } catch (error: any) {
            setResult(`Erro: ${error.message || 'Falha ao conectar com Ollama'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="pointer-events-auto mb-4 w-80 md:w-96 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                            <div className="flex items-center gap-2">
                                <CommandLineIcon className="w-5 h-5 text-blue-400" />
                                <h3 className="text-sm font-semibold text-white tracking-wider">OLLAMA DOM INSPECTOR</h3>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Fechar Inspetor"
                                title="Fechar Inspetor"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 flex-1 flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Tarefa para o Agente</label>
                                <textarea 
                                    value={task}
                                    onChange={(e) => setTask(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none h-20"
                                    placeholder="O que o Ollama deve fazer?"
                                />
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analisando DOM...
                                    </>
                                ) : (
                                    <>
                                        <DocumentMagnifyingGlassIcon className="w-4 h-4" />
                                        Executar Teste DOM
                                    </>
                                )}
                            </button>

                            {result && (
                                <div className="mt-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Resultado do Ollama</label>
                                    <div className="bg-black/60 border border-white/5 rounded-lg p-3 text-sm text-blue-50/80 font-mono whitespace-pre-wrap">
                                        {result}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-white/5 flex items-center justify-center">
                            <span className="text-[9px] text-gray-500 font-mono">Status: Conectado a Localhost:11434</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-900/40 border border-white/20 group relative overflow-hidden"
                aria-label="Abrir Inspetor DOM Ollama"
                title="Abrir Inspetor DOM Ollama"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <BeakerIcon className="w-7 h-7 text-white" />
            </motion.button>
        </div>
    );
};

export default OllamaDOMInspector;
