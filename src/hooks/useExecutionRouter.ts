import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../supabase';

export type BackendName = 'kimi_meta' | 'hermes_openclaw' | 'simulation';

export interface BackendStatus {
  kimi_meta: boolean;
  hermes_openclaw: boolean;
  simulation: boolean;
}

export interface RouteResult {
  success: boolean;
  executionId?: string;
  error?: string;
}

const BACKEND_ROUTING_MAP: Record<string, BackendName> = {
  // Trader agents → hermes_openclaw
  arbitrage_trader: 'hermes_openclaw',
  market_maker: 'hermes_openclaw',
  signal_trader: 'hermes_openclaw',
  portfolio_manager: 'hermes_openclaw',
  risk_manager: 'hermes_openclaw',
  quant_researcher: 'hermes_openclaw',
  // Designer/dev agents → kimi_meta
  ui_designer: 'kimi_meta',
  ux_researcher: 'kimi_meta',
  frontend_dev: 'kimi_meta',
  backend_dev: 'kimi_meta',
  fullstack_dev: 'kimi_meta',
  graphic_designer: 'kimi_meta',
  motion_designer: 'kimi_meta',
  brand_designer: 'kimi_meta',
  // Data/knowledge agents → kimi_meta
  data_analyst: 'kimi_meta',
  content_writer: 'kimi_meta',
  researcher: 'kimi_meta',
  // Legal/compliance → hermes_openclaw (safety-critical)
  legal_reviewer: 'hermes_openclaw',
  compliance_officer: 'hermes_openclaw',
  // Meta → hermes_openclaw
  meta_orchestrator: 'hermes_openclaw',
  session_manager: 'hermes_openclaw',
};

/**
 * Returns the appropriate backend for a given agent type.
 * Falls back to 'simulation' for unknown agent types.
 */
export function getBackendForAgentType(agentType: string): BackendName {
  const normalized = agentType.toLowerCase().trim();
  return BACKEND_ROUTING_MAP[normalized] ?? 'simulation';
}

/**
 * Hook for routing task execution to different backends.
 *
 * Provides:
 * - `routeExecution` — route a task to its designated backend
 * - `getBackendStatus` — check which backends are online
 * - `getBackendForAgentType` — look up the backend for an agent type
 *
 * Backends:
 * - `kimi_meta` — creative/design/dev tasks
 * - `hermes_openclaw` — trading, safety-critical, meta-orchestration
 * - `simulation` — fallback / unknown agent types
 */
export function useExecutionRouter() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    kimi_meta: true,
    hermes_openclaw: true,
    simulation: true,
  });
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const healthCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Check backend health by probing Supabase for recent execution records.
   */
  const checkBackendHealth = useCallback(async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

      const { data: recentExecutions, error: execError } = await supabase
        .from('loop_agent_executions')
        .select('backend, status, started_at')
        .gte('started_at', fiveMinutesAgo);

      if (execError) {
        // If we can't reach Supabase, mark all backends as unknown but still "up"
        // since the backend itself may be fine
        setBackendStatus({
          kimi_meta: true,
          hermes_openclaw: true,
          simulation: true,
        });
        return;
      }

      const status: BackendStatus = {
        kimi_meta: true,
        hermes_openclaw: true,
        simulation: true,
      };

      if (recentExecutions) {
        // A backend is considered "down" if ALL its recent executions errored
        const backendErrorCounts: Record<string, { total: number; errors: number }> = {};

        for (const exec of recentExecutions) {
          const be = exec.backend as string;
          if (!backendErrorCounts[be]) {
            backendErrorCounts[be] = { total: 0, errors: 0 };
          }
          backendErrorCounts[be].total++;
          if (exec.status === 'error') {
            backendErrorCounts[be].errors++;
          }
        }

        for (const [be, counts] of Object.entries(backendErrorCounts)) {
          if (counts.total >= 3 && counts.errors === counts.total) {
            (status as Record<string, boolean>)[be] = false;
          }
        }
      }

      setBackendStatus(status);
      setError(null);
    } catch {
      // Fail open — assume backends are up if health check itself fails
      setBackendStatus({
        kimi_meta: true,
        hermes_openclaw: true,
        simulation: true,
      });
    }
  }, []);

  /**
   * Route a task to the specified backend for execution.
   */
  const routeExecution = useCallback(
    async (
      taskId: string,
      backend: BackendName
    ): Promise<RouteResult> => {
      setIsRouting(true);
      setError(null);

      try {
        // Check if backend is available
        if (!backendStatus[backend]) {
          // If requested backend is down, try fallback
          const fallback: BackendName =
            backend === 'kimi_meta' ? 'simulation' : 'hermes_openclaw';

          // Insert execution record with fallback backend
          const { data, error: insertError } = await supabase
            .from('loop_agent_executions')
            .insert({
              task_id: taskId,
              backend: fallback,
              status: 'queued',
              started_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (insertError) {
            setError(`Failed to route task to fallback backend: ${insertError.message}`);
            return {
              success: false,
              error: `Primary backend '${backend}' is down and fallback insert failed: ${insertError.message}`,
            };
          }

          return {
            success: true,
            executionId: data?.id,
          };
        }

        // Insert execution record for the requested backend
        const { data, error: insertError } = await supabase
          .from('loop_agent_executions')
          .insert({
            task_id: taskId,
            backend,
            status: 'queued',
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) {
          setError(`Failed to route task: ${insertError.message}`);
          return {
            success: false,
            error: `Insert failed: ${insertError.message}`,
          };
        }

        return {
          success: true,
          executionId: data?.id,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown routing error';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsRouting(false);
      }
    },
    [backendStatus]
  );

  /**
   * Get current status of all backends.
   */
  const getBackendStatus = useCallback((): BackendStatus => {
    return { ...backendStatus };
  }, [backendStatus]);

  // Health check polling every 60 seconds
  useEffect(() => {
    checkBackendHealth();
    healthCheckIntervalRef.current = setInterval(checkBackendHealth, 60000);

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [checkBackendHealth]);

  return {
    routeExecution,
    getBackendStatus,
    getBackendForAgentType,
    backendStatus,
    isRouting,
    error,
  };
}
