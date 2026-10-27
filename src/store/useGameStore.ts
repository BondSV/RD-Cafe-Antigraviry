import { create } from 'zustand';
import { GameState, ActionFlags } from '../types/game';
import { initialMetrics } from '../data/initialMetrics';
import { beginRun, record, updateRecordedActions } from '../research/recording';

export interface GameStore extends GameState {
  selectedActionId: string | null;
  selectionId: string;
  acknowledgedTurn: number;
  selectAction: (actionId: string) => void;
  cancelSelection: () => void;
  acknowledgeResult: (turn: number) => void;
  applyAction: (actionId: string) => void;
  resetGame: () => void;
}

export const defaultFlags: ActionFlags = {
  extraTillInstalled: false,
  tempStaffAdded: false,
  extendedHours: false,
  discountPromotion: false,
  expandedMenu: false,
  selfServicePastries: false,
  managerMovedEarlier: false,
  headBaristaMovedEarlier: false,
  lateHoursShortened: false,
  extraCoffeeMachineInstalled: false,
  menuSimplified: false,
  prepAheadEnabled: false,
  workZonesCreated: false,
  peakTaskSpecialisation: false,
  sopsEnabled: false,
  queuePathMarked: false,
  pickupSeparated: false,
  stockRoutineEnabled: false,
  clickAndCollectEnabled: false,
  peakTaskBoardEnabled: false,
  // New cards (a21-a33)
  deliveryAppLaunched: false,
  socialMediaCampaign: false,
  premiumGrinderInstalled: false,
  interiorRedesigned: false,
  freeWifiOffered: false,
  digitalMenuInstalled: false,
  loyaltyCardIntroduced: false,
  baristaTrainingDone: false,
  feedbackTabletInstalled: false,
  cheaperSupplier: false,
  bulkBuyEnabled: false,
  erpImplemented: false,
  rolesRemapped: false,
};

const createInitialGameState = (): GameState => ({
  turn: 1,
  maxTurns: 7,
  actionsTaken: [],
  flags: { ...defaultFlags },
  metrics: { ...initialMetrics },
  breakdown: null,
  history: [],
  outcome: undefined,
});

import { applyActionEngine } from '../engine/applyAction';
import { actions } from '../data/actions';

export const useGameStore = create<GameStore>((set,get) => ({
  ...createInitialGameState(), selectedActionId:null, selectionId:'', acknowledgedTurn:0,
  selectAction: (actionId) => {const state=get();if(state.turn>state.maxTurns||state.acknowledgedTurn<state.history.length||state.actionsTaken.includes(actionId))return;set({selectedActionId:actionId,selectionId:crypto.randomUUID()});},
  cancelSelection: () => {const id=get().selectedActionId;if(id)record('candidate_cancelled',{actionId:id});set({selectedActionId:null});},
  acknowledgeResult: (turn) => {if(turn!==get().history.length||turn<=get().acknowledgedTurn)return;record('feedback_dismissed',{turn});set({acknowledgedTurn:turn});},
  applyAction: (actionId: string) => {
    const state=get();if(state.selectedActionId!==actionId||state.acknowledgedTurn<state.history.length)return;
    const action=actions.find(a=>a.id===actionId);if(!action||state.actionsTaken.includes(actionId)||state.turn>state.maxTurns)return;
    const result=applyActionEngine(state,action);updateRecordedActions(result);record('action_committed',{actionId});set({...result,selectedActionId:null});
  },
  resetGame: () => {beginRun();set({...createInitialGameState(),selectedActionId:null,selectionId:'',acknowledgedTurn:0});},
}));
