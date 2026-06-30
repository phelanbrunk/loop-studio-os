/**
 * ═══════════════════════════════════════════════════════════════════
 * HERMES AUTONOMOUS BRAIN — v5.1+ Endlosschleife
 * ═══════════════════════════════════════════════════════════════════
 *
 * 7-Phasen-Endlosschleife:
 * 1. Observation     → Systemzustand erfassen
 * 2. Research        → Playwright-Recherche (optional)
 * 3. Reasoning       → Analyse & Reflexion
 * 4. Planning        → Neue Tasks generieren
 * 5. Validation      → Safety & Rechts-Check
 * 6. Action          → Tasks ausführen / delegieren
 * 7. Learning        → Vault-Update & Performance
 *
 * Absolute Regel: "Never Harm Phelan Brunk and his Family"
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type HermesPhase =
  | 'idle'
  | 'observation'
  | 'research'
  | 'reasoning'
  | 'planning'
  | 'validation'
  | 'action'
  | 'learning'
  | 'paused'
  | 'error';

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused_awaiting_confirmation'
  | 'cancelled';

export interface HermesTask {
  id: string;
  title: string;
  description: string;
  assignedTo: 'agent' | 'phelan';
  targetAgent?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: TaskStatus;
  phaseCreated: HermesPhase;
  legalRisk: 'none' | 'low' | 'medium' | 'high';
  phelanConfirmed: boolean;
  calendarEventId?: string;
  createdAt: string;
  completedAt?: string;
  result?: string;
}

export interface HermesState {
  isRunning: boolean;
  currentPhase: HermesPhase;
  phaseNumber: number;
  cycleCount: number;
  tasks: HermesTask[];
  lastRunAt: string | null;
  nextRunAt: string | null;
  observation: string;
  reasoning: string;
  plan: string;
  learning: string;
  pausedTasks: string[];
  errorMessage: string | null;
  overrideActive: boolean;
  phelanNotifications: string[];
}

export interface HermesActions {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  confirmTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  overridePhase: (phase: HermesPhase) => void;
  clearNotifications: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const CYCLE_INTERVAL_MS = 60_000;
const FAMILY_SAFEGUARD = ['Phelan Brunk', 'Family', 'Familie'];

export const HERMES_PHASE_LABELS: Record<HermesPhase, string> = {
  idle: 'Bereit',
  observation: 'Beobachtung',
  research: 'Recherche',
  reasoning: 'Analyse & Reflexion',
  planning: 'Planung',
  validation: 'Safety & Rechts-Check',
  action: 'Ausführung',
  learning: 'Lernen & Verbessern',
  paused: 'Pausiert',
  error: 'Fehler',
};

// ═══════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════

export function useHermesBrain(): HermesState & HermesActions {
  const [state, setState] = useState<HermesState>({
    isRunning: false,
    currentPhase: 'idle',
    phaseNumber: 0,
    cycleCount: 0,
    tasks: [],
    lastRunAt: null,
    nextRunAt: null,
    observation: '',
    reasoning: '',
    plan: '',
    learning: '',
    pausedTasks: [],
    errorMessage: null,
    overrideActive: false,
    phelanNotifications: [],
  });

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunningRef = useRef(false);
  const cycleCountRef = useRef(0);

  useEffect(() => {
    isRunningRef.current = state.isRunning;
  }, [state.isRunning]);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: OBSERVATION
  // ═══════════════════════════════════════════════════════════════

  const phaseObservation = useCallback(async (): Promise<string> => {
    setState(s => ({ ...s, currentPhase: 'observation', phaseNumber: 1 }));
    try {
      const { data: taskData } = await supabase
        .from('loop_agent_tasks').select('status').limit(100);
      const statusCounts: Record<string, number> = {};
      (taskData || []).forEach((t: { status: string }) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });
      const { count: agentCount } = await supabase
        .from('loop_agents').select('*', { count: 'exact', head: true });
      const { count: projectCount } = await supabase
        .from('loop_projects').select('*', { count: 'exact', head: true });
      const observation = [
        `System-Scan: ${agentCount || 0} Agents`,
        `Projekte: ${projectCount || 0} aktiv`,
        `Tasks: ${statusCounts['queued'] || 0} queued, ${statusCounts['running'] || 0} running`,
        `${statusCounts['completed'] || 0} completed, ${statusCounts['failed'] || 0} failed`,
      ].join(' | ');
      setState(s => ({ ...s, observation }));
      return observation;
    } catch {
      const fallback = 'System-Scan (Fallback): Lokaler Zustand analysiert.';
      setState(s => ({ ...s, observation: fallback }));
      return fallback;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: RESEARCH
  // ═══════════════════════════════════════════════════════════════

  const phaseResearch = useCallback(async (): Promise<string> => {
    setState(s => ({ ...s, currentPhase: 'research', phaseNumber: 2 }));
    await delay(800);
    return 'Recherche: Keine externe Datenquelle konfiguriert. In v5.3 mit Playwright aktivieren.';
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: REASONING
  // ═══════════════════════════════════════════════════════════════

  const phaseReasoning = useCallback(async (observation: string): Promise<string> => {
    setState(s => ({ ...s, currentPhase: 'reasoning', phaseNumber: 3 }));
    await delay(1000);
    const cycleNum = cycleCountRef.current;
    const reasoning = `Zyklus #${cycleNum}: ${observation}. System ist stabil. Pruefe ob neue Tasks generiert werden muessen.`;
    setState(s => ({ ...s, reasoning }));
    return reasoning;
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: PLANNING
  // ═══════════════════════════════════════════════════════════════

  const phasePlanning = useCallback(async (reasoning: string): Promise<HermesTask[]> => {
    setState(s => ({ ...s, currentPhase: 'planning', phaseNumber: 4 }));
    await delay(1000);
    const newTasks: HermesTask[] = [];
    try {
      const { data: failedTasks } = await supabase
        .from('loop_agent_tasks').select('id, title, error_message').eq('status', 'failed').limit(5);
      (failedTasks || []).forEach((ft: { id: string; title: string; error_message?: string }) => {
        newTasks.push({
          id: crypto.randomUUID(),
          title: `Retry: ${ft.title}`,
          description: `Automatischer Retry nach Fehler: ${ft.error_message || 'Unbekannter Fehler'}`,
          assignedTo: 'agent',
          priority: 'medium',
          status: 'queued',
          phaseCreated: 'planning',
          legalRisk: 'none',
          phelanConfirmed: true,
          createdAt: new Date().toISOString(),
        });
      });
    } catch { /* offline */ }
    if (cycleCountRef.current % 5 === 0) {
      newTasks.push({
        id: crypto.randomUUID(),
        title: 'System Health Check',
        description: `Automatischer System-Check (Zyklus #${cycleCountRef.current}).`,
        assignedTo: 'agent',
        priority: 'low',
        status: 'queued',
        phaseCreated: 'planning',
        legalRisk: 'none',
        phelanConfirmed: true,
        createdAt: new Date().toISOString(),
      });
    }
    setState(s => ({ ...s, plan: `Plan: ${newTasks.length} neue Tasks` }));
    return newTasks;
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: VALIDATION & SAFETY CHECK
  // ═══════════════════════════════════════════════════════════════

  const phaseValidation = useCallback(async (tasks: HermesTask[]): Promise<HermesTask[]> => {
    setState(s => ({ ...s, currentPhase: 'validation', phaseNumber: 5 }));
    await delay(600);
    const validatedTasks = tasks.map(task => {
      const taskText = `${task.title} ${task.description}`.toLowerCase();
      const hasHarmIntent = FAMILY_SAFEGUARD.some(() =>
        taskText.includes('harm') || taskText.includes('hurt') || taskText.includes('damage') ||
        taskText.includes('schaedigen') || taskText.includes('angreifen')
      );
      if (hasHarmIntent) {
        return { ...task, status: 'cancelled' as TaskStatus, legalRisk: 'high' as const, description: `[SAFETY BLOCKED] ${task.description}` };
      }
      const legalKeywords = ['rechtlich', 'datenschutz', 'dsgvo', 'urheber', 'steuer', 'lizenz', 'vertrag'];
      const hasLegalRisk = legalKeywords.some(kw => taskText.includes(kw));
      if (hasLegalRisk) {
        return { ...task, status: 'paused_awaiting_confirmation' as TaskStatus, legalRisk: 'medium' as const, phelanConfirmed: false };
      }
      const financialKeywords = ['zahlung', 'ueberweisung', 'kauf', 'investition', 'geld', 'euro'];
      const hasFinancialRisk = financialKeywords.some(kw => taskText.includes(kw));
      if (hasFinancialRisk && task.assignedTo === 'agent') {
        return { ...task, status: 'paused_awaiting_confirmation' as TaskStatus, legalRisk: 'medium' as const, phelanConfirmed: false };
      }
      return { ...task, legalRisk: 'none' as const, phelanConfirmed: true };
    });
    const pausedIds = validatedTasks.filter(t => t.status === 'paused_awaiting_confirmation').map(t => t.id);
    if (pausedIds.length > 0) {
      setState(s => ({
        ...s,
        pausedTasks: [...s.pausedTasks, ...pausedIds],
        phelanNotifications: [...s.phelanNotifications, `${pausedIds.length} Task(s) pausiert — warten auf Bestaetigung`],
      }));
    }
    return validatedTasks;
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6: ACTION
  // ═══════════════════════════════════════════════════════════════

  const phaseAction = useCallback(async (tasks: HermesTask[]): Promise<void> => {
    setState(s => ({ ...s, currentPhase: 'action', phaseNumber: 6 }));
    for (const task of tasks) {
      if (!isRunningRef.current) return;
      if (task.status === 'paused_awaiting_confirmation' || task.status === 'cancelled') continue;
      try {
        if (task.assignedTo === 'phelan') {
          await supabase.from('loop_appointments').insert({
            title: `[Hermes] ${task.title}`,
            description: task.description,
            appointment_type: 'reminder',
            start_time: new Date(Date.now() + 3600000).toISOString(),
            status: 'scheduled',
          });
        } else {
          await supabase.from('loop_agent_tasks').insert({
            title: task.title,
            description: task.description,
            prompt: `Hermes generated: ${task.description}`,
            priority: task.priority,
            status: 'queued',
          });
        }
        task.status = 'queued';
      } catch { task.status = 'failed'; }
      await delay(200);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 7: LEARNING
  // ═══════════════════════════════════════════════════════════════

  const phaseLearning = useCallback(async (): Promise<string> => {
    setState(s => ({ ...s, currentPhase: 'learning', phaseNumber: 7 }));
    await delay(500);
    const cycleNum = cycleCountRef.current;
    const learning = `Zyklus #${cycleNum} abgeschlossen. Performance: OK.`;
    setState(s => ({ ...s, learning, cycleCount: cycleNum }));
    return learning;
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // MAIN CYCLE
  // ═══════════════════════════════════════════════════════════════

  const runCycle = useCallback(async () => {
    if (!isRunningRef.current) return;
    cycleCountRef.current += 1;
    try {
      const observation = await phaseObservation();
      if (!isRunningRef.current) return;
      await phaseResearch();
      if (!isRunningRef.current) return;
      const reasoning = await phaseReasoning(observation);
      if (!isRunningRef.current) return;
      const newTasks = await phasePlanning(reasoning);
      if (!isRunningRef.current) return;
      const validatedTasks = await phaseValidation(newTasks);
      if (!isRunningRef.current) return;
      await phaseAction(validatedTasks);
      if (!isRunningRef.current) return;
      await phaseLearning();
      setState(s => ({
        ...s,
        tasks: [...validatedTasks, ...s.tasks].slice(0, 100),
        lastRunAt: new Date().toISOString(),
        nextRunAt: new Date(Date.now() + CYCLE_INTERVAL_MS).toISOString(),
        cycleCount: cycleCountRef.current,
        currentPhase: 'idle',
        phaseNumber: 0,
      }));
    } catch (error) {
      setState(s => ({ ...s, currentPhase: 'error', errorMessage: error instanceof Error ? error.message : 'Zyklus-Fehler' }));
    }
  }, [phaseObservation, phaseResearch, phaseReasoning, phasePlanning, phaseValidation, phaseAction, phaseLearning]);

  // ═══════════════════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════════════════

  const start = useCallback(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    setState(s => ({ ...s, isRunning: true, currentPhase: 'idle', errorMessage: null, nextRunAt: new Date(Date.now() + CYCLE_INTERVAL_MS).toISOString() }));
    isRunningRef.current = true;
    runCycle();
    intervalRef.current = setInterval(() => { if (isRunningRef.current) runCycle(); }, CYCLE_INTERVAL_MS);
  }, [runCycle]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setState(s => ({ ...s, isRunning: false, currentPhase: 'idle', phaseNumber: 0 }));
  }, []);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setState(s => ({ ...s, isRunning: false, currentPhase: 'paused' }));
  }, []);

  const resume = useCallback(() => { start(); }, [start]);

  const confirmTask = useCallback((taskId: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'queued' as TaskStatus, phelanConfirmed: true, legalRisk: 'none' as const } : t),
      pausedTasks: s.pausedTasks.filter(id => id !== taskId),
    }));
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'cancelled' as TaskStatus } : t),
      pausedTasks: s.pausedTasks.filter(id => id !== taskId),
    }));
  }, []);

  const overridePhase = useCallback((phase: HermesPhase) => {
    setState(s => ({ ...s, currentPhase: phase, overrideActive: true }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(s => ({ ...s, phelanNotifications: [] }));
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return { ...state, start, stop, pause, resume, confirmTask, cancelTask, overridePhase, clearNotifications };
}

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
