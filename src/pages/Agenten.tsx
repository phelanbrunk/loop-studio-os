import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type ConnectionMode,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Palette,
  Code2,
  Search,
  Rocket,
  Bot,
  X,
  ChevronRight,
  Play,
  Pause,
  Square,
  Zap,
  Settings,
  Activity,
  ListTodo,
  Terminal,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  Filter,
  LayoutGrid,
  Wifi,
  WifiOff,
  Crown,
  Cpu,
  BarChart3,
  Loader2,
  Circle,
  GripHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────

interface LoopAgent {
  id: string;
  name: string;
  agent_type: 'brain' | 'meta' | 'trader' | 'designer' | 'developer' | 'researcher' | 'deploy' | 'worker';
  status: 'idle' | 'running' | 'paused' | 'error' | 'offline';
  description: string;
  config: Record<string, unknown>;
  avatar_url?: string;
  skills: string[];
  parent_agent_id?: string;
  tier_required: number;
  max_concurrent_tasks: number;
  created_at?: string;
  updated_at?: string;
}

interface LoopAgentTask {
  id: string;
  agent_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused_awaiting_confirmation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  backend?: string;
  execution_result?: string;
  created_by?: string;
  phase?: string;
  legal_check_status?: string;
  created_at?: string;
  updated_at?: string;
}

interface ExecutionRecord {
  id: string;
  backend: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: string;
  prompt: string;
  result?: string;
}

interface AgentNodeData {
  agent: LoopAgent;
  onSelect: (agent: LoopAgent) => void;
  simulationMode: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────

const AGENT_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  brain: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400', icon: Brain, label: 'BRAIN' },
  meta: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400', icon: Crown, label: 'META' },
  trader: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400', icon: TrendingUp, label: 'TRADER' },
  designer: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400', icon: Palette, label: 'DESIGNER' },
  developer: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400', icon: Code2, label: 'DEVELOPER' },
  researcher: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400', icon: Search, label: 'RESEARCHER' },
  deploy: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400', icon: Rocket, label: 'DEPLOY' },
  worker: { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400', icon: Bot, label: 'WORKER' },
};

const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  idle: { dot: 'bg-gray-400', bg: 'bg-gray-400/10', text: 'text-gray-400', label: 'IDLE' },
  running: { dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-400', label: 'RUNNING' },
  paused: { dot: 'bg-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-400', label: 'PAUSED' },
  error: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-500', label: 'ERROR' },
  offline: { dot: 'bg-gray-600', bg: 'bg-gray-600/10', text: 'text-gray-600', label: 'OFFLINE' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// ─── Helper Components ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${s.bg} ${s.text} border border-white/5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg = AGENT_TYPE_CONFIG[type] || AGENT_TYPE_CONFIG.worker;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color} border border-white/5`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Custom Nodes ────────────────────────────────────────────────────────

function BrainNode({ data }: { data: AgentNodeData }) {
  const { agent, onSelect, simulationMode } = data;
  const isActive = agent.status === 'running' || simulationMode;

  return (
    <div
      onClick={() => onSelect(agent)}
      className="relative cursor-pointer group"
      style={{ width: 200, height: 120 }}
    >
      {/* Pulse ring animation */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-amber-400/40"
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ margin: -4 }}
        />
      )}
      {/* Second pulse ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl border border-amber-400/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{ margin: -8 }}
        />
      )}

      {/* Main card */}
      <div className="w-full h-full rounded-xl bg-gradient-to-br from-neutral-900 to-black border-2 border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.15)] flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 group-hover:border-amber-400 group-hover:shadow-[0_0_40px_rgba(251,191,36,0.25)]">
        {/* Subtle glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-400/5 to-transparent pointer-events-none" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fbbf24 1px, transparent 1px)', backgroundSize: '12px 12px' }} />

        <motion.div
          animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Brain className="w-10 h-10 text-amber-400" />
        </motion.div>
        <div className="text-center z-10">
          <p className="text-white font-bold text-sm leading-tight">{agent.name}</p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <StatusBadge status={agent.status} />
            <TypeBadge type={agent.agent_type} />
          </div>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-400/40 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-400/40 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-400/40 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-400/40 rounded-br-xl" />
      </div>

      <Handle type="source" position={Position.Bottom} id="brain-out" className="!bg-amber-400 !w-2.5 !h-2.5 !border-2 !border-black" />
      <Handle type="source" position={Position.Left} id="brain-left" className="!bg-amber-400 !w-2.5 !h-2.5 !border-2 !border-black" />
      <Handle type="source" position={Position.Right} id="brain-right" className="!bg-amber-400 !w-2.5 !h-2.5 !border-2 !border-black" />
    </div>
  );
}

function MetaNode({ data }: { data: AgentNodeData }) {
  const { agent, onSelect, simulationMode } = data;
  const isActive = agent.status === 'running' || simulationMode;

  return (
    <div
      onClick={() => onSelect(agent)}
      className="relative cursor-pointer group"
      style={{ width: 180, height: 100 }}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-yellow-400/30"
          animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ margin: -3 }}
        />
      )}

      <div className="w-full h-full rounded-xl bg-gradient-to-br from-neutral-900 to-black border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.12)] flex flex-col items-center justify-center gap-1.5 relative overflow-hidden transition-all duration-300 group-hover:border-yellow-400 group-hover:shadow-[0_0_35px_rgba(250,204,21,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #facc15 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

        <motion.div
          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Crown className="w-8 h-8 text-yellow-400" />
        </motion.div>
        <div className="text-center z-10">
          <p className="text-white font-bold text-xs leading-tight">{agent.name}</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <StatusBadge status={agent.status} />
            <TypeBadge type={agent.agent_type} />
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} id="meta-in" className="!bg-yellow-400 !w-2 !h-2 !border-2 !border-black" />
      <Handle type="source" position={Position.Bottom} id="meta-out" className="!bg-yellow-400 !w-2 !h-2 !border-2 !border-black" />
      <Handle type="source" position={Position.Left} id="meta-left" className="!bg-yellow-400 !w-2 !h-2 !border-2 !border-black" />
      <Handle type="source" position={Position.Right} id="meta-right" className="!bg-yellow-400 !w-2 !h-2 !border-2 !border-black" />
    </div>
  );
}

function AgentNode({ data }: { data: AgentNodeData }) {
  const { agent, onSelect, simulationMode } = data;
  const cfg = AGENT_TYPE_CONFIG[agent.agent_type] || AGENT_TYPE_CONFIG.worker;
  const isActive = agent.status === 'running' || simulationMode;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => onSelect(agent)}
      className="relative cursor-pointer group"
      style={{ width: 160, height: 80 }}
    >
      {isActive && (
        <motion.div
          className={`absolute inset-0 rounded-xl border border-current opacity-30`}
          style={{ color: 'var(--agent-color)' }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div
        className={`w-full h-full rounded-lg bg-gradient-to-br from-neutral-900 to-black border ${cfg.border} border-opacity-40 shadow-lg flex items-center gap-2.5 px-3 relative overflow-hidden transition-all duration-300 group-hover:${cfg.border} group-hover:border-opacity-80 group-hover:shadow-xl`}
        style={{ '--agent-color': 'currentColor' } as React.CSSProperties}
      >
        <div className={`absolute inset-0 ${cfg.bg} opacity-30 pointer-events-none`} />

        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center border border-white/5`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>

        <div className="flex-1 min-w-0 z-10">
          <p className="text-white font-semibold text-[11px] leading-tight truncate">{agent.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[agent.status]?.dot || 'bg-gray-400'} ${agent.status === 'running' || simulationMode ? 'animate-pulse' : ''}`} />
            <span className={`text-[9px] uppercase tracking-wider font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
          {agent.skills && agent.skills.length > 0 && (
            <p className="text-[9px] text-gray-500 mt-0.5">{agent.skills.length} skills</p>
          )}
        </div>

        {isActive && (
          <motion.div
            className="absolute top-1 right-1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Zap className="w-3 h-3 text-emerald-400" />
          </motion.div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className={`!w-2 !h-2 !border-2 !border-black ${cfg.dot ? '' : '!bg-gray-400'}`} style={{ backgroundColor: 'var(--handle-color)' }} />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-2 !border-black !bg-gray-400" />
    </div>
  );
}

// ─── Edge Types ──────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  brainNode: BrainNode,
  metaNode: MetaNode,
  agentNode: AgentNode,
};

// ─── Detail Panel ────────────────────────────────────────────────────────

function DetailPanel({
  agent,
  tasks,
  executions,
  onClose,
  onExecute,
  onUpdateConfig,
}: {
  agent: LoopAgent;
  tasks: LoopAgentTask[];
  executions: ExecutionRecord[];
  onClose: () => void;
  onExecute: (prompt: string, backend: string) => void;
  onUpdateConfig: (config: Record<string, unknown>) => void;
}) {
  const [execPrompt, setExecPrompt] = useState('');
  const [execBackend, setExecBackend] = useState('kimi_meta');
  const [localConfig, setLocalConfig] = useState(JSON.stringify(agent.config || {}, null, 2));
  const [configError, setConfigError] = useState('');
  const cfg = AGENT_TYPE_CONFIG[agent.agent_type] || AGENT_TYPE_CONFIG.worker;

  const handleConfigSave = () => {
    try {
      const parsed = JSON.parse(localConfig);
      setConfigError('');
      onUpdateConfig(parsed);
    } catch {
      setConfigError('Invalid JSON format');
    }
  };

  const handleExecute = (backend: string) => {
    if (!execPrompt.trim()) return;
    onExecute(execPrompt, backend);
  };

  return (
    <motion.div
      initial={{ x: 480, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 480, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="absolute top-0 right-0 w-[440px] h-full bg-neutral-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center border border-white/10`}>
            <cfg.icon className={`w-6 h-6 ${cfg.color}`} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{agent.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <TypeBadge type={agent.agent_type} />
              <StatusBadge status={agent.status} />
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-5 mt-4 bg-white/5 border border-white/10 p-1 rounded-lg h-auto">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md px-3 py-1.5">
            <Activity className="w-3.5 h-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md px-3 py-1.5">
            <ListTodo className="w-3.5 h-3.5 mr-1.5" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="execution" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md px-3 py-1.5">
            <Terminal className="w-3.5 h-3.5 mr-1.5" /> Execution
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md px-3 py-1.5">
            <Settings className="w-3.5 h-3.5 mr-1.5" /> Config
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="m-0 px-5 py-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Description</label>
              <p className="text-gray-300 text-sm leading-relaxed">{agent.description || 'No description available.'}</p>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {agent.skills?.map((skill) => (
                  <Badge key={skill} variant="outline" className="bg-white/5 text-gray-300 border-white/10 text-[10px] font-medium px-2 py-0.5">
                    {skill}
                  </Badge>
                )) || <span className="text-gray-500 text-xs">No skills defined</span>}
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Tier Required</label>
                <p className="text-white font-bold text-lg mt-1">{agent.tier_required ?? '-'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Max Concurrent</label>
                <p className="text-white font-bold text-lg mt-1">{agent.max_concurrent_tasks ?? '-'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Status</label>
                <div className="mt-1"><StatusBadge status={agent.status} /></div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">ID</label>
                <p className="text-gray-400 font-mono text-[10px] mt-1 truncate">{agent.id}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Uptime / Last Active</label>
              <p className="text-gray-300 text-xs mt-1">
                {agent.updated_at ? new Date(agent.updated_at).toLocaleString() : 'Never'}
              </p>
            </div>
          </TabsContent>

          {/* ── Tasks Tab ── */}
          <TabsContent value="tasks" className="m-0 px-5 py-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <ListTodo className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white font-medium text-sm flex-1 leading-tight">{task.title}</p>
                      <TaskStatusBadge status={task.status} />
                    </div>
                    {task.description && (
                      <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-[9px] ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium} border px-1.5 py-0`}>
                        {task.priority}
                      </Badge>
                      {task.backend && (
                        <span className="text-[9px] text-gray-500 flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> {task.backend}
                        </span>
                      )}
                      {task.created_at && (
                        <span className="text-[9px] text-gray-600 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" /> {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Execution Tab ── */}
          <TabsContent value="execution" className="m-0 px-5 py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Execution Instructions</label>
              <Textarea
                value={execPrompt}
                onChange={(e) => setExecPrompt(e.target.value)}
                placeholder="Enter execution instructions for this agent..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm min-h-[100px] resize-none focus:border-orange-500/50 focus:ring-orange-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Backend</label>
              <select
                value={execBackend}
                onChange={(e) => setExecBackend(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500/50"
              >
                <option value="kimi_meta">Kimi Meta Agent</option>
                <option value="hermes_openclaw">Hermes / OpenClaw</option>
                <option value="simulation">Simulation</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleExecute('kimi_meta')}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold text-xs h-9"
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" /> Execute via Kimi Meta
              </Button>
              <Button
                onClick={() => handleExecute('simulation')}
                variant="outline"
                className="flex-1 border-white/10 text-gray-300 hover:bg-white/5 hover:text-white text-xs h-9"
              >
                <Bot className="w-3.5 h-3.5 mr-1.5" /> Simulate
              </Button>
              <Button
                onClick={() => handleExecute('hermes_openclaw')}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold text-xs h-9"
              >
                <Brain className="w-3.5 h-3.5 mr-1.5" /> Hermes / OpenClaw
              </Button>
            </div>

            <Separator className="bg-white/10" />

            {/* Execution History */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Execution History</label>
              {executions.length === 0 ? (
                <div className="text-center py-8">
                  <Terminal className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">No executions yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {executions.map((exec) => (
                    <div key={exec.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ExecStatusIcon status={exec.status} />
                          <span className="text-white text-xs font-medium">{exec.backend}</span>
                        </div>
                        <span className="text-gray-600 text-[10px]">{new Date(exec.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1.5 truncate">{exec.prompt}</p>
                      {exec.result && (
                        <div className="mt-2 bg-black/30 rounded p-2 border border-white/5">
                          <p className="text-gray-500 text-[10px] font-mono line-clamp-3">{exec.result}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Config Tab ── */}
          <TabsContent value="config" className="m-0 px-5 py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Agent Config (JSON)</label>
              <Textarea
                value={localConfig}
                onChange={(e) => setLocalConfig(e.target.value)}
                className="bg-black/40 border-white/10 text-green-400 font-mono text-xs min-h-[200px] resize-none focus:border-orange-500/50 focus:ring-orange-500/20"
                spellCheck={false}
              />
              {configError && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {configError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Max Concurrent Tasks</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={agent.max_concurrent_tasks || 1}
                  readOnly
                  className="w-full accent-orange-500"
                />
                <p className="text-white text-xs font-mono">{agent.max_concurrent_tasks}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Tier Required</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((t) => (
                    <div
                      key={t}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${agent.tier_required === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 text-gray-500 border-white/10'}`}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfigSave} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white text-xs h-9">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Save Config
              </Button>
              <Button
                onClick={() => setLocalConfig(JSON.stringify(agent.config || {}, null, 2))}
                variant="outline"
                className="flex-1 border-white/10 text-gray-300 hover:bg-white/5 text-xs h-9"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </motion.div>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  if (status === 'paused_awaiting_confirmation') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <AlertTriangle className="w-3 h-3" /> Needs Confirm
      </span>
    );
  }
  const colors: Record<string, string> = {
    pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function ExecStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'failed': return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    case 'running': return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    default: return <Clock className="w-3.5 h-3.5 text-gray-500" />;
  }
}

// ─── Toolbar ─────────────────────────────────────────────────────────────

function CanvasToolbar({
  simulationMode,
  onToggleSimulation,
  onResetLayout,
  onAutoArrange,
  statusFilter,
  onStatusFilterChange,
  onAddAgent,
}: {
  simulationMode: boolean;
  onToggleSimulation: () => void;
  onResetLayout: () => void;
  onAutoArrange: () => void;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  onAddAgent: () => void;
}) {
  const filters = ['all', 'running', 'idle', 'error'];

  return (
    <Panel position="top-center" className="m-0 p-0">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 bg-neutral-950/90 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-2xl mt-3"
      >
        <Button
          onClick={onAddAgent}
          className="bg-orange-500 hover:bg-orange-400 text-white text-xs h-8 px-3 gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Agent
        </Button>

        <Separator orientation="vertical" className="h-5 bg-white/10" />

        <Button
          onClick={onToggleSimulation}
          variant={simulationMode ? 'default' : 'outline'}
          className={`text-xs h-8 px-3 gap-1.5 ${simulationMode ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {simulationMode ? 'Simulating...' : 'Simulation'}
        </Button>

        <Button
          onClick={onResetLayout}
          variant="outline"
          className="border-white/10 text-gray-300 hover:bg-white/5 text-xs h-8 px-3 gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>

        <Button
          onClick={onAutoArrange}
          variant="outline"
          className="border-white/10 text-gray-300 hover:bg-white/5 text-xs h-8 px-3 gap-1.5"
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Arrange
        </Button>

        <Separator orientation="vertical" className="h-5 bg-white/10" />

        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-500 mr-1" />
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => onStatusFilterChange(f)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${statusFilter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>
    </Panel>
  );
}

// ─── Status Bar ──────────────────────────────────────────────────────────

function StatusBar({
  agents,
  connected,
  lastUpdated,
}: {
  agents: LoopAgent[];
  connected: boolean;
  lastUpdated: string;
}) {
  const counts = useMemo(() => {
    const total = agents.length;
    const running = agents.filter((a) => a.status === 'running').length;
    const idle = agents.filter((a) => a.status === 'idle').length;
    const error = agents.filter((a) => a.status === 'error').length;
    return { total, running, idle, error };
  }, [agents]);

  return (
    <Panel position="bottom-center" className="m-0 p-0">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 bg-neutral-950/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 shadow-2xl mb-3"
      >
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Total</span>
          <span className="text-white text-xs font-bold ml-1">{counts.total}</span>
        </div>
        <Separator orientation="vertical" className="h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Running</span>
          <span className="text-emerald-400 text-xs font-bold ml-1">{counts.running}</span>
        </div>
        <Separator orientation="vertical" className="h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <Circle className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Idle</span>
          <span className="text-gray-400 text-xs font-bold ml-1">{counts.idle}</span>
        </div>
        <Separator orientation="vertical" className="h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Error</span>
          <span className="text-red-400 text-xs font-bold ml-1">{counts.error}</span>
        </div>
        <Separator orientation="vertical" className="h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-600 text-[10px]">{lastUpdated}</span>
        </div>
        <Separator orientation="vertical" className="h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-semibold">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 text-[10px] font-semibold">Offline</span>
            </>
          )}
        </div>
      </motion.div>
    </Panel>
  );
}

// ─── Simulation Log Panel ────────────────────────────────────────────────

function SimulationLog({ logs }: { logs: string[] }) {
  return (
    <Panel position="bottom-left" className="m-0 p-0">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-[320px] bg-neutral-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl mb-3 ml-3 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-white text-xs font-semibold">Simulation Log</span>
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-purple-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <ScrollArea className="h-[140px] px-3 py-2">
          <div className="space-y-1">
            {logs.length === 0 && (
              <p className="text-gray-600 text-[10px]">Waiting for simulation events...</p>
            )}
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-mono text-gray-400 leading-relaxed"
              >
                <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> {log}
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </motion.div>
    </Panel>
  );
}

// ─── Main Canvas Component ───────────────────────────────────────────────

function AgentCanvas() {
  const { fitView, setViewport } = useReactFlow();
  const [agents, setAgents] = useState<LoopAgent[]>([]);
  const [tasks, setTasks] = useState<LoopAgentTask[]>([]);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<LoopAgent | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('--:--:--');
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const initialNodes = useMemo<Node[]>(() => {
    const filtered = statusFilter === 'all' ? agents : agents.filter((a) => a.status === statusFilter);
    return filtered.map((agent) => {
      const type = agent.agent_type === 'brain' ? 'brainNode' : agent.agent_type === 'meta' ? 'metaNode' : 'agentNode';
      let position = { x: 0, y: 0 };
      switch (agent.agent_type) {
        case 'brain': position = { x: 400, y: 100 }; break;
        case 'meta': position = { x: 100, y: 300 }; break;
        case 'trader': position = { x: 700, y: 250 }; break;
        case 'designer': position = { x: 700, y: 400 }; break;
        case 'developer': position = { x: 450, y: 500 }; break;
        case 'researcher': position = { x: 200, y: 500 }; break;
        case 'deploy': position = { x: 600, y: 650 }; break;
        case 'worker': position = { x: 350, y: 700 }; break;
        default: position = { x: Math.random() * 600 + 100, y: Math.random() * 500 + 200 };
      }
      return {
        id: agent.id,
        type,
        position,
        data: { agent, onSelect: setSelectedAgent, simulationMode },
        draggable: true,
      };
    });
  }, [agents, statusFilter, simulationMode]);

  const initialEdges = useMemo<Edge[]>(() => {
    const edges: Edge[] = [];
    const brain = agents.find((a) => a.agent_type === 'brain');
    const meta = agents.find((a) => a.agent_type === 'meta');

    if (brain) {
      agents.forEach((agent) => {
        if (agent.id !== brain.id && agent.agent_type !== 'worker') {
          edges.push({
            id: `brain-${agent.id}`,
            source: brain.id,
            target: agent.id,
            type: 'smoothstep',
            animated: agent.status === 'running' || simulationMode,
            style: {
              stroke: '#fbbf24',
              strokeWidth: 2,
              strokeDasharray: agent.status === 'running' || simulationMode ? undefined : '5,5',
              opacity: 0.6,
            },
            sourceHandle: agent.agent_type === 'meta' ? 'brain-left' : agent.agent_type === 'trader' || agent.agent_type === 'designer' ? 'brain-right' : 'brain-out',
          });
        }
      });
    }

    if (meta) {
      agents.forEach((agent) => {
        if (agent.id !== meta.id && (agent.agent_type === 'worker' || agent.agent_type === 'developer')) {
          edges.push({
            id: `meta-${agent.id}`,
            source: meta.id,
            target: agent.id,
            type: 'smoothstep',
            animated: agent.status === 'running' || simulationMode,
            style: {
              stroke: '#facc15',
              strokeWidth: 1.5,
              strokeDasharray: '4,4',
              opacity: 0.5,
            },
            sourceHandle: 'meta-out',
          });
        }
      });
    }

    return edges;
  }, [agents, simulationMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes/edges when agents change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
    fetchTasks();
    setLastUpdated(new Date().toLocaleTimeString());

    // Subscribe to realtime changes
    const channel = supabase
      .channel('agent_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loop_agents' },
        () => {
          fetchAgents();
          setLastUpdated(new Date().toLocaleTimeString());
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Fit view on load
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [nodes.length, fitView]);

  // Simulation mode
  useEffect(() => {
    if (simulationMode) {
      setSimulationLogs(['Simulation mode activated...', 'Initializing agent swarm...']);

      simIntervalRef.current = setInterval(() => {
        setAgents((prev) =>
          prev.map((agent) => {
            if (Math.random() > 0.7) {
              const statuses: LoopAgent['status'][] = ['idle', 'running', 'paused', 'error', 'offline'];
              const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
              return { ...agent, status: newStatus, updated_at: new Date().toISOString() };
            }
            return agent;
          })
        );

        setSimulationLogs((prev) => {
          const actions = [
            'Agent processing task queue...',
            'Delegating sub-task to worker...',
            'Hermes Brain analyzing strategy...',
            'Kimi Meta coordinating agents...',
            'Trader executing market scan...',
            'Developer compiling module...',
            'Researcher gathering data...',
            'Designer rendering preview...',
            'Deploy agent checking health...',
            'Task completed successfully.',
            'New task received from pipeline.',
          ];
          const newLog = actions[Math.floor(Math.random() * actions.length)];
          const updated = [...prev, newLog].slice(-50);
          return updated;
        });

        setLastUpdated(new Date().toLocaleTimeString());
      }, 1500);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [simulationMode]);

  async function fetchAgents() {
    const { data, error } = await supabase.from('loop_agents').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setAgents(data as LoopAgent[]);
    } else {
      // Fallback: use default agents if table not available
      setAgents(DEFAULT_AGENTS);
    }
  }

  async function fetchTasks() {
    const { data, error } = await supabase.from('loop_agent_tasks').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setTasks(data as LoopAgentTask[]);
    }
  }

  const handleExecute = useCallback((prompt: string, backend: string) => {
    const newExec: ExecutionRecord = {
      id: `exec-${Date.now()}`,
      backend,
      status: 'pending',
      timestamp: new Date().toISOString(),
      prompt,
    };

    setExecutions((prev) => [newExec, ...prev]);

    // Simulate execution
    setTimeout(() => {
      setExecutions((prev) =>
        prev.map((e) =>
          e.id === newExec.id ? { ...e, status: 'running' } : e
        )
      );
    }, 500);

    setTimeout(() => {
      const results = [
        'Task executed successfully. Output generated.',
        'Agent completed processing with 3 sub-tasks.',
        'Execution finished. Review results in dashboard.',
        'Pipeline completed. All checks passed.',
      ];
      setExecutions((prev) =>
        prev.map((e) =>
          e.id === newExec.id
            ? { ...e, status: Math.random() > 0.2 ? 'completed' : 'failed', result: results[Math.floor(Math.random() * results.length)] }
            : e
        )
      );
    }, 2500);
  }, []);

  const handleUpdateConfig = useCallback((config: Record<string, unknown>) => {
    if (selectedAgent) {
      setAgents((prev) =>
        prev.map((a) => (a.id === selectedAgent.id ? { ...a, config } : a))
      );
      setSelectedAgent((prev) => prev ? { ...prev, config } : null);
    }
  }, [selectedAgent]);

  const handleAutoArrange = useCallback(() => {
    setNodes((prev) =>
      prev.map((node, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return {
          ...node,
          position: { x: 150 + col * 220, y: 100 + row * 160 },
        };
      })
    );
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [fitView, setNodes]);

  const handleResetLayout = useCallback(() => {
    const brain = agents.find((a) => a.agent_type === 'brain');
    const meta = agents.find((a) => a.agent_type === 'meta');

    setNodes((prev) =>
      prev.map((node) => {
        const agent = agents.find((a) => a.id === node.id);
        if (!agent) return node;

        let position = node.position;
        switch (agent.agent_type) {
          case 'brain': position = { x: 400, y: 100 }; break;
          case 'meta': position = { x: 100, y: 300 }; break;
          case 'trader': position = { x: 700, y: 250 }; break;
          case 'designer': position = { x: 700, y: 400 }; break;
          case 'developer': position = { x: 450, y: 500 }; break;
          case 'researcher': position = { x: 200, y: 500 }; break;
          case 'deploy': position = { x: 600, y: 650 }; break;
          case 'worker': position = { x: 350, y: 700 }; break;
        }
        return { ...node, position };
      })
    );
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [agents, fitView, setNodes]);

  const handleAddAgent = useCallback(() => {
    const newAgent: LoopAgent = {
      id: `agent-${Date.now()}`,
      name: `Worker ${agents.length + 1}`,
      agent_type: 'worker',
      status: 'idle',
      description: 'Dynamically added worker agent',
      config: {},
      skills: ['general'],
      tier_required: 1,
      max_concurrent_tasks: 3,
      created_at: new Date().toISOString(),
    };
    setAgents((prev) => [...prev, newAgent]);
  }, [agents.length]);

  const agentTasks = selectedAgent ? tasks.filter((t) => t.agent_id === selectedAgent.id) : [];

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={'loose' as ConnectionMode}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#333"
          gap={20}
          size={1}
          style={{ backgroundColor: '#000000' }}
        />
        <Controls
          className="!bg-neutral-950 !border-white/10 !shadow-xl"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-neutral-950/90 !border-white/10 !rounded-xl !shadow-xl"
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              brainNode: '#fbbf24',
              metaNode: '#facc15',
            };
            return colors[node.type || ''] || '#666';
          }}
          maskColor="rgba(0,0,0,0.7)"
          maskStrokeColor="rgba(255,255,255,0.1)"
          maskStrokeWidth={1}
          nodeStrokeWidth={2}
          nodeStrokeColor="#000"
          pannable
          zoomable
        />

        <CanvasToolbar
          simulationMode={simulationMode}
          onToggleSimulation={() => setSimulationMode(!simulationMode)}
          onResetLayout={handleResetLayout}
          onAutoArrange={handleAutoArrange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onAddAgent={handleAddAgent}
        />

        <StatusBar agents={agents} connected={connected} lastUpdated={lastUpdated} />

        {simulationMode && <SimulationLog logs={simulationLogs} />}
      </ReactFlow>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedAgent && (
          <DetailPanel
            key={selectedAgent.id}
            agent={selectedAgent}
            tasks={agentTasks}
            executions={executions.filter((e) => e.prompt.includes(selectedAgent.name) || agentTasks.some((t) => e.prompt.includes(t.title)))}
            onClose={() => setSelectedAgent(null)}
            onExecute={handleExecute}
            onUpdateConfig={handleUpdateConfig}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Default Agents (fallback) ───────────────────────────────────────────

const DEFAULT_AGENTS: LoopAgent[] = [
  {
    id: 'hermes-brain',
    name: 'Hermes Brain',
    agent_type: 'brain',
    status: 'running',
    description: 'Central orchestration brain. Manages strategy, delegates to meta and worker agents, monitors system health.',
    config: { strategy: 'adaptive', max_depth: 5 },
    skills: ['orchestration', 'strategy', 'monitoring', 'delegation'],
    tier_required: 3,
    max_concurrent_tasks: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: 'kimi-meta',
    name: 'Kimi Meta Agent',
    agent_type: 'meta',
    status: 'running',
    description: 'Meta-level coordination agent. Manages inter-agent communication, task routing, and conflict resolution.',
    config: { routing_algorithm: 'weighted', fallback_enabled: true },
    skills: ['coordination', 'routing', 'conflict_resolution', 'meta_planning'],
    tier_required: 3,
    max_concurrent_tasks: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'ricko-trader',
    name: 'Ricko Trader',
    agent_type: 'trader',
    status: 'idle',
    description: 'Financial markets trading agent. Executes trades, monitors portfolios, analyzes market signals.',
    config: { risk_level: 'medium', max_position: 10000 },
    skills: ['trading', 'portfolio_management', 'risk_analysis', 'market_scanning'],
    tier_required: 2,
    max_concurrent_tasks: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'ok-computer',
    name: 'OK-Computer Designer',
    agent_type: 'designer',
    status: 'idle',
    description: 'UI/UX design agent. Creates wireframes, design systems, and visual assets.',
    config: { style_guide: 'modern_dark', export_format: 'svg' },
    skills: ['ui_design', 'ux_research', 'prototyping', 'design_systems'],
    tier_required: 2,
    max_concurrent_tasks: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'code-weaver',
    name: 'Code Weaver',
    agent_type: 'developer',
    status: 'idle',
    description: 'Software development agent. Writes, reviews, and deploys code across the stack.',
    config: { languages: ['typescript', 'python', 'rust'], review_enabled: true },
    skills: ['coding', 'code_review', 'debugging', 'architecture'],
    tier_required: 2,
    max_concurrent_tasks: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: 'deep-researcher',
    name: 'Deep Researcher',
    agent_type: 'researcher',
    status: 'idle',
    description: 'Research and data analysis agent. Gathers intelligence, synthesizes reports, finds patterns.',
    config: { sources: ['web', 'database', 'api'], depth: 'deep' },
    skills: ['research', 'data_analysis', 'synthesis', 'pattern_recognition'],
    tier_required: 1,
    max_concurrent_tasks: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'launch-pad',
    name: 'Launch Pad',
    agent_type: 'deploy',
    status: 'idle',
    description: 'Deployment and DevOps agent. Manages CI/CD pipelines, infrastructure, and releases.',
    config: { platform: 'kubernetes', auto_rollback: true },
    skills: ['deployment', 'ci_cd', 'infrastructure', 'monitoring'],
    tier_required: 2,
    max_concurrent_tasks: 3,
    created_at: new Date().toISOString(),
  },
];

// ─── Page Wrapper ────────────────────────────────────────────────────────

export default function Agenten() {
  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden">
      <ReactFlowProvider>
        <AgentCanvas />
      </ReactFlowProvider>
    </div>
  );
}