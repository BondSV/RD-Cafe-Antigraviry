import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getSystemScore } from '../../engine/getSystemScore';

export default function TurnHeader() {
  const turn = useGameStore(state => state.turn);
  const maxTurns = useGameStore(state => state.maxTurns);

  const metrics = useGameStore(state => state.metrics);
  const systemScore = getSystemScore(metrics);
  const healthColor = systemScore > 69 ? 'bg-accent-green' : systemScore > 39 ? 'bg-accent-amber' : 'bg-accent-red';

  return (
    <div className="w-full h-[52px] bg-bg-surface border-b border-border-default flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
      <div className="font-mono font-bold text-sm text-text-primary">
        TURN {Math.min(turn, maxTurns)} OF {maxTurns}
      </div>
      <div className="hidden md:flex flex-1 max-w-[200px] h-2 bg-black/30 rounded-full overflow-hidden mx-4 border border-border-default">
        <div 
          className={`h-full transition-all duration-500 ease-in-out ${healthColor}`} 
          style={{ width: `${systemScore}%` }} 
        />
      </div>
      <div className="font-mono text-xs text-text-muted">
        SYSTEM SCORE: {systemScore.toFixed(1)}
      </div>
    </div>
  );
}
