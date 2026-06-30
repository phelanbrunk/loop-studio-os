import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AgentRealtimeState {
  skillKey: string;
  status: 'active' | 'idle' | 'error' | 'paused' | 'spawning';
  tasks: number;
  successRate: number;
  lastActive: string;
}

export type AgentStatusCallback = (skillKey: string, state: AgentRealtimeState) => void;

/**
 * useAgentRealtime — Subscribes to live agent status changes from Supabase.
 * Updates canvas nodes in real-time when agent status changes in the DB.
 */
export function useAgentRealtime(onStatusChange: AgentStatusCallback) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbackRef = useRef(onStatusChange);
  callbackRef.current = onStatusChange;

  const subscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('loop_agents_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loop_agents',
        },
        (payload) => {
          const record = payload.new as Record<string, unknown>;
          if (!record) return;

          const skillKey = record.skill_key as string;
          if (!skillKey) return;

          const state: AgentRealtimeState = {
            skillKey,
            status: (record.status as AgentRealtimeState['status']) || 'idle',
            tasks: (record.task_count as number) || 0,
            successRate: (record.metrics as { success_rate?: number })?.success_rate || 95,
            lastActive: (record.last_active as string) || new Date().toISOString(),
          };

          callbackRef.current(skillKey, state);
        }
      )
      .subscribe((status) => {
        console.log('[AgentRealtime] Subscription status:', status);
      });

    channelRef.current = channel;
  }, []);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    subscribe();
    return unsubscribe;
  }, [subscribe, unsubscribe]);

  return { subscribe, unsubscribe };
}
