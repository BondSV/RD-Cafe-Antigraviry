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
export const VB_H = 450;

export const POS = {
  enter:    { x: 70,  y: 170 },
  decision: { x: 170, y: 170 },
  queue:    { x: 370, y: 170 },
  till:     { x: 460, y: 170 },
  till2:    { x: 530, y: 170 },       // second till customer position
  waiting:  { x: 616, y: 170 },
  exit:     { x: 70,  y: 0 },
  foodPrep:    { x: 340, y: 310 },
  tillStation: { x: 460, y: 310 },
  tillStation2:{ x: 530, y: 310 },    // second till station
  machine1:    { x: 670, y: 310 },
  machine2:    { x: 750, y: 310 },
  counterY: 245,
  backlogBase: { x: 620, y: 380 },
  staffBelowY: 350,                   // staff operate below station rects
};

// Till and Pickup are rendered separately with dynamic sizing
export const STAGE_LABELS = [
  { pos: POS.enter,    label: 'Enter' },
  { pos: POS.decision, label: 'Decision' },
  { pos: POS.queue,    label: 'Queue' },
  { pos: POS.exit,     label: 'Exit' },
];

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
const TOKEN_SPEED = 0.91;         // 30% faster visually (was 0.7)
const FADE_SPEED = 0.007;
const DECIDING_TICKS = 120;      // ~2 seconds looking around
const STAFF_SPEED = 9;            // 40% slower visually (was 15); all staff same speed
const ANIM_TRAVEL_TICKS = 20;     // visual travel at STAFF_SPEED=9: ~180px/9 = 20 ticks

// Face thresholds based on accumulated wait time (queuing + waiting states)
const NEUTRAL_WAIT_THRESHOLD = 1120; // >= 7 sim-minutes (1120 ticks)
const SAD_WAIT_THRESHOLD = 1600;     // >= 10 sim-minutes (1600 ticks)

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

  return { totalStaff, tills, machines, specialised, model, tillLanes, serialised, prepLanes, managerWandering };
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
  const sY = POS.staffBelowY; // staff operate below station rects

  if (config.model === 'solo') {
    // Solo: AB1 starts at till, event-driven animation will move them
    tokens.push({
      id: 'ab1', label: 'AB1',
      x: POS.tillStation.x, y: sY,
      targetX: POS.tillStation.x, targetY: sY,
      station: 'till', busy: false,
      animState: 'idle', animStart: 0,
    });
  } else if (config.model === 'duo-parallel') {
    // Two serialised lanes — each cycles between their till and machine
    tokens.push({
      id: 'ab1', label: 'AB1',
      x: POS.tillStation.x, y: sY,
      targetX: POS.tillStation.x, targetY: sY,
      station: 'till', busy: false,
      animState: 'idle', animStart: 0,
    });
    tokens.push({
      id: 'hb', label: 'HB',
      x: POS.tillStation2.x, y: sY,
      targetX: POS.tillStation2.x, targetY: sY,
      station: 'till2', busy: false,
      animState: 'idle', animStart: 0,
    });
  } else if (config.totalStaff >= 3 && config.machines >= 2 && !config.specialised) {
    // 3+ staff with 2 machines (not specialised): MGR→till, HB→machine1, AB1→machine2
    tokens.push({
      id: 'mgr', label: 'MGR',
      x: POS.tillStation.x, y: sY,
      targetX: POS.tillStation.x, targetY: sY,
      station: 'till', busy: false,
      animState: 'idle', animStart: 0,
    });
    tokens.push({
      id: 'hb', label: 'HB',
      x: POS.machine1.x, y: sY,
      targetX: POS.machine1.x, targetY: sY,
      station: 'machine', busy: false,
      animState: 'idle', animStart: 0,
    });
    tokens.push({
      id: 'ab1', label: 'AB1',
      x: POS.machine2.x, y: sY,
      targetX: POS.machine2.x, targetY: sY,
      station: 'machine2', busy: false,
      animState: 'idle', animStart: 0,
    });
    if (config.totalStaff >= 4) {
      tokens.push({
        id: 'pt', label: 'PT',
        x: POS.foodPrep.x, y: sY + 30,
        targetX: POS.foodPrep.x + 40, targetY: sY + 30,
        station: 'wandering', busy: false,
        animState: 'wandering', animStart: 0,
      });
    }
  } else {
    // Specialised, duo-natural, or trio with 1 machine: AB1→till, HB→machine
    tokens.push({
      id: 'ab1', label: 'AB1',
      x: POS.tillStation.x, y: sY,
      targetX: POS.tillStation.x, targetY: sY,
      station: 'till', busy: false,
      animState: 'idle', animStart: 0,
    });
    if (config.totalStaff >= 2) {
      tokens.push({
        id: 'hb', label: 'HB',
        x: POS.machine1.x, y: sY,
        targetX: POS.machine1.x, targetY: sY,
        station: 'machine', busy: false,
        animState: 'idle', animStart: 0,
      });
    }
    if (config.totalStaff >= 3) {
      // Manager with 1 machine: wander in food prep / back area
      tokens.push({
        id: 'mgr', label: 'MGR',
        x: POS.foodPrep.x, y: sY + 30,
        targetX: POS.foodPrep.x + 40, targetY: sY + 30,
        station: 'wandering', busy: false,
        animState: 'wandering', animStart: 0,
      });
    }
    if (config.totalStaff >= 4) {
      if (config.tills >= 2) {
        tokens.push({
          id: 'pt', label: 'PT',
          x: POS.tillStation2.x, y: sY,
          targetX: POS.tillStation2.x, targetY: sY,
          station: 'till2', busy: false,
          animState: 'idle', animStart: 0,
        });
      } else {
        tokens.push({
          id: 'pt', label: 'PT',
          x: POS.foodPrep.x + 30, y: sY + 30,
          targetX: POS.foodPrep.x + 60, targetY: sY + 30,
          station: 'wandering', busy: false,
          animState: 'wandering', animStart: 0,
        });
      }
    }
  }

  return tokens;
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

// Queue layout: first 5 in single line left of till, then overflow rows go UP
const QUEUE_SPACING = TOKEN_R * 2 + 4; // 32px between tokens
const QUEUE_GAP = 40;                   // visible gap between ordering customer and queue front
const QUEUE_PER_ROW = 5;
const QUEUE_ROW_HEIGHT = TOKEN_R * 2 + 6; // 34px between rows

function getQueuePosition(index: number): { x: number; y: number } {
  const frontX = POS.till.x - QUEUE_GAP - TOKEN_R;
  if (index < QUEUE_PER_ROW) {
    // First 5: single horizontal line going LEFT
    return {
      x: frontX - index * QUEUE_SPACING,
      y: POS.till.y,
    };
  }
  // Overflow: rows go UP (lower y), fill RIGHT-to-LEFT
  // Start overflow at position 2's x (not position 0) so rows build above middle/tail
  const overflowIdx = index - QUEUE_PER_ROW;
  const row = Math.floor(overflowIdx / QUEUE_PER_ROW) + 1;
  const col = overflowIdx % QUEUE_PER_ROW;
  const overflowStartX = frontX - 2 * QUEUE_SPACING; // aligned with position 2
  const x = overflowStartX - col * QUEUE_SPACING;
  const y = POS.till.y - row * QUEUE_ROW_HEIGHT;
  // Clamp so queue never reaches Decision area
  return { x: Math.max(POS.decision.x + 50, x), y };
}

// Waiting/pickup layout: first 4 in line, then rows go UP
const WAITING_SPACING = TOKEN_R * 2 + 4; // 32px
const WAITING_PER_ROW = 4;
const WAITING_ROW_HEIGHT = TOKEN_R * 2 + 6;

function getWaitingPosition(index: number): { x: number; y: number } {
  if (index < WAITING_PER_ROW) {
    // First 4: fill RIGHT-to-LEFT from pickup label
    // Position 0 (earliest) = rightmost, position 3 (newest) = leftmost
    return {
      x: POS.waiting.x + (WAITING_PER_ROW - 1 - index) * WAITING_SPACING,
      y: POS.waiting.y,
    };
  }
  // Overflow rows go UP (lower y), fill right-to-left
  const overflowIdx = index - WAITING_PER_ROW;
  const row = Math.floor(overflowIdx / WAITING_PER_ROW) + 1;
  const col = overflowIdx % WAITING_PER_ROW;
  return {
    x: POS.waiting.x + (WAITING_PER_ROW - 1 - col) * WAITING_SPACING,
    y: POS.waiting.y - row * WAITING_ROW_HEIGHT,
  };
}

function getBacklogPosition(index: number, baseX: number, baseY: number): { x: number; y: number } {
  const col = index % 5;
  const row = Math.floor(index / 5);
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
  const combinedQueueCount = tokens.filter(t => t.state === 'queuing' || t.state === 'waiting').length;

  // --- Update each token ---
  tokens = tokens.map(token => {
    let t = { ...token, age: token.age + 1 };
    // Accumulate wait time when queuing, at till, or at pickup
    if (t.state === 'queuing' || t.state === 'ordering' || t.state === 'waiting') {
      t.waitTicks = token.waitTicks + 1;
    }

    switch (t.state) {
      case 'entering': {
        t.opacity = Math.min(1, t.opacity + FADE_SPEED * 2);
        if (t.type === 'cnc' || t.type === 'courier') {
          t.state = 'fast_tracking';
          t.stageStart = tick;
        } else {
          t.x = moveToward(t.x, POS.decision.x, TOKEN_SPEED);
          t.y = moveToward(t.y, POS.decision.y, TOKEN_SPEED);
          if (Math.abs(t.x - POS.decision.x) < 2) {
            // Item 10: skip decision animation when combined queue < 3
            if (combinedQueueCount < 3) {
              // Go straight through — no deciding wobble
              const effectiveBounce = computeLinearBounce(combinedQueueCount);
              if (Math.random() < effectiveBounce) {
                t.face = 'sad';
                t.state = 'bouncing';
                t.stageStart = tick;
                lostTicks.push(tick);
              } else {
                t.state = 'queuing';
                t.stageStart = tick;
                t.queueIndex = queueCount;
              }
            } else {
              t.state = 'deciding';
              t.stageStart = tick;
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

        if (decidingTime >= DECIDING_TICKS) {
          if (t.willLeave) {
            t.face = 'sad';
            t.state = 'bouncing';
            t.stageStart = tick;
            lostTicks.push(tick);
          } else {
            t.state = 'queuing';
            t.stageStart = tick;
            t.queueIndex = queueCount;
          }
        }
        break;
      }

      case 'queuing': {
        const qPos = getQueuePosition(t.queueIndex);
        t.x = moveToward(t.x, qPos.x, TOKEN_SPEED);
        t.y = moveToward(t.y, qPos.y, TOKEN_SPEED);

        if (t.queueIndex === 0) {
          const freeLane = tillBusyUntil.findIndex(u => u <= tick);
          if (freeLane >= 0) {
            t.state = 'ordering';
            t.stageStart = tick;
            t.laneIndex = freeLane;
            t.queueIndex = -1;
            t.arrivedAtStage = false;
            // Block till lane for the full cycle time
            tillBusyUntil[freeLane] = tick + rates.tillCycleTime;
          }
        }
        t.face = determineFace(t);
        break;
      }

      case 'ordering': {
        t.x = moveToward(t.x, POS.till.x, TOKEN_SPEED);
        t.y = moveToward(t.y, POS.till.y, TOKEN_SPEED);

        // Only start till timer after arriving at till position
        const atTill = Math.abs(t.x - POS.till.x) < 2 && Math.abs(t.y - POS.till.y) < 2;
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
        const wPos = getWaitingPosition(waitingTokens.length);
        t.x = moveToward(t.x, wPos.x, TOKEN_SPEED);
        t.y = moveToward(t.y, wPos.y, TOKEN_SPEED);

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
        }
        t.face = determineFace(t);
        break;
      }

      case 'fast_tracking': {
        t.opacity = Math.min(1, t.opacity + FADE_SPEED * 2);
        const targetX = POS.waiting.x + 20;
        const targetY = POS.waiting.y - 30;
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
        t.x = moveToward(t.x, POS.exit.x, TOKEN_SPEED * 1.8);
        t.y = moveToward(t.y, POS.exit.y, TOKEN_SPEED * 1.8);
        if (Math.abs(t.x - POS.exit.x) < 5 && Math.abs(t.y - POS.exit.y) < 5) {
          t.opacity -= FADE_SPEED * 4;
          if (t.opacity <= 0) t.state = 'exited';
        }
        break;
      }

      case 'stock_bouncing': {
        t.x = moveToward(t.x, POS.exit.x, TOKEN_SPEED * 1.8);
        t.y = moveToward(t.y, POS.exit.y, TOKEN_SPEED * 1.8);
        if (Math.abs(t.x - POS.exit.x) < 5 && Math.abs(t.y - POS.exit.y) < 5) {
          t.opacity -= FADE_SPEED * 4;
          if (t.opacity <= 0) t.state = 'exited';
        }
        break;
      }

      case 'leaving': {
        // Two-phase: UP from waiting area, then LEFT to exit
        if (t.y > POS.exit.y + 5) {
          t.y = moveToward(t.y, POS.exit.y, TOKEN_SPEED);
          t.x = moveToward(t.x, POS.waiting.x, TOKEN_SPEED * 0.3);
        } else {
          t.x = moveToward(t.x, POS.exit.x, TOKEN_SPEED * 1.2);
          t.y = moveToward(t.y, POS.exit.y, TOKEN_SPEED * 0.3);
        }
        if (Math.abs(t.x - POS.exit.x) < 5 && Math.abs(t.y - POS.exit.y) < 5) {
          t.opacity -= FADE_SPEED * 3;
          if (t.opacity <= 0) t.state = 'exited';
        }
        break;
      }
    }

    return t;
  });

  // --- Reindex queue positions ---
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
  let staffTokens = [...state.staffTokens];
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
      const machinePos = staff.station === 'till2' ? POS.machine2 : POS.machine1;
      const tillPos = staff.station === 'till2' ? POS.tillStation2 : POS.tillStation;

      switch (staff.animState) {
        case 'idle':
          // Wait at till for a customer
          staff.targetX = tillPos.x;
          staff.targetY = sY;
          // Check if any customer is ordering at our lane
          const orderingCustomer = tokens.find(t =>
            t.state === 'ordering' && t.arrivedAtStage
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
          // When customer finishes ordering (transitions to waiting), travel to machine
          const stillOrdering = tokens.some(t => t.state === 'ordering' && t.arrivedAtStage);
          if (!stillOrdering) {
            staff.animState = 'traveling-to-machine';
            staff.animStart = tick;
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
          // Wait for prep duration minus travel time
          if (tick - staff.animStart >= rates.prepTime - ANIM_TRAVEL_TICKS * 2) {
            staff.animState = 'traveling-to-till';
            staff.animStart = tick;
          }
          break;
        case 'traveling-to-till':
          staff.targetX = tillPos.x;
          staff.targetY = sY;
          if (Math.abs(staff.x - tillPos.x) < 3) {
            staff.animState = 'idle';
            staff.animStart = tick;
          }
          break;
      }
    } else if (isTillStaff) {
      // Specialised till person: stays at till
      const tillPos = staff.station === 'till2' ? POS.tillStation2 : POS.tillStation;
      staff.targetX = tillPos.x;
      staff.targetY = sY;
    } else if (isMachineStaff) {
      // Machine person: stays at machine
      const machPos = staff.station === 'machine2' ? POS.machine2 : POS.machine1;
      staff.targetX = machPos.x;
      staff.targetY = sY;
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

    simRef.current.staffTokens = initStaffTokens(newRates.staffConfig);
    simRef.current.tillBusyUntil = new Array(newRates.staffConfig.tillLanes).fill(0);
    simRef.current.prepBusyUntil = new Array(newRates.staffConfig.prepLanes).fill(0);
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
