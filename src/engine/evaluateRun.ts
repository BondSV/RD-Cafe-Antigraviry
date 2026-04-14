import { VisibleMetrics, ActionConfig, OutcomeCategory } from '../types/game';
import { getSystemScore } from './getSystemScore';

export function evaluateRun(
  actionsTaken: string[],
  actions: ActionConfig[],
  finalMetrics: VisibleMetrics
): OutcomeCategory {
  void actionsTaken;
  void actions;

  const systemScore = getSystemScore(finalMetrics);

  if (systemScore >= 77.5) return 'full-win';
  if (systemScore >= 74.0) return 'strong-improvement';
  if (systemScore >= 64.0) return 'near-miss';
  if (systemScore >= 48.0) return 'dead-end';
  return 'collapse';
}
