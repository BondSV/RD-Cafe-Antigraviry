import { VisibleMetrics, DeltaStatus } from '../types/game';

export function getMetricDeltaStatus(
  key: keyof VisibleMetrics,
  displayBefore: number,
  displayAfter: number
): DeltaStatus {
  if (displayAfter > displayBefore) return 'improved';
  if (displayAfter < displayBefore) return 'worsened';
  return 'unchanged';
}
