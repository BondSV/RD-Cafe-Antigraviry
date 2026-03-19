import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AlertTriangle, Target, Trophy, XCircle, TrendingUp, RotateCcw } from 'lucide-react';
import { actions } from '../../data/actions';
import MetricRow from '../game/MetricRow';
import { metricLabels } from '../../data/labels';
import { normaliseForDisplay } from '../../engine/normaliseForDisplay';
import { VisibleMetrics } from '../../types/game';

export default function FinalSummary() {
  const outcome = useGameStore(state => state.outcome);
  const metrics = useGameStore(state => state.metrics);
  const actionsTaken = useGameStore(state => state.actionsTaken);
  const resetGame = useGameStore(state => state.resetGame);

  const getOutcomeDetails = () => {
    switch(outcome) {
      case 'collapse': return { icon: AlertTriangle, title: 'System Collapse', glow: 'bg-red-50 text-accent-red border-red-200', text: 'The café is struggling under unresolved pressure. Changes were disjointed and created more chaos.' };
      case 'dead-end': return { icon: XCircle, title: 'Dead-end Strategy', glow: 'bg-red-50 text-accent-red border-red-200', text: 'Some local improvements appeared, but structural issues like cost or capability were ignored.' };
      case 'near-miss': return { icon: Target, title: 'Near Miss', glow: 'bg-amber-50 text-accent-amber border-amber-200', text: 'Significant improvements made, but at least one major system pressure remains unresolved.' };
      case 'strong-improvement': return { icon: TrendingUp, title: 'Strong Improvement', glow: 'bg-green-50 text-accent-green border-green-200', text: 'Most major issues resolved. A capable strategy with one or two minor trade-offs.' };
      case 'full-win': return { icon: Trophy, title: 'Full Win', glow: 'bg-green-100 text-accent-green border-green-300', text: 'A highly coherent package of improvements balancing flow, capacity, and cost simultaneously.' };
      default: return { icon: AlertTriangle, title: 'Unknown', glow: '', text: '' };
    }
  };

  const { icon: OutcomeIcon, title, glow, text } = getOutcomeDetails();

  const renderMetric = (key: keyof VisibleMetrics) => (
    <MetricRow 
      key={key} 
      label={metricLabels[key]} 
      rawValue={normaliseForDisplay(key, metrics[key])} 
    />
  );

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4 flex justify-center overflow-y-auto">
      <div className="max-w-[560px] w-full flex flex-col items-center">
        
        <div className={`w-full flex flex-col items-center p-8 rounded-2xl border mb-8 shadow-sm ${glow}`}>
          <OutcomeIcon className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold font-sans mb-2 text-center">{title}</h1>
          <p className="text-center font-sans text-sm opacity-90">{text}</p>
        </div>

        <div className="w-full mb-8">
          <h3 className="text-xs uppercase tracking-[0.12em] text-text-muted mb-4 font-semibold text-center">Intervention Timeline</h3>
          <div className="flex flex-col gap-3">
            {actionsTaken.map((actionId, idx) => {
              const action = actions.find(a => a.id === actionId);
              const isHarmful = action?.category === 'harmful';
              return (
                <div key={idx} className="flex items-center bg-bg-surface-alt p-3 rounded-xl border border-border-default">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold mr-3 ${isHarmful ? 'bg-accent-red/20 text-accent-red' : 'bg-accent-green/20 text-accent-green'}`}>
                    {idx + 1}
                  </div>
                  <span className="font-sans text-sm text-text-primary">{action?.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full mb-8">
          <h3 className="text-xs uppercase tracking-[0.12em] text-text-muted mb-4 font-semibold text-center">Final Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            {renderMetric('waitingTime')}
            {renderMetric('throughput')}
            {renderMetric('backlog')}
            {renderMetric('congestion')}
            {renderMetric('serviceConsistency')}
            {renderMetric('stockAvailability')}
            {renderMetric('financialResults')}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 w-full mb-8 text-center shadow-sm">
          <p className="font-sans text-base text-blue-900 leading-relaxed">
            Your choices improved some local conditions, but pressure shifted elsewhere in the café. 
            Stronger outcomes usually come from coordinated changes across staffing, workflow, complexity, and cost.
          </p>
        </div>

        <button 
          onClick={resetGame}
          className="flex items-center justify-center bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl text-md transition-transform transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-blue focus-visible:ring-offset-bg-primary"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Play Again
        </button>

      </div>
    </div>
  );
}
