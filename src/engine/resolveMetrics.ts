import { ActionFlags, VisibleMetrics, ActionConfig, MetricBreakdown, MetricContribution } from '../types/game';
import { cardEffectFns } from './cardEffects';
import { clamp } from '../utils/clamp';

const METRIC_KEYS: (keyof VisibleMetrics)[] = [
  'waitingTime', 'throughput', 'backlog', 'congestion',
  'serviceConsistency', 'stockAvailability', 'financialResults', 'wasteTracker'
];

export function resolveMetricsWithBreakdown(
  initial: VisibleMetrics,
  activeFlags: ActionFlags,
  allCards: ActionConfig[]
): { metrics: VisibleMetrics; breakdown: MetricBreakdown } {
  // Build per-metric contribution lists
  const contributions: Record<keyof VisibleMetrics, MetricContribution[]> = {} as any;
  for (const k of METRIC_KEYS) {
    contributions[k] = [];
  }

  // Compute each active card's contribution
  for (const card of allCards) {
    if (activeFlags[card.setFlag]) {
      const effectFn = cardEffectFns[card.id];
      if (!effectFn) continue;
      const effects = effectFn(activeFlags);
      for (const [k, v] of Object.entries(effects)) {
        const key = k as keyof VisibleMetrics;
        if (v !== 0) {
          contributions[key].push({
            cardId: card.id,
            cardTitle: card.title,
            delta: v as number,
          });
        }
      }
    }
  }

  // Sum contributions (before derived adjustments)
  const result = { ...initial };
  for (const k of METRIC_KEYS) {
    const totalDelta = contributions[k].reduce((sum, c) => sum + c.delta, 0);
    result[k] = initial[k] + totalDelta;
  }

  // --- Derived metrics ---
  // Compute improvements from initial values (before clamping)
  // For "lower is better" metrics: improvement = initial - current (positive means improved)
  // For "higher is better" metrics: improvement = current - initial (positive means improved)
  const waitTimeImprovement = initial.waitingTime - result.waitingTime;
  const backlogImprovement = initial.backlog - result.backlog;
  const throughputImprovement = result.throughput - initial.throughput;
  const stockImprovement = result.stockAvailability - initial.stockAvailability;
  // For waste: improvement means waste went down, so initial - current
  const wasteImprovement = initial.wasteTracker - result.wasteTracker;

  // Congestion derived adjustment:
  // congestionAdjustment = -0.50 * waitTimeImprovement - 0.40 * backlogImprovement - 0.30 * throughputImprovement
  const congestionDerived = -0.50 * waitTimeImprovement - 0.40 * backlogImprovement - 0.30 * throughputImprovement;
  if (congestionDerived !== 0) {
    result.congestion += congestionDerived;
    contributions.congestion.push({
      cardId: 'derived',
      cardTitle: 'Derived: service speed impact',
      delta: congestionDerived,
    });
  }

  // Financial results derived adjustment:
  // finResultsAdjustment = +0.50 * throughputImprovement + 0.35 * wasteReduction
  // wasteReduction = how much waste improved (positive = less waste)
  const finResultsDerived = 0.50 * throughputImprovement + 0.35 * wasteImprovement;
  if (finResultsDerived !== 0) {
    result.financialResults += finResultsDerived;
    contributions.financialResults.push({
      cardId: 'derived',
      cardTitle: 'Derived: revenue & cost savings',
      delta: finResultsDerived,
    });
  }

  // Waste derived adjustment:
  // wasteAdjustment = -0.40 * stockAvailabilityImprovement
  const wasteDerived = -0.40 * stockImprovement;
  if (wasteDerived !== 0) {
    result.wasteTracker += wasteDerived;
    contributions.wasteTracker.push({
      cardId: 'derived',
      cardTitle: 'Derived: stock management impact',
      delta: wasteDerived,
    });
  }

  // Clamp all to [0, 100] and build breakdown
  const breakdown = {} as MetricBreakdown;
  for (const k of METRIC_KEYS) {
    result[k] = clamp(result[k], 0, 100);
    breakdown[k] = {
      initial: initial[k],
      contributions: contributions[k],
      total: result[k],
    };
  }

  return { metrics: result, breakdown };
}

export function resolveMetrics(
  initial: VisibleMetrics,
  activeFlags: ActionFlags,
  allCards: ActionConfig[]
): VisibleMetrics {
  return resolveMetricsWithBreakdown(initial, activeFlags, allCards).metrics;
}
