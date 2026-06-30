import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  LayoutTemplate,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  X,
  Edit3,
  Link,
  Copy,
  Archive,
  Trash2,
  HelpCircle,
  ChevronDown,
  Tag,
  Clock,
  RefreshCw,
  Circle,
  FileText,
  Lightbulb,
  CheckSquare,
  Globe,
  Users,
  StickyNote,
  Milestone,
  Calendar,
  FolderOpen,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  x: number;
  y: number;
  size: number;
  tags: string[];
  status?: string;
  priority?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  strength: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export type NodeType =
  | 'project'
  | 'client'
  | 'note'
  | 'idea'
  | 'task'
  | 'document'
  | 'resource'
  | 'milestone'
  | 'meeting'
  | 'website';

export type LayoutMode = 'force' | 'hierarchical' | 'circular' | 'grid';

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const NODE_COLORS: Record<NodeType, string> = {
  project: '#FF8C5A',
  client: '#36CFC9',
  note: '#FFFFFF',
  idea: '#B98BFF',
  task: '#F5C542',
  document: '#5E626A',
  resource: '#4ADE80',
  milestone: '#EF4444',
  meeting: '#60A5FA',
  website: '#FF8C5A',
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  project: 'Projekt',
  client: 'Kunde',
  note: 'Notiz',
  idea: 'Idee',
  task: 'Aufgabe',
  document: 'Dokument',
  resource: 'Ressource',
  milestone: 'Meilenstein',
  meeting: 'Meeting',
  website: 'Website',
};

const TYPE_ICONS: Record<NodeType, typeof Circle> = {
  project: FolderOpen,
  client: Users,
  note: StickyNote,
  idea: Lightbulb,
  task: CheckSquare,
  document: FileText,
  resource: Globe,
  milestone: Milestone,
  meeting: Calendar,
  website: Globe,
};

const NODE_TYPE_OPTIONS: NodeType[] = [
  'project',
  'client',
  'note',
  'idea',
  'task',
  'document',
  'resource',
  'milestone',
  'meeting',
  'website',
];

const STATUS_OPTIONS = ['aktiv', 'inaktiv', 'archiviert', 'in_planung'];
const PRIORITY_OPTIONS = ['hoch', 'mittel', 'niedrig'];

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */

const MOCK_NODES: GraphNode[] = [
  { id: '1', type: 'project', title: 'Balzereit Website', x: 0, y: 0, size: 2, tags: ['garten', 'website'], status: 'aktiv', priority: 'hoch', content: 'Neue Website f\u00fcr Gartenpflegeunternehmen.', createdAt: '2026-01-10', updatedAt: '2026-01-20' },
  { id: '2', type: 'client', title: 'Balzereit Gartenpflege', x: -100, y: -80, size: 2, tags: ['kunde'], status: 'aktiv', content: 'Stammkunde seit 2024.', createdAt: '2024-03-15', updatedAt: '2026-01-18' },
  { id: '3', type: 'project', title: 'IGZ 3D Schulung', x: 150, y: -50, size: 2, tags: ['3d', 'webapp'], status: 'aktiv', priority: 'mittel', content: '3D Schulungsplattform.', createdAt: '2026-01-05', updatedAt: '2026-01-22' },
  { id: '4', type: 'client', title: 'IGZ Wernigerode', x: 200, y: -120, size: 2, tags: ['kunde', 'immobilien'], status: 'aktiv', content: 'Immobilienzentrum.', createdAt: '2025-06-01', updatedAt: '2026-01-15' },
  { id: '5', type: 'project', title: 'Spindler Berlin', x: -50, y: 120, size: 1, tags: ['landingpage'], status: 'in_planung', priority: 'mittel', content: 'Landing Page f\u00fcr Dachdecker.', createdAt: '2026-01-12', updatedAt: '2026-01-12' },
  { id: '6', type: 'client', title: 'Spindler GmbH', x: -150, y: 150, size: 2, tags: ['kunde', 'dachdecker'], status: 'aktiv', content: 'Dachdeckerfirma Berlin.', createdAt: '2025-08-20', updatedAt: '2026-01-10' },
  { id: '7', type: 'project', title: 'Jankel Voges Web', x: 80, y: 100, size: 2, tags: ['corporate'], status: 'aktiv', priority: 'hoch', content: 'Corporate Website f\u00fcr Bauunternehmen.', createdAt: '2026-01-08', updatedAt: '2026-01-25' },
  { id: '8', type: 'client', title: 'Jankel & Voges Bau', x: 150, y: 180, size: 2, tags: ['kunde', 'bau'], status: 'aktiv', content: 'Bauunternehmen.', createdAt: '2025-04-10', updatedAt: '2026-01-20' },
  { id: '9', type: 'note', title: 'Design System v2', x: -200, y: 0, size: 1, tags: ['design'], status: 'aktiv', content: 'Farben, Typografie, Komponenten.', createdAt: '2025-12-01', updatedAt: '2026-01-15' },
  { id: '10', type: 'idea', title: 'AI Chat Integration', x: 250, y: 50, size: 1, tags: ['ki', 'feature'], status: 'in_planung', content: 'KI-Chatbot f\u00fcr Kunden.', createdAt: '2026-01-20', updatedAt: '2026-01-20' },
  { id: '11', type: 'note', title: 'Kunden-Call Notizen', x: 0, y: -150, size: 1, tags: ['notizen'], status: 'aktiv', content: 'Notizen vom letzten Kundengespr\u00e4ch.', createdAt: '2026-01-18', updatedAt: '2026-01-18' },
  { id: '12', type: 'task', title: 'Logo finalisieren', x: 100, y: -180, size: 1, tags: ['design'], status: 'aktiv', priority: 'hoch', content: 'Logo f\u00fcr Balzereit fertigstellen.', createdAt: '2026-01-15', updatedAt: '2026-01-19' },
  { id: '13', type: 'idea', title: 'Mobile App Idee', x: -120, y: 80, size: 1, tags: ['mobile'], status: 'in_planung', content: 'App f\u00fcr Projektmanagement.', createdAt: '2026-01-22', updatedAt: '2026-01-22' },
  { id: '14', type: 'resource', title: 'Figma Library', x: 200, y: -200, size: 1, tags: ['tool'], status: 'aktiv', content: 'Gemeinsame Design-Bibliothek.', createdAt: '2025-10-01', updatedAt: '2026-01-10' },
  { id: '15', type: 'project', title: 'H\u00fcber Portfolio', x: -180, y: -150, size: 1, tags: ['portfolio'], status: 'in_planung', priority: 'niedrig', content: 'Portfolio-Website.', createdAt: '2026-01-14', updatedAt: '2026-01-14' },
  { id: '16', type: 'client', title: 'H\u00fcber Innenausbau', x: -250, y: -100, size: 1, tags: ['kunde'], status: 'aktiv', content: 'Innenausbau-Firma.', createdAt: '2025-09-01', updatedAt: '2026-01-05' },
  { id: '17', type: 'note', title: 'Preisliste 2026', x: 50, y: 200, size: 1, tags: ['preise'], status: 'aktiv', content: 'Aktualisierte Preisliste.', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '18', type: 'website', title: 'Loop Studio Site', x: 0, y: 250, size: 2, tags: ['eigen'], status: 'aktiv', priority: 'hoch', content: 'Eigene Website.', createdAt: '2025-01-01', updatedAt: '2026-01-25' },
  { id: '19', type: 'milestone', title: '10. Kunde!', x: -80, y: -200, size: 1, tags: ['meilenstein'], status: 'aktiv', content: 'Zehn aktive Kunden erreicht!', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '20', type: 'meeting', title: 'Kickoff Balzereit', x: -30, y: -60, size: 1, tags: ['termin'], status: 'aktiv', content: 'Projektstart-Besprechung.', createdAt: '2026-01-10', updatedAt: '2026-01-10' },
];

const MOCK_EDGES: GraphEdge[] = [
  { id: 'e1', source: '1', target: '2', label: 'f\u00fcr', type: 'created_for', strength: 1.0 },
  { id: 'e2', source: '3', target: '4', label: 'f\u00fcr', type: 'created_for', strength: 1.0 },
  { id: 'e3', source: '5', target: '6', label: 'f\u00fcr', type: 'created_for', strength: 1.0 },
  { id: 'e4', source: '7', target: '8', label: 'f\u00fcr', type: 'created_for', strength: 1.0 },
  { id: 'e5', source: '15', target: '16', label: 'f\u00fcr', type: 'created_for', strength: 1.0 },
  { id: 'e6', source: '1', target: '3', label: 'verwandt', type: 'related', strength: 0.5 },
  { id: 'e7', source: '9', target: '1', label: 'genutzt', type: 'references', strength: 0.7 },
  { id: 'e8', source: '9', target: '5', label: 'genutzt', type: 'references', strength: 0.6 },
  { id: 'e9', source: '10', target: '18', label: 'inspiriert', type: 'inspired_by', strength: 0.8 },
  { id: 'e10', source: '12', target: '1', label: 'f\u00fcr', type: 'created_for', strength: 0.9 },
  { id: 'e11', source: '11', target: '2', label: '\u00fcber', type: 'mentions', strength: 0.6 },
  { id: 'e12', source: '13', target: '10', label: 'verwandt', type: 'related', strength: 0.5 },
  { id: 'e13', source: '14', target: '9', label: 'enth\u00e4lt', type: 'parent_of', strength: 0.8 },
  { id: 'e14', source: '14', target: '12', label: 'enth\u00e4lt', type: 'parent_of', strength: 0.8 },
  { id: 'e15', source: '17', target: '2', label: 'f\u00fcr', type: 'belongs_to', strength: 0.7 },
  { id: 'e16', source: '18', target: '9', label: 'nutzt', type: 'references', strength: 0.6 },
  { id: 'e17', source: '19', target: '2', label: 'feiert', type: 'mentions', strength: 0.4 },
  { id: 'e18', source: '20', target: '1', label: 'zu', type: 'related', strength: 0.5 },
  { id: 'e19', source: '20', target: '2', label: 'mit', type: 'related', strength: 0.5 },
];

/* ================================================================== */
/*  PHYSICS ENGINE                                                     */
/* ================================================================== */

function applyForces(nodes: GraphNode[], edges: GraphEdge[]) {
  const repulsionStrength = 4000;
  const attractionStrength = 0.004;
  const springLength = 140;
  const centerStrength = 0.015;

  // Repulsion (Coulomb-like)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) dist = 1;
      const force = repulsionStrength / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      (a as GraphNode & { vx?: number; vy?: number }).vx = ((a as GraphNode & { vx?: number }).vx || 0) - fx;
      (a as GraphNode & { vy?: number }).vy = ((a as GraphNode & { vy?: number }).vy || 0) - fy;
      (b as GraphNode & { vx?: number; vy?: number }).vx = ((b as GraphNode & { vx?: number }).vx || 0) + fx;
      (b as GraphNode & { vy?: number }).vy = ((b as GraphNode & { vy?: number }).vy || 0) + fy;
    }
  }

  // Attraction (Spring)
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (!source || !target) continue;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = (dist - springLength) * attractionStrength * edge.strength;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    (source as GraphNode & { vx?: number; vy?: number }).vx = ((source as GraphNode & { vx?: number }).vx || 0) + fx;
    (source as GraphNode & { vy?: number }).vy = ((source as GraphNode & { vy?: number }).vy || 0) + fy;
    (target as GraphNode & { vx?: number; vy?: number }).vx = ((target as GraphNode & { vx?: number }).vx || 0) - fx;
    (target as GraphNode & { vy?: number }).vy = ((target as GraphNode & { vy?: number }).vy || 0) - fy;
  }

  // Center gravity
  for (const node of nodes) {
    const nx = node as GraphNode & { vx?: number; vy?: number };
    nx.vx = (nx.vx || 0) - node.x * centerStrength;
    nx.vy = (nx.vy || 0) - node.y * centerStrength;
  }
}

function updatePositions(nodes: GraphNode[], dt: number) {
  const damping = 0.88;
  const maxSpeed = 12;
  for (const node of nodes) {
    const nx = node as GraphNode & { vx?: number; vy?: number };
    let vx = (nx.vx || 0) * damping;
    let vy = (nx.vy || 0) * damping;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > maxSpeed) {
      vx = (vx / speed) * maxSpeed;
      vy = (vy / speed) * maxSpeed;
    }
    node.x += vx * dt;
    node.y += vy * dt;
    nx.vx = vx;
    nx.vy = vy;
  }
}

function runLayout(nodes: GraphNode[], edges: GraphEdge[], iterations: number) {
  for (let i = 0; i < iterations; i++) {
    applyForces(nodes, edges);
    updatePositions(nodes, 1);
  }
}

function applyCircularLayout(nodes: GraphNode[]) {
  const radius = 220;
  const angleStep = (Math.PI * 2) / nodes.length;
  nodes.forEach((node, i) => {
    node.x = Math.cos(angleStep * i) * radius;
    node.y = Math.sin(angleStep * i) * radius;
    const nx = node as GraphNode & { vx?: number; vy?: number };
    nx.vx = 0;
    nx.vy = 0;
  });
}

function applyGridLayout(nodes: GraphNode[]) {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const spacing = 160;
  nodes.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    node.x = (col - cols / 2) * spacing;
    node.y = (row - cols / 2) * spacing;
    const nx = node as GraphNode & { vx?: number; vy?: number };
    nx.vx = 0;
    nx.vy = 0;
  });
}

function applyHierarchicalLayout(nodes: GraphNode[]) {
  // Sort by type then place in levels
  const levels: Record<string, number> = {
    client: 0, website: 0, resource: 0,
    project: 1, milestone: 1,
    note: 2, document: 2, meeting: 2,
    task: 3, idea: 3,
  };
  const levelWidth = 200;
  const nodesPerLevel: Record<number, GraphNode[]> = {};
  for (const node of nodes) {
    const level = levels[node.type] ?? 2;
    if (!nodesPerLevel[level]) nodesPerLevel[level] = [];
    nodesPerLevel[level].push(node);
  }
  for (const [level, levelNodes] of Object.entries(nodesPerLevel)) {
    const l = Number(level);
    const ySpacing = 100;
    levelNodes.forEach((node, i) => {
      node.x = (l - 1.5) * levelWidth;
      node.y = (i - levelNodes.length / 2) * ySpacing;
      const nx = node as GraphNode & { vx?: number; vy?: number };
      nx.vx = 0;
      nx.vy = 0;
    });
  }
}

/* ================================================================== */
/*  RENDERER                                                           */
/* ================================================================== */

function renderGraph(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  edges: GraphEdge[],
  camera: Camera,
  width: number,
  height: number,
  hoveredId: string | null,
  selectedId: string | null,
  searchQuery: string,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  // Clear
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 0.5;
  const gridSize = 50 * camera.zoom;
  const offsetX = (width / 2 + camera.x) % gridSize;
  const offsetY = (height / 2 + camera.y) % gridSize;
  for (let x = offsetX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = offsetY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Apply camera transform
  ctx.translate(width / 2 + camera.x, height / 2 + camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Pre-compute filtered nodes for search
  const lowerQuery = searchQuery.toLowerCase();
  const filteredNodeIds = new Set(
    searchQuery
      ? nodes
          .filter(n =>
            n.title.toLowerCase().includes(lowerQuery) ||
            n.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
            n.type.toLowerCase().includes(lowerQuery),
          )
          .map(n => n.id)
      : nodes.map(n => n.id),
  );

  // Draw edges first
  edges.forEach(edge => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (!source || !target) return;

    const isDimmed = searchQuery && (!filteredNodeIds.has(source.id) || !filteredNodeIds.has(target.id));
    const isHighlighted =
      (hoveredId && (source.id === hoveredId || target.id === hoveredId)) ||
      (selectedId && (source.id === selectedId || target.id === selectedId));

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);

    if (isDimmed) {
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 0.5;
    } else if (isHighlighted) {
      ctx.strokeStyle = `rgba(255,140,90,${edge.strength * 0.5})`;
      ctx.lineWidth = 1.5 + edge.strength;
    } else {
      ctx.strokeStyle = `rgba(255,255,255,${edge.strength * 0.12})`;
      ctx.lineWidth = 0.8 + edge.strength * 0.8;
    }
    ctx.stroke();

    // Edge label at midpoint
    if (!isDimmed && camera.zoom > 0.6) {
      const mx = (source.x + target.x) / 2;
      const my = (source.y + target.y) / 2;
      ctx.fillStyle = isHighlighted ? 'rgba(255,140,90,0.8)' : '#5E626A';
      ctx.font = `${isHighlighted ? '600' : '400'} 10px "DM Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(edge.label, mx, my - 4);
    }
  });

  // Draw nodes
  nodes.forEach(node => {
    const r = 8 + node.size * 5;
    const color = NODE_COLORS[node.type] || '#FFFFFF';
    const isHovered = node.id === hoveredId;
    const isSelected = node.id === selectedId;
    const isDimmed = searchQuery && !filteredNodeIds.has(node.id);
    const isHighlighted = isHovered || isSelected;

    // Glow for selected/hovered
    if (isHighlighted && !isDimmed) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 14, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 14);
      gradient.addColorStop(0, color + '25');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    if (isDimmed) {
      ctx.fillStyle = color + '08';
      ctx.strokeStyle = color + '20';
    } else {
      ctx.fillStyle = isHighlighted ? color + '30' : color + '18';
      ctx.strokeStyle = isHighlighted ? color : color + 'AA';
    }
    ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
    ctx.fill();
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(node.x, node.y, isHighlighted ? 3 : 2, 0, Math.PI * 2);
    ctx.fillStyle = isDimmed ? color + '30' : color;
    ctx.fill();

    // Label
    if (!isDimmed && camera.zoom > 0.3) {
      ctx.fillStyle = isHighlighted ? '#FFFFFF' : '#A1A4AA';
      ctx.font = `${isHighlighted ? '600' : '500'} 12px "DM Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Truncate label if too long
      let label = node.title;
      const maxWidth = 100 / camera.zoom;
      let textWidth = ctx.measureText(label).width;
      if (textWidth > maxWidth) {
        while (textWidth > maxWidth && label.length > 3) {
          label = label.slice(0, -1);
          textWidth = ctx.measureText(label + '...').width;
        }
        label = label + '...';
      }
      ctx.fillText(label, node.x, node.y + r + 10);

      // Type badge below label
      if (camera.zoom > 0.6) {
        ctx.fillStyle = color + 'CC';
        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillText(NODE_TYPE_LABELS[node.type], node.x, node.y + r + 24);
      }
    }
  });

  ctx.restore();
}

/* ================================================================== */
/*  HIT TESTING                                                        */
/* ================================================================== */

function hitTestNode(
  nodes: GraphNode[],
  screenX: number,
  screenY: number,
  camera: Camera,
  width: number,
  height: number,
): GraphNode | null {
  // Transform screen to world
  const worldX = (screenX - (width / 2 + camera.x)) / camera.zoom;
  const worldY = (screenY - (height / 2 + camera.y)) / camera.zoom;

  // Check nodes in reverse order (top first)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const r = 8 + node.size * 5 + 8; // padding
    const dx = worldX - node.x;
    const dy = worldY - node.y;
    if (dx * dx + dy * dy <= r * r) {
      return node;
    }
  }
  return null;
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function Brain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const isDraggingNodeRef = useRef(false);
  const draggedNodeIdRef = useRef<string | null>(null);
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // State
  const [nodes, setNodes] = useState<GraphNode[]>(() =>
    MOCK_NODES.map(n => ({ ...n })),
  );
  const [edges] = useState<GraphEdge[]>(MOCK_EDGES);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [showHelp, setShowHelp] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [connectedToSelected, setConnectedToSelected] = useState<GraphNode[]>([]);

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedId) || null,
    [nodes, selectedId],
  );

  // Derived stats
  const stats = useMemo(() => {
    const typeCount = new Set(nodes.map(n => n.type)).size;
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      typeCount,
    };
  }, [nodes, edges]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Initialize physics (warm-up)
  useEffect(() => {
    if (layoutMode === 'force') {
      const copy = nodes.map(n => ({ ...n, vx: 0, vy: 0 } as GraphNode & { vx?: number; vy?: number }));
      runLayout(copy, edges, 200);
      setNodes(copy);
    } else if (layoutMode === 'circular') {
      const copy = nodes.map(n => ({ ...n }));
      applyCircularLayout(copy);
      setNodes(copy);
    } else if (layoutMode === 'grid') {
      const copy = nodes.map(n => ({ ...n }));
      applyGridLayout(copy);
      setNodes(copy);
    } else if (layoutMode === 'hierarchical') {
      const copy = nodes.map(n => ({ ...n }));
      applyHierarchicalLayout(copy);
      setNodes(copy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode]);

  // Update connected nodes when selection changes
  useEffect(() => {
    if (!selectedId) {
      setConnectedToSelected([]);
      return;
    }
    const connected = edges
      .filter(e => e.source === selectedId || e.target === selectedId)
      .map(e => {
        const otherId = e.source === selectedId ? e.target : e.source;
        return nodes.find(n => n.id === otherId);
      })
      .filter((n): n is GraphNode => n !== undefined);
    setConnectedToSelected(connected);
  }, [selectedId, edges, nodes]);

  // Animation loop: physics + render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas actual size for DPR
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.67, 2); // normalize to ~60fps
      lastTime = time;

      // Physics
      if (layoutMode === 'force') {
        applyForces(nodes, edges);
        updatePositions(nodes, dt);
      }

      // Render
      renderGraph(ctx, nodes, edges, camera, canvasSize.width, canvasSize.height, hoveredId, selectedId, searchQuery);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, edges, camera, canvasSize, hoveredId, selectedId, searchQuery, layoutMode]);

  // Hide help tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelp(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  /* ================================================================ */
  /*  MOUSE HANDLERS                                                   */
  /* ================================================================ */

  const getMousePos = useCallback((e: React.MouseEvent): [number, number] => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return [e.clientX, e.clientY];
    return [e.clientX - rect.left, e.clientY - rect.top];
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) return; // right click
      const [mx, my] = getMousePos(e);
      const hitNode = hitTestNode(nodes, mx, my, camera, canvasSize.width, canvasSize.height);

      if (hitNode) {
        isDraggingNodeRef.current = true;
        draggedNodeIdRef.current = hitNode.id;
        setSelectedId(hitNode.id);
        setHoveredId(hitNode.id);
      } else {
        isPanningRef.current = true;
        setSelectedId(null);
      }
      lastMouseRef.current = { x: mx, y: my };
    },
    [nodes, camera, canvasSize, getMousePos],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const [mx, my] = getMousePos(e);

      if (isDraggingNodeRef.current && draggedNodeIdRef.current) {
        // Drag node in world space
        const dx = (mx - lastMouseRef.current.x) / camera.zoom;
        const dy = (my - lastMouseRef.current.y) / camera.zoom;
        setNodes(prev =>
          prev.map(n => (n.id === draggedNodeIdRef.current ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
        );
        lastMouseRef.current = { x: mx, y: my };
      } else if (isPanningRef.current) {
        const dx = mx - lastMouseRef.current.x;
        const dy = my - lastMouseRef.current.y;
        setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastMouseRef.current = { x: mx, y: my };
      } else {
        // Hover detection
        const hitNode = hitTestNode(nodes, mx, my, camera, canvasSize.width, canvasSize.height);
        setHoveredId(hitNode?.id || null);
      }
    },
    [nodes, camera, canvasSize, getMousePos],
  );

  const handleMouseUp = useCallback(() => {
    isDraggingNodeRef.current = false;
    draggedNodeIdRef.current = null;
    isPanningRef.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const [mx, my] = getMousePos(e);
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.max(0.1, Math.min(5, camera.zoom * zoomFactor));

      // Zoom towards mouse position
      const worldBeforeX = (mx - (canvasSize.width / 2 + camera.x)) / camera.zoom;
      const worldBeforeY = (my - (canvasSize.height / 2 + camera.y)) / camera.zoom;

      const newCameraX = mx - (canvasSize.width / 2 + worldBeforeX * newZoom);
      const newCameraY = my - (canvasSize.height / 2 + worldBeforeY * newZoom);

      setCamera({ x: newCameraX, y: newCameraY, zoom: newZoom });
    },
    [camera, canvasSize, getMousePos],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const [mx, my] = getMousePos(e);
      // Check if clicked on empty space
      const hitNode = hitTestNode(nodes, mx, my, camera, canvasSize.width, canvasSize.height);
      if (!hitNode) {
        // Create new node at world position
        const worldX = (mx - (canvasSize.width / 2 + camera.x)) / camera.zoom;
        const worldY = (my - (canvasSize.height / 2 + camera.y)) / camera.zoom;
        const newNode: GraphNode = {
          id: `n${Date.now()}`,
          type: 'note',
          title: 'Neuer Knoten',
          x: worldX,
          y: worldY,
          size: 1,
          tags: [],
          status: 'aktiv',
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        setNodes(prev => [...prev, newNode]);
        setSelectedId(newNode.id);
      }
    },
    [nodes, camera, canvasSize, getMousePos],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const [mx, my] = getMousePos(e);
      const hitNode = hitTestNode(nodes, mx, my, camera, canvasSize.width, canvasSize.height);
      if (hitNode) {
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId: hitNode.id });
        setSelectedId(hitNode.id);
      } else {
        setContextMenu(null);
      }
    },
    [nodes, camera, canvasSize, getMousePos],
  );

  /* ================================================================ */
  /*  ACTIONS                                                          */
  /* ================================================================ */

  const zoomIn = useCallback(() => {
    setCamera(prev => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setCamera(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }));
  }, []);

  const zoomReset = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setSelectedId(prev => (prev === nodeId ? null : prev));
    setContextMenu(null);
  }, []);

  const duplicateNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newNode: GraphNode = {
      ...node,
      id: `n${Date.now()}`,
      x: node.x + 30,
      y: node.y + 30,
      title: node.title + ' (Kopie)',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setNodes(prev => [...prev, newNode]);
    setContextMenu(null);
  }, [nodes]);

  const handleUpdateNode = useCallback(
    (updates: Partial<GraphNode>) => {
      if (!selectedId) return;
      setNodes(prev =>
        prev.map(n =>
          n.id === selectedId
            ? { ...n, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
            : n,
        ),
      );
    },
    [selectedId],
  );

  // Count filtered nodes for status bar
  const visibleNodeCount = useMemo(() => {
    if (!searchQuery && filterType === 'all') return nodes.length;
    const lowerQuery = searchQuery.toLowerCase();
    return nodes.filter(n => {
      const matchesType = filterType === 'all' || n.type === filterType;
      const matchesSearch =
        !searchQuery ||
        n.title.toLowerCase().includes(lowerQuery) ||
        n.tags.some(t => t.toLowerCase().includes(lowerQuery));
      return matchesType && matchesSearch;
    }).length;
  }, [nodes, searchQuery, filterType]);

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  return (
    <div ref={containerRef} className="absolute inset-0 bg-black overflow-hidden" style={{ margin: '-32px -32px 0 -32px' }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ width: canvasSize.width, height: canvasSize.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Toolbar (top) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0C0D0F] border border-white/[0.06] rounded-xl px-3 py-2 shadow-lg">
          <Search className="w-4 h-4 text-[#5E626A]" />
          <input
            type="text"
            placeholder="Knoten suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-[#5E626A] outline-none w-40"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#5E626A] hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter dropdown */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => { setShowFilterMenu(v => !v); setShowLayoutMenu(false); }}
            className="flex items-center gap-1.5 bg-[#0C0D0F] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-[#A1A4AA] hover:text-white hover:border-white/[0.12] transition-colors shadow-lg"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1 left-0 bg-[#0C0D0F] border border-white/[0.06] rounded-xl shadow-xl py-1 min-w-[160px]"
              >
                <button
                  onClick={() => { setFilterType('all'); setShowFilterMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm ${filterType === 'all' ? 'text-white bg-white/[0.06]' : 'text-[#A1A4AA] hover:text-white hover:bg-white/[0.04]'} transition-colors`}
                >
                  Alle Typen
                </button>
                {NODE_TYPE_OPTIONS.map(type => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type); setShowFilterMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${filterType === type ? 'text-white bg-white/[0.06]' : 'text-[#A1A4AA] hover:text-white hover:bg-white/[0.04]'} transition-colors`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
                    {NODE_TYPE_LABELS[type]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Layout dropdown */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => { setShowLayoutMenu(v => !v); setShowFilterMenu(false); }}
            className="flex items-center gap-1.5 bg-[#0C0D0F] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-[#A1A4AA] hover:text-white hover:border-white/[0.12] transition-colors shadow-lg"
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>Layout</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showLayoutMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1 left-0 bg-[#0C0D0F] border border-white/[0.06] rounded-xl shadow-xl py-1 min-w-[160px]"
              >
                {([
                  ['force', 'Force-Directed'],
                  ['circular', 'Kreisf\u00f6rmig'],
                  ['grid', 'Raster'],
                  ['hierarchical', 'Hierarchisch'],
                ] as [LayoutMode, string][]).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => { setLayoutMode(mode); setShowLayoutMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm ${layoutMode === mode ? 'text-white bg-white/[0.06]' : 'text-[#A1A4AA] hover:text-white hover:bg-white/[0.04]'} transition-colors`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => {
            const newNode: GraphNode = {
              id: `n${Date.now()}`,
              type: 'note',
              title: 'Neuer Knoten',
              x: (-camera.x) / camera.zoom + (Math.random() - 0.5) * 100,
              y: (-camera.y) / camera.zoom + (Math.random() - 0.5) * 100,
              size: 1,
              tags: [],
              status: 'aktiv',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            };
            setNodes(prev => [...prev, newNode]);
            setSelectedId(newNode.id);
          }}
          className="pointer-events-auto flex items-center gap-1.5 bg-[#FF8C5A] hover:bg-[#e67d4f] text-black rounded-xl px-3 py-2 text-sm font-semibold transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Neuer Knoten</span>
        </button>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="pointer-events-auto flex items-center bg-[#0C0D0F] border border-white/[0.06] rounded-xl shadow-lg overflow-hidden">
          <button onClick={zoomOut} className="p-2 text-[#A1A4AA] hover:text-white hover:bg-white/[0.06] transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs text-[#5E626A] font-mono border-x border-white/[0.06] min-w-[48px] text-center">
            {Math.round(camera.zoom * 100)}%
          </span>
          <button onClick={zoomIn} className="p-2 text-[#A1A4AA] hover:text-white hover:bg-white/[0.06] transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={zoomReset} className="p-2 text-[#A1A4AA] hover:text-white hover:bg-white/[0.06] transition-colors border-l border-white/[0.06]">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Help tooltip */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 bg-[#0C0D0F] border border-white/[0.06] rounded-xl px-4 py-3 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-[#FF8C5A] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Knowledge Graph</p>
                <p className="text-xs text-[#A1A4AA] mt-1">
                  Doppelklick: Neuer Knoten &middot; Drag: Verschieben &middot; Scroll: Zoomen &middot; Rechtsklick: Men\u00fc
                </p>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-[#5E626A] hover:text-white transition-colors ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Panel (right) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute top-4 bottom-4 right-4 z-30 w-[340px] bg-[#0C0D0F] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.type] + '20', border: `1.5px solid ${NODE_COLORS[selectedNode.type]}40` }}
                >
                  {(() => {
                    const Icon = TYPE_ICONS[selectedNode.type] || Circle;
                    return <Icon className="w-5 h-5" style={{ color: NODE_COLORS[selectedNode.type] }} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{selectedNode.title}</h3>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md inline-block mt-0.5"
                    style={{
                      color: NODE_COLORS[selectedNode.type],
                      backgroundColor: NODE_COLORS[selectedNode.type] + '18',
                    }}
                  >
                    {NODE_TYPE_LABELS[selectedNode.type]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-[#5E626A] hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title edit */}
              <div>
                <label className="text-xs text-[#5E626A] uppercase tracking-wider font-medium mb-1.5 block">Titel</label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={e => handleUpdateNode({ title: e.target.value })}
                  className="w-full bg-[#141518] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5E626A] outline-none focus:border-[#FF8C5A]/40 transition-colors"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs text-[#5E626A] uppercase tracking-wider font-medium mb-1.5 block">Typ</label>
                <div className="flex flex-wrap gap-1.5">
                  {NODE_TYPE_OPTIONS.map(type => (
                    <button
                      key={type}
                      onClick={() => handleUpdateNode({ type })}
                      className={`px-2 py-1 rounded-md text-xs transition-colors border ${
                        selectedNode.type === type
                          ? 'text-white border-white/[0.12] bg-white/[0.08]'
                          : 'text-[#5E626A] border-transparent hover:text-[#A1A4AA] hover:bg-white/[0.04]'
                      }`}
                    >
                      {NODE_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#5E626A] uppercase tracking-wider font-medium mb-1.5 block">Status</label>
                  <select
                    value={selectedNode.status || 'aktiv'}
                    onChange={e => handleUpdateNode({ status: e.target.value })}
                    className="w-full bg-[#141518] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF8C5A]/40 transition-colors appearance-none"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#5E626A] uppercase tracking-wider font-medium mb-1.5 block">Priorit\u00e4t</label>
                  <select
                    value={selectedNode.priority || 'mittel'}
                    onChange={e => handleUpdateNode({ priority: e.target.value })}
                    className="w-full bg-[#141518] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF8C5A]/40 transition-colors appearance-none"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-xs text-[#5E626A] uppercase tracking-wider font-medium mb-1.5 block">Inhalt</label>
                <textarea
                  value={selectedNode.content || ''}
                  onChange={e => handleUpdateNode({ content: e.target.value })}
                  placeholder="Notizen hier eingeben..."
                  rows={4}
                  className="w-full bg-[#141518] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5E626A] outline-none focus:border-[#FF8C5A]/40 transition-colors resize-none"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs text-[#5E626A] uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#141518] border border-white/[0.06] rounded-md text-xs text-[#A1A4AA]"
                    >
                      {tag}
                      <button
                        onClick={() => handleUpdateNode({ tags: selectedNode.tags.filter((_, i) => i !== idx) })}
                        className="text-[#5E626A] hover:text-white transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      const newTag = prompt('Neuer Tag:');
                      if (newTag && !selectedNode.tags.includes(newTag)) {
                        handleUpdateNode({ tags: [...selectedNode.tags, newTag] });
                      }
                    }}
                    className="px-2 py-0.5 border border-dashed border-white/[0.08] rounded-md text-xs text-[#5E626A] hover:text-[#A1A4AA] hover:border-white/[0.15] transition-colors"
                  >
                    + Tag
                  </button>
                </div>
              </div>

              {/* Connected nodes */}
              <div>
                <label className="text-xs text-[#5E626A] uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3 h-3" />
                  Verbindungen ({connectedToSelected.length})
                </label>
                <div className="space-y-1">
                  {connectedToSelected.map(node => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedId(node.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[node.type] }} />
                      <span className="text-sm text-[#A1A4AA] hover:text-white truncate">{node.title}</span>
                    </button>
                  ))}
                  {connectedToSelected.length === 0 && (
                    <p className="text-xs text-[#5E626A] italic px-2">Keine Verbindungen</p>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-2 border-t border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#5E626A]">
                  <Clock className="w-3 h-3" />
                  <span>Erstellt: {selectedNode.createdAt || 'unbekannt'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5E626A]">
                  <RefreshCw className="w-3 h-3" />
                  <span>Aktualisiert: {selectedNode.updatedAt || 'unbekannt'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 bg-[#0C0D0F] border border-white/[0.06] rounded-xl shadow-2xl py-1 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {[
              { label: 'Details bearbeiten', icon: Edit3, action: () => { setSelectedId(contextMenu.nodeId); setContextMenu(null); } },
              { label: 'Verbindung hinzuf\u00fcgen', icon: Link, action: () => { setSelectedId(contextMenu.nodeId); setContextMenu(null); } },
              { label: 'Duplizieren', icon: Copy, action: () => duplicateNode(contextMenu.nodeId) },
              { label: 'Archivieren', icon: Archive, action: () => { handleUpdateNode({ status: 'archiviert' }); setContextMenu(null); } },
              { label: 'L\u00f6schen', icon: Trash2, action: () => deleteNode(contextMenu.nodeId), danger: true },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  item.danger
                    ? 'text-[#EF4444] hover:bg-[#EF4444]/10'
                    : 'text-[#A1A4AA] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}

      {/* Status Bar (bottom) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 pointer-events-none">
        <div className="bg-[#0C0D0F] border border-white/[0.06] rounded-lg px-3 py-1.5 shadow-lg">
          <span className="text-xs text-[#5E626A]">
            <span className="text-[#A1A4AA] font-medium">{visibleNodeCount}</span> Knoten
            <span className="mx-1.5 text-white/[0.06]">|</span>
            <span className="text-[#A1A4AA] font-medium">{edges.length}</span> Verbindungen
            <span className="mx-1.5 text-white/[0.06]">|</span>
            <span className="text-[#A1A4AA] font-medium">{stats.typeCount}</span> Typen
          </span>
        </div>
      </div>

      {/* Node type legend (bottom right) */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-[#0C0D0F] border border-white/[0.06] rounded-lg px-3 py-2 shadow-lg">
          <div className="flex flex-wrap gap-x-3 gap-y-1 max-w-[240px]">
            {NODE_TYPE_OPTIONS.slice(0, 6).map(type => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
                <span className="text-[10px] text-[#5E626A]">{NODE_TYPE_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
