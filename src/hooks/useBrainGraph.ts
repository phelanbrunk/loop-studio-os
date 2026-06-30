import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { GraphNode, GraphEdge } from '@/pages/Brain';

/* ================================================================== */
/*  MOCK DATA — used as fallback when Supabase is unavailable          */
/* ================================================================== */

const MOCK_NODES: GraphNode[] = [
  { id: '1', type: 'project', title: 'Balzereit Website', x: 0, y: 0, size: 2, tags: ['garten', 'website'], status: 'aktiv', priority: 'hoch', content: 'Neue Website für Gartenpflegeunternehmen.', createdAt: '2026-01-10', updatedAt: '2026-01-20' },
  { id: '2', type: 'client', title: 'Balzereit Gartenpflege', x: -100, y: -80, size: 2, tags: ['kunde'], status: 'aktiv', content: 'Stammkunde seit 2024.', createdAt: '2024-03-15', updatedAt: '2026-01-18' },
  { id: '3', type: 'project', title: 'IGZ 3D Schulung', x: 150, y: -50, size: 2, tags: ['3d', 'webapp'], status: 'aktiv', priority: 'mittel', content: '3D Schulungsplattform.', createdAt: '2026-01-05', updatedAt: '2026-01-22' },
  { id: '4', type: 'client', title: 'IGZ Wernigerode', x: 200, y: -120, size: 2, tags: ['kunde', 'immobilien'], status: 'aktiv', content: 'Immobilienzentrum.', createdAt: '2025-06-01', updatedAt: '2026-01-15' },
  { id: '5', type: 'project', title: 'Spindler Berlin', x: -50, y: 120, size: 1, tags: ['landingpage'], status: 'in_planung', priority: 'mittel', content: 'Landing Page für Dachdecker.', createdAt: '2026-01-12', updatedAt: '2026-01-12' },
  { id: '6', type: 'client', title: 'Spindler GmbH', x: -150, y: 150, size: 2, tags: ['kunde', 'dachdecker'], status: 'aktiv', content: 'Dachdeckerfirma Berlin.', createdAt: '2025-08-20', updatedAt: '2026-01-10' },
  { id: '7', type: 'project', title: 'Jankel Voges Web', x: 80, y: 100, size: 2, tags: ['corporate'], status: 'aktiv', priority: 'hoch', content: 'Corporate Website für Bauunternehmen.', createdAt: '2026-01-08', updatedAt: '2026-01-25' },
  { id: '8', type: 'client', title: 'Jankel & Voges Bau', x: 150, y: 180, size: 2, tags: ['kunde', 'bau'], status: 'aktiv', content: 'Bauunternehmen.', createdAt: '2025-04-10', updatedAt: '2026-01-20' },
  { id: '9', type: 'note', title: 'Design System v2', x: -200, y: 0, size: 1, tags: ['design'], status: 'aktiv', content: 'Farben, Typografie, Komponenten.', createdAt: '2025-12-01', updatedAt: '2026-01-15' },
  { id: '10', type: 'idea', title: 'AI Chat Integration', x: 250, y: 50, size: 1, tags: ['ki', 'feature'], status: 'in_planung', content: 'KI-Chatbot für Kunden.', createdAt: '2026-01-20', updatedAt: '2026-01-20' },
  { id: '11', type: 'note', title: 'Kunden-Call Notizen', x: 0, y: -150, size: 1, tags: ['notizen'], status: 'aktiv', content: 'Notizen vom letzten Kundengespräch.', createdAt: '2026-01-18', updatedAt: '2026-01-18' },
  { id: '12', type: 'task', title: 'Logo finalisieren', x: 100, y: -180, size: 1, tags: ['design'], status: 'aktiv', priority: 'hoch', content: 'Logo für Balzereit fertigstellen.', createdAt: '2026-01-15', updatedAt: '2026-01-19' },
  { id: '13', type: 'idea', title: 'Mobile App Idee', x: -120, y: 80, size: 1, tags: ['mobile'], status: 'in_planung', content: 'App für Projektmanagement.', createdAt: '2026-01-22', updatedAt: '2026-01-22' },
  { id: '14', type: 'resource', title: 'Figma Library', x: 200, y: -200, size: 1, tags: ['tool'], status: 'aktiv', content: 'Gemeinsame Design-Bibliothek.', createdAt: '2025-10-01', updatedAt: '2026-01-10' },
  { id: '15', type: 'project', title: 'Hüber Portfolio', x: -180, y: -150, size: 1, tags: ['portfolio'], status: 'in_planung', priority: 'niedrig', content: 'Portfolio-Website.', createdAt: '2026-01-14', updatedAt: '2026-01-14' },
  { id: '16', type: 'client', title: 'Hüber Innenausbau', x: -250, y: -100, size: 1, tags: ['kunde'], status: 'aktiv', content: 'Innenausbau-Firma.', createdAt: '2025-09-01', updatedAt: '2026-01-05' },
  { id: '17', type: 'note', title: 'Preisliste 2026', x: 50, y: 200, size: 1, tags: ['preise'], status: 'aktiv', content: 'Aktualisierte Preisliste.', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '18', type: 'website', title: 'Loop Studio Site', x: 0, y: 250, size: 2, tags: ['eigen'], status: 'aktiv', priority: 'hoch', content: 'Eigene Website.', createdAt: '2025-01-01', updatedAt: '2026-01-25' },
  { id: '19', type: 'milestone', title: '10. Kunde!', x: -80, y: -200, size: 1, tags: ['meilenstein'], status: 'aktiv', content: 'Zehn aktive Kunden erreicht!', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '20', type: 'meeting', title: 'Kickoff Balzereit', x: -30, y: -60, size: 1, tags: ['termin'], status: 'aktiv', content: 'Projektstart-Besprechung.', createdAt: '2026-01-10', updatedAt: '2026-01-10' },
];

const MOCK_EDGES: GraphEdge[] = [
  { id: 'e1', source: '1', target: '2', label: 'für', type: 'created_for', strength: 1.0 },
  { id: 'e2', source: '3', target: '4', label: 'für', type: 'created_for', strength: 1.0 },
  { id: 'e3', source: '5', target: '6', label: 'für', type: 'created_for', strength: 1.0 },
  { id: 'e4', source: '7', target: '8', label: 'für', type: 'created_for', strength: 1.0 },
  { id: 'e5', source: '15', target: '16', label: 'für', type: 'created_for', strength: 1.0 },
  { id: 'e6', source: '1', target: '3', label: 'verwandt', type: 'related', strength: 0.5 },
  { id: 'e7', source: '9', target: '1', label: 'genutzt', type: 'references', strength: 0.7 },
  { id: 'e8', source: '9', target: '5', label: 'genutzt', type: 'references', strength: 0.6 },
  { id: 'e9', source: '10', target: '18', label: 'inspiriert', type: 'inspired_by', strength: 0.8 },
  { id: 'e10', source: '12', target: '1', label: 'für', type: 'created_for', strength: 0.9 },
  { id: 'e11', source: '11', target: '2', label: 'über', type: 'mentions', strength: 0.6 },
  { id: 'e12', source: '13', target: '10', label: 'verwandt', type: 'related', strength: 0.5 },
  { id: 'e13', source: '14', target: '9', label: 'enthält', type: 'parent_of', strength: 0.8 },
  { id: 'e14', source: '14', target: '12', label: 'enthält', type: 'parent_of', strength: 0.8 },
  { id: 'e15', source: '17', target: '2', label: 'für', type: 'belongs_to', strength: 0.7 },
  { id: 'e16', source: '18', target: '9', label: 'nutzt', type: 'references', strength: 0.6 },
  { id: 'e17', source: '19', target: '2', label: 'feiert', type: 'mentions', strength: 0.4 },
  { id: 'e18', source: '20', target: '1', label: 'zu', type: 'related', strength: 0.5 },
  { id: 'e19', source: '20', target: '2', label: 'mit', type: 'related', strength: 0.5 },
];

/* ================================================================== */
/*  HELPER: Map Supabase rows to GraphNode/GraphEdge                   */
/* ================================================================== */

function mapNode(row: Record<string, unknown>): GraphNode {
  return {
    id: String(row.id),
    type: String(row.type) as GraphNode['type'],
    title: String(row.title),
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    size: Number(row.size ?? 1),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    status: row.status ? String(row.status) : undefined,
    priority: row.priority ? String(row.priority) : undefined,
    content: row.content ? String(row.content) : undefined,
    createdAt: row.created_at ? String(row.created_at).split('T')[0] : undefined,
    updatedAt: row.updated_at ? String(row.updated_at).split('T')[0] : undefined,
    obsidianNoteId: row.obsidian_note_id ? String(row.obsidian_note_id) : null,
    vaultPath: row.vault_path ? String(row.vault_path) : null,
  };
}

function mapEdge(row: Record<string, unknown>): GraphEdge {
  return {
    id: String(row.id),
    source: String(row.source_id),
    target: String(row.target_id),
    label: String(row.label ?? 'verknüpft'),
    type: String(row.type ?? 'related'),
    strength: Number(row.strength ?? 0.5),
  };
}

/* ================================================================== */
/*  HOOK                                                                 */
/* ================================================================== */

export interface BrainGraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
  saveNode: (node: GraphNode) => Promise<boolean>;
  deleteNode: (nodeId: string) => Promise<boolean>;
  saveEdge: (edge: GraphEdge) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useBrainGraph(): BrainGraphState {
  const [nodes, setNodes] = useState<GraphNode[]>(MOCK_NODES.map(n => ({ ...n })));
  const [edges, setEdges] = useState<GraphEdge[]>(MOCK_EDGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(true);

  /* ── Fetch from Supabase ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [{ data: nodeData, error: nodeErr }, { data: edgeData, error: edgeErr }] = await Promise.all([
        supabase.from('loop_knowledge_nodes').select('*').order('created_at', { ascending: false }),
        supabase.from('loop_knowledge_edges').select('*').order('created_at', { ascending: false }),
      ]);

      if (nodeErr || edgeErr) {
        throw new Error(nodeErr?.message || edgeErr?.message || 'Unknown fetch error');
      }

      const fetchedNodes = (nodeData || []).map(mapNode);
      const fetchedEdges = (edgeData || []).map(mapEdge);

      if (fetchedNodes.length > 0) {
        setNodes(fetchedNodes);
        setEdges(fetchedEdges.length > 0 ? fetchedEdges : []);
        setUsingFallback(false);
      } else {
        // Empty DB — keep mock data for demo
        setNodes(MOCK_NODES.map(n => ({ ...n })));
        setEdges(MOCK_EDGES);
        setUsingFallback(true);
      }
    } catch (e) {
      console.warn('[useBrainGraph] Supabase fetch failed, using fallback:', e);
      setNodes(MOCK_NODES.map(n => ({ ...n })));
      setEdges(MOCK_EDGES);
      setError(e instanceof Error ? e.message : 'Unknown error');
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Realtime subscriptions ── */
  useEffect(() => {
    const nodesChannel = supabase
      .channel('brain_nodes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loop_knowledge_nodes' }, () => {
        fetchData();
      })
      .subscribe();

    const edgesChannel = supabase
      .channel('brain_edges_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loop_knowledge_edges' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(nodesChannel);
      supabase.removeChannel(edgesChannel);
    };
  }, [fetchData]);

  /* ── Save node to Supabase ── */
  const saveNode = useCallback(async (node: GraphNode): Promise<boolean> => {
    if (usingFallback) {
      console.warn('[useBrainGraph] Cannot save — using fallback data (Supabase unavailable)');
      return false;
    }

    const payload = {
      id: node.id,
      type: node.type,
      title: node.title,
      x: node.x,
      y: node.y,
      size: node.size,
      tags: node.tags,
      status: node.status || null,
      priority: node.priority || null,
      content: node.content || null,
      obsidian_note_id: node.obsidianNoteId || null,
      vault_path: node.vaultPath || null,
      updated_at: new Date().toISOString(),
    };

    const { error: err } = await supabase.from('loop_knowledge_nodes').upsert(payload, { onConflict: 'id' });
    if (err) {
      console.error('[useBrainGraph] Save node failed:', err.message);
      return false;
    }
    return true;
  }, [usingFallback]);

  /* ── Delete node from Supabase ── */
  const deleteNode = useCallback(async (nodeId: string): Promise<boolean> => {
    if (usingFallback) return false;

    const { error: err } = await supabase.from('loop_knowledge_nodes').delete().eq('id', nodeId);
    if (err) {
      console.error('[useBrainGraph] Delete node failed:', err.message);
      return false;
    }
    return true;
  }, [usingFallback]);

  /* ── Save edge to Supabase ── */
  const saveEdge = useCallback(async (edge: GraphEdge): Promise<boolean> => {
    if (usingFallback) return false;

    const payload = {
      id: edge.id,
      source_id: edge.source,
      target_id: edge.target,
      label: edge.label,
      type: edge.type,
      strength: edge.strength,
    };

    const { error: err } = await supabase.from('loop_knowledge_edges').upsert(payload, { onConflict: 'id' });
    if (err) {
      console.error('[useBrainGraph] Save edge failed:', err.message);
      return false;
    }
    return true;
  }, [usingFallback]);

  return { nodes, edges, loading, error, usingFallback, saveNode, deleteNode, saveEdge, refetch: fetchData };
}
