import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export default function TurnHeader() {
  const turn = useGameStore(state => state.turn);
  const maxTurns = useGameStore(state => state.maxTurns);

  const metrics = useGameStore(state => state.metrics);
  const health = Object.values(metrics).reduce((a, b) => a + b, 0) / 7;
  const healthColor = health > 69 ? 'bg-accent-green' : health > 39 ? 'bg-accent-amber' : 'bg-accent-red';

  return (
    <div className="w-full h-[52px] bg-bg-surface border-b border-border-default flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
      <div className="font-mono font-bold text-sm text-text-primary">
        TURN {Math.min(turn, maxTurns)} OF {maxTurns}
      </div>
      <div className="hidden md:flex flex-1 max-w-[200px] h-2 bg-black/30 rounded-full overflow-hidden mx-4 border border-border-default">
        <div 
          className={`h-full transition-all duration-500 ease-in-out ${healthColor}`} 
          style={{ width: `${health}%` }} 
        />
      </div>
      <div className="font-mono text-xs text-text-muted">
        SYSTEM SCORE: {Math.round(health)}
      </div>
    </div>
  );
}
