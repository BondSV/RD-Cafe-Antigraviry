import { VisibleMetrics, ActionConfig, OutcomeCategory } from '../types/game';
import { normaliseForDisplay } from './normaliseForDisplay';

export function evaluateRun(
  actionsTaken: string[],
  actions: ActionConfig[],
  finalMetrics: VisibleMetrics
): OutcomeCategory {
  // Pass 1: count harmful actions
  const harmfulCount = actionsTaken.filter(id => {
    const action = actions.find(a => a.id === id);
    return action?.category === 'harmful';
  }).length;

  let capLevel = 4; // 4 = full-win, 3 = strong, 2 = near, 1 = dead-end, 0 = collapse
  if (harmfulCount >= 3) capLevel = 1;
  else if (harmfulCount === 2) capLevel = 2;
  else if (harmfulCount === 1) capLevel = 3;

  // Pass 2: Evaluate metrics
  const sm = {
    wait: normaliseForDisplay('waitingTime', finalMetrics.waitingTime),
    thru: normaliseForDisplay('throughput', finalMetrics.throughput),
    backlog: normaliseForDisplay('backlog', finalMetrics.backlog),
    cong: normaliseForDisplay('congestion', finalMetrics.congestion),
    svcc: normaliseForDisplay('serviceConsistency', finalMetrics.serviceConsistency),
    stock: normaliseForDisplay('stockAvailability', finalMetrics.stockAvailability),
    cost: normaliseForDisplay('budgetPressure', finalMetrics.budgetPressure)
  };

  let actualLevel = 0;
  const avg = (sm.wait + sm.thru + sm.backlog + sm.cong + sm.svcc + sm.stock + sm.cost) / 7;
  
  if (avg < 40) {
    actualLevel = 0; // Collapse
  } else if (avg < 55) {
    actualLevel = 1; // Dead-end
  } else if (avg < 70) {
    actualLevel = 2; // Near miss
  } else if (avg < 85) {
    if (sm.cost < 40 || sm.wait < 40 || sm.backlog < 40) {
      actualLevel = 2;
    } else {
      actualLevel = 3; // Strong improvement
    }
  } else {
    if (sm.cost < 60 || sm.wait < 60 || sm.backlog < 60 || sm.thru < 60) {
      actualLevel = 3;
    } else {
      actualLevel = 4; // Full win
    }
  }

  const finalLevel = Math.min(capLevel, actualLevel);

  switch (finalLevel) {
    case 0: return 'collapse';
    case 1: return 'dead-end';
    case 2: return 'near-miss';
    case 3: return 'strong-improvement';
    case 4: return 'full-win';
    default: return 'collapse';
  }
}
