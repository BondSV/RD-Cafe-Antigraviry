import { VisibleMetrics } from '../types/game';

const LOWER_IS_BETTER: (keyof VisibleMetrics)[] = [
  'waitingTime', 'backlog', 'congestion', 'wasteTracker'
];

export function normaliseForDisplay(
  key: keyof VisibleMetrics,
  rawValue: number
): number {
  if (LOWER_IS_BETTER.includes(key)) {
    return 100 - rawValue;
  }
  return rawValue;
}
