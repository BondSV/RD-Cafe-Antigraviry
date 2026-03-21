export type VisibleMetrics = {
  waitingTime: number;
  throughput: number;
  backlog: number;
  congestion: number;
  serviceConsistency: number;
  stockAvailability: number;
  financialResults: number;
  wasteTracker: number;
};

export type ActionFlags = {
  extraTillInstalled: boolean;
  tempStaffAdded: boolean;
  extendedHours: boolean;
  discountPromotion: boolean;
  expandedMenu: boolean;
  selfServicePastries: boolean;
  managerMovedEarlier: boolean;
  headBaristaMovedEarlier: boolean;
  lateHoursShortened: boolean;
  extraCoffeeMachineInstalled: boolean;
  menuSimplified: boolean;
  prepAheadEnabled: boolean;
  workZonesCreated: boolean;
  peakTaskSpecialisation: boolean;
  sopsEnabled: boolean;
  queuePathMarked: boolean;
  pickupSeparated: boolean;
  stockRoutineEnabled: boolean;
  clickAndCollectEnabled: boolean;
  peakTaskBoardEnabled: boolean;
  // New cards (a21-a33)
  deliveryAppLaunched: boolean;
  socialMediaCampaign: boolean;
  premiumGrinderInstalled: boolean;
  interiorRedesigned: boolean;
  freeWifiOffered: boolean;
  digitalMenuInstalled: boolean;
  loyaltyCardIntroduced: boolean;
  baristaTrainingDone: boolean;
  feedbackTabletInstalled: boolean;
  cheaperSupplier: boolean;
  bulkBuyEnabled: boolean;
  erpImplemented: boolean;
  rolesRemapped: boolean;
};

export type DeltaStatus = "improved" | "worsened" | "unchanged";

export type MetricDeltaView = {
  key: keyof VisibleMetrics;
  label: string;
  displayAfter: number;
  deltaValue: number;
  status: DeltaStatus;
};

export type OutcomeCategory =
  | "collapse"
  | "dead-end"
  | "near-miss"
  | "strong-improvement"
  | "full-win";

export type TurnRecord = {
  turn: number;
  actionId: string;
  before: VisibleMetrics;
  after: VisibleMetrics;
  deltas: MetricDeltaView[];
  eventText: string;
};

export type ActionGroup = "space" | "staff" | "menu" | "org" | "revenue";

export type ActionConfig = {
  id: string;
  title: string;
  category: "harmful" | "core" | "support" | "flex";
  group: ActionGroup;
  description: string;
  setFlag: keyof ActionFlags;
};

export type MetricContribution = {
  cardId: string;
  cardTitle: string;
  delta: number;
};

export type MetricBreakdown = Record<keyof VisibleMetrics, {
  initial: number;
  contributions: MetricContribution[];
  total: number;
}>;

export type SystemMapNode = {
  id: string;
  label: string;
  drivingMetrics: (keyof VisibleMetrics)[];
  x: number;
  y: number;
  insight?: string;
};

export type SystemMapConnection = {
  from: string;
  to: string;
};

export type GameState = {
  turn: number;
  maxTurns: number;
  actionsTaken: string[];
  flags: ActionFlags;
  metrics: VisibleMetrics;
  breakdown: MetricBreakdown | null;
  history: TurnRecord[];
  outcome?: OutcomeCategory;
};
