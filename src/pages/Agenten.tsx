
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExecutionRouter, type ExecutionTask, type ExecutionBackend } from '@/hooks/useExecutionRouter';
import { useTaskQueue } from '@/hooks/useTaskQueue';
import { useAgentRealtime } from '@/hooks/useAgentRealtime';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Brain, Sparkles, Palette, Layers, Zap, Wand2, Database,
  GitBranch, TrendingUp, BarChart3, Coins, Workflow, Shield,
  Code2, Globe, Search, Cpu, HardDrive, Microscope,
  Play, Pause, Plus, Filter, LayoutGrid, Search as SearchIcon,
  X, ChevronRight, Activity, Timer,
  Bot, CircleDot,
  Circle, Hexagon,
  Radio, Wifi, ZapOff, Crown,
  Terminal, Server,
} from 'lucide-react';

import AntTrailEdge from '@/components/AntTrailEdge';
import HermesPanel from '@/components/HermesPanel';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

interface AgentDef {
  skill_key: string;
  display_name: string;
  category: string;
  description: string;
  icon: string;
}

type AgentStatus = 'active' | 'idle' | 'error' | 'paused';
type LayoutMode = 'radial' | 'force' | 'grid';

interface AgentState {
  skill_key: string;
  display_name?: string;
  category?: string;
  description?: string;
  icon?: string;
  status: AgentStatus;
  tasks: number;
  successRate: number;
  lastActive: string;
  config: Record<string, unknown>;
  activityLog: string[];
}

// ═══════════════════════════════════════════════════════════════
// MOCK DATA — AGENT REGISTRY
// ═══════════════════════════════════════════════════════════════

const AGENT_REGISTRY: AgentDef[] = [
  { skill_key: 'grok-orchestrator', display_name: 'Grok Orchestrator', category: 'core_orchestrator', description: 'Zentrale Steuerung aller Agenten. Hauptbrain des Schwarm-Bewusstseins.', icon: 'Brain' },
  { skill_key: 'divine-design-director', display_name: 'Divine Design Director', category: 'creative_studio', description: 'Creative Director für göttliches Webdesign. Orchestriert kompletten Workflow.', icon: 'Sparkles' },
  { skill_key: 'frontend-design', display_name: 'Frontend Design', category: 'creative_studio', description: 'Hochwertige Frontend-Interfaces für Brand Surfaces.', icon: 'Palette' },
  { skill_key: 'ui-ux-pro-max', display_name: 'UI/UX Pro Max', category: 'creative_studio', description: '50+ Styles, 161 Paletten, 57 Font-Paarungen für perfektes UI/UX.', icon: 'Layers' },
  { skill_key: 'motion-principles-master', display_name: 'Motion Principles', category: 'creative_studio', description: 'GSAP, Scroll-Animationen, Mikro-Interaktionen, Performance.', icon: 'Zap' },
  { skill_key: 'visual-effects-orchestrator', display_name: 'VFX Orchestrator', category: 'creative_studio', description: '3D/VFX/WebGL — Spline, WebGL-Shader, Lottie, Scroll-Sequenzen.', icon: 'Wand2' },
  { skill_key: 'creative-memory-system', display_name: 'Creative Memory', category: 'creative_studio', description: 'Persistenz von Design-Entscheidungen über Projekte hinweg.', icon: 'Database' },
  { skill_key: 'design-agency-workflow', display_name: 'Design Agency WF', category: 'creative_studio', description: 'Operativer Workflow: Brief → Discovery → Design → Build → Review.', icon: 'GitBranch' },
  { skill_key: 'project-loop-trading', display_name: 'Project Loop Trading', category: 'trading_capital', description: 'XAUUSD/Gold Signale mit Bollinger + RSI + MACD + ICT.', icon: 'TrendingUp' },
  { skill_key: 'multi-agent-trading', display_name: 'Multi-Agent Trading', category: 'trading_capital', description: 'Multi-Perspektiven-Analyse für Trading-Entscheidungen.', icon: 'BarChart3' },
  { skill_key: 'cash-orchestrator', display_name: 'Cash Orchestrator', category: 'trading_capital', description: 'Autonome Kapital-Allokation: Trading + DeFi für Robot-Body.', icon: 'Coins' },
  { skill_key: 'unified-agent-workflow', display_name: 'Unified Agent WF', category: 'agentic_dev', description: 'Master-Workflow: TDD, Debugging, Subagent-Implementation.', icon: 'Workflow' },
  { skill_key: 'ecc-v2', display_name: 'ECC v2', category: 'agentic_dev', description: '53+ Subagents, 185+ Skills, Security Scans, Multi-Agent.', icon: 'Shield' },
  { skill_key: 'superpowers-dev', display_name: 'Superpowers Dev', category: 'agentic_dev', description: 'Disziplinierte Software-Entwicklung mit TDD & Review.', icon: 'Code2' },
  { skill_key: 'browser-automation', display_name: 'Browser Automation', category: 'agentic_dev', description: 'Playwright-Automatisierung für Web-Tasks & Scraping.', icon: 'Globe' },
  { skill_key: 'browser-design-auditor', display_name: 'Design Auditor', category: 'agentic_dev', description: 'Visuelles QA: Screenshots, Responsive, Performance, A11y.', icon: 'Search' },
  { skill_key: 'loop-operations', display_name: 'Loop Operations', category: 'operations_memory', description: 'Zentrale Operations: Supabase Memory, Reporting, Tasks.', icon: 'Cpu' },
  { skill_key: 'persistent-memory', display_name: 'Persistent Memory', category: 'operations_memory', description: 'Langfristige Kontext-Kompression über Sessions.', icon: 'HardDrive' },
  { skill_key: 'deep-research', display_name: 'Deep Research', category: 'operations_memory', description: 'Multi-Agent Deep Research mit adaptivem Routing.', icon: 'Microscope' },
];

const INITIAL_SPAWNED_KEYS = [
  'divine-design-director',
  'project-loop-trading',
  'unified-agent-workflow',
  'loop-operations',
];

// ═══════════════════════════════════════════════════════════════
// ICON MAP
// ═══════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Brain, Sparkles, Palette, Layers, Zap, Wand2, Database,
  GitBranch, TrendingUp, BarChart3, Coins, Workflow, Shield,
  Code2, Globe, Search, Cpu, HardDrive, Microscope,
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY CONFIG
// ═══════════════════════════════════════════════════════════════

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  core_orchestrator: { label: 'Core', color: '#FF8C5A', bg: 'rgba(255,140,90,0.12)', border: 'rgba(255,140,90,0.3)' },
  creative_studio: { label: 'Creative', color: '#B98BFF', bg: 'rgba(185,139,255,0.12)', border: 'rgba(185,139,255,0.3)' },
  trading_capital: { label: 'Trading', color: '#36CFC9', bg: 'rgba(54,207,201,0.12)', border: 'rgba(54,207,201,0.3)' },
  agentic_dev: { label: 'Dev', color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.3)' },
  operations_memory: { label: 'Ops', color: '#FFD166', bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.3)' },
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateRadialPosition(index: number, total: number, radius: number = 350) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function calculateGridPosition(index: number, cols: number = 4, spacing: number = 250) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const offsetX = (cols * spacing) / 2;
  const offsetY = spacing;
  return {
    x: col * spacing - offsetX,
    y: row * spacing + offsetY,
  };
}

function generateMockAgentState(skillKey: string): AgentState {
  const statuses: AgentStatus[] = ['active', 'idle', 'active', 'active', 'paused'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  return {
    skill_key: skillKey,
    status,
    tasks: Math.floor(Math.random() * 200) + 10,
    successRate: 85 + Math.floor(Math.random() * 14),
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString('de-DE'),
    config: { autoRetry: true, maxConcurrent: 5, priority: 'normal' },
    activityLog: [
      `[${new Date().toLocaleTimeString('de-DE')}] Agent gestartet`,
      `[${new Date().toLocaleTimeString('de-DE')}] Aufgabe #${Math.floor(Math.random() * 100)} abgeschlossen`,
      `[${new Date().toLocaleTimeString('de-DE')}] Sync mit Hauptbrain`,
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
// SPARKLINE COMPONENT
// ═══════════════════════════════════════════════════════════════

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 40;
  const h = 16;
  const barW = w / values.length - 1;

  return (
    <svg width={w} height={h} className="opacity-80">
      {values.map((v, i) => {
        const barH = ((v - min) / range) * (h - 2) + 2;
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={h - barH}
            width={barW}
            height={barH}
            rx={1}
            fill={color}
            opacity={0.4 + (v - min) / range * 0.6}
          />
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATUS DOT
// ═══════════════════════════════════════════════════════════════

function StatusDot({ status }: { status: AgentStatus }) {
  const config = {
    active: { color: '#36CFC9', glow: 'rgba(54,207,201,0.5)', label: 'Aktiv' },
    idle: { color: '#FFD166', glow: 'rgba(255,209,102,0.5)', label: 'Idle' },
    error: { color: '#FF6B6B', glow: 'rgba(255,107,107,0.5)', label: 'Fehler' },
    paused: { color: '#5E626A', glow: 'rgba(94,98,106,0.5)', label: 'Pausiert' },
  };
  const c = config[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          backgroundColor: c.color,
          boxShadow: `0 0 6px ${c.glow}`,
          animation: status === 'active' ? 'pulseGlow 2s ease-in-out infinite' : 'none',
        }}
      />
      <span className="text-[10px]" style={{ color: c.color, fontFamily: '"IBM Plex Mono", monospace' }}>
        {c.label}
      </span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAINBRAIN NODE
// ═══════════════════════════════════════════════════════════════

interface MainBrainNodeData {
  label: string;
  totalAgents: number;
  totalTasks: number;
  uptime: number;
}

function MainBrainNode({ data, selected }: { data: MainBrainNodeData; selected?: boolean }) {
  return (
    <div
      className="relative"
      style={{
        width: 260,
        height: 120,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(255,140,90,0.15), rgba(185,139,255,0.1))',
        border: `2px solid ${selected ? '#FF8C5A' : 'rgba(255,140,90,0.4)'}`,
        boxShadow: selected
          ? '0 0 30px rgba(255,140,90,0.4), inset 0 0 20px rgba(255,140,90,0.05)'
          : '0 0 20px rgba(255,140,90,0.2), inset 0 0 15px rgba(255,140,90,0.03)',
        animation: 'mainBrainPulse 4s ease-in-out infinite',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="flex flex-col items-center justify-center h-full px-4 relative z-10">
        {/* Icon + Title */}
        <div className="flex items-center gap-2 mb-2">
          <Brain size={22} style={{ color: '#FF8C5A' }} />
          <span
            className="text-sm font-bold text-white tracking-wide"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            LOOP HAUPTBRAIN
          </span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-[11px]" style={{ color: '#A1A4AA', fontFamily: '"IBM Plex Mono", monospace' }}>
          <span style={{ color: '#FF8C5A' }}>{data.totalAgents} Agents</span>
          <span style={{ color: '#5E626A' }}>•</span>
          <span style={{ color: '#B98BFF' }}>{data.totalTasks} Tasks</span>
          <span style={{ color: '#5E626A' }}>•</span>
          <span style={{ color: '#36CFC9' }}>{data.uptime}%</span>
        </div>

        {/* Pulse indicator */}
        <div
          className="absolute top-2 right-3 flex items-center gap-1"
          style={{ animation: 'fadeInOut 2s ease-in-out infinite' }}
        >
          <Radio size={10} style={{ color: '#36CFC9' }} />
          <span className="text-[9px]" style={{ color: '#36CFC9', fontFamily: '"IBM Plex Mono", monospace' }}>
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// META AGENT NODE (Kimi) — v5.1
// ═══════════════════════════════════════════════════════════════

function MetaAgentNode({ data }: { data: AgentState }) {
  const isRunning = data.status === 'active';
  return (
    <div className="group relative" style={{ width: 240, cursor: 'pointer' }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{ background: 'linear-gradient(135deg, #F5C542, #FF8C5A)', color: '#000', fontWeight: 700 }}>K</div>
      </div>
      <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-all"
        style={{ background: 'linear-gradient(135deg, #F5C542, #FF8C5A, #B98BFF)', transform: 'scale(1.15)' }} />
      <div className="relative rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-[1.03]"
        style={{ background: 'linear-gradient(135deg, rgba(255,140,90,0.15), rgba(185,139,255,0.15))',
          border: isRunning ? '2px solid rgba(245,197,66,0.6)' : '2px solid rgba(255,140,90,0.3)', backdropFilter: 'blur(12px)' }}>
        {isRunning && <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ border: '2px solid rgba(245,197,66,0.4)' }} />}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF8C5A, #B98BFF)' }}>
              <Crown size={16} color="#000" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: '#F5C542' }}>{data.display_name}</div>
              <div className="text-[10px]" style={{ color: '#A1A4AA' }}>Meta Orchestrator</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: data.status === 'active' ? '#36CFC9' : data.status === 'idle' ? '#F5C542' : '#EF4444',
                boxShadow: `0 0 8px ${data.status === 'active' ? '#36CFC9' : data.status === 'idle' ? '#F5C542' : '#EF4444'}` }} />
          </div>
          <div className="text-xs mb-3 line-clamp-2" style={{ color: '#A1A4AA' }}>{data.description}</div>
          <div className="flex items-center gap-3 text-[10px]" style={{ color: '#5E626A' }}>
            <span>Tasks: <strong style={{ color: '#F5C542' }}>{data.tasks}</strong></span>
            <span>Rate: <strong style={{ color: '#36CFC9' }}>{data.successRate}%</strong></span>
          </div>
          <div className="flex items-end gap-0.5 h-4 mt-2 opacity-60">
            {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 7 ? '#F5C542' : '#5E626A' }} />
            ))}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AGENT NODE
// ═══════════════════════════════════════════════════════════════

interface AgentNodeData {
  skill_key: string;
  display_name: string;
  category: string;
  description: string;
  icon: string;
  status: AgentStatus;
  tasks: number;
  successRate: number;
  sparkline: number[];
}

function AgentNode({ data, selected }: { data: AgentNodeData; selected?: boolean }) {
  const catConfig = CATEGORY_CONFIG[data.category] || CATEGORY_CONFIG.operations_memory;
  const IconComp = ICON_MAP[data.icon] || Bot;
  const statusColors: Record<AgentStatus, string> = {
    active: '#36CFC9',
    idle: '#FFD166',
    error: '#FF6B6B',
    paused: '#5E626A',
  };

  return (
    <div
      className="relative group"
      style={{
        width: 200,
        height: 100,
        borderRadius: 12,
        backgroundColor: selected ? '#141518' : '#0C0D0F',
        border: `1.5px solid ${selected ? catConfig.color : 'rgba(255,255,255,0.08)'}`,
        boxShadow: selected
          ? `0 0 20px ${catConfig.bg}, 0 4px 12px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        backdropFilter: 'blur(16px)',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.borderColor = catConfig.color;
          e.currentTarget.style.boxShadow = `0 0 15px ${catConfig.bg}, 0 4px 12px rgba(0,0,0,0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        }
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div className="flex flex-col h-full p-3 relative z-10">
        {/* Top Row: Icon + Name */}
        <div className="flex items-center gap-2 min-w-0">
          <IconComp size={16} style={{ color: catConfig.color }} className="shrink-0" />
          <span
            className="text-[13px] font-semibold text-white truncate flex-1"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            title={data.display_name}
          >
            {data.display_name}
          </span>
          {/* Status dot */}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: statusColors[data.status],
              boxShadow: `0 0 4px ${statusColors[data.status]}`,
            }}
          />
        </div>

        {/* Category Badge */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: catConfig.bg,
              color: catConfig.color,
              border: `1px solid ${catConfig.border}`,
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            {catConfig.label}
          </span>
        </div>

        {/* Bottom Row: Metrics + Sparkline */}
        <div className="flex items-end justify-between mt-auto pt-1.5">
          <div className="text-[10px]" style={{ color: '#5E626A', fontFamily: '"IBM Plex Mono", monospace' }}>
            <span style={{ color: '#A1A4AA' }}>T:{data.tasks}</span>
            <span className="mx-1">|</span>
            <span style={{ color: data.successRate > 95 ? '#36CFC9' : '#FFD166' }}>{data.successRate}%</span>
          </div>
          <MiniSparkline values={data.sparkline} color={catConfig.color} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL PANEL
// ═══════════════════════════════════════════════════════════════

/**
 * DetailPanel — v5.1 Enhanced with Execution Controls
 * Shows agent details + prompt input + execution buttons
 */
function DetailPanel({
  agent,
  agentDef,
  onClose,
  onStatusChange,
  onExecute,
  isExecuting,
}: {
  agent: AgentState | null;
  agentDef: AgentDef | null;
  onClose: () => void;
  onStatusChange: (skillKey: string, status: AgentStatus) => void;
  onExecute: (agent: AgentState, prompt: string, backend: ExecutionBackend) => void;
  isExecuting: boolean;
}) {
  const [prompt, setPrompt] = useState('');

  if (!agent || !agentDef) return null;

  const isMetaAgent = agent.skill_key === 'kimi-meta';
  const catConfig = CATEGORY_CONFIG[agentDef.category] || CATEGORY_CONFIG.operations_memory;
  const IconComp = ICON_MAP[agentDef.icon] || Bot;
  const canExecute = prompt.trim().length > 0 && !isExecuting;

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="fixed right-0 top-0 h-full w-[420px] z-30 flex flex-col border-l"
      style={{
        backgroundColor: 'rgba(12,13,15,0.95)',
        backdropFilter: 'blur(24px)',
        borderColor: 'rgba(255,255,255,0.06)',
        marginTop: 0,
      }}
    >
      {/* Header */}
      <div
        className="h-14 flex items-center justify-between px-5 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: '#A1A4AA' }}>
            {isMetaAgent ? 'Kimi Meta Agent' : 'Agent Details'}
          </span>
          {isMetaAgent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded animate-pulse"
              style={{ background: 'rgba(245,197,66,0.2)', color: '#F5C542', fontFamily: '"IBM Plex Mono", monospace' }}>
              META
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: '#5E626A' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#141518';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#5E626A';
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Agent Header */}
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isMetaAgent
                ? 'linear-gradient(135deg, #F5C542, #FF8C5A)'
                : catConfig.bg,
              border: `1px solid ${isMetaAgent ? 'rgba(245,197,66,0.5)' : catConfig.border}`,
            }}
          >
            {isMetaAgent ? <Crown size={24} color="#000" /> : <IconComp size={24} style={{ color: catConfig.color }} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold truncate" style={{
              color: isMetaAgent ? '#F5C542' : '#FFFFFF',
              fontFamily: '"Space Grotesk", sans-serif',
            }}>
              {agentDef.display_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: isMetaAgent ? 'rgba(245,197,66,0.15)' : catConfig.bg,
                  color: isMetaAgent ? '#F5C542' : catConfig.color,
                  border: `1px solid ${isMetaAgent ? 'rgba(245,197,66,0.3)' : catConfig.border}`,
                  fontFamily: '"IBM Plex Mono", monospace',
                }}
              >
                {isMetaAgent ? 'Meta Orchestrator' : catConfig.label}
              </span>
              <StatusDot status={agent.status} />
              {isExecuting && (
                <span className="text-[9px] px-1.5 py-0.5 rounded animate-pulse"
                  style={{ background: 'rgba(255,140,90,0.2)', color: '#FF8C5A' }}>
                  RUNNING
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-medium mb-1.5 block" style={{ color: '#5E626A' }}>
            Beschreibung
          </label>
          <p className="text-[13px] leading-relaxed" style={{ color: '#A1A4AA' }}>
            {agentDef.description}
          </p>
        </div>

        {/* ═══ v5.1: PROMPT INPUT + EXECUTION ═══ */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-medium mb-1.5 block" style={{ color: '#5E626A' }}>
            Aufgabe / Prompt
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isMetaAgent
                ? 'Gib eine komplexe Aufgabe ein, die Kimi delegiert...'
                : 'Gib eine Aufgabe fuer diesen Agent ein...'}
              className="w-full h-24 rounded-xl p-3 pr-10 text-[12px] resize-none focus:outline-none focus:ring-1 focus:ring-[#FF8C5A]"
              style={{
                backgroundColor: '#141518',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#FFFFFF',
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            />
            <button
              onClick={() => setPrompt('')}
              className="absolute top-2 right-2 p-1 rounded"
              style={{ color: '#5E626A' }}
            >
              <X size={12} />
            </button>
          </div>

          {/* Execution Buttons */}
          <div className="mt-3 space-y-2">
            {/* Kimi Meta Button (always shown, highlighted for meta agent) */}
            <button
              onClick={() => {
                if (canExecute) onExecute(agent, prompt, 'kimi_meta');
              }}
              disabled={!canExecute}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, rgba(245,197,66,0.2), rgba(255,140,90,0.2))',
                color: '#F5C542',
                border: '1px solid rgba(245,197,66,0.4)',
              }}
              onMouseEnter={(e) => {
                if (canExecute) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,197,66,0.3), rgba(255,140,90,0.3))';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,197,66,0.2), rgba(255,140,90,0.2))';
              }}
            >
              <Crown size={14} />
              {isExecuting ? 'Wird ausgefuehrt...' : 'Mit Kimi (Meta Agent) ausfuehren'}
            </button>

            {/* Simulation Button */}
            <button
              onClick={() => {
                if (canExecute) onExecute(agent, prompt, 'simulation');
              }}
              disabled={!canExecute}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'rgba(54,207,201,0.1)',
                color: '#36CFC9',
                border: '1px solid rgba(54,207,201,0.25)',
              }}
              onMouseEnter={(e) => {
                if (canExecute) e.currentTarget.style.backgroundColor = 'rgba(54,207,201,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(54,207,201,0.1)';
              }}
            >
              <Terminal size={14} />
              Simulation (Lokal)
            </button>

            {/* Hermes Button (placeholder for v5.2) */}
            <button
              disabled={true}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'rgba(185,139,255,0.08)',
                color: '#B98BFF',
                border: '1px solid rgba(185,139,255,0.15)',
              }}
              title="Verfuegbar in v5.2 — Hermes/OpenClaw Integration"
            >
              <Server size={14} />
              Hermes/OpenClaw + Qwen (v5.2)
            </button>
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-medium mb-1.5 block" style={{ color: '#5E626A' }}>
            Status
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['active', 'idle', 'paused', 'error'] as AgentStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(agent.skill_key, s)}
                className="px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all capitalize"
                style={{
                  backgroundColor: agent.status === s ? (isMetaAgent ? 'rgba(245,197,66,0.2)' : catConfig.bg) : '#1B1D20',
                  color: agent.status === s ? (isMetaAgent ? '#F5C542' : catConfig.color) : '#5E626A',
                  border: `1px solid ${agent.status === s ? (isMetaAgent ? 'rgba(245,197,66,0.4)' : catConfig.border) : 'rgba(255,255,255,0.06)'}`,
                  fontFamily: '"IBM Plex Mono", monospace',
                }}
              >
                {s === 'active' ? 'Aktiv' : s === 'idle' ? 'Idle' : s === 'paused' ? 'Pause' : 'Fehler'}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Cards */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-medium mb-2 block" style={{ color: '#5E626A' }}>
            Metriken
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Tasks', value: agent.tasks, color: isMetaAgent ? '#F5C542' : '#FF8C5A' },
              { label: 'Success', value: `${agent.successRate}%`, color: '#36CFC9' },
              { label: 'Letzte', value: agent.lastActive, color: '#B98BFF', isTime: true },
            ].map((m) => (
              <div key={m.label}
                className="p-3 rounded-xl"
                style={{ backgroundColor: '#141518', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-[10px] mb-1" style={{ color: '#5E626A' }}>{m.label}</div>
                <div className={m.isTime ? 'text-[11px] font-semibold mt-1.5' : 'text-lg font-bold'}
                  style={{ color: m.color, fontFamily: m.isTime ? '"IBM Plex Mono", monospace' : '"Space Grotesk", sans-serif' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-medium mb-2 block" style={{ color: '#5E626A' }}>
            Aktivitätslog
          </label>
          <div
            className="rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto"
            style={{ backgroundColor: '#141518', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {agent.activityLog.length === 0 ? (
              <span className="text-[11px]" style={{ color: '#5E626A' }}>Keine Aktivitaeten</span>
            ) : (
              agent.activityLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color: isMetaAgent ? '#F5C542' : catConfig.color }} />
                  <span className="text-[11px]" style={{ color: '#A1A4AA', fontFamily: '"IBM Plex Mono", monospace' }}>
                    {entry}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Config Editor */}
        <div>
          <label className="text-[10px] uppercase tracking-wider font-medium mb-2 block" style={{ color: '#5E626A' }}>
            Konfiguration
          </label>
          <textarea
            className="w-full h-24 rounded-xl p-3 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-[#FF8C5A]"
            style={{
              backgroundColor: '#141518',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#A1A4AA',
              fontFamily: '"IBM Plex Mono", monospace',
            }}
            defaultValue={JSON.stringify(agent.config, null, 2)}
            readOnly
          />
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPAWN MODAL
// ═══════════════════════════════════════════════════════════════

function SpawnModal({
  open,
  onClose,
  onSpawn,
  spawnedKeys,
}: {
  open: boolean;
  onClose: () => void;
  onSpawn: (agent: AgentDef) => void;
  spawnedKeys: string[];
}) {
  if (!open) return null;

  const [filterCat, setFilterCat] = useState<string>('all');
  const [search, setSearch] = useState('');

  const categories = ['all', ...new Set(AGENT_REGISTRY.map((a) => a.category))];

  const filtered = AGENT_REGISTRY.filter((a) => {
    if (a.category === 'core_orchestrator') return false; // can't spawn mainbrain
    if (spawnedKeys.includes(a.skill_key)) return false;
    if (filterCat !== 'all' && a.category !== filterCat) return false;
    if (search && !a.display_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[560px] max-h-[600px] rounded-2xl flex flex-col overflow-hidden"
            style={{
              backgroundColor: '#0C0D0F',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="h-14 flex items-center justify-between px-5 border-b shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <Plus size={18} style={{ color: '#FF8C5A' }} />
                <span className="text-sm font-bold text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Agent spawnen
                </span>
                <span className="text-[11px] ml-1" style={{ color: '#5E626A' }}>
                  ({filtered.length} verfügbar)
                </span>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: '#5E626A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#141518';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#5E626A';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search + Filter */}
            <div className="p-4 space-y-3">
              <div
                className="flex items-center gap-2 h-9 px-3 rounded-lg"
                style={{ backgroundColor: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <SearchIcon size={14} style={{ color: '#5E626A' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Agent suchen..."
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-[#5E626A] focus:outline-none"
                  style={{ fontFamily: '"DM Sans", sans-serif' }}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all"
                    style={{
                      backgroundColor: filterCat === cat ? 'rgba(255,140,90,0.15)' : '#1B1D20',
                      color: filterCat === cat ? '#FF8C5A' : '#5E626A',
                      border: `1px solid ${filterCat === cat ? 'rgba(255,140,90,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      fontFamily: '"IBM Plex Mono", monospace',
                    }}
                  >
                    {cat === 'all' ? 'Alle' : CATEGORY_CONFIG[cat]?.label || cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {filtered.map((agent) => {
                const catCfg = CATEGORY_CONFIG[agent.category] || CATEGORY_CONFIG.operations_memory;
                const AIcon = ICON_MAP[agent.icon] || Bot;
                return (
                  <button
                    key={agent.skill_key}
                    onClick={() => {
                      onSpawn(agent);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group"
                    style={{
                      backgroundColor: '#141518',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1B1D20';
                      e.currentTarget.style.borderColor = catCfg.border;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#141518';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                    }}
                  >
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: catCfg.bg, border: `1px solid ${catCfg.border}` }}
                    >
                      <AIcon size={16} style={{ color: catCfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-white truncate">
                        {agent.display_name}
                      </div>
                      <div className="text-[11px] mt-0.5 truncate" style={{ color: '#5E626A' }}>
                        {agent.description}
                      </div>
                    </div>
                    <Plus
                      size={14}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: catCfg.color }}
                    />
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-[13px]" style={{ color: '#5E626A' }}>
                  Keine Agenten verfügbar
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════════════

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl flex items-center gap-2"
      style={{
        backgroundColor: 'rgba(12,13,15,0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(54,207,201,0.3)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <Activity size={14} style={{ color: '#36CFC9' }} />
      <span className="text-[12px]" style={{ color: '#A1A4AA' }}>{message}</span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

const nodeTypes = {
  mainbrain: MainBrainNode,
  agent: AgentNode,
  metaAgent: MetaAgentNode,
};

const edgeTypes = {
  anttrail: AntTrailEdge,
};

export default function Agenten() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  // v5.1: Execution Layer Hooks
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const { isExecuting, currentTask, history, executeTask } = useExecutionRouter();
  const taskQueue = useTaskQueue();
  void taskQueue; // Used for realtime subscriptions — will be fully wired in v5.2

  // v5.1: Realtime agent status updates
  useAgentRealtime((skillKey, realtimeState) => {
    setAgentStates((prev) => {
      const existing = prev[skillKey];
      if (!existing) return prev;
      return {
        ...prev,
        [skillKey]: {
          ...existing,
          status: realtimeState.status as AgentStatus,
          tasks: realtimeState.tasks,
          successRate: realtimeState.successRate,
          lastActive: new Date(realtimeState.lastActive).toLocaleTimeString('de-DE'),
        },
      };
    });
  });

  /**
   * Execute task from Detail Panel — v5.1
   */
  const handleAgentExecute = useCallback(async (
    agent: AgentState,
    prompt: string,
    backend: ExecutionBackend
  ) => {
    setTaskPanelOpen(true);

    // Update agent status to active
    setAgentStates((prev) => ({
      ...prev,
      [agent.skill_key]: {
        ...prev[agent.skill_key],
        status: 'active' as AgentStatus,
        activityLog: [
          `[${new Date().toLocaleTimeString('de-DE')}] Task gestartet [${backend}]`,
          ...prev[agent.skill_key].activityLog,
        ].slice(0, 20),
      },
    }));

    const title = `Task: ${agent.display_name || agent.skill_key}`;
    const completedTask = await executeTask(agent.skill_key, title, prompt, backend);

    // Update agent status based on result
    setAgentStates((prev) => ({
      ...prev,
      [agent.skill_key]: {
        ...prev[agent.skill_key],
        status: completedTask.status === 'completed' ? 'idle' : completedTask.status === 'failed' ? 'error' : 'idle',
        tasks: prev[agent.skill_key].tasks + (completedTask.status === 'completed' ? 1 : 0),
        successRate: completedTask.status === 'completed'
          ? Math.min(99, prev[agent.skill_key].successRate + 1)
          : prev[agent.skill_key].successRate,
        lastActive: new Date().toLocaleTimeString('de-DE'),
        activityLog: [
          `[${new Date().toLocaleTimeString('de-DE')}] Task ${completedTask.status}: ${completedTask.title}`,
          ...prev[agent.skill_key].activityLog,
        ].slice(0, 20),
      },
    }));
  }, [executeTask]);

  const runTask = useCallback(async (agentSkillKey: string, title: string, prompt: string, backend: 'kimi_meta' | 'hermes_openclaw' | 'simulation' = 'simulation') => {
    setTaskPanelOpen(true);
    await executeTask(agentSkillKey, title, prompt, backend);
  }, [executeTask]);

  const metaAgent: AgentState = useMemo(() => ({
    skill_key: 'kimi-meta',
    display_name: 'Kimi Meta Agent',
    category: 'core_orchestrator',
    description: 'Leistungsstaerkster Meta-Agent. Versteht High-Level-Aufgaben und delegiert an Specialist Agents.',
    icon: 'Crown',
    status: isExecuting ? 'active' : 'idle',
    tasks: history.length,
    successRate: 97,
    lastActive: currentTask?.title || 'Bereit',
    config: { mode: 'meta', delegationDepth: 3, autoScale: true },
    activityLog: isExecuting ? [`[${new Date().toLocaleTimeString('de-DE')}] Task ausfuehrend: ${currentTask?.title || ''}`] : [],
  }), [history.length, currentTask, isExecuting]);



  const [layoutMode, setLayoutMode] = useState<LayoutMode>('radial');
  const [spawnModalOpen, setSpawnModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<string[]>([]);
  const [spawnedKeys, setSpawnedKeys] = useState<string[]>(['grok-orchestrator', ...INITIAL_SPAWNED_KEYS]);
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>(() => {
    const states: Record<string, AgentState> = {};
    AGENT_REGISTRY.forEach((a) => {
      if (INITIAL_SPAWNED_KEYS.includes(a.skill_key) || a.skill_key === 'grok-orchestrator') {
        states[a.skill_key] = generateMockAgentState(a.skill_key);
      }
    });
    return states;
  });
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // BUILD NODES FROM SPAWNED KEYS
  // ═══════════════════════════════════════════════════════════════

  const buildNodes = useCallback((keys: string[], layout: LayoutMode) => {
    const newNodes: Node[] = [];
    const spawnedAgents = AGENT_REGISTRY.filter((a) => keys.includes(a.skill_key));

    // MainBrain
    const mainBrainDef = AGENT_REGISTRY.find((a) => a.skill_key === 'grok-orchestrator');
    if (mainBrainDef && keys.includes('grok-orchestrator')) {
      const mbState = agentStates['grok-orchestrator'];
      newNodes.push({
        id: 'mainbrain',
        type: 'mainbrain',
        position: { x: -130, y: -60 },
        data: {
          label: 'LOOP HAUPTBRAIN',
          totalAgents: keys.length - 1,
          totalTasks: mbState?.tasks || 142,
          uptime: mbState?.successRate || 97,
        },
      });
    }

    // Meta Agent Node (Kimi) — v5.1
    newNodes.push({
      id: 'kimi-meta',
      type: 'metaAgent',
      position: { x: -130, y: -260 },
      data: { ...metaAgent, executeTask: runTask } as unknown as Record<string, unknown>,
    });

    // Agent nodes
    const agentDefs = spawnedAgents.filter((a) => a.category !== 'core_orchestrator');
    agentDefs.forEach((def, idx) => {
      const state = agentStates[def.skill_key];
      const total = agentDefs.length;
      let pos;
      if (layout === 'radial') {
        pos = calculateRadialPosition(idx, total, 320);
      } else if (layout === 'grid') {
        pos = calculateGridPosition(idx, 4, 240);
      } else {
        // force-ish: spread randomly but deterministic
        const seed = idx * 137.508;
        pos = {
          x: Math.cos(seed) * 200 + (idx % 3) * 150 - 150,
          y: Math.sin(seed) * 200 + Math.floor(idx / 3) * 150 - 100,
        };
      }

      // Search filter: dim non-matching
      const matchesSearch = !searchQuery || def.display_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = catFilter === 'all' || def.category === catFilter;
      const matchesStatus = statusFilter === 'all' || state?.status === statusFilter;
      const dimmed = !matchesSearch || !matchesCat || !matchesStatus;

      newNodes.push({
        id: def.skill_key,
        type: 'agent',
        position: pos,
        data: {
          skill_key: def.skill_key,
          display_name: def.display_name,
          category: def.category,
          description: def.description,
          icon: def.icon,
          status: state?.status || 'idle',
          tasks: state?.tasks || 0,
          successRate: state?.successRate || 0,
          sparkline: Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)),
        },
        style: {
          opacity: dimmed ? 0.25 : 1,
          transition: 'opacity 0.3s ease',
        },
      });
    });

    return newNodes;
  }, [agentStates, searchQuery, catFilter, statusFilter, metaAgent]);

  // Build edges
  const buildEdges = useCallback((keys: string[]) => {
    const newEdges: Edge[] = [];

    // Meta Agent → MainBrain (golden command edge)
    newEdges.push({
      id: 'edge-meta-mainbrain',
      source: 'kimi-meta',
      target: 'mainbrain',
      type: 'anttrail',
      data: {
        strength: 0.9,
        activity: isExecuting ? 'high' : 'medium',
        animated: simulationActive,
        color: '#F5C542',
      },
      style: { opacity: 0.9, transition: 'opacity 0.3s ease' },
    });

    keys.forEach((key) => {
      if (key === 'grok-orchestrator') return;
      const state = agentStates[key];
      newEdges.push({
        id: `edge-${key}`,
        source: 'mainbrain',
        target: key,
        type: 'anttrail',
        data: {
          strength: (state?.successRate || 50) / 100,
          activity: state?.status === 'active' ? 'high' : state?.status === 'idle' ? 'medium' : 'low',
          animated: simulationActive,
        },
        style: {
          opacity: 0.8,
          transition: 'opacity 0.3s ease',
        },
      });
    });
    return newEdges;
  }, [agentStates, simulationActive, isExecuting]);

  // Rebuild nodes/edges when dependencies change
  useEffect(() => {
    const newNodes = buildNodes(spawnedKeys, layoutMode);
    const newEdges = buildEdges(spawnedKeys);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [spawnedKeys, layoutMode, agentStates, searchQuery, catFilter, statusFilter, simulationActive, buildNodes, buildEdges, setNodes, setEdges]);

  // ═══════════════════════════════════════════════════════════════
  // CONNECTIONS
  // ═══════════════════════════════════════════════════════════════

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((prevEdges: Edge[]) =>
        addEdge(
          {
            ...params,
            type: 'anttrail',
            data: { strength: 0.5, activity: 'medium', animated: simulationActive },
          },
          prevEdges,
        ) as Edge[],
      );
    },
    [setEdges, simulationActive],
  );

  // ═══════════════════════════════════════════════════════════════
  // NODE CLICK
  // ═══════════════════════════════════════════════════════════════

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id === 'mainbrain') {
      setSelectedAgent(null);
      return;
    }
    setSelectedAgent(node.id);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // SPAWN AGENT
  // ═══════════════════════════════════════════════════════════════

  const handleSpawn = useCallback((agentDef: AgentDef) => {
    setSpawnedKeys((prev) => [...prev, agentDef.skill_key]);
    setAgentStates((prev) => ({
      ...prev,
      [agentDef.skill_key]: generateMockAgentState(agentDef.skill_key),
    }));
    addToast(`Agent "${agentDef.display_name}" gespawnt`);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // STATUS CHANGE
  // ═══════════════════════════════════════════════════════════════

  const handleStatusChange = useCallback((skillKey: string, status: AgentStatus) => {
    setAgentStates((prev) => {
      const current = prev[skillKey];
      if (!current) return prev;
      return {
        ...prev,
        [skillKey]: { ...current, status },
      };
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // TOAST HELPERS
  // ═══════════════════════════════════════════════════════════════

  const addToast = useCallback((msg: string) => {
    setToasts((prev) => [...prev, msg]);
  }, []);

  const removeToast = useCallback((idx: number) => {
    setToasts((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // SIMULATION
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!simulationActive) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      return;
    }

    simIntervalRef.current = setInterval(() => {
      setAgentStates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const state = next[key];
          if (!state || state.status === 'paused') return;

          // Random status flip
          if (Math.random() < 0.05) {
            const statuses: AgentStatus[] = ['active', 'idle', 'active', 'active'];
            state.status = statuses[Math.floor(Math.random() * statuses.length)];
          }

          // Increment tasks
          if (state.status === 'active' && Math.random() < 0.3) {
            state.tasks += 1;
            state.lastActive = new Date().toLocaleTimeString('de-DE');
          }

          // Adjust success rate slightly
          state.successRate = Math.max(80, Math.min(99, state.successRate + (Math.random() - 0.5) * 2));

          // Add log entry occasionally
          if (Math.random() < 0.1) {
            state.activityLog = [
              `[${new Date().toLocaleTimeString('de-DE')}] Aufgabe #${state.tasks} abgeschlossen`,
              ...state.activityLog.slice(0, 9),
            ];
          }
        });
        return next;
      });

      // Random toast
      if (Math.random() < 0.15) {
        const activeAgents = AGENT_REGISTRY.filter(
          (a) => spawnedKeys.includes(a.skill_key) && a.category !== 'core_orchestrator',
        );
        if (activeAgents.length > 0) {
          const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
          addToast(`${agent.display_name} hat Aufgabe #${Math.floor(Math.random() * 200)} abgeschlossen`);
        }
      }
    }, 3000);

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [simulationActive, spawnedKeys, addToast]);

  // ═══════════════════════════════════════════════════════════════
  // DERIVED STATE
  // ═══════════════════════════════════════════════════════════════

  const statusCounts = useMemo(() => {
    const counts = { active: 0, idle: 0, error: 0, paused: 0 };
    Object.values(agentStates).forEach((s) => {
      if (s) counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, [agentStates]);

  const selectedAgentDef = useMemo(
    () => AGENT_REGISTRY.find((a) => a.skill_key === selectedAgent) || null,
    [selectedAgent],
  );
  const selectedAgentState = useMemo(
    () => (selectedAgent ? agentStates[selectedAgent] || null : null),
    [selectedAgent, agentStates],
  );

  const totalAgents = spawnedKeys.length - 1; // minus mainbrain
  const lastSync = new Date().toLocaleTimeString('de-DE');

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-[calc(100dvh-88px)] -m-6 -mt-[88px] p-0 relative" style={{ marginLeft: '-32px', marginRight: '-32px' }}>
      {/* ═══ TOOLBAR ═══ */}
      <div
        className="h-14 flex items-center gap-3 px-4 border-b shrink-0 z-20"
        style={{
          backgroundColor: 'rgba(12,13,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {/* Search */}
        <div
          className="flex items-center gap-2 h-8 px-3 rounded-lg w-52"
          style={{ backgroundColor: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SearchIcon size={13} style={{ color: '#5E626A' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Agent suchen..."
            className="flex-1 bg-transparent text-[12px] text-white placeholder:text-[#5E626A] focus:outline-none"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="h-8 pl-3 pr-7 rounded-lg text-[11px] appearance-none cursor-pointer focus:outline-none"
            style={{
              backgroundColor: '#1B1D20',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#A1A4AA',
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            <option value="all">Alle Kategorien</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <Filter size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5E626A' }} />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 pl-3 pr-7 rounded-lg text-[11px] appearance-none cursor-pointer focus:outline-none"
            style={{
              backgroundColor: '#1B1D20',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#A1A4AA',
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            <option value="all">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="idle">Idle</option>
            <option value="paused">Pausiert</option>
            <option value="error">Fehler</option>
          </select>
          <CircleDot size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5E626A' }} />
        </div>

        <div className="w-px h-5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

        {/* Layout Buttons */}
        <div className="flex items-center gap-1">
          {([
            { mode: 'radial' as LayoutMode, icon: Circle, label: 'Radial' },
            { mode: 'force' as LayoutMode, icon: Hexagon, label: 'Force' },
            { mode: 'grid' as LayoutMode, icon: LayoutGrid, label: 'Grid' },
          ]).map(({ mode, icon: LIcon, label }) => (
            <button
              key={mode}
              onClick={() => setLayoutMode(mode)}
              title={label}
              className="h-8 w-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                backgroundColor: layoutMode === mode ? 'rgba(255,140,90,0.15)' : 'transparent',
                color: layoutMode === mode ? '#FF8C5A' : '#5E626A',
                border: `1px solid ${layoutMode === mode ? 'rgba(255,140,90,0.3)' : 'transparent'}`,
              }}
              onMouseEnter={(e) => {
                if (layoutMode !== mode) {
                  e.currentTarget.style.backgroundColor = '#1B1D20';
                  e.currentTarget.style.color = '#A1A4AA';
                }
              }}
              onMouseLeave={(e) => {
                if (layoutMode !== mode) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#5E626A';
                }
              }}
            >
              <LIcon size={14} />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Spawn Button */}
        <button
          onClick={() => setSpawnModalOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium transition-all"
          style={{
            backgroundColor: 'rgba(255,140,90,0.15)',
            color: '#FF8C5A',
            border: '1px solid rgba(255,140,90,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,140,90,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,140,90,0.15)';
          }}
        >
          <Plus size={13} />
          Spawn
        </button>

        {/* Simulation Toggle */}
        <button
          onClick={() => setSimulationActive(!simulationActive)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium transition-all"
          style={{
            backgroundColor: simulationActive ? 'rgba(54,207,201,0.15)' : '#1B1D20',
            color: simulationActive ? '#36CFC9' : '#5E626A',
            border: `1px solid ${simulationActive ? 'rgba(54,207,201,0.3)' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: simulationActive ? '0 0 12px rgba(54,207,201,0.2)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (!simulationActive) {
              e.currentTarget.style.backgroundColor = '#141518';
              e.currentTarget.style.color = '#A1A4AA';
            }
          }}
          onMouseLeave={(e) => {
            if (!simulationActive) {
              e.currentTarget.style.backgroundColor = '#1B1D20';
              e.currentTarget.style.color = '#5E626A';
            }
          }}
        >
          {simulationActive ? <Pause size={13} /> : <Play size={13} />}
          {simulationActive ? 'Pause' : 'Sim'}
        </button>

        {/* v5.1: Quick Task Execution */}
        <button
          onClick={() => runTask('kimi-meta', 'Meta-Analyse: System-Check', 'Fuehre einen vollstaendigen System-Check durch: Analysiere alle aktiven Agents, pruefe deren Status, und erstelle einen Zustandsbericht.', 'simulation')}
          disabled={isExecuting}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
          style={{
            backgroundColor: isExecuting ? 'rgba(245,197,66,0.08)' : 'rgba(245,197,66,0.15)',
            color: '#F5C542',
            border: '1px solid rgba(245,197,66,0.3)',
          }}
          onMouseEnter={(e) => { if (!isExecuting) e.currentTarget.style.backgroundColor = 'rgba(245,197,66,0.25)'; }}
          onMouseLeave={(e) => { if (!isExecuting) e.currentTarget.style.backgroundColor = 'rgba(245,197,66,0.15)'; }}
        >
          <Zap size={13} />
          {isExecuting ? 'Running...' : 'Run Task'}
        </button>
      </div>

      {/* ═══ REACT FLOW CANVAS ═══ */}
      <div className="flex-1 relative" style={{ backgroundColor: '#000000' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.5}
          defaultEdgeOptions={{
            type: 'anttrail',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#5E626A' },
          }}
          proOptions={{ hideAttribution: true }}
          style={{ backgroundColor: '#000000' }}
        >
          <Background
            gap={24}
            size={1}
            color="rgba(255,255,255,0.03)"
            style={{ backgroundColor: '#000000' }}
          />
          <Controls
            style={{
              backgroundColor: '#0C0D0F',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
            }}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.id === 'mainbrain') return '#FF8C5A';
              const cat = ((node.data as unknown) as AgentNodeData)?.category;
              return CATEGORY_CONFIG[cat]?.color || '#5E626A';
            }}
            maskColor="rgba(0,0,0,0.7)"
            style={{
              backgroundColor: '#0C0D0F',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
            }}
            className="!bottom-12 !right-4"
          />
        </ReactFlow>

        {/* Detail Panel overlay */}
        <AnimatePresence>
          {selectedAgent && selectedAgentDef && selectedAgentState && (
            <DetailPanel
              agent={selectedAgentState}
              agentDef={selectedAgentDef}
              onClose={() => setSelectedAgent(null)}
              onStatusChange={handleStatusChange}
              onExecute={handleAgentExecute}
              isExecuting={isExecuting}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div
        className="h-8 flex items-center gap-4 px-4 border-t shrink-0 z-20"
        style={{
          backgroundColor: 'rgba(12,13,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <Bot size={11} style={{ color: '#FF8C5A' }} />
          <span className="text-[11px] font-medium" style={{ color: '#A1A4AA', fontFamily: '"IBM Plex Mono", monospace' }}>
            <span style={{ color: '#FFFFFF' }}>{totalAgents}</span> Agents
          </span>
        </div>
        <div className="w-px h-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#36CFC9', boxShadow: '0 0 4px rgba(54,207,201,0.5)' }} />
          <span className="text-[11px]" style={{ color: '#36CFC9', fontFamily: '"IBM Plex Mono", monospace' }}>
            {statusCounts.active} Aktiv
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#FFD166' }} />
          <span className="text-[11px]" style={{ color: '#FFD166', fontFamily: '"IBM Plex Mono", monospace' }}>
            {statusCounts.idle} Idle
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#FF6B6B' }} />
          <span className="text-[11px]" style={{ color: '#FF6B6B', fontFamily: '"IBM Plex Mono", monospace' }}>
            {statusCounts.error} Fehler
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {simulationActive ? (
            <>
              <Wifi size={11} style={{ color: '#36CFC9', animation: 'pulseGlow 1.5s ease-in-out infinite' }} />
              <span className="text-[11px]" style={{ color: '#36CFC9', fontFamily: '"IBM Plex Mono", monospace' }}>
                Simulation: AN
              </span>
            </>
          ) : (
            <>
              <ZapOff size={11} style={{ color: '#5E626A' }} />
              <span className="text-[11px]" style={{ color: '#5E626A', fontFamily: '"IBM Plex Mono", monospace' }}>
                Simulation: AUS
              </span>
            </>
          )}
        </div>
        <div className="w-px h-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div className="flex items-center gap-1.5">
          <Timer size={11} style={{ color: '#5E626A' }} />
          <span className="text-[10px]" style={{ color: '#5E626A', fontFamily: '"IBM Plex Mono", monospace' }}>
            Sync: {lastSync}
          </span>
        </div>
      </div>

      {/* ═══ SPAWN MODAL ═══ */}
      <SpawnModal
        open={spawnModalOpen}
        onClose={() => setSpawnModalOpen(false)}
        onSpawn={handleSpawn}
        spawnedKeys={spawnedKeys}
      />


      {/* ═══ v5.1: FLOATING TASK PANEL ═══ */}
      <AnimatePresence>
        {taskPanelOpen && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50" style={{ width: 480 }}>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12, 13, 15, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Activity size={14} style={{ color: '#FF8C5A' }} />
                  <span className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>Task Monitor</span>
                  {isExecuting && <span className="text-[10px] px-1.5 py-0.5 rounded animate-pulse" style={{ background: 'rgba(255,140,90,0.2)', color: '#FF8C5A' }}>LIVE</span>}
                </div>
                <button onClick={() => setTaskPanelOpen(false)} style={{ color: '#5E626A' }}><X size={14} /></button>
              </div>
              <div className="p-3 max-h-48 overflow-y-auto space-y-2">
                {currentTask && (
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(255,140,90,0.08)', border: '1px solid rgba(255,140,90,0.2)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium" style={{ color: '#FF8C5A' }}>{currentTask.title}</span>
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: '#A1A4AA' }}>Backend: {currentTask.backend} | Status: {currentTask.status}</div>
                  </div>
                )}
                {history.slice(0, 5).map((task: ExecutionTask) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#1B1D20' }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.status==='completed'?'#36CFC9':task.status==='failed'?'#EF4444':'#F5C542' }} />
                    <span className="text-xs flex-1 truncate" style={{ color: '#A1A4AA' }}>{task.title}</span>
                    {task.duration && <span className="text-[10px]" style={{ color: '#5E626A' }}>{(task.duration/1000).toFixed(1)}s</span>}
                  </div>
                ))}
                {history.length === 0 && !currentTask && (
                  <div className="text-center py-4 text-xs" style={{ color: '#5E626A' }}>Keine Tasks ausgefuehrt.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HERMES BRAIN PANEL — v5.1+ ═══ */}
      <div className="fixed right-[420px] top-16 bottom-8 w-[300px] z-40 rounded-2xl overflow-hidden hidden xl:flex flex-col"
        style={{
          backgroundColor: 'rgba(12,13,15,0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
        <HermesPanel />
      </div>

      {/* ═══ TOASTS ═══ */}
      <AnimatePresence>
        {toasts.map((msg, i) => (
          <Toast key={`${msg}-${i}`} message={msg} onClose={() => removeToast(i)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
