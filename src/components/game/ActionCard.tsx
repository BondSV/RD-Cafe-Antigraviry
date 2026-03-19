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

  const colorMap: Record<string, { border: string; bg: string; text: string; hover: string }> = {
    staffing: { border: 'border-l-accent-burgundy', bg: 'bg-accent-burgundy/10', text: 'text-accent-burgundy', hover: 'hover:border-accent-burgundy' },
    layout: { border: 'border-l-accent-blue', bg: 'bg-accent-blue/10', text: 'text-accent-blue', hover: 'hover:border-accent-blue' },
    menu: { border: 'border-l-accent-green', bg: 'bg-accent-green/10', text: 'text-accent-green', hover: 'hover:border-accent-green' },
    process: { border: 'border-l-accent-amber', bg: 'bg-accent-amber/10', text: 'text-accent-amber', hover: 'hover:border-accent-amber' },
  };
  const colors = colorMap[action.group] || colorMap.staffing;

  return (
    <button
      onClick={() => isInteractive && applyAction(action.id)}
      disabled={!isInteractive}
      className={`w-full text-left bg-white border-y-[1.5px] border-r-[1.5px] border-l-[4px] rounded-xl p-4 my-2 transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:ring-accent-blue shadow-sm
        ${isUsed ? 'opacity-40 cursor-not-allowed border-border-default shadow-none bg-bg-surface-alt/50 border-l-border-default' : 
          disabled ? 'opacity-50 cursor-not-allowed border-border-default shadow-none border-l-border-default' : 
          `border-border-default ${colors.border} ${colors.hover} hover:-translate-y-1 hover:shadow-lg cursor-pointer`
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-sans font-semibold text-base text-text-primary ${isUsed ? 'line-through' : ''}`}>
          {action.title}
        </h4>
        <Icon className={`w-[18px] h-[18px] ml-2 flex-shrink-0 ${isUsed || disabled ? 'text-text-secondary' : colors.text}`} />
      </div>
      <p className="font-sans text-sm text-text-secondary leading-relaxed mb-6 pr-2">
        {action.description}
      </p>
      <div className="absolute bottom-3 right-4">
        <span className={`font-sans text-xs font-semibold uppercase tracking-[0.08em] px-2 py-1 rounded ${isUsed || disabled ? 'bg-bg-surface-alt text-text-muted' : `${colors.bg} ${colors.text}`}`}>
          {action.group}
        </span>
      </div>
    </button>
  );
}
