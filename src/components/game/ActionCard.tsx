import React from 'react';
import { ActionConfig } from '../../types/game';
import { Users, LayoutGrid, UtensilsCrossed, ClipboardList } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export default function ActionCard({ action, disabled }: { action: ActionConfig, disabled: boolean }) {
  const applyAction = useGameStore(state => state.applyAction);
  const actionsTaken = useGameStore(state => state.actionsTaken);
  
  const isUsed = actionsTaken.includes(action.id);
  const isInteractive = !isUsed && !disabled;

  const Icon = action.group === 'staffing' ? Users : 
               action.group === 'layout' ? LayoutGrid : 
               action.group === 'menu' ? UtensilsCrossed : ClipboardList;

  return (
    <button
      onClick={() => isInteractive && applyAction(action.id)}
      disabled={!isInteractive}
      className={`w-full text-left bg-bg-surface-alt border-[1.5px] rounded-[10px] p-[14px] px-4 my-1 transition-all relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:ring-accent-blue
        ${isUsed ? 'opacity-30 cursor-not-allowed border-border-default' : 
          disabled ? 'opacity-50 cursor-not-allowed border-border-default' : 
          'border-border-default hover:border-border-focus hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(59,130,246,0.12)] cursor-pointer'
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-sans font-semibold text-base text-text-primary ${isUsed ? 'line-through' : ''}`}>
          {action.title}
        </h4>
        <Icon className="w-[18px] h-[18px] text-text-secondary ml-2 flex-shrink-0" />
      </div>
      <p className="font-sans text-sm text-text-secondary leading-relaxed mb-6 pr-2">
        {action.description}
      </p>
      <div className="absolute bottom-3 right-4">
        <span className="font-sans text-xs uppercase tracking-[0.08em] text-text-muted bg-bg-surface px-2 py-1 rounded">
          {action.group}
        </span>
      </div>
    </button>
  );
}
