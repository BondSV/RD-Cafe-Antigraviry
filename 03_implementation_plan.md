# Fix RainyDay Café – Implementation plan

## 1. Build goal

Create a front-end-only, browser-based, turn-based educational game based on the RainyDay Café case.

The game should help Level 4 students learn that:
- operational systems are interconnected
- shallow local fixes can create wider side effects
- some bad actions create dead-end chains
- good solutions are often multi-step and systemic
- the best results come from coherent packages of changes, not isolated fixes

Use the RainyDay Café brief and Layer 1 / Layer 2 issue map as the design foundation.

---

## 2. Final design decisions to preserve

Do **not** drift away from these during implementation.

### 2.1 20 actions, 5 turns
- 20 available actions in 4 grouped categories
- 5 turns maximum
- each action usable once
- deterministic outcomes only

### 2.2 Outcome metrics only on the player side
Do **not** show internal logic flags. The player should only see observable outcomes:
- Customer Waiting Time
- Orders Completed / Hour
- Order Backlog
- Counter Congestion
- Service Consistency
- Stock Availability
- Budget Pressure

All displayed as normalised 0–100 scores where **higher is always better**.

### 2.3 No explicit teaching message after each turn
Per-turn feedback should be:
- neutral
- observational (what someone standing in the café would see)
- maximum 2 sentences
- non-prescriptive

### 2.4 Separate internal logic from visible text
The game needs:
- internal rule logic (flags, conditions)
- student-facing event text (observations)

Those must be separate layers.

### 2.5 "Add another till" is a deliberately bad action
- does not immediately increase throughput (no one to operate it)
- only later combinations may activate it
- even then it should still tend to worsen the system
- never part of a full-win path

### 2.6 "Hire temporary staff" is also a poor action
- may create limited local relief
- worsens budget pressure
- inferior to better rota and scheduling redesign
- never part of a full-win path

### 2.7 Two-pass outcome evaluator
- Pass 1: cap maximum outcome based on number of harmful actions used
- Pass 2: score final metrics against thresholds within the cap

### 2.8 Case data panel must be present
A collapsible panel showing key operational data from the brief must be accessible at all times during play.

### 2.9 System map must update visually
A 6-node system map with connections must animate after each turn to show where changes propagated.

---

## 3. Tech stack

### Required
- React 18+
- TypeScript
- Vite
- Tailwind CSS 3+

### Recommended
- Zustand for state management
- Lucide React for icons
- CSS transitions and `@keyframes` for all animations

### Avoid
- no backend, no auth, no database
- no randomness, no multiplayer
- no Framer Motion (use CSS animations instead)
- no complex charting library
- no external animation library

### Persistence
Use `localStorage` wrapped in a try-catch with in-memory fallback:

```ts
function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); }
  catch { /* silently fail, use in-memory state */ }
}
```

Persist:
- current run state
- previous action history
- best achieved outcome
- number of attempts

### Deployment target
Vercel Hobby (free tier) via Git push. Ensure Vite config outputs to `dist/` which Vercel auto-detects.

---

## 4. Architecture

Use a light rule engine, not a deep simulation and not a giant decision tree.

```text
src/
  app/
    App.tsx
  components/
    layout/
      GameLayout.tsx
      MobileDrawer.tsx
    intro/
      IntroScreen.tsx
    game/
      TurnHeader.tsx
      ActionGrid.tsx
      ActionCard.tsx
      ActionCategoryAccordion.tsx
      MetricPanel.tsx
      MetricRow.tsx
      SystemMap.tsx
      SystemMapNode.tsx
      SystemMapConnection.tsx
      CaseDataPanel.tsx
      ResultPanel.tsx
      MetricDeltaList.tsx
    summary/
      FinalSummary.tsx
      OutcomeBadge.tsx
      ActionTimeline.tsx
  data/
    actions.ts
    initialMetrics.ts
    labels.ts
    nodeMap.ts
    caseData.ts
  engine/
    applyAction.ts
    applyBaseEffects.ts
    applyConditionalRules.ts
    normaliseForDisplay.ts
    generateTurnEventText.ts
    evaluateRun.ts
    deriveNodeHealth.ts
    getMetricDeltaStatus.ts
  store/
    useGameStore.ts
  types/
    game.ts
  utils/
    clamp.ts
    storage.ts
```

### Architecture rules
- `data/` = static action config, labels, case information
- `engine/` = all pure functions, no side effects, no React
- `store/` = session state only (Zustand)
- `components/` = rendering only, no business logic
- `app/` = page composition and routing between screens

---

## 5. Product flow

### 5.1 Intro screen
Show:
- title and café illustration/visual
- short RainyDay Café setup paragraph
- short objective summary
- instruction: "You have 5 moves to improve the café."
- warning: "Some obvious fixes create new problems elsewhere."
- start button

### 5.2 Main game screen
Show:
- turn counter (top bar)
- action cards grouped in 4 accordion categories
- system map (6 nodes with connections)
- current visible metrics (7 metrics, traffic-light display)
- case data panel (collapsible sidebar on desktop, drawer on mobile)
- short objective reminder

Do **not** show explicit bottleneck diagnosis text.

### 5.3 Turn result screen
After every action:
- disable other actions
- show metric changes with traffic-light indicators and delta arrows
- show max 2 sentence observational event text
- show updated system map with animated connection pulses
- show continue button

No "lesson" box during play.

### 5.4 Final summary screen
After turn 5:
- outcome badge: Collapse / Dead-end / Near miss / Strong improvement / Full win
- chosen action sequence as a visual timeline
- final metrics with traffic lights
- conceptual reflection (not an answer key)
- restart button

---

## 6. Internal model strategy

Use **three layers**:

### 6.1 Player action layer
Stores the chosen action sequence.

### 6.2 Hidden rule layer
Stores lightweight flags describing which structural changes have been made.

### 6.3 Visible outcome layer
Stores only the normalised outcome metrics shown to the student.

---

## 7. Types

Create `types/game.ts` first.

```ts
export type VisibleMetrics = {
  waitingTime: number;
  throughput: number;
  backlog: number;
  congestion: number;
  serviceConsistency: number;
  stockAvailability: number;
  budgetPressure: number;
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
  rotaRedesigned: boolean;
  peakTaskBoardEnabled: boolean;
};

export type DeltaStatus = "improved" | "worsened" | "unchanged";

export type MetricDeltaView = {
  key: keyof VisibleMetrics;
  label: string;
  displayBefore: number;
  displayAfter: number;
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

export type ActionGroup = "staffing" | "layout" | "menu" | "process";

export type ActionConfig = {
  id: string;
  title: string;
  category: "harmful" | "core" | "support";
  group: ActionGroup;
  description: string;
  setFlag: keyof ActionFlags;
  baseEffects: Partial<VisibleMetrics>;
};

export type SystemMapNode = {
  id: string;
  label: string;
  drivingMetrics: (keyof VisibleMetrics)[];
  x: number;
  y: number;
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
  history: TurnRecord[];
  outcome?: OutcomeCategory;
};
```

---

## 8. Initial data files

### `data/initialMetrics.ts`

```ts
import { VisibleMetrics } from '../types/game';

export const initialMetrics: VisibleMetrics = {
  waitingTime: 78,
  throughput: 38,
  backlog: 70,
  congestion: 76,
  serviceConsistency: 42,
  stockAvailability: 48,
  budgetPressure: 72,
};
```

### `data/caseData.ts`

```ts
export const caseData = {
  staffRoster: [
    { role: 'Café Manager', schedule: 'Mon–Fri', hours: '10 AM – 6 PM', type: 'Full-time' },
    { role: 'Head Barista', schedule: 'Mon–Fri', hours: '9 AM – 5 PM', type: 'Full-time' },
    { role: 'Assistant Barista #1', schedule: 'Mon–Fri', hours: '7 AM – 3 PM', type: 'Full-time' },
    { role: 'Assistant Barista #2', schedule: 'Mon–Fri', hours: '1 PM – 9 PM', type: 'Full-time' },
    { role: 'Assistant Barista #3', schedule: 'Sat–Sun', hours: '10 AM – 6 PM', type: 'Part-time' },
  ],
  operatingHours: {
    weekdays: '7 AM – 9 PM',
    weekends: '10 AM – 6 PM',
  },
  footfall: { weekdays: '~350', weekends: '~100' },
  transactions: { weekdays: '~150', weekends: '~80' },
  averageTransaction: '£6.30',
  prepSpace: 'All food preparation and coffee-making happen in one small shared area behind the counter.',
  keyComplaints: [
    'Slow service and long queues',
    'Congestion around the counter',
    'Occasional stockouts of popular fillings',
    'Pastries not always fresh',
  ],
  positives: [
    'Friendly, approachable staff',
    'Good-quality coffee',
  ],
};
```

### `data/nodeMap.ts`

```ts
import { SystemMapNode, SystemMapConnection } from '../types/game';

export const systemNodes: SystemMapNode[] = [
  { id: 'orderPoint',    label: 'Order Point',    drivingMetrics: ['waitingTime', 'congestion'],         x: 50, y: 15 },
  { id: 'preparation',   label: 'Preparation',    drivingMetrics: ['throughput', 'backlog'],              x: 80, y: 40 },
  { id: 'customerFlow',  label: 'Customer Flow',  drivingMetrics: ['congestion', 'waitingTime'],         x: 20, y: 40 },
  { id: 'staffing',      label: 'Staffing',       drivingMetrics: ['serviceConsistency', 'throughput'],  x: 50, y: 55 },
  { id: 'menuStock',     label: 'Menu & Stock',   drivingMetrics: ['stockAvailability', 'serviceConsistency'], x: 80, y: 75 },
  { id: 'costs',         label: 'Costs',          drivingMetrics: ['budgetPressure'],                    x: 20, y: 75 },
];

export const systemConnections: SystemMapConnection[] = [
  { from: 'orderPoint',   to: 'preparation' },
  { from: 'orderPoint',   to: 'customerFlow' },
  { from: 'orderPoint',   to: 'costs' },
  { from: 'preparation',  to: 'staffing' },
  { from: 'preparation',  to: 'menuStock' },
  { from: 'staffing',     to: 'costs' },
  { from: 'menuStock',    to: 'costs' },
  { from: 'customerFlow', to: 'staffing' },
];
```

### `data/actions.ts`
Define all 20 actions with:
- id, title, category, group, flag, description, baseEffects

Use the exact descriptions from the game schema document (section 9). Do not put conditional logic in the action objects. Keep action metadata here and put conditional logic inside the engine.

---

## 9. Engine implementation order

### Step 1 – types and basic store
Create the Zustand store with:
- current turn
- current metrics
- flags
- actions taken
- turn history
- reset action
- apply action wrapper

### Step 2 – metric normalisation
Create `normaliseForDisplay.ts`:

```ts
const LOWER_IS_BETTER: (keyof VisibleMetrics)[] = [
  'waitingTime', 'backlog', 'congestion', 'budgetPressure'
];

export function normaliseForDisplay(
  key: keyof VisibleMetrics,
  rawValue: number
): number {
  if (LOWER_IS_BETTER.includes(key)) {
    return 100 - rawValue;
  }
  return rawValue;
}
```

### Step 3 – delta helper
Create `getMetricDeltaStatus.ts`:

```ts
export function getMetricDeltaStatus(
  key: keyof VisibleMetrics,
  displayBefore: number,
  displayAfter: number
): DeltaStatus {
  if (displayAfter > displayBefore) return 'improved';
  if (displayAfter < displayBefore) return 'worsened';
  return 'unchanged';
}
```

### Step 4 – base effect engine
Create `applyBaseEffects.ts`. Receives current metrics and action config, returns updated metrics.

### Step 5 – conditional rule engine
Create `applyConditionalRules.ts`. Reads flags and the selected action, applies additional deterministic consequences. This is the most important module. See the game schema (section 10) for detailed conditional logic.

### Step 6 – node health derivation
Create `deriveNodeHealth.ts`:

```ts
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
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
```

### Step 7 – event text generator
Create `generateTurnEventText.ts`. See the schema (sections 11–12) for writing rules. Maximum 2 sentences per turn. Observational style, not diagnostic.

### Step 8 – outcome evaluator
Create `evaluateRun.ts` with two-pass logic:

```ts
export function evaluateRun(
  actionsTaken: string[],
  actions: ActionConfig[],
  finalMetrics: VisibleMetrics
): OutcomeCategory {
  // Pass 1: count harmful actions
  const harmfulCount = actionsTaken.filter(id => {
    const action = actions.find(a => a.id === id);
    return action?.category === 'harmful';
  }).length;

  let cap: OutcomeCategory;
  if (harmfulCount >= 3) cap = 'dead-end';
  else if (harmfulCount >= 2) cap = 'near-miss';
  else if (harmfulCount >= 1) cap = 'strong-improvement';
  else cap = 'full-win';

  // Pass 2: evaluate metrics against thresholds
  // ... (see game schema section 15 for threshold logic)

  // Return the lesser of the cap and the metric-derived outcome
}
```

---

## 10. Conditional logic reference

See `02_game_schema.md` section 10 for full conditional logic. Key rules to implement:

### Second till activation
```ts
const secondTillCanRun =
  flags.tempStaffAdded ||
  flags.rotaRedesigned ||
  (flags.managerMovedEarlier && flags.headBaristaMovedEarlier);

const prepSideImproved =
  flags.extraCoffeeMachineInstalled ||
  flags.menuSimplified ||
  flags.prepAheadEnabled ||
  flags.workZonesCreated ||
  flags.peakTaskSpecialisation;
```

### Rota + shift synergies
`rotaRedesigned` + `managerMovedEarlier` + `headBaristaMovedEarlier` + `lateHoursShortened` should create the strongest positive synergies in the game.

### Fulfilment-side synergies
`extraCoffeeMachineInstalled` + `menuSimplified` + `prepAheadEnabled` should create strong throughput gains.

### Support action amplification
SOPs, task board, queue path, and pickup separation should help good strategies work better but should not rescue clearly harmful strategies.

---

## 11. UI implementation

See `04_ui_ux_spec.md` for complete visual design specifications, including typography, colours, layout, animations, responsive breakpoints, and component-level styling rules.

---

## 12. Validation tests

Create deterministic tests for the 5 test cases defined in the game schema (section 16). Each test should:
- set up an initial game state
- apply the 5 actions in sequence
- assert the final outcome category
- assert the direction of key metrics

---

## 13. Implementation sequence

### Phase 1 – Foundation
- scaffold Vite + React + TypeScript + Tailwind project
- define types
- define actions data
- define case data
- define node map
- create Zustand store
- build basic app shell and layout

### Phase 2 – Engine
- implement metric normalisation
- implement base effects
- implement conditional rules
- implement metric delta logic
- implement node health derivation
- implement event text generator
- implement two-pass outcome evaluator
- write validation tests for all 5 test cases

### Phase 3 – UI
- build intro screen
- build action cards with category accordion
- build metric panel with traffic lights
- build system map with nodes and connections
- build case data panel (collapsible sidebar / drawer)
- build result panel
- build final summary screen
- build action timeline for summary

### Phase 4 – Polish
- add CSS animations (node glow, shake, connection pulse)
- add responsive layout (desktop / tablet / phone breakpoints)
- add localStorage persistence with fallback
- balance numeric effects across all 20 actions
- refine event text for all action combinations
- test on mobile devices
- deploy to Vercel

---

## 14. Final reminder

Do **not** overbuild this.

This is not a restaurant simulator.
It is an educational systems-thinking game.

Optimise for:
- clarity
- deterministic logic
- strong replay value
- visual polish (see UI/UX spec)
- easy future tweaking by a lecturer (action effects and event text in clear data files)
- mobile-first responsive design

Preserve the agreed pedagogic logic:
- 20 actions in 4 groups
- 5 turns
- observable outcome metrics only (normalised, traffic-light)
- observational per-turn text (max 2 sentences)
- hidden rule engine
- visual system map with animated updates
- case data panel always accessible
- two-pass outcome evaluator
- dead-end chains, near misses, and multiple full-win paths
