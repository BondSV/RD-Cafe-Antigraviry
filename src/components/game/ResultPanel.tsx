import React from 'react';
import { TurnRecord, DeltaStatus } from '../../types/game';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { actions } from '../../data/actions';

export default function ResultPanel({ turnRecord, onClose }: { turnRecord: TurnRecord, onClose: () => void }) {
  const action = actions.find(a => a.id === turnRecord.actionId);

  const getDeltaColor = (status: DeltaStatus) => {
    if (status === 'improved') return 'text-accent-green';
    if (status === 'worsened') return 'text-accent-red';
    return 'text-text-muted';
  };

  const getDeltaIcon = (status: DeltaStatus) => {
    if (status === 'improved') return <ArrowUp className="w-4 h-4 ml-2" />;
    if (status === 'worsened') return <ArrowDown className="w-4 h-4 ml-2" />;
    return <Minus className="w-4 h-4 ml-2" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0 bg-black/60 md:bg-transparent md:backdrop-blur-none transition-opacity">
      <div className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-md md:max-w-[440px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6">
          <div className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
            TURN {turnRecord.turn} RESULT
          </div>
          <h2 className="font-sans font-bold text-[1.15rem] leading-tight text-text-primary mb-6">
            {action?.title}
          </h2>

          <div className="space-y-3 mb-6 bg-bg-surface-alt p-4 rounded-xl border border-border-default">
            {turnRecord.deltas.map(d => (
              <div key={d.key} className="flex justify-between items-center">
                <span className="font-sans text-sm text-text-secondary">{d.label}</span>
                <div className={`flex items-center font-mono font-bold text-sm ${getDeltaColor(d.status)}`}>
                  <span>{d.displayAfter}</span>
                  <span className="ml-2 text-xs opacity-80">
                    {d.deltaValue > 0 ? `+${d.deltaValue}` : d.deltaValue < 0 ? d.deltaValue : ''}
                  </span>
                  {getDeltaIcon(d.status)}
                </div>
              </div>
            ))}
          </div>

          <p className="font-sans text-sm md:text-base text-text-primary leading-relaxed bg-black/20 p-4 rounded-xl border-l-4 border-accent-blue">
            {turnRecord.eventText}
          </p>
        </div>

        <div className="p-4 bg-bg-surface-alt border-t border-border-default">
          <button 
            onClick={onClose}
            className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-md transition-transform transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-blue focus-visible:ring-offset-bg-surface"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
