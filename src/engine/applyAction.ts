import { GameState, ActionConfig, ActionFlags, VisibleMetrics, MetricDeltaView } from '../types/game';
import { resolveMetricsWithBreakdown } from './resolveMetrics';
import { generateTurnEventText } from './generateTurnEventText';
import { getMetricDeltaStatus } from './getMetricDeltaStatus';
import { normaliseForDisplay } from './normaliseForDisplay';
import { metricLabels } from '../data/labels';
import { evaluateRun } from './evaluateRun';
import { actions } from '../data/actions';
import { initialMetrics } from '../data/initialMetrics';

export function applyActionEngine(
  state: GameState,
  action: ActionConfig
): GameState {
  if (state.turn > state.maxTurns) return state;
  if (state.actionsTaken.includes(action.id)) return state;

  const newFlags = { ...state.flags, [action.setFlag]: true } as ActionFlags;

  // Recalculate ALL metrics from initial values based on complete flag set
  const beforeResult = resolveMetricsWithBreakdown(initialMetrics, state.flags, actions);
  const afterResult = resolveMetricsWithBreakdown(initialMetrics, newFlags, actions);

  const newMetrics = afterResult.metrics;

  const deltas: MetricDeltaView[] = Object.keys(newMetrics).map(key => {
    const k = key as keyof VisibleMetrics;
    const beforeDisp = normaliseForDisplay(k, beforeResult.metrics[k]);
    const afterDisp = normaliseForDisplay(k, newMetrics[k]);
    return {
      key: k,
      label: metricLabels[k],
      displayAfter: Math.round(afterDisp),
      deltaValue: Math.round(afterDisp) - Math.round(beforeDisp),
      status: getMetricDeltaStatus(k, beforeDisp, afterDisp)
    };
  });

  const eventText = generateTurnEventText(action, newFlags, beforeResult.metrics, newMetrics);

  let newOutcome = state.outcome;
  if (state.turn === state.maxTurns) {
    newOutcome = evaluateRun([...state.actionsTaken, action.id], actions, newMetrics);
  }

  return {
    ...state,
    turn: state.turn + 1,
    actionsTaken: [...state.actionsTaken, action.id],
    flags: newFlags,
    metrics: newMetrics,
    breakdown: afterResult.breakdown,
    outcome: newOutcome,
    history: [
      ...state.history,
      {
        turn: state.turn,
        actionId: action.id,
        before: beforeResult.metrics,
        after: newMetrics,
        deltas,
        eventText
      }
    ]
  };
}
