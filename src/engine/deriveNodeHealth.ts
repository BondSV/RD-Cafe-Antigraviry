import { VisibleMetrics, SystemMapNode } from '../types/game';
import { normaliseForDisplay } from './normaliseForDisplay';

export function deriveNodeHealth(
  nodeId: string,
  metrics: VisibleMetrics,
  nodes: SystemMapNode[]
): number {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return 0;
  const scores = node.drivingMetrics.map(key =>
    normaliseForDisplay(key, metrics[key])
  );
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
