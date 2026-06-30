import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'offline';

export interface AgentNode {
  id: string;
  name: string;
  agentType: string;
  status: AgentStatus;
  description: string | null;
  skills: string[] | null;
  tierRequired: number;
  avatar_url: string | null;
  parent_agent_id: string | null;
  max_concurrent_tasks: number;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Status color mapping for UI display.
 */
export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  idle: 'text-gray-400',
  running: 'text-green-400',
  paused: 'text-yellow-400',
  error: 'text-red-400',
  offline: 'text-neutral-500',
};

export const AGENT_STATUS_BG_COLORS: Record<AgentStatus, string> = {
  idle: 'bg-gray-400/10',
  running: 'bg-green-400/10',
  paused: 'bg-yellow-400/10',
  error: 'bg-red-400/10',
  offline: 'bg-neutral-500/10',
};

export const AGENT_STATUS_DOT_COLORS: Record<AgentStatus, string> = {
  idle: 'bg-gray-400',
  running: 'bg-green-400 animate-pulse',
  paused: 'bg-yellow-400',
  error: 'bg-red-400',
  offline: 'bg-neutral-500',
};

export type AgentUpdateCallback = (agent: AgentNode) => void;

/**
 * Hook for live agent node status with Supabase Realtime.
 *
 * Provides:
 * - `agents` — all agents with live status updates
 * - `getAgentStatus(id)` — look up a single agent by ID
 * - `subscribeToAgentUpdates(callback)` — register a callback for agent changes
 * - Status color helpers for UI rendering
 */
export function useAgentRealtime() {
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef<AgentUpdateCallback[]>([]);

  /**
   * Fetch all agents from Supabase.
   */
  const fetchAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('loop_agents')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        setError(`Failed to fetch agents: ${fetchError.message}`);
        return;
      }

      const mapped = (data ?? []).map((row) => ({
        id: row.id as string,
        name: row.name as string,
        agentType: row.agent_type as string,
        status: (row.status as AgentStatus) ?? 'offline',
        description: (row.description as string | null) ?? null,
        skills: (row.skills as string[] | null) ?? null,
        tierRequired: (row.tier_required as number) ?? 1,
        avatar_url: (row.avatar_url as string | null) ?? null,
        parent_agent_id: (row.parent_agent_id as string | null) ?? null,
        max_concurrent_tasks: (row.max_concurrent_tasks as number) ?? 1,
        config: (row.config as Record<string, unknown> | null) ?? null,
        created_at: (row.created_at as string) ?? new Date().toISOString(),
        updated_at: (row.updated_at as string) ?? new Date().toISOString(),
      })) as AgentNode[];

      setAgents(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a single agent by ID. Returns a default offline node if not found.
   */
  const getAgentStatus = useCallback(
    (id: string): AgentNode => {
      const found = agents.find((a) => a.id === id);
      if (found) return found;

      // Return a safe fallback so callers never get undefined
      return {
        id,
        name: 'Unknown Agent',
        agentType: 'unknown',
        status: 'offline',
        description: null,
        skills: null,
        tierRequired: 1,
        avatar_url: null,
        parent_agent_id: null,
        max_concurrent_tasks: 1,
        config: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    [agents]
  );

  /**
   * Subscribe to agent update events.
   * The callback fires whenever any agent's row changes via Realtime.
   */
  const subscribeToAgentUpdates = useCallback((callback: AgentUpdateCallback) => {
    callbacksRef.current.push(callback);

    // Return unsubscribe function
    return () => {
      callbacksRef.current = callbacksRef.current.filter((cb) => cb !== callback);
    };
  }, []);

  /**
   * Update an agent's status directly (useful for optimistic UI updates).
   */
  const updateAgentStatus = useCallback(
    async (id: string, status: AgentStatus): Promise<boolean> => {
      try {
        setError(null);

        const { error: updateError } = await supabase
          .from('loop_agents')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) {
          setError(`Failed to update agent status: ${updateError.message}`);
          return false;
        }

        // Optimistic update
        setAgents((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status, updated_at: new Date().toISOString() }
              : a
          )
        );

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error updating agent');
        return false;
      }
    },
    []
  );

  /**
   * Get agents filtered by a specific status.
   */
  const getAgentsByStatus = useCallback(
    (status: AgentStatus): AgentNode[] => {
      return agents.filter((a) => a.status === status);
    },
    [agents]
  );

  /**
   * Get agents filtered by type.
   */
  const getAgentsByType = useCallback(
    (agentType: string): AgentNode[] => {
      return agents.filter((a) => a.agentType.toLowerCase() === agentType.toLowerCase());
    },
    [agents]
  );

  // Initial fetch + Realtime subscription
  useEffect(() => {
    fetchAgents();

    channelRef.current = supabase
      .channel('loop_agents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loop_agents',
        },
        (payload) => {
          const newAgent = payload.new as AgentNode;
          const oldAgent = payload.old as AgentNode;

          if (payload.eventType === 'INSERT') {
            setAgents((prev) => {
              // Avoid duplicates
              if (prev.some((a) => a.id === newAgent.id)) return prev;
              return [...prev, newAgent];
            });
            // Notify subscribers
            callbacksRef.current.forEach((cb) => cb(newAgent));
          } else if (payload.eventType === 'UPDATE') {
            setAgents((prev) =>
              prev.map((a) => (a.id === newAgent.id ? newAgent : a))
            );
            // Notify subscribers
            callbacksRef.current.forEach((cb) => cb(newAgent));
          } else if (payload.eventType === 'DELETE') {
            setAgents((prev) =>
              prev.filter((a) => a.id !== (oldAgent as unknown as { id: string }).id)
            );
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
  }, [fetchAgents]);

  return {
    agents,
    getAgentStatus,
    subscribeToAgentUpdates,
    updateAgentStatus,
    getAgentsByStatus,
    getAgentsByType,
    isLoading,
    error,
    refresh: fetchAgents,
  };
}
