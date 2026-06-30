import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused_awaiting_confirmation'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskPhase =
  | 'intake'
  | 'routing'
  | 'execution'
  | 'validation'
  | 'review'
  | 'completion';

export type LegalCheckStatus = 'not_started' | 'in_progress' | 'passed' | 'failed' | 'concerns';

export interface AgentTask {
  id: string;
  agent_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  backend: string | null;
  execution_result: Record<string, unknown> | null;
  execution_error: string | null;
  assigned_to: string | null;
  created_by: string | null;
  phase: TaskPhase;
  legal_check_status: LegalCheckStatus;
  legal_concerns: string | null;
  metadata: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskQueueState {
  tasks: AgentTask[];
  pendingTasks: AgentTask[];
  runningTasks: AgentTask[];
  pausedTasks: AgentTask[];
  completedTasks: AgentTask[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for task queue management with Supabase Realtime.
 *
 * Provides live task lists segmented by status, CRUD operations,
 * legal-review pausing/resuming, and automatic cleanup of subscriptions.
 */
export function useTaskQueue() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Derived task lists
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const runningTasks = tasks.filter((t) => t.status === 'running');
  const pausedTasks = tasks.filter((t) => t.status === 'paused_awaiting_confirmation');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  /**
   * Fetch all tasks from Supabase on mount.
   */
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('loop_agent_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(`Failed to fetch tasks: ${fetchError.message}`);
        return;
      }

      setTasks((data as AgentTask[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new task in the queue.
   */
  const createTask = useCallback(
    async (task: Partial<AgentTask>): Promise<{ id: string } | null> => {
      try {
        setError(null);

        const insertPayload = {
          agent_id: task.agent_id,
          title: task.title ?? 'Untitled Task',
          description: task.description,
          status: (task.status ?? 'pending') as TaskStatus,
          priority: (task.priority ?? 'medium') as TaskPriority,
          backend: task.backend,
          phase: (task.phase ?? 'intake') as TaskPhase,
          legal_check_status: 'not_started' as LegalCheckStatus,
          legal_concerns: null,
          metadata: task.metadata ?? {},
          due_date: task.due_date,
          created_by: task.created_by,
          assigned_to: task.assigned_to,
        };

        const { data, error: insertError } = await supabase
          .from('loop_agent_tasks')
          .insert(insertPayload)
          .select('id')
          .single();

        if (insertError) {
          setError(`Failed to create task: ${insertError.message}`);
          return null;
        }

        return { id: data.id as string };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error creating task');
        return null;
      }
    },
    []
  );

  /**
   * Update a task's status and optionally its result.
   */
  const updateTaskStatus = useCallback(
    async (
      id: string,
      status: TaskStatus,
      result?: Record<string, unknown>
    ): Promise<boolean> => {
      try {
        setError(null);

        const updatePayload: Record<string, unknown> = {
          status,
          updated_at: new Date().toISOString(),
        };

        if (status === 'running' && !result) {
          updatePayload.started_at = new Date().toISOString();
        }

        if (status === 'completed' || status === 'failed') {
          updatePayload.completed_at = new Date().toISOString();
        }

        if (result) {
          updatePayload.execution_result = result;
        }

        const { error: updateError } = await supabase
          .from('loop_agent_tasks')
          .update(updatePayload)
          .eq('id', id);

        if (updateError) {
          setError(`Failed to update task: ${updateError.message}`);
          return false;
        }

        // Optimistic local update
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  ...(result ? { execution_result: result } : {}),
                  ...(status === 'running' && !t.started_at
                    ? { started_at: new Date().toISOString() }
                    : {}),
                  ...(status === 'completed' || status === 'failed'
                    ? { completed_at: new Date().toISOString() }
                    : {}),
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error updating task');
        return false;
      }
    },
    []
  );

  /**
   * Pause a task for legal review.
   * Sets status to 'paused_awaiting_confirmation' and records concerns.
   */
  const pauseTaskForLegalReview = useCallback(
    async (id: string, concerns: string): Promise<boolean> => {
      try {
        setError(null);

        const { error: updateError } = await supabase
          .from('loop_agent_tasks')
          .update({
            status: 'paused_awaiting_confirmation',
            legal_check_status: 'concerns',
            legal_concerns: concerns,
            phase: 'review',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) {
          setError(`Failed to pause task for legal review: ${updateError.message}`);
          return false;
        }

        // Optimistic local update
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: 'paused_awaiting_confirmation' as TaskStatus,
                  legal_check_status: 'concerns' as LegalCheckStatus,
                  legal_concerns: concerns,
                  phase: 'review' as TaskPhase,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error pausing task');
        return false;
      }
    },
    []
  );

  /**
   * Resume a paused task (after Phelan approval).
   * Returns the task to 'pending' status.
   */
  const resumeTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('loop_agent_tasks')
        .update({
          status: 'pending',
          phase: 'intake',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        setError(`Failed to resume task: ${updateError.message}`);
        return false;
      }

      // Optimistic local update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'pending' as TaskStatus,
                phase: 'intake' as TaskPhase,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error resuming task');
      return false;
    }
  }, []);

  /**
   * Cancel a task permanently.
   */
  const cancelTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('loop_agent_tasks')
        .update({
          status: 'cancelled',
          phase: 'completion',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        setError(`Failed to cancel task: ${updateError.message}`);
        return false;
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'cancelled' as TaskStatus,
                phase: 'completion' as TaskPhase,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error cancelling task');
      return false;
    }
  }, []);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    fetchTasks();

    channelRef.current = supabase
      .channel('loop_agent_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loop_agent_tasks',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as AgentTask, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as AgentTask).id ? (payload.new as AgentTask) : t
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchTasks]);

  return {
    tasks,
    pendingTasks,
    runningTasks,
    pausedTasks,
    completedTasks,
    createTask,
    updateTaskStatus,
    pauseTaskForLegalReview,
    resumeTask,
    cancelTask,
    isLoading,
    error,
    refresh: fetchTasks,
  };
}
