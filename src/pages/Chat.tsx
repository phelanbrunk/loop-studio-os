import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Plus,
  Globe,
  Zap,
  Code,
  FileText,
  Sparkles,
  Settings,
  ChevronDown,
  Archive,
  Trash2,
  X,
  Bot,
  User,
  Check,
  Edit3,
  Plug,
  Star,
  StarOff,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Webhook,
  KeyRound,
  MessageSquare,
} from 'lucide-react';
import type {
  ChatConversation,
  ChatMessage,
  ApiConnector,
  ApiPrompt,
  ChatPreferences,
} from '@/types';

// ─── Mock Data ───

const initialConversations: ChatConversation[] = [];

const initialMessages: ChatMessage[] = [];

const mockConnectors: ApiConnector[] = [
  {
    id: '1',
    name: 'OpenAI Production',
    provider: 'openai',
    base_url: 'https://api.openai.com/v1',
    default_model: 'gpt-4',
    is_active: true,
  },
  {
    id: '2',
    name: 'Anthropic Claude',
    provider: 'anthropic',
    base_url: 'https://api.anthropic.com',
    default_model: 'claude-3-opus-20240229',
    is_active: false,
  },
  {
    id: '3',
    name: 'Custom Webhook',
    provider: 'webhook',
    base_url: 'https://hooks.zapier.com/hooks/catch/...',
    default_model: 'custom',
    is_active: true,
  },
];

const mockPrompts: ApiPrompt[] = [
  {
    id: '1',
    name: 'Website-Entwurf',
    description: 'Generiert einen Website-Entwurf basierend auf Anforderungen',
    system_prompt:
      'Du bist ein erfahrener Webdesigner. Erstelle strukturierte Website-Entwürfe mit modernem Design.',
    user_prompt_template:
      'Erstelle einen Entwurf für {{projekttyp}} mit Fokus auf {{schwerpunkt}}',
    variables: ['projekttyp', 'schwerpunkt'],
    is_favorite: true,
  },
  {
    id: '2',
    name: 'Code-Review',
    description: 'Reviewt Code auf Best Practices',
    system_prompt:
      'Du bist ein Senior-Entwickler. Review Code auf Performance, Sicherheit und Best Practices.',
    is_favorite: false,
  },
];

const quickActions = [
  { label: 'Neues Projekt', icon: Plus, text: 'Ich möchte ein neues Projekt starten.' },
  { label: 'Website Entwurf', icon: Globe, text: 'Erstelle einen Website-Entwurf für mein Geschäft.' },
  { label: 'API-Anfrage', icon: Zap, text: 'Hilf mir bei einer API-Integration.' },
  { label: 'Code generieren', icon: Code, text: 'Generiere Code für eine React-Komponente.' },
  { label: 'Dokument analysieren', icon: FileText, text: 'Analysiere dieses Dokument für mich.' },
];

const models = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5', name: 'GPT-3.5' },
  { id: 'claude-3', name: 'Claude 3' },
  { id: 'custom', name: 'Custom' },
];

// ─── Helper: Format Timestamp ───
function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
  });
}

// ─── Typing Indicator Component ───
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex flex-col items-start gap-2"
    >
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-orange to-accent-purple flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-white" />
        </div>
        <div className="bg-[#0C0D0F] border border-white/[0.06] rounded-2xl rounded-bl-sm px-5 py-4">
          <div className="flex gap-1.5 items-center h-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-accent-orange"
                animate={{
                  scale: [0.8, 1, 0.8],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
          <p className="text-[11px] text-text-muted mt-2">Loop AI denkt nach...</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── API Panel Component ───
function ApiPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'connectors' | 'prompts' | 'settings'>('connectors');
  const [connectors, setConnectors] = useState<ApiConnector[]>(mockConnectors);
  const [prompts, setPrompts] = useState<ApiPrompt[]>(mockPrompts);
  const [preferences, setPreferences] = useState<ChatPreferences>({
    default_model: 'gpt-4',
    theme: 'dark',
    show_timestamps: true,
    compact_mode: false,
  });
  const [showConnectorForm, setShowConnectorForm] = useState(false);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [editingConnector, setEditingConnector] = useState<ApiConnector | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<ApiPrompt | null>(null);

  const [connectorForm, setConnectorForm] = useState<Partial<ApiConnector>>({
    provider: 'openai',
    default_model: 'gpt-4',
    is_active: true,
  });
  const [promptForm, setPromptForm] = useState<Partial<ApiPrompt>>({
    is_favorite: false,
  });

  function handleToggleConnector(id: string) {
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
    );
  }

  function handleDeleteConnector(id: string) {
    setConnectors((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSaveConnector() {
    if (!connectorForm.name) return;
    if (editingConnector) {
      setConnectors((prev) =>
        prev.map((c) => (c.id === editingConnector.id ? { ...c, ...connectorForm } as ApiConnector : c))
      );
    } else {
      const newConnector: ApiConnector = {
        id: String(Date.now()),
        name: connectorForm.name || 'Neuer Connector',
        provider: (connectorForm.provider as ApiConnector['provider']) || 'openai',
        base_url: connectorForm.base_url,
        api_key: connectorForm.api_key,
        default_model: connectorForm.default_model || 'gpt-4',
        is_active: connectorForm.is_active ?? true,
        config: {},
      };
      setConnectors((prev) => [...prev, newConnector]);
    }
    setShowConnectorForm(false);
    setEditingConnector(null);
    setConnectorForm({ provider: 'openai', default_model: 'gpt-4', is_active: true });
  }

  function handleSavePrompt() {
    if (!promptForm.name) return;
    if (editingPrompt) {
      setPrompts((prev) =>
        prev.map((p) => (p.id === editingPrompt.id ? { ...p, ...promptForm } as ApiPrompt : p))
      );
    } else {
      const newPrompt: ApiPrompt = {
        id: String(Date.now()),
        name: promptForm.name || 'Neuer Prompt',
        description: promptForm.description,
        system_prompt: promptForm.system_prompt,
        user_prompt_template: promptForm.user_prompt_template,
        variables: [],
        is_favorite: promptForm.is_favorite ?? false,
      };
      setPrompts((prev) => [...prev, newPrompt]);
    }
    setShowPromptForm(false);
    setEditingPrompt(null);
    setPromptForm({ is_favorite: false });
  }

  function handleToggleFavorite(id: string) {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_favorite: !p.is_favorite } : p))
    );
  }

  function handleDeletePrompt(id: string) {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }

  const providerIcons: Record<string, React.ReactNode> = {
    openai: <Cpu size={14} />,
    anthropic: <Bot size={14} />,
    custom: <Plug size={14} />,
    webhook: <Webhook size={14} />,
    supabase_function: <Zap size={14} />,
  };

  const providerColors: Record<string, string> = {
    openai: 'bg-green-500/15 text-green-400 border-green-500/20',
    anthropic: 'bg-accent-purple/15 text-accent-purple border-accent-purple/20',
    custom: 'bg-status-yellow/15 text-status-yellow border-status-yellow/20',
    webhook: 'bg-status-teal/15 text-status-teal border-status-teal/20',
    supabase_function: 'bg-accent-orange/15 text-accent-orange border-accent-orange/20',
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-[420px] z-50 border-l border-white/[0.06] flex flex-col"
      style={{
        background: 'rgba(12,13,15,0.85)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] shrink-0">
        <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <Plug size={18} className="text-accent-orange" />
          API-Verbindungen
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-white/[0.06] shrink-0">
        {[
          { key: 'connectors' as const, label: 'Connectors', icon: Plug },
          { key: 'prompts' as const, label: 'Prompts', icon: FileText },
          { key: 'settings' as const, label: 'Einstellungen', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-accent-orange/15 text-accent-orange'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ─── Connectors Tab ─── */}
        {activeTab === 'connectors' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setEditingConnector(null);
                setConnectorForm({ provider: 'openai', default_model: 'gpt-4', is_active: true });
                setShowConnectorForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-accent-orange to-accent-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Neuer Connector
            </button>

            {showConnectorForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#141518] border border-white/[0.06] rounded-xl p-4 space-y-3"
              >
                <h4 className="text-sm font-semibold text-white">
                  {editingConnector ? 'Connector bearbeiten' : 'Neuer Connector'}
                </h4>
                <input
                  type="text"
                  placeholder="Name"
                  value={connectorForm.name || ''}
                  onChange={(e) => setConnectorForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50"
                />
                <select
                  value={connectorForm.provider || 'openai'}
                  onChange={(e) => setConnectorForm((p) => ({ ...p, provider: e.target.value as ApiConnector['provider'] }))}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-orange/50"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">Custom</option>
                  <option value="webhook">Webhook</option>
                  <option value="supabase_function">Supabase Function</option>
                </select>
                <input
                  type="text"
                  placeholder="Base URL"
                  value={connectorForm.base_url || ''}
                  onChange={(e) => setConnectorForm((p) => ({ ...p, base_url: e.target.value }))}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50"
                />
                <input
                  type="password"
                  placeholder="API Key"
                  value={connectorForm.api_key || ''}
                  onChange={(e) => setConnectorForm((p) => ({ ...p, api_key: e.target.value }))}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50"
                />
                <input
                  type="text"
                  placeholder="Standard-Modell"
                  value={connectorForm.default_model || ''}
                  onChange={(e) => setConnectorForm((p) => ({ ...p, default_model: e.target.value }))}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveConnector}
                    className="flex-1 py-2 rounded-lg bg-accent-orange text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => {
                      setShowConnectorForm(false);
                      setEditingConnector(null);
                    }}
                    className="flex-1 py-2 rounded-lg bg-[#1B1D20] text-text-secondary text-xs font-medium hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </motion.div>
            )}

            {connectors.map((connector) => (
              <div
                key={connector.id}
                className="bg-[#141518] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border ${providerColors[connector.provider] || providerColors.custom}`}
                    >
                      {providerIcons[connector.provider] || <Plug size={14} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{connector.name}</h4>
                      <span className="text-[11px] text-text-muted capitalize">
                        {connector.provider}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingConnector(connector);
                        setConnectorForm(connector);
                        setShowConnectorForm(true);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteConnector(connector.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-status-red hover:bg-status-red/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                    <KeyRound size={11} />
                    {connector.api_key ? 'API Key gesetzt' : 'Kein API Key'}
                  </div>
                  <button
                    onClick={() => handleToggleConnector(connector.id)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      connector.is_active ? 'bg-accent-orange' : 'bg-[#2A2D32]'
                    }`}
                  >
                    <motion.div
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                      animate={{ x: connector.is_active ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Prompts Tab ─── */}
        {activeTab === 'prompts' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setEditingPrompt(null);
                setPromptForm({ is_favorite: false });
                setShowPromptForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-accent-orange to-accent-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Neuer Prompt
            </button>

            {showPromptForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#141518] border border-white/[0.06] rounded-xl p-4 space-y-3"
              >
                <h4 className="text-sm font-semibold text-white">
                  {editingPrompt ? 'Prompt bearbeiten' : 'Neuer Prompt'}
                </h4>
                <input
                  type="text"
                  placeholder="Name"
                  value={promptForm.name || ''}
                  onChange={(e) => setPromptForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50"
                />
                <input
                  type="text"
                  placeholder="Beschreibung"
                  value={promptForm.description || ''}
                  onChange={(e) => setPromptForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50"
                />
                <textarea
                  placeholder="System-Prompt"
                  value={promptForm.system_prompt || ''}
                  onChange={(e) => setPromptForm((p) => ({ ...p, system_prompt: e.target.value }))}
                  rows={3}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 resize-none"
                />
                <textarea
                  placeholder="User-Prompt-Template ({{variable}})"
                  value={promptForm.user_prompt_template || ''}
                  onChange={(e) => setPromptForm((p) => ({ ...p, user_prompt_template: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 resize-none"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSavePrompt}
                    className="flex-1 py-2 rounded-lg bg-accent-orange text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => {
                      setShowPromptForm(false);
                      setEditingPrompt(null);
                    }}
                    className="flex-1 py-2 rounded-lg bg-[#1B1D20] text-text-secondary text-xs font-medium hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </motion.div>
            )}

            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-[#141518] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">{prompt.name}</h4>
                      {prompt.is_favorite && (
                        <Star size={12} className="text-status-yellow shrink-0 fill-status-yellow" />
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-[11px] text-text-muted mt-0.5">{prompt.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleToggleFavorite(prompt.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-status-yellow hover:bg-status-yellow/10 transition-colors"
                    >
                      {prompt.is_favorite ? (
                        <Star size={13} className="fill-status-yellow text-status-yellow" />
                      ) : (
                        <StarOff size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPrompt(prompt);
                        setPromptForm(prompt);
                        setShowPromptForm(true);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-status-red hover:bg-status-red/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {prompt.system_prompt && (
                  <p className="text-[11px] text-text-muted line-clamp-2 mt-1.5 bg-[#0C0D0F] rounded-lg p-2">
                    {prompt.system_prompt}
                  </p>
                )}
                {prompt.user_prompt_template && (
                  <p className="text-[11px] text-accent-purple/70 mt-1.5 font-mono">
                    {prompt.user_prompt_template}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Default Model */}
            <div className="bg-[#141518] border border-white/[0.06] rounded-xl p-4">
              <label className="text-sm font-semibold text-white mb-2 block">Standard-Modell</label>
              <select
                value={preferences.default_model}
                onChange={(e) =>
                  setPreferences((p) => ({ ...p, default_model: e.target.value }))
                }
                className="w-full bg-[#0C0D0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-orange/50"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Timestamps */}
            <div className="bg-[#141518] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white">Zeitstempel anzeigen</span>
                <p className="text-[11px] text-text-muted">Zeige Zeit unter jeder Nachricht</p>
              </div>
              <button
                onClick={() =>
                  setPreferences((p) => ({ ...p, show_timestamps: !p.show_timestamps }))
                }
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  preferences.show_timestamps ? 'bg-accent-orange' : 'bg-[#2A2D32]'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ x: preferences.show_timestamps ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Compact Mode */}
            <div className="bg-[#141518] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white">Kompaktmodus</span>
                <p className="text-[11px] text-text-muted">Reduziere Abstände zwischen Nachrichten</p>
              </div>
              <button
                onClick={() =>
                  setPreferences((p) => ({ ...p, compact_mode: !p.compact_mode }))
                }
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  preferences.compact_mode ? 'bg-accent-orange' : 'bg-[#2A2D32]'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ x: preferences.compact_mode ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Chat Component ───

export default function Chat() {
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  function handleSend() {
    if (!inputValue.trim()) return;

    let convId = activeConversationId;

    // If no active conversation, create one
    if (!convId) {
      const newConv: ChatConversation = {
        id: String(Date.now()),
        title: inputValue.slice(0, 40) + (inputValue.length > 40 ? '...' : ''),
        model: selectedModel,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    }

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      conversation_id: convId,
      role: 'user',
      content: inputValue,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        conversation_id: convId || 'new',
        role: 'assistant',
        content:
          'Das ist ein Mock-Response. Hier würde die echte API-Antwort erscheinen. Du kannst im API-Panel deine eigene API konfigurieren!',
        model: selectedModel,
        tokens_used: 42,
        latency_ms: 1500,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  }

  function handleQuickAction(text: string) {
    let convId = activeConversationId;

    if (!convId) {
      const newConv: ChatConversation = {
        id: String(Date.now()),
        title: text.slice(0, 40) + (text.length > 40 ? '...' : ''),
        model: selectedModel,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    }

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      conversation_id: convId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        conversation_id: convId || 'new',
        role: 'assistant',
        content:
          'Das ist ein Mock-Response. Hier würde die echte API-Antwort erscheinen. Du kannst im API-Panel deine eigene API konfigurieren!',
        model: selectedModel,
        tokens_used: 42,
        latency_ms: 1500,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
  }

  function handleArchiveConversation(id: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'archived' as const } : c))
    );
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }

  function handleDeleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
    // In a real app, you'd fetch messages for this conversation
    setMessages([]);
  }

  function handleUpdateTitle() {
    if (!activeConversationId || !titleValue.trim()) {
      setEditingTitle(false);
      return;
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId ? { ...c, title: titleValue } : c
      )
    );
    setEditingTitle(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const filteredMessages = activeConversationId
    ? messages.filter((m) => m.conversation_id === activeConversationId)
    : [];

  return (
    <div className="h-[calc(100vh-4rem)] flex relative overflow-hidden">
      {/* ─── Chat Sidebar ─── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full border-r border-white/[0.06] flex flex-col overflow-hidden shrink-0"
            style={{
              background: 'linear-gradient(180deg, rgba(12,13,15,0.98) 0%, rgba(12,13,15,0.92) 100%)',
            }}
          >
            {/* New Chat Button */}
            <div className="p-3 border-b border-white/[0.06]">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-accent-orange to-accent-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
                Neuer Chat
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
              {conversations
                .filter((c) => c.status !== 'deleted')
                .map((conv) => (
                  <div
                    key={conv.id}
                    className="group relative mx-2"
                  >
                    <button
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                        activeConversationId === conv.id
                          ? 'bg-accent-orange/10 text-accent-orange'
                          : 'text-text-secondary hover:bg-[#1B1D20] hover:text-white'
                      }`}
                    >
                      <MessageSquare
                        size={16}
                        className={
                          activeConversationId === conv.id
                            ? 'text-accent-orange'
                            : 'text-text-muted'
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-[10px] text-text-muted">
                          {formatDate(conv.updated_at)}
                        </p>
                      </div>
                      {conv.status === 'archived' && (
                        <Archive size={12} className="text-text-muted shrink-0" />
                      )}
                    </button>

                    {/* Hover Actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveConversation(conv.id);
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-status-yellow hover:bg-status-yellow/10 transition-colors"
                        title="Archivieren"
                      >
                        <Archive size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-status-red hover:bg-status-red/10 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Bottom */}
            <div className="p-3 border-t border-white/[0.06]">
              <button
                onClick={() => setShowApiPanel(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-text-secondary hover:bg-[#1B1D20] hover:text-white transition-colors"
              >
                <Settings size={14} />
                Einstellungen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative">
        {/* Top Bar */}
        <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Title */}
            {activeConversation ? (
              <div className="flex items-center gap-2">
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={handleUpdateTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTitle();
                        if (e.key === 'Escape') setEditingTitle(false);
                      }}
                      autoFocus
                      className="bg-[#141518] border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-orange/50 w-64"
                    />
                    <button
                      onClick={handleUpdateTitle}
                      className="w-6 h-6 rounded flex items-center justify-center text-accent-orange hover:bg-accent-orange/10 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-white">
                      {activeConversation.title}
                    </h3>
                    <button
                      onClick={() => {
                        setTitleValue(activeConversation.title);
                        setEditingTitle(true);
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                      style={{ opacity: editingTitle ? 0 : undefined }}
                    >
                      <Edit3 size={12} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <h3 className="text-sm font-semibold text-text-muted">Neuer Chat</h3>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141518] border border-white/[0.06] text-xs font-medium text-text-secondary hover:text-white hover:border-white/[0.12] transition-all"
              >
                <Cpu size={13} />
                {models.find((m) => m.id === selectedModel)?.name || 'GPT-4'}
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showModelDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowModelDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-44 bg-[#141518] border border-white/[0.08] rounded-xl shadow-xl z-20 overflow-hidden"
                    >
                      {models.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedModel(m.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                            selectedModel === m.id
                              ? 'bg-accent-orange/10 text-accent-orange'
                              : 'text-text-secondary hover:bg-[#1B1D20] hover:text-white'
                          }`}
                        >
                          {selectedModel === m.id && <Check size={12} />}
                          {m.name}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* API Connect Button */}
            <button
              onClick={() => setShowApiPanel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141518] border border-white/[0.06] text-xs font-medium text-text-secondary hover:text-white hover:border-white/[0.12] transition-all"
            >
              <Plug size={13} />
              API verbinden
            </button>
          </div>
        </div>

        {/* ─── Messages Area ─── */}
        {!activeConversationId ? (
          /* ─── Welcome Screen ─── */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-orange to-accent-purple flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-orange/20">
                <Sparkles size={32} className="text-white" />
              </div>
              <h1 className="font-display font-bold text-4xl text-white mb-3">
                Was kann ich für dich bauen?
              </h1>
              <p className="text-text-secondary text-sm">
                Frage mich nach Websites, APIs, Code oder Analysen.
              </p>
            </motion.div>

            {/* Quick Action Chips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-wrap justify-center gap-2 mb-10 max-w-xl"
            >
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.text)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1B1D20] border border-white/[0.06] text-xs font-medium text-text-secondary hover:bg-[#2A2D32] hover:text-white hover:border-white/[0.12] transition-all"
                >
                  <action.icon size={14} />
                  {action.label}
                </button>
              ))}
            </motion.div>

            {/* Input Bar (centered, welcome screen) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full max-w-2xl"
            >
              <div className="flex items-end gap-2 bg-[#141518] border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-accent-orange/30 transition-colors">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-colors shrink-0 mb-0.5">
                  <Paperclip size={18} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Frag mich was..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-text-muted resize-none focus:outline-none max-h-[120px] py-1.5"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all ${
                    inputValue.trim()
                      ? 'bg-gradient-to-r from-accent-orange to-accent-purple text-white shadow-lg shadow-accent-orange/25 hover:shadow-accent-orange/40'
                      : 'bg-[#1B1D20] text-text-muted'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          /* ─── Active Chat View ─── */
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
              <AnimatePresence initial={false}>
                {filteredMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-full ${
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      {msg.role === 'user' ? (
                        <div className="w-8 h-8 rounded-full bg-[#2A2D32] border border-white/[0.08] flex items-center justify-center shrink-0 self-start">
                          <User size={14} className="text-text-secondary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-orange to-accent-purple flex items-center justify-center shrink-0 self-start">
                          <Sparkles size={14} className="text-white" />
                        </div>
                      )}

                      {/* Message Bubble + Timestamp */}
                      <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-accent-orange to-[#FFB347] text-white rounded-2xl rounded-br-sm max-w-[70%]'
                              : 'bg-[#0C0D0F] border border-white/[0.06] text-white rounded-2xl rounded-bl-sm max-w-[80%]'
                          }`}
                        >
                          <MessageContent content={msg.content} />
                        </div>
                        {/* Timestamp */}
                        <span className="text-[10px] text-text-muted mt-1 px-1">
                          {formatTime(msg.created_at)}
                          {msg.model && ` · ${msg.model}`}
                          {msg.tokens_used && ` · ${msg.tokens_used} Tokens`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] bg-black">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-end gap-2 bg-[#141518] border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-accent-orange/30 transition-colors">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-colors shrink-0 mb-0.5">
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Schreibe eine Nachricht..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-text-muted resize-none focus:outline-none max-h-[120px] py-1"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all ${
                      inputValue.trim()
                        ? 'bg-gradient-to-r from-accent-orange to-accent-purple text-white shadow-lg shadow-accent-orange/25 hover:shadow-accent-orange/40'
                        : 'bg-[#1B1D20] text-text-muted'
                    }`}
                  >
                    <Send size={16} />
                  </button>
                </div>
                <p className="text-center text-[10px] text-text-muted mt-2">
                  Loop AI kann Fehler machen. Überprüfe wichtige Informationen.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── API Panel ─── */}
      <AnimatePresence>
        {showApiPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowApiPanel(false)}
            />
            <ApiPanel onClose={() => setShowApiPanel(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Message Content Renderer ───
function MessageContent({ content }: { content: string }) {
  // Simple rendering: if content has code blocks, render them with styling
  if (content.includes('```')) {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const code = part.slice(3, -3).trim();
            return (
              <pre
                key={i}
                className="mt-2 mb-2 bg-black/40 rounded-lg p-3 text-xs font-mono text-text-secondary overflow-x-auto"
              >
                <code>{code}</code>
              </pre>
            );
          }
          return <span key={i}>{renderInlineMarkdown(part)}</span>;
        })}
      </>
    );
  }
  return <>{renderInlineMarkdown(content)}</>;
}

function renderInlineMarkdown(text: string) {
  // Bold: **text**
  const boldParts = text.split(/(\*\*[\s\S]*?\*\*)/g);
  return boldParts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Replace newlines with <br> for non-code text
    if (part.includes('\n')) {
      const lines = part.split('\n');
      return (
        <span key={i}>
          {lines.map((line, j) => (
            <span key={j}>
              {line}
              {j < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

