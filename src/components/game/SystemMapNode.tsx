import React, { useEffect, useState, useRef } from 'react';
import { deriveNodeHealth } from '../../engine/deriveNodeHealth';
import { useGameStore } from '../../store/useGameStore';
import { systemNodes } from '../../data/nodeMap';
import { SystemMapNode as NodeType } from '../../types/game';
import { metricLabels } from '../../data/labels';

export default function SystemMapNode({ node }: { node: NodeType }) {
  const metrics = useGameStore(state => state.metrics);
  const health = deriveNodeHealth(node.id, metrics, systemNodes);
  const [prevHealth, setPrevHealth] = useState(health);
  const [animClass, setAnimClass] = useState('');
  
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const colorClass = health > 69 ? 'border-accent-green text-accent-green drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 
                     health > 39 ? 'border-accent-amber text-accent-amber drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 
                     'border-accent-red text-accent-red drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]';

  const glowVar = health > 69 ? 'rgba(34, 197, 94, 0.15)' : 
                   health > 39 ? 'rgba(245, 158, 11, 0.15)' : 
                   'rgba(239, 68, 68, 0.15)';

  // Positioning logic for tooltip to prevent clipping at the bottom
  const tooltipClass = node.y > 60 
    ? "bottom-full mb-3" // Show above node if it's placed low on the map
    : "top-full mt-3";   // Show below node otherwise

  return (
    <div 
      className={`absolute pointer-events-auto ${showTooltip ? 'z-[100]' : 'z-10'}`}
      style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
      ref={nodeRef}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div 
        className={`w-[96px] md:w-[120px] h-[52px] md:h-[64px] bg-bg-surface-alt border-2 rounded-lg md:rounded-[10px] flex flex-col items-center justify-center system-node cursor-pointer transition-transform hover:scale-105 ${colorClass} ${animClass}`}
        style={{ '--glow-green': glowVar } as React.CSSProperties}
      >
        <div className="font-sans font-semibold text-[10px] md:text-sm text-text-primary text-center leading-tight px-1 break-words">
          {node.label}
        </div>
        <div className="font-mono font-medium text-[10px] md:text-xs mt-0.5 md:mt-1">
          {Math.round(health)}
        </div>
      </div>
      
      {showTooltip && node.insight && (
        <div className={`absolute left-1/2 -translate-x-1/2 ${tooltipClass} w-[260px] md:w-72 bg-bg-surface border border-border-default rounded-xl shadow-xl p-4 cursor-default text-left pointer-events-none before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2 ${node.y > 60 ? 'before:-bottom-2 before:border-[8px] before:border-transparent before:border-t-border-default' : 'before:-top-2 before:border-[8px] before:border-transparent before:border-b-border-default'}`}>
          <div className="mb-3">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.1em]">Driven By:</span>
            <ul className="text-xs text-text-secondary mt-1 ml-1 space-y-0.5">
              {node.drivingMetrics.map(m => (
                <li key={m} className="flex items-center gap-1.5 before:content-['•'] before:text-accent-blue before:font-bold">
                  {metricLabels[m]}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-sm text-text-primary leading-snug border-t border-border-default/50 pt-2.5">
            <span className="font-bold block mb-1 text-accent-blue text-xs uppercase tracking-wider">System Insight</span>
            {node.insight}
          </div>
        </div>
      )}
    </div>
  );
}
