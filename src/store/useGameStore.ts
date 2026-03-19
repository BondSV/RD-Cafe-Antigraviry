import { create } from 'zustand';
import { GameState, ActionFlags } from '../types/game';
import { initialMetrics } from '../data/initialMetrics';

export interface GameStore extends GameState {
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
  rotaRedesigned: false,
  peakTaskBoardEnabled: false,
};

const initialState: GameState = {
  turn: 1,
  maxTurns: 5,
  actionsTaken: [],
  flags: defaultFlags,
  metrics: initialMetrics,
  history: [],
};

import { applyActionEngine } from '../engine/applyAction';
import { actions } from '../data/actions';

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  applyAction: (actionId: string) => set((state) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return state;
    return applyActionEngine(state, action);
  }),
  resetGame: () => set(() => ({ ...initialState })),
}));
