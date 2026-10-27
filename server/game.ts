import { actions } from '../src/data/actions';
import { initialMetrics } from '../src/data/initialMetrics';
import { applyActionEngine } from '../src/engine/applyAction';
import { normaliseForDisplay } from '../src/engine/normaliseForDisplay';
import { getSystemScore } from '../src/engine/getSystemScore';
import { ActionFlags, GameState, VisibleMetrics } from '../src/types/game';
export { actions };
export {metricLabels} from '../src/data/labels';
export {SCORE_METRIC_KEYS} from '../src/engine/getSystemScore';
export function reconstruct(ids: string[]): GameState {
  let state: GameState = {turn:1,maxTurns:7,actionsTaken:[],flags:Object.fromEntries(actions.map(a=>[a.setFlag,false])) as ActionFlags,metrics:{...initialMetrics},breakdown:null,history:[]};
  if(!Array.isArray(ids)||ids.length>7||new Set(ids).size!==ids.length) throw Error('Invalid action sequence');
  for(const id of ids){const action=actions.find(a=>a.id===id);if(!action)throw Error('Unknown intervention');state=applyActionEngine(state,action);}
  return state;
}
export function describe(state: GameState){
  return {...state,displayMetrics:Object.fromEntries(Object.entries(state.metrics).map(([k,v])=>[k,normaliseForDisplay(k as keyof VisibleMetrics,v)])),score:getSystemScore(state.metrics)};
}
