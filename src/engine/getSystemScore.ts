import { VisibleMetrics } from '../types/game';
import { normaliseForDisplay } from './normaliseForDisplay';

export const SCORE_METRIC_KEYS: (keyof VisibleMetrics)[] = [
  'waitingTime',
  'backlog',
  'congestion',
  'serviceConsistency',
  'stockAvailability',
  'financialResults',
  'wasteTracker',
];

export function getSystemScore(metrics: VisibleMetrics): number {
  const total = SCORE_METRIC_KEYS.reduce((sum, key) => {
    return sum + normaliseForDisplay(key, metrics[key]);
  }, 0);

  return total / SCORE_METRIC_KEYS.length;
}
