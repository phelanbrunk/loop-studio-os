import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type CycleStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export type PhaseName =
  | 'observation'
  | 'research'
  | 'reasoning'
  | 'planning'
  | 'validation'
  | 'action'
  | 'learning';

export interface PhaseData {
  status: 'not_started' | 'in_progress' | 'completed' | 'error';
  started_at: string | null;
  completed_at: string | null;
  data: Record<string, unknown> | null;
  summary: string | null;
}

export interface PhaseStatus {
  phase: PhaseName;
  phaseNumber: number;
  status: PhaseData['status'];
  isCurrent: boolean;
  startedAt: string | null;
  completedAt: string | null;
  summary: string | null;
}

export interface BrainCycle {
  id: string;
  cycleNumber: number;
  status: CycleStatus;
  phaseObservation: PhaseData;
  phaseResearch: PhaseData;
  phaseReasoning: PhaseData;
  phasePlanning: PhaseData;
  phaseValidation: PhaseData;
  phaseAction: PhaseData;
  phaseLearning: PhaseData;
  summary: string | null;
  tasksGenerated: number;
  tasksCompleted: number;
  tasksPaused: number;
  phelanTasksCreated: number;
  learnings: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export type PhelanTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PhelanPriority = 'low' | 'medium' | 'high' | 'critical';

export interface PhelanTask {
  id: string;
  title: string;
  description: string | null;
  status: PhelanTaskStatus;
  priority: PhelanPriority;
  dueDate: string | null;
  calendarEventId: string | null;
  notificationSent: boolean;
  notificationRead: boolean;
  createdBy: string | null;
  hermesReasoning: string | null;
  sourceCycleId: string | null;
  relatedTaskId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

const PHASE_NAMES: PhaseName[] = [
  'observation',
  'research',
  'reasoning',
  'planning',
  'validation',
  'action',
  'learning',
];

const PHASE_DB_COLUMNS: string[] = [
  'phase_observation',
  'phase_research',
  'phase_reasoning',
  'phase_planning',
  'phase_validation',
  'phase_action',
  'phase_learning',
];

function mapRowToBrainCycle(row: Record<string, unknown>): BrainCycle {
  return {
    id: row.id as string,
    cycleNumber: (row.cycle_number as number) ?? 0,
    status: (row.status as CycleStatus) ?? 'idle',
    phaseObservation: (row.phase_observation as PhaseData) ?? {
      status: 'not_started',
      started_at: null,
      completed_at: null,
      data: null,
      summary: null,
    },
    phaseResearch: (row.phase_research as PhaseData) ?? {
      status: 'not_started',
      started_at: null,
      completed_at: null,
      data: null,
      summary: null,
    },
    phaseReasoning: (row.phase_reasoning as PhaseData) ?? {
      status: 'not_started',
      started_at: null,
      completed_at: null,
      data: null,
      summary: null,
    },
    phasePlanning: (row.phase_planning as PhaseData) ?? {
      status: 'not_started',
      started_at: null,
      completed_at: null,
      data: null,
      summary: null,
    },
    phaseValidation: (row.phase_validation as PhaseData) ?? {
      status: 'not_started',
      started_at: null,
      completed_at: null,
      data: null,
      summary: null,
    },
    phaseAction: (row.phase_action as PhaseData) ?? {
      status: 'not_started',
      started_at: null,
      completed_at: null,
      data: null,
      summary: null,
    },
    phaseLearning: (row.phase_learning as PhaseData) ?? {
      status: 'not_started',
      started_at: null,
      completed_at: null,
      data: null,
      summary: null,
    },
    summary: (row.summary as string | null) ?? null,
    tasksGenerated: (row.tasks_generated as number) ?? 0,
    tasksCompleted: (row.tasks_completed as number) ?? 0,
    tasksPaused: (row.tasks_paused as number) ?? 0,
    phelanTasksCreated: (row.phelan_tasks_created as number) ?? 0,
    learnings: (row.learnings as string[] | null) ?? null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

function mapRowToPhelanTask(row: Record<string, unknown>): PhelanTask {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: (row.status as PhelanTaskStatus) ?? 'pending',
    priority: (row.priority as PhelanPriority) ?? 'medium',
    dueDate: (row.due_date as string | null) ?? null,
    calendarEventId: (row.calendar_event_id as string | null) ?? null,
    notificationSent: (row.notification_sent as boolean) ?? false,
    notificationRead: (row.notification_read as boolean) ?? false,
    createdBy: (row.created_by as string | null) ?? null,
    hermesReasoning: (row.hermes_reasoning as string | null) ?? null,
    sourceCycleId: (row.source_cycle_id as string | null) ?? null,
    relatedTaskId: (row.related_task_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Hook for controlling the Hermes 7-phase brain loop.
 *
 * Provides:
 * - `currentCycle` — the active brain cycle
 * - `cycles` — history of all cycles
 * - `isRunning` — whether a cycle is currently running
 * - `startCycle()` — begin a new brain cycle
 * - `pauseCycle()` — pause the current cycle
 * - `resumeCycle()` — resume a paused cycle
 * - `getPhaseStatus(phase)` — detailed status of any phase
 * - `activePhelanTasks` — Phelan tasks generated by the current cycle
 * - `createPhelanTask()` — manually create a Phelan task
 * - `markPhelanTaskRead()` — mark a Phelan notification as read
 *
 * Subscribes to Supabase Realtime for live cycle and Phelan task updates.
 */
export function useHermesBrain() {
  const [currentCycle, setCurrentCycle] = useState<BrainCycle | null>(null);
  const [cycles, setCycles] = useState<BrainCycle[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePhelanTasks, setActivePhelanTasks] = useState<PhelanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cycleChannelRef = useRef<RealtimeChannel | null>(null);
  const phelanChannelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Fetch all cycles and determine the current one.
   */
  const fetchCycles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('loop_hermes_brain_cycles')
        .select('*')
        .order('cycle_number', { ascending: false })
        .limit(50);

      if (fetchError) {
        setError(`Failed to fetch cycles: ${fetchError.message}`);
        return;
      }

      const mapped = (data ?? []).map((row) =>
        mapRowToBrainCycle(row as Record<string, unknown>)
      );

      setCycles(mapped);

      // Determine the current (active or most recent) cycle
      const active = mapped.find(
        (c) => c.status === 'running' || c.status === 'paused'
      );
      if (active) {
        setCurrentCycle(active);
        setIsRunning(active.status === 'running');
      } else if (mapped.length > 0) {
        setCurrentCycle(mapped[0]);
        setIsRunning(false);
      } else {
        setCurrentCycle(null);
        setIsRunning(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching cycles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch active Phelan tasks.
   */
  const fetchPhelanTasks = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('loop_phelan_tasks')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        setError(`Failed to fetch Phelan tasks: ${fetchError.message}`);
        return;
      }

      setActivePhelanTasks(
        (data ?? []).map((row) => mapRowToPhelanTask(row as Record<string, unknown>))
      );
    } catch {
      // Non-critical — don't block on Phelan task fetch errors
    }
  }, []);

  /**
   * Start a new brain cycle. Automatically determines the next cycle number.
   */
  const startCycle = useCallback(async (): Promise<BrainCycle | null> => {
    try {
      setError(null);

      // Get the highest cycle number
      const { data: maxRow } = await supabase
        .from('loop_hermes_brain_cycles')
        .select('cycle_number')
        .order('cycle_number', { ascending: false })
        .limit(1)
        .single();

      const nextNumber = ((maxRow?.cycle_number as number) ?? 0) + 1;

      const now = new Date().toISOString();

      const { data, error: insertError } = await supabase
        .from('loop_hermes_brain_cycles')
        .insert({
          cycle_number: nextNumber,
          status: 'running',
          phase_observation: {
            status: 'in_progress',
            started_at: now,
            completed_at: null,
            data: null,
            summary: null,
          },
          tasks_generated: 0,
          tasks_completed: 0,
          tasks_paused: 0,
          phelan_tasks_created: 0,
          learnings: [],
        })
        .select('*')
        .single();

      if (insertError) {
        setError(`Failed to start cycle: ${insertError.message}`);
        return null;
      }

      const cycle = mapRowToBrainCycle(data as Record<string, unknown>);
      setCurrentCycle(cycle);
      setIsRunning(true);
      setCycles((prev) => [cycle, ...prev]);

      return cycle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error starting cycle');
      return null;
    }
  }, []);

  /**
   * Pause the current cycle.
   */
  const pauseCycle = useCallback(async (): Promise<boolean> => {
    if (!currentCycle) {
      setError('No active cycle to pause');
      return false;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentCycle.id);

      if (updateError) {
        setError(`Failed to pause cycle: ${updateError.message}`);
        return false;
      }

      setIsRunning(false);
      setCurrentCycle((prev) =>
        prev ? { ...prev, status: 'paused' } : prev
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error pausing cycle');
      return false;
    }
  }, [currentCycle]);

  /**
   * Resume a paused cycle.
   */
  const resumeCycle = useCallback(async (): Promise<boolean> => {
    if (!currentCycle) {
      setError('No cycle to resume');
      return false;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          status: 'running',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentCycle.id);

      if (updateError) {
        setError(`Failed to resume cycle: ${updateError.message}`);
        return false;
      }

      setIsRunning(true);
      setCurrentCycle((prev) =>
        prev ? { ...prev, status: 'running' } : prev
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error resuming cycle');
      return false;
    }
  }, [currentCycle]);

  /**
   * Get detailed status for a specific phase (1-7).
   */
  const getPhaseStatus = useCallback(
    (phase: number): PhaseStatus => {
      if (phase < 1 || phase > 7) {
        return {
          phase: 'observation',
          phaseNumber: 0,
          status: 'not_started',
          isCurrent: false,
          startedAt: null,
          completedAt: null,
          summary: null,
        };
      }

      const phaseName = PHASE_NAMES[phase - 1];
      const phaseKey = `phase${phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}` as keyof BrainCycle;
      const phaseData = (currentCycle?.[phaseKey] as PhaseData | undefined) ?? {
        status: 'not_started' as const,
        started_at: null,
        completed_at: null,
        data: null,
        summary: null,
      };

      // Determine which phase is currently active
      let currentPhaseNumber = 0;
      if (currentCycle) {
        for (let i = 0; i < PHASE_NAMES.length; i++) {
          const key = `phase${PHASE_NAMES[i].charAt(0).toUpperCase() + PHASE_NAMES[i].slice(1)}` as keyof BrainCycle;
          const pd = currentCycle[key] as PhaseData | undefined;
          if (pd?.status === 'in_progress') {
            currentPhaseNumber = i + 1;
            break;
          }
        }
      }

      return {
        phase: phaseName,
        phaseNumber: phase,
        status: phaseData.status,
        isCurrent: phase === currentPhaseNumber,
        startedAt: phaseData.started_at,
        completedAt: phaseData.completed_at,
        summary: phaseData.summary,
      };
    },
    [currentCycle]
  );

  /**
   * Create a new Phelan task manually.
   */
  const createPhelanTask = useCallback(
    async (task: Partial<PhelanTask>): Promise<{ id: string } | null> => {
      try {
        setError(null);

        const { data, error: insertError } = await supabase
          .from('loop_phelan_tasks')
          .insert({
            title: task.title ?? 'Untitled Task',
            description: task.description,
            status: (task.status ?? 'pending') as PhelanTaskStatus,
            priority: (task.priority ?? 'medium') as PhelanPriority,
            due_date: task.dueDate,
            hermes_reasoning: task.hermesReasoning,
            source_cycle_id: currentCycle?.id ?? task.sourceCycleId,
            related_task_id: task.relatedTaskId,
            metadata: task.metadata ?? {},
            created_by: task.createdBy,
          })
          .select('id')
          .single();

        if (insertError) {
          setError(`Failed to create Phelan task: ${insertError.message}`);
          return null;
        }

        return { id: data.id as string };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error creating Phelan task');
        return null;
      }
    },
    [currentCycle]
  );

  /**
   * Mark a Phelan task notification as read.
   */
  const markPhelanTaskRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('loop_phelan_tasks')
        .update({
          notification_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        setError(`Failed to mark Phelan task read: ${updateError.message}`);
        return false;
      }

      setActivePhelanTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, notificationRead: true, updatedAt: new Date().toISOString() }
            : t
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error marking Phelan task');
      return false;
    }
  }, []);

  // Initial fetch + Realtime subscriptions
  useEffect(() => {
    fetchCycles();
    fetchPhelanTasks();

    // Subscribe to brain cycle changes
    cycleChannelRef.current = supabase
      .channel('loop_hermes_brain_cycles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loop_hermes_brain_cycles',
        },
        (payload) => {
          const cycle = mapRowToBrainCycle(payload.new as Record<string, unknown>);

          if (payload.eventType === 'INSERT') {
            setCycles((prev) => {
              if (prev.some((c) => c.id === cycle.id)) return prev;
              return [cycle, ...prev];
            });
            // If it's running, it becomes the current cycle
            if (cycle.status === 'running') {
              setCurrentCycle(cycle);
              setIsRunning(true);
            }
          } else if (payload.eventType === 'UPDATE') {
            setCycles((prev) =>
              prev.map((c) => (c.id === cycle.id ? cycle : c))
            );
            if (
              currentCycle?.id === cycle.id ||
              cycle.status === 'running' ||
              cycle.status === 'paused'
            ) {
              setCurrentCycle(cycle);
              setIsRunning(cycle.status === 'running');
            }
          }
        }
      )
      .subscribe();

    // Subscribe to Phelan task changes
    phelanChannelRef.current = supabase
      .channel('loop_phelan_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loop_phelan_tasks',
        },
        (payload) => {
          const task = mapRowToPhelanTask(payload.new as Record<string, unknown>);

          if (payload.eventType === 'INSERT') {
            setActivePhelanTasks((prev) => {
              if (prev.some((t) => t.id === task.id)) return prev;
              return [task, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setActivePhelanTasks((prev) =>
              prev.map((t) => (t.id === task.id ? task : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setActivePhelanTasks((prev) =>
              prev.filter(
                (t) =>
                  t.id !==
                  (payload.old as unknown as { id: string }).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (cycleChannelRef.current) {
        supabase.removeChannel(cycleChannelRef.current);
        cycleChannelRef.current = null;
      }
      if (phelanChannelRef.current) {
        supabase.removeChannel(phelanChannelRef.current);
        phelanChannelRef.current = null;
      }
    };
  }, [fetchCycles, fetchPhelanTasks, currentCycle?.id]);

  return {
    currentCycle,
    cycles,
    isRunning,
    isLoading,
    error,
    activePhelanTasks,
    startCycle,
    pauseCycle,
    resumeCycle,
    getPhaseStatus,
    createPhelanTask,
    markPhelanTaskRead,
    refreshCycles: fetchCycles,
    refreshPhelanTasks: fetchPhelanTasks,
  };
}
