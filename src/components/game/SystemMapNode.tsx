import React, { useEffect, useState } from 'react';
import { deriveNodeHealth } from '../../engine/deriveNodeHealth';
import { useGameStore } from '../../store/useGameStore';
import { systemNodes } from '../../data/nodeMap';
import { SystemMapNode as NodeType } from '../../types/game';

export default function SystemMapNode({ node }: { node: NodeType }) {
  const metrics = useGameStore(state => state.metrics);
  const health = deriveNodeHealth(node.id, metrics, systemNodes);
  const [prevHealth, setPrevHealth] = useState(health);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (health !== prevHealth) {
      if (health > prevHealth) setAnimClass('node-improved');
      else setAnimClass('node-worsened');
      
      const timer = setTimeout(() => {
        setAnimClass('');
        setPrevHealth(health);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [health, prevHealth]);

  const colorClass = health > 69 ? 'border-accent-green text-accent-green drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 
                     health > 39 ? 'border-accent-amber text-accent-amber drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 
                     'border-accent-red text-accent-red drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]';

  const glowVar = health > 69 ? 'rgba(34, 197, 94, 0.15)' : 
                   health > 39 ? 'rgba(245, 158, 11, 0.15)' : 
                   'rgba(239, 68, 68, 0.15)';

  return (
    <div 
      className="absolute pointer-events-auto"
      style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div 
        className={`w-[96px] md:w-[120px] h-[52px] md:h-[64px] bg-bg-surface-alt border-2 rounded-lg md:rounded-[10px] flex flex-col items-center justify-center system-node ${colorClass} ${animClass}`}
        style={{ '--glow-green': glowVar } as React.CSSProperties}
      >
        <div className="font-sans font-semibold text-[10px] md:text-sm text-text-primary text-center leading-tight px-1 break-words">
          {node.label}
        </div>
        <div className="font-mono font-medium text-[10px] md:text-xs mt-0.5 md:mt-1">
          {Math.round(health)}
        </div>
      </div>
    </div>
  );
}
