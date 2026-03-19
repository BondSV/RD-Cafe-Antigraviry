import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MetricRowProps {
  label: string;
  rawValue: number; 
  previousValue?: number;
}

export default function MetricRow({ label, rawValue, previousValue }: MetricRowProps) {
  const [displayValue, setDisplayValue] = useState(rawValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(rawValue);
    }, 50);
    return () => clearTimeout(timer);
  }, [rawValue]);

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

  return (
    <div className="bg-bg-surface-alt rounded-lg p-3 my-1 border border-border-default">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${bgClass}`}></div>
          <span className="font-sans font-medium text-sm text-text-primary">{label}</span>
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
  );
}
