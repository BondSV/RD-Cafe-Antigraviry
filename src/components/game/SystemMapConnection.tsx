import React, { useEffect, useState } from 'react';
import { SystemMapNode as NodeType, SystemMapConnection as ConnType } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';

export default function SystemMapConnection({ conn, nodes }: { conn: ConnType, nodes: NodeType[] }) {
  const fromNode = nodes.find(n => n.id === conn.from);
  const toNode = nodes.find(n => n.id === conn.to);
  const turn = useGameStore(state => state.turn);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (turn > 1) {
      setActive(true);
      const timer = setTimeout(() => setActive(false), 600);
      return () => clearTimeout(timer);
    }
  }, [turn]);

  if (!fromNode || !toNode) return null;

  return (
    <line
      x1={`${fromNode.x}%`}
      y1={`${fromNode.y}%`}
      x2={`${toNode.x}%`}
      y2={`${toNode.y}%`}
      className={`stroke-border-default stroke-[1.5px] fill-transparent ${active ? 'connection-active' : ''}`}
    />
  );
}
