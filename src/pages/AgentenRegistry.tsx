import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Palette, Layers, Zap, Wand2, Database,
  GitBranch, TrendingUp, BarChart3, Coins, Workflow, Shield,
  Code2, Globe, Search as SearchIcon, Cpu, HardDrive, Microscope,
  Puzzle, Plus, ChevronDown, ChevronUp, Rocket,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

interface AgentData {
  skill_key: string;
  display_name: string;
  category: string;
  description: string;
  icon: string;
  full_description: string;
  tasks: string[];
}

const AGENT_REGISTRY: AgentData[] = [
  {
    skill_key: 'grok-orchestrator', display_name: 'Grok Orchestrator',
    category: 'core_orchestrator', description: 'Zentrale Steuerung aller Agenten...',
    icon: 'Brain',
    full_description: 'Der Grok Orchestrator ist das Hauptgehirn des Schwarm-Bewusstseins. Er koordiniert alle Agenten, verteilt Aufgaben und sorgt fuer optimale Ressourcenallokation im gesamten Agenten-Netzwerk.',
    tasks: ['Aufgabenverteilung', 'Ressourcen-Optimierung', 'Agenten-Orchestrierung', 'Ergebnis-Aggregation'],
  },
  {
    skill_key: 'divine-design-director', display_name: 'Divine Design Director',
    category: 'creative_studio', description: 'Creative Director fuer goettliches Webdesign...',
    icon: 'Sparkles',
    full_description: 'Der Divine Design Director ist der ultimative Creative Director fuer außergewoehnliches Webdesign. Er definiert Design-Richtlinien, erstellt Moodboards und sorgt fuer konsistente, atemberaubende visuelle Erlebnisse.',
    tasks: ['Design-Richtlinien definieren', 'Moodboards erstellen', 'Visuelle Konsistenz pruefen', 'Brand-Identity entwickeln'],
  },
  {
    skill_key: 'frontend-design', display_name: 'Frontend Design',
    category: 'creative_studio', description: 'Hochwertige Frontend-Interfaces...',
    icon: 'Palette',
    full_description: 'Der Frontend Design Agent erstellt hochwertige Benutzeroberflaechen mit modernsten Technologien. Er setzt Designs pixelgenau in React, TypeScript und Tailwind CSS um.',
    tasks: ['React-Komponenten bauen', 'Tailwind CSS Styling', 'Responsive Layouts', 'Animationen implementieren'],
  },
  {
    skill_key: 'ui-ux-pro-max', display_name: 'UI/UX Pro Max',
    category: 'creative_studio', description: '50+ Styles, 161 Paletten...',
    icon: 'Layers',
    full_description: 'UI/UX Pro Max bietet Zugang zu ueber 50 Design-Styles und 161 Farbpaletten. Er optimiert User Flows, erstellt Wireframes und sorgt fuer intuitive Benutzererlebnisse.',
    tasks: ['Wireframes erstellen', 'User Flows optimieren', 'Farbschemas anwenden', 'Usability-Tests durchfuehren'],
  },
  {
    skill_key: 'motion-principles-master', display_name: 'Motion Principles',
    category: 'creative_studio', description: 'GSAP, Scroll-Animationen...',
    icon: 'Zap',
    full_description: 'Der Motion Principles Master spezialisiert sich auf fortgeschrittene Animationen mit GSAP, Scroll-Animationen und Mikrointeraktionen, die Websites zum Leben erwecken.',
    tasks: ['GSAP-Animationen', 'Scroll-basierte Effekte', 'Mikrointeraktionen', 'Performance-Optimierung'],
  },
  {
    skill_key: 'visual-effects-orchestrator', display_name: 'VFX Orchestrator',
    category: 'creative_studio', description: '3D/VFX/WebGL...',
    icon: 'Wand2',
    full_description: 'Der VFX Orchestrator integriert 3D-Effekte, WebGL-Visualisierungen und besondere visuelle Effekte, die Ihre Website von der Masse abheben.',
    tasks: ['WebGL-Effekte', '3D-Integration', 'Shader-Programmierung', 'Visuelle Post-Processing'],
  },
  {
    skill_key: 'creative-memory-system', display_name: 'Creative Memory',
    category: 'creative_studio', description: 'Persistenz von Design-Entscheidungen...',
    icon: 'Database',
    full_description: 'Das Creative Memory System speichert alle Design-Entscheidungen persistently, sodass kuenftige Projekte auf gelernten Praeferenzen und frueheren Entscheidungen aufbauen koennen.',
    tasks: ['Design-Entscheidungen speichern', 'Kontext-Kompression', 'Projekt-Historie verwalten', 'Praeferenz-Lernen'],
  },
  {
    skill_key: 'design-agency-workflow', display_name: 'Design Agency WF',
    category: 'creative_studio', description: 'Operativer Workflow...',
    icon: 'GitBranch',
    full_description: 'Der Design Agency Workflow Agent verwaltet den kompletten operativen Ablauf einer Design-Agentur von der ersten Anfrage bis zur finalen Lieferung.',
    tasks: ['Projekt-Management', 'Kundenkommunikation', 'Qualitaetskontrolle', 'Liefer-Workflows'],
  },
  {
    skill_key: 'project-loop-trading', display_name: 'Project Loop Trading',
    category: 'trading_capital', description: 'XAUUSD/Gold Signale...',
    icon: 'TrendingUp',
    full_description: 'Project Loop Trading analysiert XAUUSD/Gold-Maerkte und generiert praezise Handelssignale basierend auf technischer und fundamentaler Marktanalyse.',
    tasks: ['Technische Analyse', 'Fundamentalanalyse', 'Signale generieren', 'Risikomanagement'],
  },
  {
    skill_key: 'multi-agent-trading', display_name: 'Multi-Agent Trading',
    category: 'trading_capital', description: 'Multi-Perspektiven-Analyse...',
    icon: 'BarChart3',
    full_description: 'Multi-Agent Trading nutzt mehrere spezialisierte Agenten, die gleichzeitig aus verschiedenen Perspektiven analysieren, um robuste Handelsentscheidungen zu treffen.',
    tasks: ['Multi-Agent-Analyse', 'Konsensbildung', 'Markt-Monitoring', 'Strategie-Optimierung'],
  },
  {
    skill_key: 'cash-orchestrator', display_name: 'Cash Orchestrator',
    category: 'trading_capital', description: 'Autonome Kapital-Allokation...',
    icon: 'Coins',
    full_description: 'Der Cash Orchestrator verwaltet autonom die Kapitalallokation ueber verschiedene Handelsstrategien und sorgt fuer optimale Gewinnmaximierung bei kontrolliertem Risiko.',
    tasks: ['Kapital-Allokation', 'Risiko-Balancierung', 'Gewinn-Optimierung', 'Portfolio-Management'],
  },
  {
    skill_key: 'unified-agent-workflow', display_name: 'Unified Agent WF',
    category: 'agentic_dev', description: 'Master-Workflow...',
    icon: 'Workflow',
    full_description: 'Unified Agent Workflow ist der Master-Workflow, der alle Entwicklungsprozesse in einem einheitlichen System verbindet und orchestriert.',
    tasks: ['Workflow-Orchestrierung', 'Prozess-Integration', 'Agenten-Koordination', 'Ergebnis-Synchronisation'],
  },
  {
    skill_key: 'ecc-v2', display_name: 'ECC v2',
    category: 'agentic_dev', description: '53+ Subagents, 185+ Skills...',
    icon: 'Shield',
    full_description: 'ECC v2 ist ein massives Agentensystem mit ueber 53 Subagents und 185+ Skills. Es bietet Enterprise-Grade Code-Generation, Review und Deployment-Automatisierung.',
    tasks: ['Code-Generation', 'Code-Review', 'Deployment-Automatisierung', 'Enterprise-Integration'],
  },
  {
    skill_key: 'superpowers-dev', display_name: 'Superpowers Dev',
    category: 'agentic_dev', description: 'Disziplinierte Software-Entwicklung...',
    icon: 'Code2',
    full_description: 'Superpowers Dev bringt disziplinierte Software-Entwicklung auf das naechste Level mit strengen Qualitaetsstandards, automatisierten Tests und sauberer Architektur.',
    tasks: ['Software-Architektur', 'Test-Automatisierung', 'Code-Qualitaet', 'CI/CD-Pipelines'],
  },
  {
    skill_key: 'browser-automation', display_name: 'Browser Automation',
    category: 'agentic_dev', description: 'Playwright-Automatisierung...',
    icon: 'Globe',
    full_description: 'Browser Automation nutzt Playwright fuer vollautomatisierte Browser-Interaktionen, von Testing bis hin zu Datenextraktion und Formularausfuellung.',
    tasks: ['Playwright-Scripts', 'End-to-End Testing', 'Web-Scraping', 'Formular-Automatisierung'],
  },
  {
    skill_key: 'browser-design-auditor', display_name: 'Design Auditor',
    category: 'agentic_dev', description: 'Visuelles QA...',
    icon: 'SearchIcon',
    full_description: 'Der Design Auditor fuehrt visuelles Quality Assurance durch, erkennt Design-Inkonsistenzen und prueft die Uebereinstimmung mit Design-Vorgaben.',
    tasks: ['Visuelle QA-Pruefung', 'Design-Inkonsistenzen finden', 'Pixel-Perfect-Check', 'Accessibility-Audit'],
  },
  {
    skill_key: 'loop-operations', display_name: 'Loop Ops',
    category: 'operations_memory', description: 'Zentrale Operations...',
    icon: 'Cpu',
    full_description: 'Loop Operations ist das zentrale Operations-System, das alle laufenden Prozesse, Monitoring und Wartungsaufgaben im Agenten-Swarm verwaltet.',
    tasks: ['System-Monitoring', 'Prozess-Verwaltung', 'Wartungs-Aufgaben', 'Fehlerbehebung'],
  },
  {
    skill_key: 'persistent-memory', display_name: 'Persistent Memory',
    category: 'operations_memory', description: 'Langfristige Kontext-Kompression...',
    icon: 'HardDrive',
    full_description: 'Persistent Memory bietet langfristige Kontext-Kompression und -Speicherung, sodass wichtige Informationen ueber lange Zeitraeume hinweg erhalten bleiben.',
    tasks: ['Kontext-Kompression', 'Langzeit-Speicherung', 'Erinnerungs-Abruf', 'Wissens-Management'],
  },
  {
    skill_key: 'deep-research', display_name: 'Deep Research',
    category: 'operations_memory', description: 'Multi-Agent Deep Research...',
    icon: 'Microscope',
    full_description: 'Deep Research fuehrt tiefe Recherchen mit mehreren spezialisierten Agenten durch, um umfassende, fundierte Analysen zu jedem Thema zu liefern.',
    tasks: ['Tiefenrecherche', 'Quellenanalyse', 'Faktenpruefung', 'Berichtserstellung'],
  },
];

/* ------------------------------------------------------------------ */
/*  CATEGORY CONFIG                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  core_orchestrator:  { label: 'CORE ORCHESTRATOR',  color: '#FF8C5A', icon: Brain },
  creative_studio:    { label: 'CREATIVE STUDIO',    color: '#B98BFF', icon: Palette },
  trading_capital:    { label: 'TRADING & CAPITAL',  color: '#36CFC9', icon: TrendingUp },
  agentic_dev:        { label: 'AGENTIC DEVELOPMENT',color: '#F5C542', icon: Code2 },
  operations_memory:  { label: 'OPERATIONS & MEMORY',color: '#A1A4AA', icon: Cpu },
};

const CATEGORY_ORDER = [
  'core_orchestrator',
  'creative_studio',
  'trading_capital',
  'agentic_dev',
  'operations_memory',
];

const ICON_MAP: Record<string, LucideIcon> = {
  Brain, Sparkles, Palette, Layers, Zap, Wand2, Database,
  GitBranch, TrendingUp, BarChart3, Coins, Workflow, Shield,
  Code2, Globe, SearchIcon, Cpu, HardDrive, Microscope,
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Puzzle;
}

/* ------------------------------------------------------------------ */
/*  AGENT CARD                                                         */
/* ------------------------------------------------------------------ */

function AgentCard({
  agent,
  onOpenDetail,
}: {
  agent: AgentData;
  onOpenDetail: (agent: AgentData) => void;
}) {
  const Icon = getIcon(agent.icon);
  const catConfig = CATEGORY_CONFIG[agent.category];
  const accentColor = catConfig?.color || '#A1A4AA';

  const handleSpawn = () => {
    toast.success(`${agent.display_name} wurde gespawnt!`, {
      description: 'Der Agent ist jetzt im Schwarm aktiv.',
      icon: <Rocket size={16} />,
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.12)' }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border p-5 flex flex-col gap-3 group cursor-default"
      style={{
        backgroundColor: '#0C0D0F',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Header: Icon + Name */}
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <Icon size={20} style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            {agent.display_name}
          </h3>
          <span
            className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${accentColor}15`,
              color: accentColor,
            }}
          >
            {catConfig?.label || agent.category}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed" style={{ color: '#5E626A' }}>
        {agent.description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <button
          onClick={handleSpawn}
          className="flex-1 h-8 rounded-lg text-xs font-semibold text-white transition-all duration-200 flex items-center justify-center gap-1.5"
          style={{
            background: 'linear-gradient(135deg, #FF8C5A, #FF6B3D)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Plus size={14} />
          Spawn
        </button>
        <button
          onClick={() => onOpenDetail(agent)}
          className="h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200"
          style={{ color: '#A1A4AA', backgroundColor: 'rgba(255,255,255,0.04)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = '#A1A4AA';
          }}
        >
          Mehr erfahren
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CATEGORY SECTION                                                   */
/* ------------------------------------------------------------------ */

function CategorySection({
  categoryKey,
  agents,
  onOpenDetail,
  defaultOpen = true,
}: {
  categoryKey: string;
  agents: AgentData[];
  onOpenDetail: (agent: AgentData) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = CATEGORY_CONFIG[categoryKey];
  if (!config || agents.length === 0) return null;

  const Icon = config.icon;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mb-4 group"
      >
        <Icon size={16} style={{ color: config.color }} />
        <h2
          className="text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: config.color }}
        >
          {config.label}
        </h2>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: '#5E626A', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          {agents.length}
        </span>
        {isOpen ? (
          <ChevronUp size={14} style={{ color: '#5E626A' }} />
        ) : (
          <ChevronDown size={14} style={{ color: '#5E626A' }} />
        )}
      </button>

      {/* Cards Grid */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className={
                categoryKey === 'core_orchestrator'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              }
            >
              {agents.map((agent, i) => (
                <motion.div
                  key={agent.skill_key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                >
                  <AgentCard agent={agent} onOpenDetail={onOpenDetail} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AGENT DETAIL MODAL                                                 */
/* ------------------------------------------------------------------ */

function AgentDetailModal({
  agent,
  open,
  onClose,
}: {
  agent: AgentData | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!agent) return null;

  const Icon = getIcon(agent.icon);
  const catConfig = CATEGORY_CONFIG[agent.category];
  const accentColor = catConfig?.color || '#A1A4AA';

  const handleSpawn = () => {
    toast.success(`${agent.display_name} wurde gespawnt!`, {
      description: 'Der Agent ist jetzt im Schwarm aktiv.',
      icon: <Rocket size={16} />,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg border-0 p-0 overflow-hidden"
        style={{
          backgroundColor: '#0F1014',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Accent top bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}18` }}
              >
                <Icon size={24} style={{ color: accentColor }} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {agent.display_name}
                </DialogTitle>
                <span
                  className="inline-block mt-0.5 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                  }}
                >
                  {catConfig?.label || agent.category}
                </span>
              </div>
            </div>
            <DialogDescription className="text-sm leading-relaxed" style={{ color: '#8B8E95' }}>
              {agent.full_description}
            </DialogDescription>
          </DialogHeader>

          {/* Tasks */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold tracking-wider uppercase mb-3" style={{ color: '#5E626A' }}>
              Typische Aufgaben
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {agent.tasks.map((task) => (
                <div
                  key={task}
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: '#A1A4AA',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                  {task}
                </div>
              ))}
            </div>
          </div>

          {/* Spawn Button */}
          <button
            onClick={handleSpawn}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #FF8C5A, #FF6B3D)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'scale(1.01)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Rocket size={18} />
            In Swarm spawnen
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */

export default function AgentenRegistry() {
  const [detailAgent, setDetailAgent] = useState<AgentData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const agentsByCategory = useMemo(() => {
    const map: Record<string, AgentData[]> = {};
    for (const cat of CATEGORY_ORDER) {
      map[cat] = AGENT_REGISTRY.filter((a) => a.category === cat);
    }
    return map;
  }, []);

  const handleOpenDetail = (agent: AgentData) => {
    setDetailAgent(agent);
    setModalOpen(true);
  };

  const handleCloseDetail = () => {
    setModalOpen(false);
    setTimeout(() => setDetailAgent(null), 200);
  };

  const handleSpawnCoreTeam = () => {
    const coreAgents = [
      AGENT_REGISTRY[0], // orchestrator
      AGENT_REGISTRY[1], // divine design director
      AGENT_REGISTRY[11], // unified agent workflow
      AGENT_REGISTRY[15], // loop operations
      AGENT_REGISTRY[16], // persistent memory
    ].filter(Boolean);

    coreAgents.forEach((agent, i) => {
      setTimeout(() => {
        toast.success(`${agent.display_name} gespawnt!`, {
          description: 'Core-Team Agent aktiv.',
          icon: <Rocket size={14} />,
        });
      }, i * 300);
    });

    toast.success('Core Team wird gespawnt...', {
      description: `${coreAgents.length} Agenten werden initialisiert.`,
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Agent Registry
          </h1>
          <p className="text-sm mt-1" style={{ color: '#5E626A' }}>
            Verfuegbare Skills als spawnable Agenten
          </p>
        </div>
        <button
          onClick={handleSpawnCoreTeam}
          className="h-10 px-5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #FF8C5A, #B98BFF)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Rocket size={18} />
          Core Team spawnen
        </button>
      </div>

      {/* Category Sections */}
      {CATEGORY_ORDER.map((catKey) => (
        <CategorySection
          key={catKey}
          categoryKey={catKey}
          agents={agentsByCategory[catKey] || []}
          onOpenDetail={handleOpenDetail}
          defaultOpen={catKey === 'core_orchestrator'}
        />
      ))}

      {/* Detail Modal */}
      <AgentDetailModal
        agent={detailAgent}
        open={modalOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
