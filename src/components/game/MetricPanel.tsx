import React from 'react';
import MetricRow from './MetricRow';
import { useGameStore } from '../../store/useGameStore';
import { metricLabels } from '../../data/labels';
import { VisibleMetrics } from '../../types/game';
import { normaliseForDisplay } from '../../engine/normaliseForDisplay';

const LOWER_IS_BETTER: (keyof VisibleMetrics)[] = [
  'waitingTime', 'backlog', 'congestion', 'wasteTracker'
];

export default function MetricPanel() {
  const metrics = useGameStore(state => state.metrics);
  const history = useGameStore(state => state.history);
  const breakdown = useGameStore(state => state.breakdown);

  const prevMetrics = history.length > 0 ? history[history.length - 1].before : undefined;

  const renderMetric = (key: keyof VisibleMetrics) => {
    const displayAfter = normaliseForDisplay(key, metrics[key]);
    const displayBefore = prevMetrics ? normaliseForDisplay(key, prevMetrics[key]) : undefined;
    const contributions = breakdown?.[key]?.contributions.filter(c => c.delta !== 0) ?? [];
    return (
      <MetricRow
        key={key}
        label={metricLabels[key]}
        rawValue={displayAfter}
        previousValue={displayBefore}
        contributions={contributions}
        isLowerBetter={LOWER_IS_BETTER.includes(key)}
      />
    );
  };

  return (
    <div className="w-full pb-6 px-4 md:px-0">
      <h3 className="font-sans text-xs font-semibold text-text-secondary uppercase tracking-[0.12em] mb-3 px-1">
        Performance Metrics
      </h3>
      <div className="flex flex-col gap-0.5">
        {renderMetric('waitingTime')}
        {renderMetric('throughput')}
        {renderMetric('backlog')}
        {renderMetric('congestion')}
        {renderMetric('serviceConsistency')}
        {renderMetric('stockAvailability')}
        {renderMetric('financialResults')}
        {renderMetric('wasteTracker')}
      </div>
    </div>
  );
}
