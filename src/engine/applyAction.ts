import { GameState, ActionConfig, ActionFlags, VisibleMetrics, MetricDeltaView } from '../types/game';
import { applyBaseEffects } from './applyBaseEffects';
import { applyConditionalRules } from './applyConditionalRules';
import { generateTurnEventText } from './generateTurnEventText';
import { getMetricDeltaStatus } from './getMetricDeltaStatus';
import { normaliseForDisplay } from './normaliseForDisplay';
import { metricLabels } from '../data/labels';
import { evaluateRun } from './evaluateRun';
import { actions } from '../data/actions';

export function applyActionEngine(
  state: GameState,
  action: ActionConfig
): GameState {
  if (state.turn > state.maxTurns) return state;
  if (state.actionsTaken.includes(action.id)) return state;

  const newFlags = { ...state.flags, [action.setFlag]: true } as ActionFlags;

  let newMetrics = applyBaseEffects(state.metrics, action);
  newMetrics = applyConditionalRules(action, newFlags, newMetrics);

  const deltas: MetricDeltaView[] = Object.keys(newMetrics).map(key => {
    const k = key as keyof VisibleMetrics;
    const beforeDisp = normaliseForDisplay(k, state.metrics[k]);
    const afterDisp = normaliseForDisplay(k, newMetrics[k]);
    return {
      key: k,
      label: metricLabels[k],
      displayBefore: beforeDisp,
      displayAfter: afterDisp,
      deltaValue: afterDisp - beforeDisp,
      status: getMetricDeltaStatus(k, beforeDisp, afterDisp)
    };
  });

  const eventText = generateTurnEventText(action, newFlags, state.metrics, newMetrics);

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
    outcome: newOutcome,
    history: [
      ...state.history,
      {
        turn: state.turn,
        actionId: action.id,
        before: state.metrics,
        after: newMetrics,
        deltas,
        eventText
      }
    ]
  };
}
