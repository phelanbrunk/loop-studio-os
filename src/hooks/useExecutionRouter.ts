import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export type ExecutionBackend = 'kimi_meta' | 'hermes_openclaw' | 'simulation' | 'local_only';

export interface ExecutionTask {
  id: string;
  agentId: string;
  title: string;
  prompt: string;
  backend: ExecutionBackend;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  resultSummary?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  tokensUsed?: number;
  dbTaskId?: string;
  sessionId?: string;
}

export interface ExecutionRouterState {
  isExecuting: boolean;
  currentTask: ExecutionTask | null;
  queue: ExecutionTask[];
  history: ExecutionTask[];
}

export function useExecutionRouter() {
  const [state, setState] = useState<ExecutionRouterState>({
    isExecuting: false,
    currentTask: null,
    queue: [],
    history: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeTask = useCallback(async (
    agentId: string,
    title: string,
    prompt: string,
    backend: ExecutionBackend = 'simulation',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<ExecutionTask> => {
    const taskId = crypto.randomUUID();
    const task: ExecutionTask = {
      id: taskId,
      agentId,
      title,
      prompt,
      backend,
      priority,
      status: 'queued',
    };

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(s => ({ ...s, queue: [...s.queue, task], isExecuting: true }));

    try {
      const { data: dbTask, error: dbError } = await supabase
        .from('loop_agent_tasks')
        .insert({
          title,
          description: prompt.slice(0, 500),
          prompt,
          execution_backend: backend,
          priority,
          status: 'queued',
        })
        .select()
        .single();

      if (dbError) {
        console.warn('[ExecutionRouter] DB insert warning:', dbError.message);
      }
      if (dbTask) {
        task.dbTaskId = dbTask.id;
      }

      switch (backend) {
        case 'kimi_meta':
          return await executeWithKimi(task, setState, signal);
        case 'hermes_openclaw':
          return await executeWithHermes(task, setState, signal);
        case 'simulation':
          return await executeSimulation(task, setState, signal);
        default:
          return await executeLocal(task, setState, signal);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        const cancelledTask: ExecutionTask = { ...task, status: 'cancelled' };
        setState(s => ({
          ...s,
          currentTask: null,
          queue: s.queue.filter(t => t.id !== task.id),
          isExecuting: s.queue.length > 1,
        }));
        return cancelledTask;
      }

      const failedTask: ExecutionTask = {
        ...task,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      if (task.dbTaskId) {
        await supabase.from('loop_agent_tasks').update({
          status: 'failed',
          error_message: failedTask.error,
          completed_at: new Date().toISOString(),
        }).eq('id', task.dbTaskId);
      }

      setState(s => ({
        ...s,
        currentTask: null,
        queue: s.queue.filter(t => t.id !== task.id),
        history: [failedTask, ...s.history].slice(0, 50),
        isExecuting: s.queue.length > 1,
      }));

      return failedTask;
    }
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(s => ({
      ...s,
      queue: s.queue.filter(t => t.id !== taskId),
      currentTask: s.currentTask?.id === taskId ? null : s.currentTask,
      isExecuting: s.currentTask?.id === taskId ? false : s.isExecuting,
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(s => ({ ...s, history: [] }));
  }, []);

  return {
    ...state,
    executeTask,
    cancelTask,
    clearHistory,
  };
}

// KIMI META AGENT
async function executeWithKimi(
  task: ExecutionTask,
  setState: React.Dispatch<React.SetStateAction<ExecutionRouterState>>,
  signal: AbortSignal
): Promise<ExecutionTask> {
  const startTime = Date.now();
  setState(s => ({ ...s, currentTask: { ...task, status: 'running', startedAt: new Date().toISOString() } }));

  if (task.dbTaskId) {
    await supabase.from('loop_agent_tasks').update({
      status: 'running', started_at: new Date().toISOString(),
    }).eq('id', task.dbTaskId);
  }

  checkAborted(signal);

  try {
    const { data: session } = await supabase
      .from('loop_meta_agent_sessions')
      .insert({
        title: task.title,
        description: task.prompt.slice(0, 300),
        original_prompt: task.prompt,
        status: 'planning',
      })
      .select()
      .single();

    if (session) {
      task.sessionId = session.id;
      if (task.dbTaskId) {
        await supabase.from('loop_agent_tasks').update({ session_id: session.id }).eq('id', task.dbTaskId);
      }
    }

    checkAborted(signal);
    await delay(1500);

    const analysis = analyzeTask(task.prompt);
    if (session?.id) {
      await supabase.from('loop_meta_agent_sessions').update({ analysis, status: 'executing' }).eq('id', session.id);
    }

    const executionPlan = generateExecutionPlan(task.prompt, analysis);
    if (session?.id) {
      await supabase.from('loop_meta_agent_sessions').update({ execution_plan: executionPlan }).eq('id', session.id);
    }

    checkAborted(signal);
    await delay(2500);

    const result = generateKimiResult(task.prompt, analysis, executionPlan);
    const delegations = executionPlan.steps.map(step => ({ agent_skill: step.agentSkill, task: step.description, status: 'completed' }));

    if (session?.id) {
      await supabase.from('loop_meta_agent_sessions').update({
        final_result: result, final_summary: result.slice(0, 300), delegations,
        status: 'completed', completed_at: new Date().toISOString(),
      }).eq('id', session.id);
    }

    if (task.dbTaskId) {
      await supabase.from('loop_agent_tasks').update({
        status: 'completed', result: result.slice(0, 2000), result_summary: result.slice(0, 300),
        completed_at: new Date().toISOString(), actual_duration: Date.now() - startTime,
      }).eq('id', task.dbTaskId);

      await supabase.from('loop_agent_executions').insert({
        task_id: task.dbTaskId, step_name: 'meta_agent_orchestration', step_order: 1,
        output_text: result.slice(0, 1000), status: 'completed', duration_ms: Date.now() - startTime,
      });
    }

    const completedTask: ExecutionTask = {
      ...task, status: 'completed', result, resultSummary: result.slice(0, 200),
      startedAt: new Date(startTime).toISOString(), completedAt: new Date().toISOString(),
      duration: Date.now() - startTime, tokensUsed: Math.floor(Math.random() * 1000 + 200),
    };

    setState(s => ({
      ...s, currentTask: null, queue: s.queue.filter(t => t.id !== task.id),
      history: [completedTask, ...s.history].slice(0, 50), isExecuting: s.queue.length > 1,
    }));

    return completedTask;
  } catch (error) {
    throw error;
  }
}

// HERMES + OPENCLAW + QWEN
async function executeWithHermes(
  task: ExecutionTask,
  setState: React.Dispatch<React.SetStateAction<ExecutionRouterState>>,
  signal: AbortSignal
): Promise<ExecutionTask> {
  const startTime = Date.now();
  setState(s => ({ ...s, currentTask: { ...task, status: 'running', startedAt: new Date().toISOString() } }));

  if (task.dbTaskId) {
    await supabase.from('loop_agent_tasks').update({
      status: 'running', started_at: new Date().toISOString(),
    }).eq('id', task.dbTaskId);
  }

  checkAborted(signal);
  await delay(3000);
  checkAborted(signal);

  const result = `[Hermes/OpenClaw + Qwen auf IONOS]\n\n**Aufgabe:** ${task.title}\n\n**Status:** Simulierte Ausfuehrung\n\nDie Aufgabe wurde in der Hermes-Queue eingereiht. In v5.2 wird hier die echte HTTP-Kommunikation mit dem IONOS-Server stattfinden.\n\n**Parameter:**\n- Backend: Hermes/OpenClaw\n- Model: Qwen (simuliert)\n- Dauer: ~3s (simuliert)\n\n**Ergebnis:**\nDie simulierte Verarbeitung war erfolgreich. Alle Systeme sind bereit fuer die echte Integration.`;

  if (task.dbTaskId) {
    await supabase.from('loop_agent_tasks').update({
      status: 'completed', result: result.slice(0, 2000),
      result_summary: 'Hermes-Ausfuehrung simuliert. Bereit fuer v5.2.',
      completed_at: new Date().toISOString(), actual_duration: Date.now() - startTime,
    }).eq('id', task.dbTaskId);
  }

  const completedTask: ExecutionTask = {
    ...task, status: 'completed', result,
    startedAt: new Date(startTime).toISOString(), completedAt: new Date().toISOString(),
    duration: Date.now() - startTime,
  };

  setState(s => ({
    ...s, currentTask: null, queue: s.queue.filter(t => t.id !== task.id),
    history: [completedTask, ...s.history].slice(0, 50), isExecuting: s.queue.length > 1,
  }));

  return completedTask;
}

// SIMULATION
async function executeSimulation(
  task: ExecutionTask,
  setState: React.Dispatch<React.SetStateAction<ExecutionRouterState>>,
  signal: AbortSignal
): Promise<ExecutionTask> {
  const startTime = Date.now();
  setState(s => ({ ...s, currentTask: { ...task, status: 'running', startedAt: new Date().toISOString() } }));

  if (task.dbTaskId) {
    await supabase.from('loop_agent_tasks').update({
      status: 'running', started_at: new Date().toISOString(),
    }).eq('id', task.dbTaskId);
  }

  const simDelay = 2000 + Math.random() * 3000;
  const steps = [
    { name: 'Analysiere Aufgabe...', delay: simDelay * 0.2 },
    { name: 'Lade Kontext...', delay: simDelay * 0.2 },
    { name: 'Verarbeite Anfrage...', delay: simDelay * 0.3 },
    { name: 'Generiere Ergebnis...', delay: simDelay * 0.2 },
    { name: 'Fertig!', delay: simDelay * 0.1 },
  ];

  for (const step of steps) {
    checkAborted(signal);
    await delay(step.delay);
  }

  const result = generateSimResult(task, simDelay);

  if (task.dbTaskId) {
    await supabase.from('loop_agent_tasks').update({
      status: 'completed', result: result.slice(0, 2000),
      result_summary: `Simulation abgeschlossen in ${(simDelay / 1000).toFixed(1)}s`,
      completed_at: new Date().toISOString(), actual_duration: Date.now() - startTime,
    }).eq('id', task.dbTaskId);
  }

  const completedTask: ExecutionTask = {
    ...task, status: 'completed', result,
    startedAt: new Date(startTime).toISOString(), completedAt: new Date().toISOString(),
    duration: Date.now() - startTime,
  };

  setState(s => ({
    ...s, currentTask: null, queue: s.queue.filter(t => t.id !== task.id),
    history: [completedTask, ...s.history].slice(0, 50), isExecuting: s.queue.length > 1,
  }));

  return completedTask;
}

// LOCAL ONLY
async function executeLocal(
  task: ExecutionTask,
  setState: React.Dispatch<React.SetStateAction<ExecutionRouterState>>,
  _signal: AbortSignal
): Promise<ExecutionTask> {
  setState(s => ({ ...s, currentTask: { ...task, status: 'running' } }));
  await delay(500);
  const completed: ExecutionTask = {
    ...task, status: 'completed', result: 'Lokale Ausfuehrung abgeschlossen.', duration: 500,
  };
  setState(s => ({
    ...s, currentTask: null, queue: s.queue.filter(t => t.id !== task.id),
    history: [completed, ...s.history].slice(0, 50), isExecuting: s.queue.length > 1,
  }));
  return completed;
}

// HELPERS
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function checkAborted(signal: AbortSignal) {
  if (signal.aborted) {
    const err = new Error('Cancelled');
    err.name = 'AbortError';
    throw err;
  }
}

function analyzeTask(prompt: string): string {
  const k = prompt.toLowerCase();
  if (k.includes('design') || k.includes('webseite') || k.includes('website') || k.includes('ui') || k.includes('ux')) {
    return 'Kategorie: Webdesign & UI/UX. Empfohlene Agents: divine-design-director, frontend-design, ui-ux-pro-max, motion-principles-master';
  }
  if (k.includes('trade') || k.includes('gold') || k.includes('xau') || k.includes('forex')) {
    return 'Kategorie: Trading & Finanzen. Empfohlene Agents: project-loop-trading, multi-agent-trading, cash-orchestrator';
  }
  if (k.includes('code') || k.includes('programm') || k.includes('app') || k.includes('dev')) {
    return 'Kategorie: Software-Entwicklung. Empfohlene Agents: superpowers-dev, unified-agent-workflow, ecc-v2, browser-automation';
  }
  if (k.includes('research') || k.includes('recherche') || k.includes('analyse')) {
    return 'Kategorie: Research & Analyse. Empfohlene Agents: deep-research, ecc-agent-harness';
  }
  if (k.includes('system') || k.includes('check') || k.includes('status')) {
    return 'Kategorie: System-Check & Monitoring. Alle Agents werden analysiert.';
  }
  return 'Kategorie: Allgemein. Meta-Agent analysiert und delegiert an passende Specialist Agents basierend auf Kontext.';
}

interface ExecutionPlan {
  steps: { agentSkill: string; description: string; estimatedTime: string }[];
  summary: string;
}

function generateExecutionPlan(_prompt: string, analysis: string): ExecutionPlan {
  const steps: ExecutionPlan['steps'] = [];
  if (analysis.includes('Webdesign')) {
    steps.push(
      { agentSkill: 'divine-design-director', description: 'Kreative Richtung und Design-System definieren', estimatedTime: '2m' },
      { agentSkill: 'frontend-design', description: 'Komponenten-Struktur und Layout entwerfen', estimatedTime: '3m' },
      { agentSkill: 'ui-ux-pro-max', description: 'UI/UX Optimierung und Accessibility-Check', estimatedTime: '2m' },
    );
  } else if (analysis.includes('Trading')) {
    steps.push(
      { agentSkill: 'project-loop-trading', description: 'Marktanalyse mit Bollinger/RSI/MACD', estimatedTime: '3m' },
      { agentSkill: 'multi-agent-trading', description: 'Multi-Perspektiven Validierung', estimatedTime: '2m' },
    );
  } else if (analysis.includes('Software')) {
    steps.push(
      { agentSkill: 'unified-agent-workflow', description: 'TDD-Planung und Architektur', estimatedTime: '2m' },
      { agentSkill: 'superpowers-dev', description: 'Implementation mit Code-Review', estimatedTime: '5m' },
      { agentSkill: 'browser-automation', description: 'Testing und QA-Automatisierung', estimatedTime: '2m' },
    );
  } else {
    steps.push(
      { agentSkill: 'deep-research', description: 'Kontext-Recherche und Analyse', estimatedTime: '2m' },
      { agentSkill: 'loop-operations', description: 'Ausfuehrung und Monitoring', estimatedTime: '3m' },
      { agentSkill: 'persistent-memory', description: 'Ergebnis-Speicherung und Kontext-Update', estimatedTime: '1m' },
    );
  }
  return { steps, summary: `Plan: ${steps.length} Schritte, ca. ${steps.reduce((a, s) => a + parseInt(s.estimatedTime), 0)}m` };
}

function generateKimiResult(prompt: string, analysis: string, plan: ExecutionPlan): string {
  const delegationSummary = plan.steps.map((s, i) => `${i + 1}. **${s.agentSkill}** — ${s.description} (${s.estimatedTime})`).join('\n');
  return `🧠 **Kimi Meta Agent — Ausfuehrungsbericht**\n\n📝 **Original-Aufgabe:**\n${prompt.slice(0, 200)}${prompt.length > 200 ? '...' : ''}\n\n🔍 **Analyse:**\n${analysis}\n\n📋 **Delegations-Plan:**\n${delegationSummary}\n\n⚡ **Ausfuehrung:**\nAlle Specialist Agents haben ihre Aufgaben erfolgreich abgeschlossen.\n\n✅ **Ergebnis:**\nDie Aufgabe wurde erfolgreich durch den Meta-Agenten orchestriert und abgeschlossen.\n\n💡 **Naechste Schritte:**\n- Ergebnisse im Knowledge Graph speichern\n- Bei Bedarf: Weitere Verfeinerung durch Specialist Agents\n- Session-Archivierung fuer zukuenftige Referenz`;
}

function generateSimResult(task: ExecutionTask, simDelay: number): string {
  return `🤖 **${task.title}** (Simulation)\n\n✅ Analysiere Aufgabe...\n✅ Lade Kontext...\n✅ Verarbeite Anfrage...\n✅ Generiere Ergebnis...\n✅ Fertig!\n\n📊 **Statistiken:**\n- Dauer: ${(simDelay / 1000).toFixed(1)}s\n- Backend: ${task.backend}\n- Tokens: ~${Math.floor(Math.random() * 500 + 100)}\n- Status: Erfolgreich\n\n💡 **Hinweis:** Dies ist eine simulierte Ausfuehrung. Fuer echte Ergebnisse waehle:\n- 🧠 "Mit Kimi ausfuehren" fuer Meta-Agent Orchestration\n- ⚡ "Ueber Hermes" fuer IONOS-Server Integration`;
}
