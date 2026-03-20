
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import {
    UserIcon,
    ShieldCheckIcon,
    BellIcon,
    SparklesIcon,
    CloudIcon,
    CpuChipIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import ProfileSection from './settings/ProfileSection';
import SubscriptionSection from './settings/SubscriptionSection';
import IntegrationsSection from './settings/IntegrationsSection';
import SecuritySection from './settings/SecuritySection';
import NotificationsSection from './settings/NotificationsSection';
import PreferencesSection from './settings/PreferencesSection';
import ApiSettingsSection from './settings/ApiSettingsSection';

type TabId = 'account' | 'security' | 'preferences' | 'integrations' | 'ai';

const Settings: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<TabId>('account');

    const handleSignOut = async () => {
        try {
            await signOut();
            addToast({
                type: 'success',
                title: 'Desconectado',
                message: 'Você saiu da sua conta com sucesso.'
            });
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erro ao sair',
                message: 'Não foi possível desconectar.'
            });
        }
    };

    const tabs = useMemo(() => [
        { id: 'account' as TabId, label: 'Minha Conta', icon: UserIcon, description: 'Perfil e Assinatura' },
        { id: 'security' as TabId, label: 'Segurança', icon: ShieldCheckIcon, description: 'Acesso e Notificações' },
        { id: 'preferences' as TabId, label: 'Preferências', icon: SparklesIcon, description: 'Idioma e Aparência' },
        { id: 'integrations' as TabId, label: 'Canais Digitais', icon: CloudIcon, description: 'Conexões Externas' },
        { id: 'ai' as TabId, label: 'Conexões de IA', icon: CpuChipIcon, description: 'Modelos e APIs' },
    ], []);

    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <div className="space-y-8">
                        <SubscriptionSection />
                        <ProfileSection />
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-8">
                        <SecuritySection />
                        <NotificationsSection />
                    </div>
                );
            case 'preferences':
                return <PreferencesSection />;
            case 'integrations':
                return <IntegrationsSection />;
            case 'ai':
                return <ApiSettingsSection />;
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in pb-24">
            <header className="mb-8">
                <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
                    Configurações<span className="text-primary">.</span>
                </h1>
                <p className="text-[var(--text-secondary)] mt-2">Personalize sua experiência no VitrineX AI.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-6 sticky top-28 overflow-hidden">
                        {/* User Summary */}
                        <div className="flex flex-col items-center text-center mb-8 pb-6 border-b border-white/5">
                            <div className="relative group mb-4">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative w-20 h-20 rounded-full bg-[var(--background-card)] border-2 border-primary/20 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-[var(--background-card)] rounded-full"></div>
                            </div>
                            <h2 className="font-bold text-[var(--text-primary)] text-lg leading-tight truncate w-full px-2">
                                {user?.user_metadata?.full_name || 'Usuário VitrineX'}
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)] truncate w-full px-2 mt-1">{user?.email}</p>
                            <div className="mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                {profile?.plan || 'Free'} PLAN
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="space-y-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full group flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                                            isActive 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                                            : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/20' : 'bg-[var(--background-input)] group-hover:bg-primary/10'}`}>
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-primary'}`} />
                                        </div>
                                        <div className="text-left">
                                            <div className="block">{tab.label}</div>
                                            {!isActive && <div className="text-[10px] font-normal opacity-50 group-hover:opacity-100">{tab.description}</div>}
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Sign Out */}
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all"
                            >
                                Sair da Conta
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-3 min-h-[600px] relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full"
                        >
                            {renderActiveTabContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Settings;
