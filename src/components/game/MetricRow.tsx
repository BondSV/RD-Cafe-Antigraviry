import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { MetricContribution } from '../../types/game';

interface MetricRowProps {
  label: string;
  rawValue: number;
  previousValue?: number;
  contributions?: MetricContribution[];
  isLowerBetter?: boolean;
}

export default function MetricRow({ label, rawValue, previousValue, contributions, isLowerBetter }: MetricRowProps) {
  const [displayValue, setDisplayValue] = useState(rawValue);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(rawValue);
    }, 50);
    return () => clearTimeout(timer);
  }, [rawValue]);

  // Close breakdown when clicking outside
  useEffect(() => {
    if (!showBreakdown) return;
    const handler = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setShowBreakdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBreakdown]);

  const colorClass = displayValue > 69 ? 'text-accent-green' : displayValue > 39 ? 'text-accent-amber' : 'text-accent-red';
  const bgClass = displayValue > 69 ? 'bg-accent-green' : displayValue > 39 ? 'bg-accent-amber' : 'bg-accent-red';

  let deltaIcon = null;
  let deltaText = null;
  if (previousValue !== undefined) {
    const delta = displayValue - previousValue;
    if (displayValue > previousValue) {
      deltaIcon = <ArrowUp className="w-3 h-3 text-accent-green ml-1" />;
      deltaText = <span className="text-[10px] text-accent-green ml-1 leading-none font-mono">+{delta}</span>;
    }
    else if (displayValue < previousValue) {
      deltaIcon = <ArrowDown className="w-3 h-3 text-accent-red ml-1" />;
      deltaText = <span className="text-[10px] text-accent-red ml-1 leading-none font-mono">{delta}</span>;
    }
    else {
      deltaIcon = <Minus className="w-3 h-3 text-text-muted ml-1" />;
    }
  }

  const hasContributions = contributions && contributions.length > 0;

  return (
    <div ref={rowRef} className="relative">
      <div
        className={`bg-bg-surface-alt rounded-lg p-3 my-1 border border-border-default ${hasContributions ? 'cursor-pointer hover:border-accent-blue/50 transition-colors' : ''}`}
        onClick={() => hasContributions && setShowBreakdown(prev => !prev)}
      >
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${bgClass}`}></div>
            <span className="font-sans font-medium text-sm text-text-primary">{label}</span>
            {hasContributions && (
              <span className="text-[10px] text-text-muted ml-1.5">
                {showBreakdown ? '\u25B2' : '\u25BC'}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className={`font-mono font-bold text-sm ${colorClass}`}>{displayValue}</span>
            {deltaText}
            {deltaIcon && <div className="ml-0.5 flex justify-end">{deltaIcon}</div>}
          </div>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-sm overflow-hidden">
          <div
            className={`h-full metric-fill ${bgClass}`}
            style={{ width: `${displayValue}%` }}
          />
        </div>
      </div>

      {/* Breakdown tooltip */}
      {showBreakdown && hasContributions && (
        <div className="mx-1 mb-1 bg-bg-surface border border-border-default rounded-lg p-3 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="text-[11px] font-sans text-text-muted mb-2 uppercase tracking-wider">Card contributions</div>
          <div className="flex flex-col gap-1.5">
            {contributions.map((c) => {
              // For display: flip sign on lower-is-better metrics so positive = good
              const displayDelta = isLowerBetter ? -c.delta : c.delta;
              const isPositive = displayDelta > 0;
              const sign = isPositive ? '+' : '';
              const deltaColor = isPositive ? 'text-accent-green' : 'text-accent-red';
              return (
                <div key={c.cardId} className="flex justify-between items-center">
                  <span className="text-xs text-text-secondary truncate mr-2">{c.cardTitle}</span>
                  <span className={`text-xs font-mono font-semibold ${deltaColor} shrink-0`}>
                    {sign}{displayDelta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
