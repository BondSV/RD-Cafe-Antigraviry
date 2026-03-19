import { VisibleMetrics, ActionConfig } from '../types/game';
import { clamp } from '../utils/clamp';

export function applyBaseEffects(
  currentMetrics: VisibleMetrics,
  action: ActionConfig
): VisibleMetrics {
  const newMetrics = { ...currentMetrics };
  
  if (action.baseEffects) {
    for (const key in action.baseEffects) {
      const metricKey = key as keyof VisibleMetrics;
      const effect = action.baseEffects[metricKey];
      if (effect !== undefined) {
        newMetrics[metricKey] = clamp(newMetrics[metricKey] + effect, 0, 100);
      }
    }
  }
  
  return newMetrics;
}
