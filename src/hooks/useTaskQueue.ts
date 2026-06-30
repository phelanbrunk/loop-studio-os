import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { ExecutionBackend } from './useExecutionRouter';

export interface TaskQueueItem {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  prompt: string;
  backend: ExecutionBackend;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'queued' | 'assigned' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  result?: string;
  resultSummary?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  tokensUsed?: number;
  sessionId?: string;
  delegatedTo?: string;
  createdAt: string;
}

export interface TaskQueueState {
  items: TaskQueueItem[];
  isLoading: boolean;
  error: string | null;
}

export function useTaskQueue() {
  const [state, setState] = useState<TaskQueueState>({
    items: [],
    isLoading: false,
    error: null,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadTasks = useCallback(async (limit: number = 50) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('loop_agent_tasks')
        .select(`id, agent_id, title, description, prompt, execution_backend, priority, status, result, result_summary, error_message, started_at, completed_at, actual_duration, tokens_used, session_id, delegated_to_agent_id, created_at, loop_agents!loop_agent_tasks_agent_id_fkey(display_name)`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      const items: TaskQueueItem[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        agentId: (row.agent_id as string) || '',
        agentName: (row.loop_agents as { display_name?: string } | null)?.display_name || 'Meta Agent',
        title: (row.title as string) || 'Untitled',
        prompt: (row.prompt as string) || (row.description as string) || '',
        backend: (row.execution_backend as ExecutionBackend) || 'simulation',
        priority: (row.priority as TaskQueueItem['priority']) || 'medium',
        status: (row.status as TaskQueueItem['status']) || 'queued',
        result: (row.result as string) || undefined,
        resultSummary: (row.result_summary as string) || undefined,
        errorMessage: (row.error_message as string) || undefined,
        startedAt: (row.started_at as string) || undefined,
        completedAt: (row.completed_at as string) || undefined,
        duration: (row.actual_duration as number) || undefined,
        tokensUsed: (row.tokens_used as number) || undefined,
        sessionId: (row.session_id as string) || undefined,
        delegatedTo: (row.delegated_to_agent_id as string) || undefined,
        createdAt: (row.created_at as string) || new Date().toISOString(),
      }));
      setState(s => ({ ...s, items, isLoading: false }));
    } catch (err) {
      setState(s => ({ ...s, isLoading: false, error: (err as Error).message }));
    }
  }, []);

  const createTask = useCallback(async (params: {
    agentId?: string; title: string; prompt: string; backend?: ExecutionBackend; priority?: TaskQueueItem['priority'];
  }): Promise<string | null> => {
    try {
      const { data, error } = await supabase.from('loop_agent_tasks').insert({
        agent_id: params.agentId, title: params.title, description: params.prompt.slice(0, 500),
        prompt: params.prompt, execution_backend: params.backend || 'simulation',
        priority: params.priority || 'medium', status: 'queued',
      }).select('id').single();
      if (error) { console.warn('[useTaskQueue] createTask error:', error.message); return null; }
      const newItem: TaskQueueItem = {
        id: data.id, agentId: params.agentId || '', agentName: 'Meta Agent', title: params.title,
        prompt: params.prompt, backend: params.backend || 'simulation', priority: params.priority || 'medium',
        status: 'queued', createdAt: new Date().toISOString(),
      };
      setState(s => ({ ...s, items: [newItem, ...s.items].slice(0, 50) }));
      return data.id;
    } catch (err) { console.warn('[useTaskQueue] createTask failed:', err); return null; }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskQueueItem['status'], updates?: Partial<TaskQueueItem>) => {
    try {
      const dbUpdates: Record<string, unknown> = { status };
      if (updates?.result) dbUpdates.result = updates.result;
      if (updates?.errorMessage) dbUpdates.error_message = updates.errorMessage;
      if (updates?.startedAt) dbUpdates.started_at = updates.startedAt;
      if (updates?.completedAt) dbUpdates.completed_at = updates.completedAt;
      if (updates?.duration) dbUpdates.actual_duration = updates.duration;
      if (status === 'running' && !updates?.startedAt) dbUpdates.started_at = new Date().toISOString();
      if (status === 'completed' || status === 'failed') dbUpdates.completed_at = new Date().toISOString();
      await supabase.from('loop_agent_tasks').update(dbUpdates).eq('id', taskId);
      setState(s => ({ ...s, items: s.items.map(item => item.id === taskId ? { ...item, status, ...updates } : item) }));
    } catch (err) { console.warn('[useTaskQueue] updateTaskStatus failed:', err); }
  }, []);

  const cancelTask = useCallback(async (taskId: string) => { await updateTaskStatus(taskId, 'cancelled'); }, [updateTaskStatus]);
  const retryTask = useCallback(async (taskId: string) => { await updateTaskStatus(taskId, 'retrying', { errorMessage: undefined }); }, [updateTaskStatus]);
  const deleteTask = useCallback(async (taskId: string) => {
    try { await supabase.from('loop_agent_tasks').delete().eq('id', taskId); setState(s => ({ ...s, items: s.items.filter(i => i.id !== taskId) })); }
    catch (err) { console.warn('[useTaskQueue] deleteTask failed:', err); }
  }, []);

  const setupRealtime = useCallback(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase.channel('loop_agent_tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loop_agent_tasks' }, (payload) => {
        const newRecord = payload.new as Record<string, unknown>;
        const oldRecord = payload.old as Record<string, unknown>;
        if (payload.eventType === 'INSERT') {
          const item: TaskQueueItem = {
            id: newRecord.id as string, agentId: (newRecord.agent_id as string) || '', agentName: 'Meta Agent',
            title: (newRecord.title as string) || 'Untitled', prompt: (newRecord.prompt as string) || '',
            backend: (newRecord.execution_backend as ExecutionBackend) || 'simulation',
            priority: (newRecord.priority as TaskQueueItem['priority']) || 'medium',
            status: (newRecord.status as TaskQueueItem['status']) || 'queued',
            createdAt: (newRecord.created_at as string) || new Date().toISOString(),
          };
          setState(s => ({ ...s, items: [item, ...s.items].slice(0, 50) }));
        } else if (payload.eventType === 'UPDATE') {
          setState(s => ({
            ...s,
            items: s.items.map(item => item.id === newRecord.id ? {
              ...item, status: (newRecord.status as TaskQueueItem['status']) || item.status,
              result: (newRecord.result as string) || item.result, resultSummary: (newRecord.result_summary as string) || item.resultSummary,
              errorMessage: (newRecord.error_message as string) || item.errorMessage, startedAt: (newRecord.started_at as string) || item.startedAt,
              completedAt: (newRecord.completed_at as string) || item.completedAt, duration: (newRecord.actual_duration as number) || item.duration,
              tokensUsed: (newRecord.tokens_used as number) || item.tokensUsed,
            } : item),
          }));
        } else if (payload.eventType === 'DELETE') {
          setState(s => ({ ...s, items: s.items.filter(i => i.id !== oldRecord.id) }));
        }
      }).subscribe();
    channelRef.current = channel;
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, []);

  useEffect(() => { const cleanup = setupRealtime(); loadTasks(); return cleanup; }, [setupRealtime, loadTasks]);

  return { ...state, loadTasks, createTask, updateTaskStatus, cancelTask, retryTask, deleteTask, setupRealtime };
}
