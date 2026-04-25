import { useRef, useEffect, useCallback, useState } from 'react';
import { VisibleMetrics, ActionFlags } from '../types/game';
import { normaliseForDisplay } from '../engine/normaliseForDisplay';

// ============================================================
// TYPES
// ============================================================

export type TokenType = 'walkin' | 'cnc' | 'courier';
export type TokenState =
  | 'entering'
  | 'deciding'
  | 'approaching_queue'
  | 'queuing'
  | 'ordering'
  | 'waiting'
  | 'leaving'
  | 'bouncing'
  | 'stock_bouncing'
  | 'fast_tracking'
  | 'exited';

export type Face = 'happy' | 'neutral' | 'sad';

export interface Token {
  id: number;
  type: TokenType;
  state: TokenState;
  x: number;
  y: number;
  age: number;
  stageStart: number;
  face: Face;
  opacity: number;
  queueIndex: number;
  laneIndex: number;
  arrivedAtStage: boolean;
  prepDoneAt: number;       // tick when this token's prep finishes
  waitTicks: number;        // accumulated ticks spent in queuing + waiting states
  decidingProgress?: number;// tracks 0.0 to 1.0 of the decision timer
  willLeave?: boolean;      // explicitly pre-calculated decision to bounce
  curveT?: number;          // 0..1 progress along current Bézier curve
  routeStep?: number;       // current waypoint index for multi-node walking routes
  routePhase?: 'branch' | 'queue' | 'direct';
  waitIndex?: number;       // track slot in the pickup queue
  isStationary?: boolean;   // true if exactly reached movement target
}

export type StaffAnimState = 'idle' | 'serving' | 'traveling-to-machine' | 'making' | 'traveling-to-till' | 'wandering';

export interface StaffToken {
  id: string;
  label: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  station: 'till' | 'machine' | 'food' | 'wandering' | 'till2' | 'machine2';
  busy: boolean;
  animState: StaffAnimState;
  animStart: number;
  animProgress: number;
}

export interface BacklogTicket {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

export type OpModel =
  | 'solo'
  | 'duo-natural'
  | 'duo-parallel'
  | 'duo-spec'
  | 'trio-floating'
  | 'trio-spec'
  | 'quad-chaos'
  | 'quad-parallel'
  | 'quad-spec';

export interface StaffConfig {
  totalStaff: number;
  tills: number;
  machines: number;
  specialised: boolean;
  model: OpModel;
  tillLanes: number;
  serialised: boolean;
  prepLanes: number;
  managerWandering: boolean;
  hasPT: boolean;  // Part-time barista hired
  hasHB: boolean;  // Head barista moved to earlier shift
  hasMGR: boolean; // Cafe manager moved to earlier shift
}

export interface SimRates {
  spawnInterval: number;
  bounceRate: number;
  targetQueue: number;
  tillTime: number;
  tillCycleTime: number;
  prepTime: number;
  consistencyFailRate: number;
  stockBounceRate: number;
  staffConfig: StaffConfig;
  cncActive: boolean;
  deliveryActive: boolean;
  cncSpawnInterval: number;
  courierSpawnInterval: number;
}

// ============================================================
// LAYOUT CONSTANTS
// ============================================================

export const VB_W = 900;
export const VB_H = 820;

export const POS = {
  // Customer journey geometric nodes
  enter:      { x: 371, y: 7 },        // Entrance/exit just outside the left section of the doorway
  decision:   { x: 270, y: 170 },      // Decision point (red circle)
  queueTrackCorner: { x: 90, y: 480 }, // Outer edge for L-curve corner
  queue:      { x: 320, y: 575 },      // Queue Head (Point 1)
  till:       { x: 420, y: 585 },      // Till 1
  till2:      { x: 320, y: 585 },      // Till 2 occupies queue's origin slot when active
  waiting:    { x: 720, y: 585 },      // Pickup (Point 2 - Arrow Tip)
  exitCorner: { x: 800, y: 180 },      // Top right geometric corner
  exit:       { x: 371, y: 7 },        // Same as enter

  // Staff stations (behind counter) — centered within each counter block
  foodPrep:    { x: 85,  y: 610 },
  tillStation2:{ x: 325, y: 610 },
  tillStation: { x: 425, y: 610 },
  machine1:    { x: 607, y: 610 },
  machine2:    { x: 802, y: 610 },

  counterY: 585,                     // top edge of counter blocks
  backlogBase: { x: 680, y: 720 },
  staffBelowY: 645,
};

export const PATH = {
  // Raw engine coordinates. Customer sprites render at y + 50 in the SVG.
  entryRoute: [
    { x: 371, y: 7 },
    { x: 370, y: 39 },
    { x: 357, y: 95 },
    { x: 344, y: 115 },
    { x: 324, y: 135 },
    { x: 304, y: 149 },
    { x: 284, y: 159 },
    POS.decision,
  ],
  queueApproach: [
    { x: 257, y: 180 },
    { x: 237, y: 197 },
    { x: 217, y: 217 },
    { x: 191, y: 249 },
    { x: 177, y: 267 },
    { x: 164, y: 287 },
    { x: 151, y: 310 },
    { x: 141, y: 330 },
    { x: 128, y: 360 },
    { x: 114, y: 423 },
    { x: 106, y: 473 },
    { x: 112, y: 521 },
    { x: 145, y: 557 },
    { x: 200, y: 570 },
    POS.queue,
  ],
  branchRoute: [
    POS.decision,
    { x: 257, y: 180 },
    { x: 237, y: 197 },
    { x: 217, y: 217 },
    { x: 191, y: 249 },
    { x: 177, y: 267 },
    { x: 164, y: 287 },
    { x: 151, y: 310 },
  ],
  directServiceRoute: [
    { x: 151, y: 310 },
    { x: 147, y: 344 },
    { x: 160, y: 402 },
    { x: 179, y: 464 },
    { x: 202, y: 501 },
    { x: 232, y: 532 },
    { x: 269, y: 555 },
    POS.queue,
  ],
  indexZeroOneRoute: [
    { x: 151, y: 310 },
    { x: 147, y: 344 },
    { x: 160, y: 402 },
    { x: 179, y: 464 },
    { x: 202, y: 501 },
    { x: 232, y: 532 },
    { x: 269, y: 555 },
    POS.queue,
  ],
  bounceRoute: [
    POS.decision,
    { x: 303, y: 164 },
    { x: 336, y: 162 },
    { x: 366, y: 158 },
    { x: 389, y: 149 },
    { x: 403, y: 133 },
    { x: 405, y: 116 },
    { x: 403, y: 81 },
    { x: 400, y: 48 },
    { x: 397, y: 16 },
    { x: 371, y: 7 },
  ],
  exitRoute: [
    { x: 770, y: 340 },
    { x: 760, y: 269 },
    { x: 749, y: 226 },
    { x: 728, y: 201 },
    { x: 696, y: 184 },
    { x: 653, y: 166 },
    { x: 611, y: 152 },
    { x: 568, y: 139 },
    { x: 526, y: 127 },
    { x: 484, y: 112 },
    { x: 451, y: 94 },
    { x: 430, y: 74 },
    { x: 419, y: 56 },
    { x: 409, y: 28 },
    POS.exit,
  ],
};

// Stage labels (kept for backward compat with top-down views)
export const STAGE_LABELS: { pos: { x: number; y: number }; label: string }[] = [];

// Token / staff sizes — customers match staff size
export const TOKEN_R = 14;
export const STAFF_R = 14;
export const TICKET_SIZE = 16;

// ---- Timing constants ----
// Calibrated to user's mathematical model:
//   1 sim-minute = 160 ticks, 1 sim-hour = 9600 ticks
//   Base inflow = 60 visitors/hour → spawnInterval = 9600/60 = 160
//   Solo cycle = till(160) + prep(480) = 640 ticks = 4 sim-minutes → 15 orders/hour
//   Travel is WITHIN the prep phase (not added separately)
const BASE_SPAWN_INTERVAL = 160;
const BASE_TILL_TIME = 160;      // 1 sim-minute — order taking + payment (25%)
const BASE_PREP_TIME = 480;      // 3 sim-minutes — order preparation (75%), includes travel for solo
const CNC_SPAWN_INTERVAL = 400;
const COURIER_SPAWN_INTERVAL = 500;
const TRANSITION_DURATION = 900;
const TOKEN_SPEED = 1.3;          // scaled up for larger layout distances
const FADE_SPEED = 0.007;
const DECIDING_TICKS = 120;      // ~2 seconds looking around
const STAFF_SPEED = 13;           // scaled up for larger layout distances
const ANIM_TRAVEL_TICKS = 20;     // visual travel at STAFF_SPEED=9: ~180px/9 = 20 ticks

// Face thresholds based on accumulated wait time (queuing + waiting states)
const NEUTRAL_WAIT_THRESHOLD = 1800; // >= 11 sim-minutes 
const SAD_WAIT_THRESHOLD = 2800;     // >= 17 sim-minutes

// ============================================================
// RATE DERIVATION
// ============================================================

export function deriveStaffConfig(flags: ActionFlags): StaffConfig {
  const extra = [flags.headBaristaMovedEarlier, flags.managerMovedEarlier, flags.tempStaffAdded].filter(Boolean).length;
  const totalStaff = 1 + extra;
  const tills = 1 + (flags.extraTillInstalled ? 1 : 0);
  const machines = 1 + (flags.extraCoffeeMachineInstalled ? 1 : 0);
  const specialised = flags.peakTaskSpecialisation;

  let model: OpModel;
  let tillLanes = 1;
  let serialised = true;
  let prepLanes = 1;
  let managerWandering = false;

  if (totalStaff === 1) {
    model = 'solo';
    serialised = true;
    tillLanes = 1;
    prepLanes = 1;
  } else if (totalStaff === 2) {
    if (specialised) {
      model = 'duo-spec';
      serialised = false;
      tillLanes = 1;
      prepLanes = 1;
    } else if (tills >= 2 && machines >= 2) {
      model = 'duo-parallel';
      serialised = true;
      tillLanes = 2;
      prepLanes = 2;
    } else {
      model = 'duo-natural';
      serialised = false;
      tillLanes = 1;
      prepLanes = 1;
    }
  } else if (totalStaff === 3) {
    if (specialised) {
      model = 'trio-spec';
      serialised = false;
      tillLanes = 1;
      prepLanes = Math.min(machines, 2);
    } else {
      model = 'trio-floating';
      serialised = false;
      tillLanes = Math.min(tills, 2);
      prepLanes = Math.min(machines, 2);
    }
  } else {
    if (specialised && tills >= 2 && machines >= 2) {
      model = 'quad-spec';
      serialised = false;
      tillLanes = 2;
      prepLanes = 2;
    } else if (tills >= 2 && machines >= 2) {
      model = 'quad-parallel';
      serialised = false;
      tillLanes = 2;
      prepLanes = 2;
      managerWandering = true;
    } else {
      model = 'quad-chaos';
      serialised = false;
      tillLanes = Math.min(tills, 2);
      prepLanes = Math.min(machines, 2);
      managerWandering = true;
    }
  }

  return {
    totalStaff, tills, machines, specialised, model, tillLanes, serialised, prepLanes, managerWandering,
    hasPT: !!flags.tempStaffAdded,
    hasHB: !!flags.headBaristaMovedEarlier,
    hasMGR: !!flags.managerMovedEarlier,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clampUnit(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function deriveSimRates(metrics: VisibleMetrics, flags: ActionFlags): SimRates {
  const staffConfig = deriveStaffConfig(flags);

  // --- Metric-driven base parameters ---
  // Scale base till/prep times by metric performance, but let the
  // operational MODEL determine how they combine into tillCycleTime.
  const relevantKeys: (keyof VisibleMetrics)[] = ['waitingTime', 'throughput', 'backlog', 'congestion'];
  const avgDisplay = relevantKeys.reduce((sum, k) =>
    sum + normaliseForDisplay(k, metrics[k]), 0) / relevantKeys.length;
  const t = clampUnit((avgDisplay - 35) / 40); // 0 = baseline (~35), 1 = winning (~75)

  const tillTime = Math.round(lerp(BASE_TILL_TIME, BASE_TILL_TIME * 0.75, t));
  const prepTime = Math.round(lerp(BASE_PREP_TIME, BASE_PREP_TIME * 0.85, t));

  // --- MODEL-AWARE tillCycleTime ---
  // The operational model determines whether till is blocked during prep.
  // This is the structural constraint — metrics scale the parameters, model determines structure.
  let tillCycleTime: number;
  if (staffConfig.serialised && staffConfig.model !== 'duo-parallel') {
    // Solo: one person does both → till blocked for entire cycle
    tillCycleTime = tillTime + prepTime;
  } else if (staffConfig.model === 'duo-parallel') {
    // Two serialised lanes: each person does everything
    tillCycleTime = tillTime + prepTime;
  } else {
    // Non-serialised: till person takes orders, machine person works independently
    // Till frees up immediately after order — this is WHY adding staff helps
    tillCycleTime = tillTime;
  }

  // Context switching penalty for unspecialised multi-person setups
  if (!staffConfig.specialised && staffConfig.totalStaff >= 2) {
    tillCycleTime = Math.round(tillCycleTime * 1.15);
  }

  // Demand multiplier from demand-boosting cards
  let demandMultiplier = 1.0;
  if (flags.discountPromotion) demandMultiplier += 0.3;
  if (flags.socialMediaCampaign) demandMultiplier += 0.25;
  if (flags.freeWifiOffered) demandMultiplier += 0.15;
  if (flags.loyaltyCardIntroduced) demandMultiplier += 0.1;
  const spawnInterval = Math.max(120, Math.round(BASE_SPAWN_INTERVAL / demandMultiplier));

  // Bounce rate and target queue are no longer metric-driven;
  // bounce is computed in the tick loop from the actual combined queue size.
  const bounceRate = 0;
  const targetQueue = 0;

  // Service consistency fail rate: 10% at display 50
  const scDisplay = normaliseForDisplay('serviceConsistency', metrics.serviceConsistency);
  const consistencyFailRate = (1 - scDisplay / 100) * 0.2;

  // Stock bounce rate at till — disabled (stock issues don't cause customers to leave)
  const stockBounceRate = 0;

  return {
    spawnInterval,
    bounceRate,
    targetQueue,
    tillTime,
    tillCycleTime,
    prepTime,
    consistencyFailRate,
    stockBounceRate,
    staffConfig,
    cncActive: flags.clickAndCollectEnabled,
    deliveryActive: flags.deliveryAppLaunched,
    cncSpawnInterval: CNC_SPAWN_INTERVAL,
    courierSpawnInterval: COURIER_SPAWN_INTERVAL,
  };
}

// ============================================================
// STAFF POSITION LOGIC
// ============================================================

export function initStaffTokens(config: StaffConfig): StaffToken[] {
  const tokens: StaffToken[] = [];
  const sY = POS.staffBelowY;
  const { hasHB, hasMGR, hasPT, tills, machines } = config;

  if (!hasHB) {
    // === NO HEAD BARISTA ===
    // AB1 alone or with PT/MGR (no dedicated machine operator)
    if (hasPT || hasMGR) {
      // PT/MGR takes the till, AB1 moves to the machine
      tokens.push({ id: 'ab1', label: 'AB1', x: POS.machine1.x, y: sY, targetX: POS.machine1.x, targetY: sY, station: 'machine', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
      const tillPerson = hasPT ? 'pt' : 'mgr';
      const tillLabel = hasPT ? 'PT' : 'MGR';
      tokens.push({ id: tillPerson, label: tillLabel, x: POS.tillStation.x, y: sY, targetX: POS.tillStation.x, targetY: sY, station: 'till', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
      // If both PT and MGR present without HB, second one wanders
      if (hasPT && hasMGR) {
        tokens.push({ id: 'mgr', label: 'MGR', x: POS.foodPrep.x, y: sY + 30, targetX: POS.foodPrep.x + 40, targetY: sY + 30, station: 'wandering', busy: false, animState: 'wandering', animStart: 0, animProgress: 0 });
      }
    } else {
      // Solo: AB1 at till (handles machine too in tick logic)
      tokens.push({ id: 'ab1', label: 'AB1', x: POS.tillStation.x, y: sY, targetX: POS.tillStation.x, targetY: sY, station: 'till', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
    }
  } else {
    // === HEAD BARISTA IS PRESENT ===
    // HB always operates the coffee machine
    tokens.push({ id: 'hb', label: 'HB', x: POS.machine1.x, y: sY, targetX: POS.machine1.x, targetY: sY, station: 'machine', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });

    if (machines >= 2 && (hasPT || hasMGR)) {
      // === 2 MACHINES: AB1 takes machine2, 3rd person takes the till ===
      tokens.push({ id: 'ab1', label: 'AB1', x: POS.machine2.x, y: sY, targetX: POS.machine2.x, targetY: sY, station: 'machine2', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
      // Prefer PT at till, MGR at till2; if only one, they take the single till
      if (hasPT && hasMGR) {
        tokens.push({ id: 'pt',  label: 'PT',  x: POS.tillStation.x,  y: sY, targetX: POS.tillStation.x,  targetY: sY, station: 'till',  busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
        if (tills >= 2) {
          tokens.push({ id: 'mgr', label: 'MGR', x: POS.tillStation2.x, y: sY, targetX: POS.tillStation2.x, targetY: sY, station: 'till2', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
        } else {
          tokens.push({ id: 'mgr', label: 'MGR', x: POS.foodPrep.x, y: sY + 30, targetX: POS.foodPrep.x + 40, targetY: sY + 30, station: 'wandering', busy: false, animState: 'wandering', animStart: 0, animProgress: 0 });
        }
      } else {
        const tillPerson = hasPT ? 'pt' : 'mgr';
        const tillLabel  = hasPT ? 'PT' : 'MGR';
        tokens.push({ id: tillPerson, label: tillLabel, x: POS.tillStation.x, y: sY, targetX: POS.tillStation.x, targetY: sY, station: 'till', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
      }
    } else {
      // === 1 MACHINE: AB1 at till, 3rd person at till2 (if 2 tills) or wanders ===
      tokens.push({ id: 'ab1', label: 'AB1', x: POS.tillStation.x, y: sY, targetX: POS.tillStation.x, targetY: sY, station: 'till', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
      if (hasPT && hasMGR) {
        // Two extra people: one fills till2 (if available), other wanders
        if (tills >= 2) {
          tokens.push({ id: 'pt',  label: 'PT',  x: POS.tillStation2.x, y: sY, targetX: POS.tillStation2.x, targetY: sY, station: 'till2', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
        } else {
          tokens.push({ id: 'pt', label: 'PT', x: POS.foodPrep.x + 30, y: sY + 30, targetX: POS.foodPrep.x + 60, targetY: sY + 30, station: 'wandering', busy: false, animState: 'wandering', animStart: 0, animProgress: 0 });
        }
        tokens.push({ id: 'mgr', label: 'MGR', x: POS.foodPrep.x, y: sY + 30, targetX: POS.foodPrep.x + 40, targetY: sY + 30, station: 'wandering', busy: false, animState: 'wandering', animStart: 0, animProgress: 0 });
      } else if (hasPT || hasMGR) {
        const extraId    = hasPT ? 'pt'  : 'mgr';
        const extraLabel = hasPT ? 'PT'  : 'MGR';
        if (tills >= 2) {
          tokens.push({ id: extraId, label: extraLabel, x: POS.tillStation2.x, y: sY, targetX: POS.tillStation2.x, targetY: sY, station: 'till2', busy: false, animState: 'idle', animStart: 0, animProgress: 0 });
        } else {
          tokens.push({ id: extraId, label: extraLabel, x: POS.foodPrep.x, y: sY + 30, targetX: POS.foodPrep.x + 40, targetY: sY + 30, station: 'wandering', busy: false, animState: 'wandering', animStart: 0, animProgress: 0 });
        }
      }
    }
  }

  return tokens;
}

function reconcileStaffTokens(
  currentStaff: StaffToken[],
  nextConfig: StaffConfig
): StaffToken[] {
  const nextStaff = initStaffTokens(nextConfig);
  const currentById = new Map(currentStaff.map((staff) => [staff.id, staff]));

  return nextStaff.map((template) => {
    const existing = currentById.get(template.id);
    if (!existing) return template;

    const stationChanged = existing.station !== template.station;
    let nextAnimState = existing.animState;

    if (stationChanged) {
      if (template.station === 'wandering') {
        nextAnimState = 'wandering';
      } else if (template.station === 'machine' || template.station === 'machine2') {
        nextAnimState = 'traveling-to-machine';
      } else {
        nextAnimState = 'traveling-to-till';
      }
    }

    return {
      ...existing,
      label: template.label,
      station: template.station,
      targetX: template.targetX,
      targetY: template.targetY,
      busy: stationChanged ? false : existing.busy,
      animState: nextAnimState,
      animStart: stationChanged ? 0 : existing.animStart,
      animProgress: stationChanged ? 0 : existing.animProgress,
    };
  });
}

function resizeLaneTimers(currentTimers: number[], laneCount: number): number[] {
  const resized = currentTimers.slice(0, laneCount);

  while (resized.length < laneCount) {
    resized.push(0);
  }

  return resized;
}

// ============================================================
// SIMULATION STATE
// ============================================================

export interface SimState {
  tick: number;
  tokens: Token[];
  staffTokens: StaffToken[];
  backlog: BacklogTicket[];
  nextTokenId: number;
  nextTicketId: number;
  lastWalkinSpawn: number;
  lastCncSpawn: number;
  lastCourierSpawn: number;
  tillBusyUntil: number[];
  prepBusyUntil: number[];
  rates: SimRates;
  targetRates: SimRates;
  transitioning: boolean;
  transitionStart: number;
  completedTicks: number[];  // tick values when orders completed (for orders/hr)
  lostTicks: number[];       // tick values when customers bounced (for lost/hr)
}

export function createInitialState(rates: SimRates): SimState {
  return {
    tick: 0,
    tokens: [],
    staffTokens: initStaffTokens(rates.staffConfig),
    backlog: [],
    nextTokenId: 1,
    nextTicketId: 1,
    lastWalkinSpawn: 0,
    lastCncSpawn: 0,
    lastCourierSpawn: 0,
    tillBusyUntil: new Array(rates.staffConfig.tillLanes).fill(0),
    prepBusyUntil: new Array(rates.staffConfig.prepLanes).fill(0),
    rates,
    targetRates: rates,
    transitioning: false,
    transitionStart: 0,
    completedTicks: [],
    lostTicks: [],
  };
}

// ============================================================
// HELPERS
// ============================================================

function moveToward(current: number, target: number, speed: number): number {
  const diff = target - current;
  if (Math.abs(diff) < speed) return target;
  return current + Math.sign(diff) * speed;
}

// Move toward a point in a straight line (normalized direction, constant speed)
function moveTowardPoint(cx: number, cy: number, tx: number, ty: number, speed: number): {x: number, y: number} {
  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < speed) return { x: tx, y: ty };
  const ratio = speed / dist;
  return { x: cx + dx * ratio, y: cy + dy * ratio };
}

function moveAlongRoute(
  token: Token,
  route: { x: number; y: number }[],
  speed: number,
): { x: number; y: number; routeStep: number; complete: boolean } {
  const routeStep = Math.min(token.routeStep ?? 0, route.length - 1);
  const target = route[routeStep];
  const next = moveTowardPoint(token.x, token.y, target.x, target.y, speed);
  const reached = Math.abs(next.x - target.x) < 2 && Math.abs(next.y - target.y) < 2;
  const nextStep = reached ? routeStep + 1 : routeStep;

  return {
    x: next.x,
    y: next.y,
    routeStep: nextStep,
    complete: nextStep >= route.length,
  };
}

function getQueueApproachRoute(queueIndex: number, targetPos: { x: number; y: number }, showTill2: boolean): { x: number; y: number }[] {
  const queueSpine = [
    PATH.branchRoute[PATH.branchRoute.length - 1],
    ...PATH.queueApproach.slice(7, 12),
  ];

  if (queueIndex === 0) {
    return [
      ...PATH.indexZeroOneRoute,
      targetPos,
    ];
  }

  if (queueIndex <= 4) {
    const finalApproach =
      queueIndex === 1 ? { x: 205, y: 563 } :
      queueIndex === 2 ? { x: 180, y: 561 } :
      queueIndex === 3 ? { x: 150, y: 553 } :
      { x: 122, y: 545 };

    return [
      ...queueSpine,
      finalApproach,
      targetPos,
    ];
  }

  // For tail positions, progressively shorten the shared spine so higher indexes
  // do not walk past their slot and then backtrack.
  const tailWaypoints = [
    PATH.queueApproach[7],
    PATH.queueApproach[8],
    PATH.queueApproach[9],
    PATH.queueApproach[10],
    PATH.queueApproach[11],
  ];
  const tailWaypointCount = Math.max(0, 10 - queueIndex);

  return [
    PATH.branchRoute[PATH.branchRoute.length - 1],
    ...tailWaypoints.slice(0, tailWaypointCount),
    targetPos,
  ];
}

// Quadratic Bézier: B(t) = (1-t)²·P0 + 2(1-t)t·CP + t²·P1
function quadBezier(t: number, p0: {x:number,y:number}, cp: {x:number,y:number}, p1: {x:number,y:number}) {
  const u = 1 - t;
  return {
    x: u*u*p0.x + 2*u*t*cp.x + t*t*p1.x,
    y: u*u*p0.y + 2*u*t*cp.y + t*t*p1.y,
  };
}

// Quadratic Bézier derivative: B'(t) = 2(1-t)(CP-P0) + 2t(P1-CP)
function quadBezierSpeed(t: number, p0: {x:number,y:number}, cp: {x:number,y:number}, p1: {x:number,y:number}): number {
  const u = 1 - t;
  const dx = 2 * u * (cp.x - p0.x) + 2 * t * (p1.x - cp.x);
  const dy = 2 * u * (cp.y - p0.y) + 2 * t * (p1.y - cp.y);
  return Math.sqrt(dx * dx + dy * dy);
}

// Cubic Bézier: B(t) = (1-t)³·P0 + 3(1-t)²t·CP1 + 3(1-t)t²·CP2 + t³·P1
function cubicBezier(t: number, p0: {x:number,y:number}, cp1: {x:number,y:number}, cp2: {x:number,y:number}, p1: {x:number,y:number}) {
  const u = 1 - t;
  return {
    x: u*u*u*p0.x + 3*u*u*t*cp1.x + 3*u*t*t*cp2.x + t*t*t*p1.x,
    y: u*u*u*p0.y + 3*u*u*t*cp1.y + 3*u*t*t*cp2.y + t*t*t*p1.y,
  };
}

// Cubic Bézier derivative: B'(t) = 3(1-t)²(CP1-P0) + 6(1-t)t(CP2-CP1) + 3t²(P1-CP2)
function cubicBezierSpeed(t: number, p0: {x:number,y:number}, cp1: {x:number,y:number}, cp2: {x:number,y:number}, p1: {x:number,y:number}): number {
  const u = 1 - t;
  const dx = 3*u*u*(cp1.x-p0.x) + 6*u*t*(cp2.x-cp1.x) + 3*t*t*(p1.x-cp2.x);
  const dy = 3*u*u*(cp1.y-p0.y) + 6*u*t*(cp2.y-cp1.y) + 3*t*t*(p1.y-cp2.y);
  return Math.sqrt(dx * dx + dy * dy);
}

// Constant-speed Bézier stepping: adjusts dt so pixel-speed stays at `pixelSpeed`
const CURVE_WALK_SPEED = 1.3; // pixels per tick — matches TOKEN_SPEED

function getQueuePosition(index: number, showTill2: boolean): { x: number; y: number } {
  const startX = showTill2 ? POS.queue.x - 60 : POS.queue.x;
  const startY = POS.queue.y;

  // Single-file neck (indexes 0 to 3)
  if (index === 0) return { x: startX, y: startY };
  if (index === 1) return { x: startX - 45, y: startY };
  if (index === 2) return { x: startX - 90, y: startY };
  if (index === 3) return { x: startX - 135, y: startY - 8 }; // Third step left, bumping slightly upward to initiate the curve
  if (index === 4) return { x: startX - 180, y: startY - 16 }; // Still straight behind index 3 before the tail bends.

  // Index 5+ follows an explicit monotonic tail up the left corridor, with only a slight checkered x-shift.
  const tailIdx = index - 5;
  const tailTemplate = [
    { x: startX - 225, y: startY - 42 },
    { x: startX - 210, y: startY - 88 },
    { x: startX - 198, y: startY - 134 },
    { x: startX - 186, y: startY - 180 },
    { x: startX - 174, y: startY - 222 },
    { x: startX - 162, y: startY - 260 },
    { x: startX - 148, y: startY - 294 },
    { x: startX - 134, y: startY - 324 },
    { x: startX - 118, y: startY - 350 },
    { x: startX - 100, y: startY - 372 },
  ];
  const anchor = tailTemplate[Math.min(tailIdx, tailTemplate.length - 1)];
  const overflow = Math.max(0, tailIdx - (tailTemplate.length - 1));
  const stagger = tailIdx === 0 ? 0 : (tailIdx % 2 === 0 ? -6 : 6);

  return {
    x: anchor.x + stagger + overflow * 14,
    y: anchor.y - overflow * 24,
  };
}

// Waiting/pickup layout: first customer at tip of arrow (Point 2), others stack LEFT and wrap UP/backward
const WAITING_SPACING_X = 45;
const WAITING_SPACING_Y = 30;
const WAITING_PER_ROW = 4;

function getWaitingPosition(index: number): { x: number; y: number } {
  const row = Math.floor(index / WAITING_PER_ROW);
  const isOddRow = row % 2 !== 0;
  let col = index % WAITING_PER_ROW;
  
  // Snake the queue layout to naturally enforce correct movement direction
  if (isOddRow) {
    col = (WAITING_PER_ROW - 1) - col;
  }
  
  return {
    x: POS.waiting.x - col * WAITING_SPACING_X - (row * 15),
    y: POS.waiting.y - row * WAITING_SPACING_Y,
  };
}

function getBacklogPosition(index: number, baseX: number, baseY: number): { x: number; y: number } {
  const col = index % 6;
  const row = Math.floor(index / 6);
  return { x: baseX + col * 20, y: baseY + row * 24 };
}

// Linear bounce based on combined queue (queue + waiting).
// Combined ≤ 2: 0% bounce (full conversion).
// Combined = 3: 5% bounce.
// Combined 4–9: linear from 5% to 70%.
// Combined 10+: +10%/customer, cap 95%.
function computeLinearBounce(combinedQueue: number): number {
  if (combinedQueue <= 2) return 0;
  if (combinedQueue === 3) return 0.05;
  if (combinedQueue <= 9) return 0.05 + (combinedQueue - 3) * 0.65 / 6;
  return Math.min(0.95, 0.7 + (combinedQueue - 9) * 0.10);
}

const FACE_RANK: Record<Face, number> = { happy: 0, neutral: 1, sad: 2 };

function determineFace(token: Token): Face {
  if (token.type === 'courier') return 'neutral';
  if (token.state === 'bouncing' || token.state === 'stock_bouncing') return 'sad';

  // Only re-evaluate when actually waiting (in queue or at pickup)
  if (token.state !== 'queuing' && token.state !== 'waiting') return token.face;

  // Face based on accumulated wait time (queuing + waiting)
  let proposed: Face = 'happy';
  if (token.waitTicks >= SAD_WAIT_THRESHOLD) proposed = 'sad';
  else if (token.waitTicks >= NEUTRAL_WAIT_THRESHOLD) proposed = 'neutral';

  // Perception can only degrade, never improve
  return FACE_RANK[proposed] > FACE_RANK[token.face] ? proposed : token.face;
}

function determineExitFace(token: Token, rates: SimRates): Face {
  if (token.type === 'courier') return 'neutral';
  if (token.state === 'bouncing' || token.state === 'stock_bouncing') return 'sad';

  const baseFace = token.face;

  // Service consistency penalty: small chance of downgrade by one step
  if (baseFace === 'happy' && Math.random() < rates.consistencyFailRate) {
    return 'neutral';
  }

  return baseFace;
}

// ============================================================
// SIMULATION TICK
// ============================================================

export function tickSimulation(state: SimState): SimState {
  const { rates } = state;
  const tick = state.tick + 1;
  let tokens = [...state.tokens];
  let backlog = [...state.backlog];
  let nextTokenId = state.nextTokenId;
  let nextTicketId = state.nextTicketId;
  let lastWalkinSpawn = state.lastWalkinSpawn;
  let lastCncSpawn = state.lastCncSpawn;
  let lastCourierSpawn = state.lastCourierSpawn;
  const tillBusyUntil = [...state.tillBusyUntil];
  const prepBusyUntil = [...state.prepBusyUntil];
  const completedTicks = [...state.completedTicks];
  const lostTicks = [...state.lostTicks];
  let staffTokens = [...state.staffTokens];

  // --- Spawn walk-in customers ---
  if (tick - lastWalkinSpawn >= rates.spawnInterval) {
    tokens.push({
      id: nextTokenId++,
      type: 'walkin',
      state: 'entering',
      x: POS.enter.x,
      y: POS.enter.y,
      age: 0,
      stageStart: tick,
      face: 'happy',
      opacity: 0,
      queueIndex: -1,
      laneIndex: -1,
      arrivedAtStage: false,
      prepDoneAt: 0,
      waitTicks: 0,
    });
    lastWalkinSpawn = tick;
  }

  // --- Spawn C&C customers ---
  if (rates.cncActive && tick - lastCncSpawn >= rates.cncSpawnInterval) {
    tokens.push({
      id: nextTokenId++,
      type: 'cnc',
      state: 'entering',
      x: POS.enter.x,
      y: POS.enter.y,
      age: 0,
      stageStart: tick,
      face: 'happy',
      opacity: 0,
      queueIndex: -1,
      laneIndex: -1,
      arrivedAtStage: false,
      prepDoneAt: 0,
      waitTicks: 0,
    });
    lastCncSpawn = tick;
  }

  // --- Spawn delivery couriers ---
  if (rates.deliveryActive && tick - lastCourierSpawn >= rates.courierSpawnInterval) {
    tokens.push({
      id: nextTokenId++,
      type: 'courier',
      state: 'entering',
      x: POS.enter.x,
      y: POS.enter.y,
      age: 0,
      stageStart: tick,
      face: 'neutral',
      opacity: 0,
      queueIndex: -1,
      laneIndex: -1,
      arrivedAtStage: false,
      prepDoneAt: 0,
      waitTicks: 0,
    });
    lastCourierSpawn = tick;
  }

  // --- Queue stats ---
  const queueCount = tokens.filter(t => t.state === 'queuing').length;
  const approachingCount = tokens.filter(t => t.state === 'approaching_queue' && t.queueIndex >= 0).length;
  const combinedQueueCount = tokens.filter(t => t.state === 'queuing' || t.state === 'waiting' || t.state === 'approaching_queue').length;
  const findFreeTillLane = () => tillBusyUntil.findIndex((u, laneIdx) => {
    if (u > tick) return false;
    const mappedStation = laneIdx === 1 ? 'till2' : 'till';
    return staffTokens.some(st =>
      st.station === mappedStation &&
      st.animState === 'idle' &&
      Math.abs(st.x - st.targetX) < 3 &&
      Math.abs(st.y - st.targetY) < 3
    );
  });

  // --- Update each token ---
  tokens = tokens.map(token => {
    let t = { ...token, age: token.age + 1 };
    // Accumulate wait time when approaching queue, queuing, at till, or at pickup
    if (t.state === 'approaching_queue' || t.state === 'queuing' || t.state === 'ordering' || t.state === 'waiting') {
      t.waitTicks = token.waitTicks + 1;
    }

    switch (t.state) {
      case 'entering': {
        t.opacity = Math.min(1, t.opacity + FADE_SPEED * 2);
        if (t.type === 'cnc' || t.type === 'courier') {
          t.state = 'fast_tracking';
          t.stageStart = tick;
        } else {
          const np = moveAlongRoute(t, PATH.entryRoute, TOKEN_SPEED);
          t.x = np.x;
          t.y = np.y;
          t.routeStep = np.routeStep;

          if (np.complete) {
            t.x = POS.decision.x;
            t.y = POS.decision.y;
            // Item 10: skip decision animation when combined queue < 3
            if (combinedQueueCount < 3) {
              // Go straight through — no deciding wobble
              const effectiveBounce = computeLinearBounce(combinedQueueCount);
              if (Math.random() < effectiveBounce) {
                t.face = 'sad';
                t.state = 'bouncing';
                t.stageStart = tick;
                t.curveT = undefined;
                t.routeStep = 0;
                lostTicks.push(tick);
              } else {
                t.state = 'approaching_queue';
                t.stageStart = tick;
                t.curveT = undefined;
                t.routeStep = 0;
                t.routePhase = 'branch';
                t.queueIndex = -1;
              }
            } else {
              t.state = 'deciding';
              t.stageStart = tick;
              t.curveT = undefined;
              t.routeStep = undefined;
              // Pre-calculate the bounce decision so the UI thought-bubble can foreshadow it accurately
              const combinedQ = tokens.filter((tok: any) => tok.state === 'queuing' || tok.state === 'waiting').length;
              const effBounce = computeLinearBounce(combinedQ);
              t.willLeave = Math.random() < effBounce;
            }
          }
        }
        break;
      }

      case 'deciding': {
        const decidingTime = tick - t.stageStart;
        t.decidingProgress = decidingTime / DECIDING_TICKS;
        t.x = POS.decision.x;
        t.y = POS.decision.y;

        if (decidingTime >= DECIDING_TICKS) {
          if (t.willLeave) {
            t.face = 'sad';
            t.state = 'bouncing';
            t.stageStart = tick;
            t.curveT = undefined;
            t.routeStep = 0;
            lostTicks.push(tick);
          } else {
            t.state = 'approaching_queue';
            t.stageStart = tick;
            t.curveT = undefined;
            t.routeStep = 0;
            t.routePhase = 'branch';
            t.queueIndex = -1;
          }
        }
        break;
      }

      case 'approaching_queue': {
        if (t.routePhase === 'direct') {
          const direct = moveAlongRoute(t, PATH.directServiceRoute, TOKEN_SPEED);
          t.x = direct.x;
          t.y = direct.y;
          t.routeStep = direct.routeStep;
          if (direct.complete) {
            t.state = 'ordering';
            t.stageStart = tick;
            t.routeStep = undefined;
            t.arrivedAtStage = false;
          }
          break;
        }

        if (t.routePhase === 'branch' || t.queueIndex < 0) {
          const branch = moveAlongRoute(t, PATH.branchRoute, TOKEN_SPEED);
          t.x = branch.x;
          t.y = branch.y;
          t.routeStep = branch.routeStep;

          if (branch.complete) {
            const lockedQueueCount = tokens.filter(tok =>
              tok.state === 'queuing' ||
              (tok.state === 'approaching_queue' && tok.routePhase === 'queue' && tok.queueIndex >= 0)
            ).length;
            const freeLane = lockedQueueCount === 0 ? findFreeTillLane() : -1;

            if (freeLane >= 0) {
              t.stageStart = tick;
              t.laneIndex = freeLane;
              t.queueIndex = -1;
              t.routePhase = 'direct';
              t.routeStep = 0;
              t.arrivedAtStage = false;
              tillBusyUntil[freeLane] = tick + rates.tillCycleTime;
            } else {
              t.queueIndex = lockedQueueCount;
              t.routePhase = 'queue';
              t.routeStep = 0;
            }
          }
          break;
        }

        const showTill2 = rates.staffConfig.tillLanes >= 2;
        const targetPos = getQueuePosition(t.queueIndex, showTill2);
        const route = getQueueApproachRoute(t.queueIndex, targetPos, showTill2);
        const np = moveAlongRoute(t, route, TOKEN_SPEED);
        t.x = np.x;
        t.y = np.y;
        t.routeStep = np.routeStep;
        
        // Hard-stop precisely upon reaching exact target slot in queue
        const distToTarget = Math.sqrt(Math.pow(t.x - targetPos.x, 2) + Math.pow(t.y - targetPos.y, 2));
        if (distToTarget < 2) {
          t.state = 'queuing';
          t.arrivedAtStage = true;
          t.stageStart = tick;
          t.routeStep = undefined;
          t.isStationary = true;
        } else {
          t.isStationary = false;
        }
        break;
      }

      case 'queuing': {
        const qPos = getQueuePosition(t.queueIndex, rates.staffConfig.tillLanes >= 2);
        const dist = Math.sqrt(Math.pow(t.x - qPos.x, 2) + Math.pow(t.y - qPos.y, 2));
        if (dist < 2) {
          t.x = qPos.x;
          t.y = qPos.y;
          t.isStationary = true;
        } else {
          const qp = moveTowardPoint(t.x, t.y, qPos.x, qPos.y, TOKEN_SPEED);
          t.x = qp.x;
          t.y = qp.y;
          t.isStationary = false;
        }

        if (t.queueIndex === 0) {
          const freeLane = tillBusyUntil.findIndex((u, laneIdx) => {
            if (u > tick) return false;
            // Check if a staff token is mapped to this till, is ready to serve,
            // and has actually reached their current assignment.
            const mappedStation = laneIdx === 1 ? 'till2' : 'till';
            return staffTokens.some(st =>
              st.station === mappedStation &&
              st.animState === 'idle' &&
              Math.abs(st.x - st.targetX) < 3 &&
              Math.abs(st.y - st.targetY) < 3
            );
          });
          if (freeLane >= 0) {
            t.state = 'ordering';
            t.stageStart = tick;
            t.laneIndex = freeLane;
            t.queueIndex = -1;
            t.arrivedAtStage = false;
            // Block till lane for the full cycle time (for serialized models, this physically prevents overlap)
            tillBusyUntil[freeLane] = tick + rates.tillCycleTime;
          }
        }
        t.face = determineFace(t);
        break;
      }

      case 'ordering': {
        // Move to the correct till based on lane assignment
        const tillTarget = t.laneIndex === 1 ? POS.till2 : POS.till;
        const op = moveTowardPoint(t.x, t.y, tillTarget.x, tillTarget.y, TOKEN_SPEED);
        t.x = op.x;
        t.y = op.y;

        // Only start till timer after arriving at till position
        const atTill = Math.abs(t.x - tillTarget.x) < 2 && Math.abs(t.y - tillTarget.y) < 2;
        if (atTill && !t.arrivedAtStage) {
          t.arrivedAtStage = true;
          t.stageStart = tick;
        }

        if (t.arrivedAtStage && tick - t.stageStart >= rates.tillTime) {
          // Stock availability check
          if (Math.random() < rates.stockBounceRate) {
            t.face = 'sad';
            t.state = 'stock_bouncing';
            t.stageStart = tick;
            t.routeStep = 0;
            lostTicks.push(tick);
          } else {
            t.state = 'waiting';
            t.stageStart = tick;
            t.arrivedAtStage = false;
            const bpos = getBacklogPosition(backlog.length, POS.backlogBase.x, POS.backlogBase.y);
            backlog.push({ id: nextTicketId++, x: bpos.x, y: bpos.y, opacity: 1 });

            const freePrepLane = prepBusyUntil.findIndex(u => u <= tick);
            if (freePrepLane >= 0) {
              prepBusyUntil[freePrepLane] = tick + rates.prepTime;
              t.laneIndex = freePrepLane;
              t.prepDoneAt = prepBusyUntil[freePrepLane];
            } else {
              const soonest = prepBusyUntil.indexOf(Math.min(...prepBusyUntil));
              prepBusyUntil[soonest] += rates.prepTime;
              t.laneIndex = soonest;
              t.prepDoneAt = prepBusyUntil[soonest];
            }
          }
        }
        // Face does NOT change at the till — only in queue and waiting area
        break;
      }

      case 'waiting': {
        const waitingTokens = tokens.filter(tk => tk.state === 'waiting' && tk.id < t.id);
        t.waitIndex = waitingTokens.length;
        const wPos = getWaitingPosition(t.waitIndex);
        const dist = Math.sqrt(Math.pow(t.x - wPos.x, 2) + Math.pow(t.y - wPos.y, 2));
        
        if (dist < 2 || (t.curveT !== undefined && t.curveT >= 1 && dist < 5)) {
            t.x = wPos.x;
            t.y = wPos.y;
            t.curveT = 1; // Locked in
            t.isStationary = true;
        } else {
            const waitRow = Math.floor(t.waitIndex / WAITING_PER_ROW);
            const isOddRow = waitRow % 2 !== 0;
            const isFirstInOddRow = isOddRow && (t.waitIndex % WAITING_PER_ROW === 0);
            
            // If they have already completed their arrival curve, they should just shuffle linearly
            if (!isOddRow || isFirstInOddRow || (t.curveT !== undefined && t.curveT >= 1)) {
                // Right-to-Left rows (and the far-left anchor of Left-to-Right rows) 
                // simply walk linearly straight into their slot without clipping
                const wp = moveTowardPoint(t.x, t.y, wPos.x, wPos.y, TOKEN_SPEED * 1.4);
                t.x = wp.x;
                t.y = wp.y;
                t.isStationary = false;
            } else {
                // Subsequent Left-to-Right rows must arc overhead to avoid clipping through their neighbors
                if (t.curveT === undefined) t.curveT = 0;
                
                const startPos = t.laneIndex === 1 ? POS.till2 : POS.till;
                const midX = (startPos.x + wPos.x) / 2;
                
                const arcHeight = 40 + (waitRow * 25); 
                const cp = { x: midX, y: Math.min(startPos.y, wPos.y) - arcHeight };
                
                const spd = quadBezierSpeed(t.curveT, startPos, cp, wPos);
                const dt = spd > 0.1 ? (TOKEN_SPEED * 1.4) / spd : 0.01;
                t.curveT = Math.min(1, t.curveT + dt);
                
                const nextNode = quadBezier(t.curveT, startPos, cp, wPos);
                t.x = nextNode.x;
                t.y = nextNode.y;
                t.isStationary = false;
            }
        }

        const prepDone = t.prepDoneAt > 0 && t.prepDoneAt <= tick;
        const timeWaited = tick - t.stageStart;
        if (prepDone || timeWaited > rates.prepTime * 10) {
          if (backlog.length > 0) {
            backlog = backlog.slice(1);
          }
          completedTicks.push(tick);
          t.face = determineExitFace(t, rates);
          t.state = 'leaving';
          t.stageStart = tick;
          t.curveT = undefined;
          t.routeStep = 0;
        }
        t.face = determineFace(t);
        break;
      }

      case 'fast_tracking': {
        t.opacity = Math.min(1, t.opacity + FADE_SPEED * 2);
        const targetX = POS.waiting.x + 20;
        const targetY = POS.waiting.y - 50;  // approach from above
        t.x = moveToward(t.x, targetX, TOKEN_SPEED * 1.5);
        t.y = moveToward(t.y, targetY, TOKEN_SPEED * 1.5);
        if (Math.abs(t.x - targetX) < 3 && Math.abs(t.y - targetY) < 3) {
          t.state = 'waiting';
          t.stageStart = tick;
          // Add backlog ticket now (synced with entering waiting state)
          const bpos = getBacklogPosition(backlog.length, POS.backlogBase.x, POS.backlogBase.y);
          backlog.push({ id: nextTicketId++, x: bpos.x, y: bpos.y, opacity: 1 });
          const freePrepLane = prepBusyUntil.findIndex(u => u <= tick);
          if (freePrepLane >= 0) {
            prepBusyUntil[freePrepLane] = tick + rates.prepTime;
            t.laneIndex = freePrepLane;
            t.prepDoneAt = prepBusyUntil[freePrepLane];
          } else {
            const soonest = prepBusyUntil.indexOf(Math.min(...prepBusyUntil));
            prepBusyUntil[soonest] += rates.prepTime;
            t.laneIndex = soonest;
            t.prepDoneAt = prepBusyUntil[soonest];
          }
        }
        break;
      }

      case 'bouncing': {
        const bp = moveAlongRoute(t, PATH.bounceRoute, TOKEN_SPEED);
        t.x = bp.x;
        t.y = bp.y;
        t.routeStep = bp.routeStep;
        if (bp.complete) {
          t.opacity -= FADE_SPEED * 4;
          if (t.opacity <= 0) t.state = 'exited';
        }
        break;
      }

      case 'stock_bouncing': {
        // Move right to pickup zone first, then follow right geometric exit route
        if (t.x < POS.waiting.x - 5) {
          const sp = moveTowardPoint(t.x, t.y, POS.waiting.x, POS.waiting.y, TOKEN_SPEED * 1.2);
          t.x = sp.x;
          t.y = sp.y;
        } else {
          const sp2 = moveAlongRoute(t, PATH.exitRoute, TOKEN_SPEED * 1.2);
          t.x = sp2.x;
          t.y = sp2.y;
          t.routeStep = sp2.routeStep;
          
          if (sp2.complete) {
            t.opacity -= FADE_SPEED * 4;
            if (t.opacity <= 0) t.state = 'exited';
          }
        }
        break;
      }

      case 'leaving': {
        const np = moveAlongRoute(t, PATH.exitRoute, TOKEN_SPEED * 1.3);
        t.x = np.x;
        t.y = np.y;
        t.routeStep = np.routeStep;

        if (np.complete) {
          t.opacity -= FADE_SPEED * 3;
          if (t.opacity <= 0) t.state = 'exited';
        }
        break;
      }
    }

    return t;
  });

  // --- Reindex queue positions ---
  // Reindex only customers already standing in the queue; approaching customers keep their locked target slot.
  const queuedTokens = tokens
    .filter(t => t.state === 'queuing')
    .sort((a, b) => a.id - b.id);
  queuedTokens.forEach((t, i) => {
    const idx = tokens.findIndex(tk => tk.id === t.id);
    if (idx >= 0) tokens[idx] = { ...tokens[idx], queueIndex: i };
  });

  // --- Remove exited tokens ---
  tokens = tokens.filter(t => t.state !== 'exited');

  // --- Cap total tokens ---
  if (tokens.length > 30) {
    tokens = tokens.slice(-30);
  }

  // --- Cap backlog to match waiting count (item 17) ---
  const waitingCount = tokens.filter(t => t.state === 'waiting').length;
  while (backlog.length > waitingCount && backlog.length > 0) {
    backlog = backlog.slice(1);
  }

  // --- Reposition all backlog tickets by current array index (Fix 1) ---
  // Prevents position overlap/gaps from add/remove ordering within the tick
  backlog = backlog.map((ticket, i) => {
    const bpos = getBacklogPosition(i, POS.backlogBase.x, POS.backlogBase.y);
    return { ...ticket, x: bpos.x, y: bpos.y };
  });

  // --- Trim completedTicks and lostTicks to last sim-hour ---
  const SIM_HOUR_TICKS = 9600;
  while (completedTicks.length > 0 && completedTicks[0] < tick - SIM_HOUR_TICKS) {
    completedTicks.shift();
  }
  while (lostTicks.length > 0 && lostTicks[0] < tick - SIM_HOUR_TICKS) {
    lostTicks.shift();
  }

  // --- Update staff tokens (event-driven animation) ---
  const sY = POS.staffBelowY;

  for (const staff of staffTokens) {
    if (staff.animState === 'wandering') {
      // Wandering staff: gentle amble in food prep / back area only
      if (Math.abs(staff.x - staff.targetX) < 3 && Math.abs(staff.y - staff.targetY) < 3) {
        staff.targetX = POS.foodPrep.x - 40 + Math.random() * 100;
        staff.targetY = sY + 20 + Math.random() * 30;
      }
      staff.x = moveToward(staff.x, staff.targetX, STAFF_SPEED * 0.08);
      staff.y = moveToward(staff.y, staff.targetY, STAFF_SPEED * 0.08);
      continue;
    }

    const isSerialisedModel = rates.staffConfig.serialised;
    const isTillStaff = staff.station === 'till' || staff.station === 'till2';
    const isMachineStaff = staff.station === 'machine' || staff.station === 'machine2';

    if (isSerialisedModel && isTillStaff) {
      // Serialised staff (solo, duo-parallel): cycle between till and machine
      // Solo/serialised staff always use machine1, UNLESS explicitly mapped to till2 (duo-parallel right lane)
      const machinePos = staff.station === 'till2' ? POS.machine2 : POS.machine1;
      const tillPos = staff.station === 'till2' ? POS.tillStation2 : POS.tillStation;

      switch (staff.animState) {
        case 'idle':
          // Wait at till for a customer
          staff.targetX = tillPos.x;
          staff.targetY = sY;
          const myTillLane = staff.station === 'till2' ? 1 : 0;
          // Check if any customer is ordering at our lane
          const orderingCustomer = tokens.find(t =>
            t.state === 'ordering' && t.arrivedAtStage && t.laneIndex === myTillLane
          );
          if (orderingCustomer) {
            staff.animState = 'serving';
            staff.animStart = tick;
          }
          break;
        case 'serving':
          // Stay at till while customer orders
          staff.targetX = tillPos.x;
          staff.targetY = sY;
          staff.animProgress = Math.min(1, (tick - staff.animStart) / rates.tillTime);
          const myTillLaneServing = staff.station === 'till2' ? 1 : 0;
          // When customer finishes ordering (transitions to waiting), travel to machine
          const stillOrdering = tokens.some(t => t.state === 'ordering' && t.arrivedAtStage && t.laneIndex === myTillLaneServing);
          if (!stillOrdering) {
            staff.animState = 'traveling-to-machine';
            staff.animStart = tick;
            staff.animProgress = 0;
          }
          break;
        case 'traveling-to-machine':
          staff.targetX = machinePos.x;
          staff.targetY = sY;
          if (Math.abs(staff.x - machinePos.x) < 3) {
            staff.animState = 'making';
            staff.animStart = tick;
          }
          break;
        case 'making':
          staff.targetX = machinePos.x;
          staff.targetY = sY;
          const makingDuration = rates.prepTime - ANIM_TRAVEL_TICKS * 2;
          staff.animProgress = Math.min(1, (tick - staff.animStart) / makingDuration);
          // Wait for prep duration minus travel time
          if (tick - staff.animStart >= makingDuration) {
            staff.animState = 'traveling-to-till';
            staff.animStart = tick;
            staff.animProgress = 0;
          }
          break;
        case 'traveling-to-till':
          staff.targetX = tillPos.x;
          staff.targetY = sY;
          if (Math.abs(staff.x - tillPos.x) < 3) {
            staff.animState = 'idle';
            staff.animStart = tick;
            staff.animProgress = 0;
          }
          break;
      }
    } else if (isTillStaff) {
      // Specialised till person: stays at till
      const tillPos = staff.station === 'till2' ? POS.tillStation2 : POS.tillStation;
      staff.targetX = tillPos.x;
      staff.targetY = sY;

      const orderingCustomer = tokens.find(t =>
        t.state === 'ordering' && t.arrivedAtStage && t.laneIndex === (staff.station === 'till2' ? 1 : 0)
      );
      if (orderingCustomer) {
        staff.animState = 'serving';
        staff.animProgress = Math.min(1, (tick - orderingCustomer.stageStart) / rates.tillTime);
      } else {
        staff.animState = 'idle';
        staff.animProgress = 0;
      }

    } else if (isMachineStaff) {
      // Machine person: stays at machine
      const machPos = staff.station === 'machine2' ? POS.machine2 : POS.machine1;
      staff.targetX = machPos.x;
      staff.targetY = sY;

      const machineIndex = staff.station === 'machine2' ? 1 : 0;
      const makingCustomer = tokens.find(t =>
        t.state === 'waiting' && t.laneIndex === machineIndex && t.prepDoneAt > tick && tick >= (t.prepDoneAt - rates.prepTime)
      );
      if (makingCustomer) {
         staff.animState = 'making';
         staff.animProgress = Math.min(1, 1 - (makingCustomer.prepDoneAt - tick) / rates.prepTime);
      } else {
         staff.animState = 'idle';
         staff.animProgress = 0;
      }
    }

    // Move toward target
    staff.x = moveToward(staff.x, staff.targetX, STAFF_SPEED);
    staff.y = moveToward(staff.y, staff.targetY, STAFF_SPEED);
  }

  return {
    ...state,
    tick,
    tokens,
    staffTokens,
    backlog,
    nextTokenId,
    nextTicketId,
    lastWalkinSpawn,
    lastCncSpawn,
    lastCourierSpawn,
    tillBusyUntil,
    prepBusyUntil,
    completedTicks,
    lostTicks,
  };
}

// ============================================================

export function useCustomerFlowSimulation(metrics: VisibleMetrics, flags: ActionFlags, triggerKey: number) {
  const simRef = useRef<SimState | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const [renderTick, setRenderTick] = useState(0);

  if (!simRef.current) {
    const rates = deriveSimRates(metrics, flags);
    simRef.current = createInitialState(rates);
  }

  useEffect(() => {
    if (!simRef.current) return;
    const newRates = deriveSimRates(metrics, flags);
    simRef.current.targetRates = newRates;
    simRef.current.transitioning = true;
    simRef.current.transitionStart = simRef.current.tick;

    simRef.current.staffTokens = reconcileStaffTokens(
      simRef.current.staffTokens,
      newRates.staffConfig
    );
    simRef.current.tillBusyUntil = resizeLaneTimers(
      simRef.current.tillBusyUntil,
      newRates.staffConfig.tillLanes
    );
    simRef.current.prepBusyUntil = resizeLaneTimers(
      simRef.current.prepBusyUntil,
      newRates.staffConfig.prepLanes
    );
  }, [triggerKey, metrics, flags]);

  const animate = useCallback((timestamp: number) => {
    if (!simRef.current) return;

    const elapsed = timestamp - lastFrameRef.current;
    if (elapsed < 16) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameRef.current = timestamp;

    // Handle rate transition
    if (simRef.current.transitioning) {
      const transitionProgress = Math.min(1, (simRef.current.tick - simRef.current.transitionStart) / TRANSITION_DURATION);
      if (transitionProgress >= 1) {
        simRef.current.rates = simRef.current.targetRates;
        simRef.current.transitioning = false;
      } else {
        const r = simRef.current.rates;
        const t = simRef.current.targetRates;
        const p = transitionProgress;
        simRef.current.rates = {
          ...t,
          spawnInterval: Math.round(r.spawnInterval + (t.spawnInterval - r.spawnInterval) * p),
          bounceRate: r.bounceRate + (t.bounceRate - r.bounceRate) * p,
          targetQueue: Math.round(r.targetQueue + (t.targetQueue - r.targetQueue) * p),
          tillTime: Math.round(r.tillTime + (t.tillTime - r.tillTime) * p),
          tillCycleTime: Math.round(r.tillCycleTime + (t.tillCycleTime - r.tillCycleTime) * p),
          prepTime: Math.round(r.prepTime + (t.prepTime - r.prepTime) * p),
          consistencyFailRate: r.consistencyFailRate + (t.consistencyFailRate - r.consistencyFailRate) * p,
          stockBounceRate: r.stockBounceRate + (t.stockBounceRate - r.stockBounceRate) * p,
        };
      }
    }

    simRef.current = tickSimulation(simRef.current);

    if (simRef.current.tick % 2 === 0) {
      setRenderTick(simRef.current.tick);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return { state: simRef.current, renderTick };
}
