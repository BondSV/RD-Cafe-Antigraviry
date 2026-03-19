import React, { useEffect, useState } from 'react';
import { SystemMapNode as NodeType, SystemMapConnection as ConnType } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';

export default function SystemMapConnection({ conn, nodes, allConnections, dims }: { conn: ConnType, nodes: NodeType[], allConnections: ConnType[], dims: { w: number, h: number } }) {
  const fromNode = nodes.find(n => n.id === conn.from);
  const toNode = nodes.find(n => n.id === conn.to);
  const turn = useGameStore(state => state.turn);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (turn > 1) {
      setActive(true);
      const timer = setTimeout(() => setActive(false), 800);
      return () => clearTimeout(timer);
    }
  }, [turn]);

  if (!fromNode || !toNode || dims.w === 0) return null;

  const hasReverse = allConnections.some(c => c.from === conn.to && c.to === conn.from);
  const pathId = `path-${conn.from}-${conn.to}`;

  const x1 = (fromNode.x / 100) * dims.w;
  const y1 = (fromNode.y / 100) * dims.h;
  const x2 = (toNode.x / 100) * dims.w;
  const y2 = (toNode.y / 100) * dims.h;

  let d = `M ${x1} ${y1} L ${x2} ${y2}`;

  if (hasReverse) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx = x1 + dx * 0.5 - dy * 0.15;
    const cy = y1 + dy * 0.5 + dx * 0.15;
    d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }

  // Draw distinct grey vs indigo for dual-way lines
  const strokeColor = hasReverse ? (conn.from > conn.to ? '#94A3B8' : '#818CF8') : '#CBD5E1';
  const duration = active ? '0.8s' : '3.5s';

  return (
    <g>
      <path
        id={pathId}
        d={d}
        fill="none"
        stroke={strokeColor}
        className={`stroke-[1.5px] transition-all duration-300 ${active ? 'stroke-accent-blue shadow-[0_0_8px_#3B82F6]' : ''}`}
      />
      
      <polygon key={active ? 'fast' : 'slow'} points="-5,-5 6,0 -5,5" fill="#16A34A">
        <animateMotion dur={duration} repeatCount="indefinite" rotate="auto">
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </polygon>
    </g>
  );
}
