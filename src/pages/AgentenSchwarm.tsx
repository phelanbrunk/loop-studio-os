import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit, Puzzle, Rocket, Zap, Shield,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

const SWARM_STATS = [
  { label: 'Agenten', value: '19', icon: BrainCircuit, color: '#FF8C5A' },
  { label: 'Kategorien', value: '5', icon: Puzzle, color: '#B98BFF' },
  { label: 'Skills', value: '185+', icon: Zap, color: '#36CFC9' },
  { label: 'Subagents', value: '53+', icon: Shield, color: '#F5C542' },
];

const QUICK_ACTIONS = [
  {
    label: 'Agent Registry',
    description: 'Alle verfuegbaren Skills entdecken und spawnen',
    icon: Puzzle,
    color: '#B98BFF',
    action: 'navigate' as const,
    to: '/agenten/registry',
  },
  {
    label: 'Grok Orchestrator',
    description: 'Zentrale Steuerung aktivieren',
    icon: BrainCircuit,
    color: '#FF8C5A',
    action: 'spawn' as const,
  },
  {
    label: 'Divine Design Director',
    description: 'Creative Director fuer goettliches Design',
    icon: Sparkles,
    color: '#36CFC9',
    action: 'spawn' as const,
  },
  {
    label: 'ECC v2',
    description: '53+ Subagents, 185+ Skills',
    icon: Zap,
    color: '#F5C542',
    action: 'spawn' as const,
  },
];

export default function AgentenSchwarm() {
  const navigate = useNavigate();

  const handleAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.action === 'navigate' && action.to) {
      navigate(action.to);
    } else {
      toast.success(`${action.label} wurde gespawnt!`, {
        description: 'Der Agent ist jetzt im Schwarm aktiv.',
        icon: <Rocket size={14} />,
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          Agenten-Schwarm
        </h1>
        <p className="text-sm mt-1" style={{ color: '#5E626A' }}>
          Verwalte und spawn deine KI-Agenten
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {SWARM_STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              className="rounded-xl border p-4"
              style={{
                backgroundColor: '#0C0D0F',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-[11px] font-medium mt-0.5" style={{ color: '#5E626A' }}>
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <h2
        className="text-xs font-bold tracking-[0.15em] uppercase mb-4"
        style={{ color: '#5E626A' }}
      >
        Schnellaktionen
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.24 + i * 0.06 }}
              onClick={() => handleAction(action)}
              className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 group"
              style={{
                backgroundColor: '#0C0D0F',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Icon size={22} style={{ color: action.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{action.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#5E626A' }}>
                  {action.description}
                </div>
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: '#5E626A' }}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
