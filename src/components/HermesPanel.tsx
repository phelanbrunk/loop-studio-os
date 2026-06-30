/**
 * ═══════════════════════════════════════════════════════════════════
 * HERMES CONTROL PANEL — v5.1+
 * ═══════════════════════════════════════════════════════════════════
 *
 * Visual interface for the Hermes Autonomous Brain:
 * - Phase progress indicator (7 phases)
 * - Start/Stop/Pause controls
 * - Task list with status
 * - Phelan notifications
 * - Override controls
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Square, Brain, Eye, Search, Lightbulb,
  ClipboardList, ShieldCheck, Zap, BookOpen, AlertTriangle,
  CheckCircle, X, Clock, Crown,
} from 'lucide-react';
import { useHermesBrain } from '@/hooks/useHermesBrain';
import type { HermesPhase, HermesTask } from '@/hooks/useHermesBrain';

const PHASE_CONFIG: { phase: HermesPhase; label: string; icon: typeof Eye; color: string }[] = [
  { phase: 'observation', label: 'Beobachtung', icon: Eye, color: '#36CFC9' },
  { phase: 'research', label: 'Recherche', icon: Search, color: '#4D8AFF' },
  { phase: 'reasoning', label: 'Analyse', icon: Lightbulb, color: '#F5C542' },
  { phase: 'planning', label: 'Planung', icon: ClipboardList, color: '#FF8C5A' },
  { phase: 'validation', label: 'Safety', icon: ShieldCheck, color: '#EF4444' },
  { phase: 'action', label: 'Aktion', icon: Zap, color: '#B98BFF' },
  { phase: 'learning', label: 'Lernen', icon: BookOpen, color: '#36CFC9' },
];

export default function HermesPanel() {
  const hermes = useHermesBrain();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #B98BFF, #4D8AFF)' }}>
              <Brain size={16} color="#FFF" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                Hermes Brain
              </h3>
              <div className="flex items-center gap-1.5">
                {hermes.isRunning ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#36CFC9' }} />
                    <span className="text-[10px]" style={{ color: '#36CFC9' }}>Autonom aktiv</span>
                  </>
                ) : hermes.currentPhase === 'paused' ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#F5C542' }} />
                    <span className="text-[10px]" style={{ color: '#F5C542' }}>Pausiert</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#5E626A' }} />
                    <span className="text-[10px]" style={{ color: '#5E626A' }}>Bereit</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-[10px]" style={{ color: '#5E626A', fontFamily: '"IBM Plex Mono", monospace' }}>
            #{hermes.cycleCount}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {!hermes.isRunning ? (
            <button
              onClick={hermes.start}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(54,207,201,0.2), rgba(77,138,255,0.2))',
                color: '#36CFC9',
                border: '1px solid rgba(54,207,201,0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(54,207,201,0.3), rgba(77,138,255,0.3))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(54,207,201,0.2), rgba(77,138,255,0.2))';
              }}
            >
              <Play size={13} />
              Start
            </button>
          ) : (
            <>
              <button
                onClick={hermes.pause}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: 'rgba(245,197,66,0.15)',
                  color: '#F5C542',
                  border: '1px solid rgba(245,197,66,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245,197,66,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245,197,66,0.15)';
                }}
              >
                <Pause size={13} />
                Pause
              </button>
              <button
                onClick={hermes.stop}
                className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.15)',
                  color: '#EF4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)';
                }}
              >
                <Square size={11} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Phase Progress */}
      <div className="shrink-0 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <label className="text-[10px] uppercase tracking-wider font-medium mb-2 block" style={{ color: '#5E626A' }}>
          Phasen-Fortschritt
        </label>
        <div className="space-y-1.5">
          {PHASE_CONFIG.map((pc, idx) => {
            const isActive = hermes.currentPhase === pc.phase;
            const isCompleted = hermes.phaseNumber > idx + 1;
            const Icon = pc.icon;

            return (
              <div
                key={pc.phase}
                className="flex items-center gap-2 h-6 px-2 rounded-md transition-all"
                style={{
                  backgroundColor: isActive ? `${pc.color}15` : 'transparent',
                  borderLeft: isActive ? `2px solid ${pc.color}` : '2px solid transparent',
                }}
              >
                {isCompleted ? (
                  <CheckCircle size={11} style={{ color: '#36CFC9' }} />
                ) : (
                  <Icon size={11} style={{ color: isActive ? pc.color : '#5E626A' }} />
                )}
                <span
                  className="text-[11px] flex-1"
                  style={{
                    color: isActive ? pc.color : isCompleted ? '#A1A4AA' : '#5E626A',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {idx + 1}. {pc.label}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: pc.color }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Phelan Notifications */}
        <AnimatePresence>
          {hermes.phelanNotifications.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crown size={11} style={{ color: '#F5C542' }} />
                    <span className="text-[10px] font-semibold" style={{ color: '#F5C542' }}>
                      Phelan
                    </span>
                  </div>
                  <button
                    onClick={hermes.clearNotifications}
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{ color: '#5E626A' }}
                  >
                    Clear
                  </button>
                </div>
                {hermes.phelanNotifications.map((notif, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 p-1.5 rounded"
                    style={{ backgroundColor: 'rgba(245,197,66,0.08)' }}
                  >
                    <AlertTriangle size={10} style={{ color: '#F5C542' }} />
                    <span className="text-[10px]" style={{ color: '#F5C542' }}>{notif}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task List */}
        <div className="p-4">
          <label className="text-[10px] uppercase tracking-wider font-medium mb-2 block" style={{ color: '#5E626A' }}>
            Hermes Tasks ({hermes.tasks.length})
          </label>
          <div className="space-y-1.5">
            {hermes.tasks.length === 0 ? (
              <div className="text-[11px] py-3 text-center" style={{ color: '#5E626A' }}>
                Keine Tasks generiert
              </div>
            ) : (
              hermes.tasks.slice(0, 20).map((task) => (
                <TaskRow key={task.id} task={task} onConfirm={hermes.confirmTask} onCancel={hermes.cancelTask} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className="shrink-0 p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock size={10} style={{ color: '#5E626A' }} />
            <span className="text-[10px]" style={{ color: '#5E626A' }}>
              {hermes.lastRunAt
                ? `Letzter Lauf: ${new Date(hermes.lastRunAt).toLocaleTimeString('de-DE')}`
                : 'Noch nicht gestartet'}
            </span>
          </div>
          {hermes.nextRunAt && hermes.isRunning && (
            <span className="text-[10px]" style={{ color: '#5E626A' }}>
              Nächster: {new Date(hermes.nextRunAt).toLocaleTimeString('de-DE')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TASK ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════

function TaskRow({
  task,
  onConfirm,
  onCancel,
}: {
  task: HermesTask;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const statusColors: Record<string, { bg: string; color: string }> = {
    queued: { bg: 'rgba(54,207,201,0.1)', color: '#36CFC9' },
    running: { bg: 'rgba(255,140,90,0.1)', color: '#FF8C5A' },
    completed: { bg: 'rgba(54,207,201,0.05)', color: '#36CFC9' },
    failed: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
    paused_awaiting_confirmation: { bg: 'rgba(245,197,66,0.1)', color: '#F5C542' },
    cancelled: { bg: 'rgba(94,98,106,0.1)', color: '#5E626A' },
  };

  const sc = statusColors[task.status] || statusColors.queued;

  return (
    <div
      className="rounded-lg p-2.5 space-y-1.5"
      style={{ backgroundColor: sc.bg, border: `1px solid ${sc.color}25` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sc.color }} />
        <span className="text-[11px] font-medium flex-1 truncate" style={{ color: '#FFFFFF' }}>
          {task.title}
        </span>
        <span
          className="text-[9px] px-1 py-0.5 rounded shrink-0"
          style={{ backgroundColor: `${sc.color}20`, color: sc.color }}
        >
          {task.status === 'paused_awaiting_confirmation' ? 'Wartet' : task.status}
        </span>
      </div>
      <p className="text-[10px] line-clamp-2" style={{ color: '#A1A4AA' }}>
        {task.description}
      </p>

      {/* Action buttons for paused tasks */}
      {task.status === 'paused_awaiting_confirmation' && (
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => onConfirm(task.id)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all"
            style={{ backgroundColor: 'rgba(54,207,201,0.2)', color: '#36CFC9' }}
          >
            <CheckCircle size={9} />
            Bestätigen
          </button>
          <button
            onClick={() => onCancel(task.id)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all"
            style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}
          >
            <X size={9} />
            Ablehnen
          </button>
          {task.legalRisk !== 'none' && (
            <span className="text-[9px] ml-auto" style={{ color: '#F5C542' }}>
              <AlertTriangle size={9} className="inline mr-0.5" />
              Rechtlich
            </span>
          )}
        </div>
      )}
    </div>
  );
}
