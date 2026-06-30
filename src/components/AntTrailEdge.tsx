import { useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';

interface AntTrailEdgeData {
  strength?: number;
  activity?: 'high' | 'medium' | 'low';
  animated?: boolean;
}

export default function AntTrailEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps & { data?: AntTrailEdgeData }) {
  const strength = data?.strength ?? 0.5;
  const activity = data?.activity ?? 'medium';
  const isAnimated = data?.animated ?? true;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });

  const color = useMemo(() => {
    switch (activity) {
      case 'high': return '#FF8C5A';
      case 'medium': return '#B98BFF';
      case 'low': return '#5E626A';
      default: return '#B98BFF';
    }
  }, [activity]);

  const glowColor = useMemo(() => {
    switch (activity) {
      case 'high': return 'rgba(255, 140, 90, 0.3)';
      case 'medium': return 'rgba(185, 139, 255, 0.25)';
      case 'low': return 'rgba(94, 98, 106, 0.15)';
      default: return 'rgba(185, 139, 255, 0.25)';
    }
  }, [activity]);

  const strokeWidth = 2 + strength * 2;

  // Generate animated dot offsets
  const dots = useMemo(() => {
    return [0, 0.33, 0.66].map((offset) => ({
      offset,
      delay: offset * 2,
      speed: 2 + offset,
    }));
  }, []);

  return (
    <>
      {/* SVG Definitions for gradients */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id={`antGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="50%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.8} />
          </linearGradient>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Glow layer - wider semi-transparent stroke */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: glowColor,
          strokeWidth: strokeWidth + 6,
          fill: 'none',
          filter: `url(#glow-${id})`,
          opacity: selected ? 1 : 0.6,
          transition: 'all 0.3s ease',
        }}
      />

      {/* Base path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: `url(#antGrad-${id})`,
          strokeWidth,
          fill: 'none',
          opacity: selected ? 1 : 0.7,
          transition: 'all 0.3s ease',
        }}
      />

      {/* Marching ants overlay */}
      {isAnimated && (
        <path
          d={edgePath}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="6 6"
          opacity={0.5}
          style={{
            animation: 'antMarch 2s linear infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Animated ant dots */}
      {isAnimated &&
        dots.map((dot, i) => (
          <circle
            key={`${id}-dot-${i}`}
            r={2 + strength * 1}
            fill={color}
            opacity={0.9}
            filter={`url(#glow-${id})`}
            style={{
              animation: `antCrawl${(i % 3) + 1} ${dot.speed}s linear infinite`,
              animationDelay: `${dot.delay}s`,
              offsetPath: `path('${edgePath}')`,
              offsetDistance: '0%',
              offsetRotate: '0deg',
            }}
          />
        ))}

      {/* Activity label on hover/selected */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className="px-2 py-1 rounded-md text-[10px] font-medium backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(12,13,15,0.9)',
                color,
                border: `1px solid ${color}`,
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              {strength > 0.7 ? '●●●' : strength > 0.4 ? '●●○' : '●○○'} {Math.round(strength * 100)}%
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Edge button for removing/selecting
export function AntTrailEdgeButton({ id }: { id: string }) {
  const { setEdges } = useReactFlow();

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  return (
    <button
      className="ant-trail-edge__button"
      onClick={onEdgeClick}
      aria-label="Verbindung entfernen"
      title="Verbindung entfernen"
    >
      ×
    </button>
  );
}
