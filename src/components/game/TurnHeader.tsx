import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getSystemScore } from '../../engine/getSystemScore';

export default function TurnHeader() {
  const turn = useGameStore(state => state.turn);
  const maxTurns = useGameStore(state => state.maxTurns);

  const metrics = useGameStore(state => state.metrics);
  const systemScore = getSystemScore(metrics);
  const healthColor = systemScore > 69 ? 'bg-accent-green' : systemScore > 39 ? 'bg-accent-amber' : 'bg-accent-red';
  const scoreAccent = systemScore > 69
    ? 'border-accent-green/40 bg-accent-green/12 text-accent-green shadow-[0_0_0_1px_rgba(34,197,94,0.08),0_10px_24px_rgba(34,197,94,0.12)]'
    : systemScore > 39
      ? 'border-accent-amber/40 bg-accent-amber/12 text-accent-amber shadow-[0_0_0_1px_rgba(245,158,11,0.08),0_10px_24px_rgba(245,158,11,0.14)]'
      : 'border-accent-red/40 bg-accent-red/12 text-accent-red shadow-[0_0_0_1px_rgba(239,68,68,0.08),0_10px_24px_rgba(239,68,68,0.12)]';

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
      <div className={`flex items-center gap-3 rounded-xl border px-3 py-1.5 transition-all duration-300 ${scoreAccent}`}>
        <div className="font-mono text-[10px] font-bold leading-none uppercase tracking-[0.16em] text-black">
          System Score
        </div>
        <div className="font-mono text-lg font-bold leading-none">
          {systemScore.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
