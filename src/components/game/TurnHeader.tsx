import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getSystemScore } from '../../engine/getSystemScore';

export default function TurnHeader() {
  const turn = useGameStore(state => state.turn);
  const maxTurns = useGameStore(state => state.maxTurns);

  const metrics = useGameStore(state => state.metrics);
  const systemScore = getSystemScore(metrics);
  const scoreAccent = systemScore > 69
    ? 'border-accent-green/40 bg-accent-green/12 text-accent-green shadow-[0_0_0_1px_rgba(34,197,94,0.08),0_10px_24px_rgba(34,197,94,0.12)]'
    : systemScore > 39
      ? 'border-accent-amber/40 bg-accent-amber/12 text-accent-amber shadow-[0_0_0_1px_rgba(245,158,11,0.08),0_10px_24px_rgba(245,158,11,0.14)]'
      : 'border-accent-red/40 bg-accent-red/12 text-accent-red shadow-[0_0_0_1px_rgba(239,68,68,0.08),0_10px_24px_rgba(239,68,68,0.12)]';

  return (
    <header className="turn-header w-full bg-bg-surface border-b border-border-default px-4 sticky top-0 z-30 shadow-sm shrink-0" aria-label="Simulation progress">
      <div className="turn-label font-mono font-bold text-sm text-text-primary">
        TURN {Math.min(turn, maxTurns)} OF {maxTurns}
      </div>
      <ol className="turn-sequence" aria-label="Turn progress">
        {Array.from({ length: maxTurns }, (_, index) => {
          const number = index + 1;
          const status = number < turn ? 'completed' : number === turn ? 'current' : 'upcoming';
          return (
            <li
              key={number}
              className={`turn-step turn-step--${status}`}
              aria-current={status === 'current' ? 'step' : undefined}
              aria-label={`Turn ${number}: ${status}`}
            >
              <span className="turn-marker" aria-hidden="true">{number}</span>
            </li>
          );
        })}
      </ol>
      <div className={`turn-score flex items-center gap-3 rounded-xl border px-3 py-1.5 transition-all duration-300 ${scoreAccent}`}>
        <div className="font-mono text-[10px] font-bold leading-none uppercase tracking-[0.16em] text-black">
          System Score
        </div>
        <div className="font-mono text-lg font-bold leading-none">
          {systemScore.toFixed(1)}
        </div>
      </div>
    </header>
  );
}
