# Fix RainyDay Café – Detailed game schema

## 1. Purpose

This game is a browser-based teaching tool for introducing **systems thinking** to **Level 4 Operations and Project Management students** through the RainyDay Café case.

It must achieve three learning goals:

1. **Active case engagement.** Force students to read the operational detail and think about it, rather than copy-pasting AI-generated solutions.
2. **Multi-step systemic solutions.** Teach that good operational improvement requires a coherent package of changes, not a single fix.
3. **Systems thinking through consequence visibility.** Show that local fixes can create side effects, bottleneck shifts, and new pressures elsewhere, and that even good solutions sometimes need balancing actions.

The game should be simple enough for Level 4 students to understand quickly, but rigorous enough to expose shallow reasoning and reward better operational thinking.

---

## 2. Case alignment

The game should be grounded in the RainyDay Café brief and the Layer 1 / Layer 2 issue map.

Key points from the case include:
- peak-hour waiting time rose from around 3 minutes to around 8 minutes
- customers report slow service and congestion around the ordering counter
- all sandwich prep and coffee-making happen in one small shared space behind the counter
- customers crowd near the counter
- minimal training leads to ad-hoc processes
- assistants float between espresso, food prep, and counter service
- the morning peak is under-covered, especially 8–9 AM
- the café manager starts at 10 AM, the head barista at 9 AM, and Assistant Barista #1 at 7 AM
- late weekday hours are likely not well aligned to demand
- menu breadth adds complexity and slows the shared prep area
- prep-ahead is weak or absent
- inventory is tracked manually and reactively

### Scope boundary
Base the live game mainly on **Layer 1 and Layer 2** issues.

Do **not** make the playable game about:
- leadership capability failure
- founder governance
- full strategic business redesign
- detailed labour-cost calculations
- advanced strategic layers from Layer 3 / Layer 4

Those can inform the hidden logic, but the playable experience should stay at an accessible operational-systems level.

---

## 3. Core gameplay concept

The player has **5 turns** to improve RainyDay Café.

Each turn:
1. the player selects one unused action
2. the rule engine applies deterministic consequences
3. the visible metrics update
4. the game shows a neutral result panel
5. the player continues to the next turn

The player learns by:
- observing consequences
- comparing runs
- spotting repeated patterns
- building a stronger action package over multiple attempts

The game must **show consequences, not explain answers**.

---

## 4. Key design principles

### 4.1 Deterministic, not random
The same action sequence must always produce the same outcome.

### 4.2 Rule-based, not full simulation
Do **not** simulate the café minute by minute.
Do **not** author every possible sequence manually.

Use a **small rule-based engine**:
- actions set flags
- rules check flags
- visible metrics change
- end-state classification is derived from the resulting state

### 4.3 Internal logic vs visible outcomes
The game must separate:
- internal structural logic
- visible operational outcomes

The player should **not** see internal design variables like "staff coverage" as a tracked metric.

### 4.4 Per-turn text must be observational
Per-turn text should describe what someone standing in the café would see. It must not reveal the correct solution path, diagnose the "real bottleneck" explicitly, or tell the player what to do next. Maximum 2 sentences.

### 4.5 Replay is part of the learning design
The game is meant to be replayed. Failure and near-miss runs are educational.

### 4.6 Case data must be visible during play
A collapsible case data panel must always be one click/tap away, forcing the operational detail into the student's field of view during decision-making.

---

## 5. Turn structure

Each turn has 4 phases.

### 5.1 Action selection
The player chooses one unused action card from the grouped action catalogue.

### 5.2 Rule application
The engine applies:
- the direct flag for the action
- any conditional rules triggered by previously chosen actions
- metric updates

### 5.3 Result display
The game shows:
- action title
- changed outcome metrics with traffic-light indicators and delta arrows
- maximum 2 sentence observational event text
- refreshed system map with animated connection pulses

### 5.4 Continue
The player moves to the next turn.

After turn 5, the game shows the final outcome screen.

---

## 6. Visible outcome metrics

The player-facing metric layer should contain **observable outcomes only**.

### Metric definitions

```ts
type VisibleMetrics = {
  waitingTime: number;         // lower is better internally
  throughput: number;          // higher is better internally
  backlog: number;             // lower is better internally
  congestion: number;          // lower is better internally
  serviceConsistency: number;  // higher is better internally
  stockAvailability: number;   // higher is better internally
  financialResults: number;    // higher is better internally 
  wasteTracker: number;        // lower is better internally
};
```

### Physical Meaning of Each Metric (CRITICAL CONTEXT)
These variables map to exact physical realities in the café operation:

* **Service Speed** (internal: `waitingTime`): Represents the average physical time a customer spends standing and waiting for their order after paying. *(Inverted: higher UI score = wait is shorter).*
* **Orders Completed per Hour** (internal: `throughput`): Represents raw production volume; the total number of orders successfully handed over to customers per hour. *(Higher UI score = more total output).*
* **Order Processing** (internal: `backlog`): Represents the backlog of unmade tickets piling up in the shared prep space. *(Inverted: higher UI score = ticket backlog is smaller).*
* **Queue Flow** (internal: `congestion`): Represents physical crowding and congestion strictly on the **customer side** of the counter (e.g., at the till and waiting area). *(Inverted: higher UI score = space is clearer).*
* **Service Consistency** (internal: `serviceConsistency`): Represents recipe execution, standardisation, and product quality errors by the staff making the food/drinks. *(Higher UI score = fewer mistakes made).*
* **Stock Availability** (internal: `stockAvailability`): Represents raw material availability and supply chain reliability. *(Higher UI score = ingredients are in stock).*
* **Cost Efficiency** (internal: `financialResults`): Represents the financial budget health, balancing the staff wage bill and costs against incoming sales volume. *(Higher UI score = better financial efficiency).*
* **Waste Control** (internal: `wasteTracker`): Represents physical waste of spoiling or unused ingredients at the end of the day. *(Inverted: higher UI score = less food wasted).*

### Display normalisation rule (CRITICAL)

All metrics must be **normalised for display** so that **higher is always better** on the player-facing UI. This removes cognitive load.

For metrics where lower is better internally (waitingTime, backlog, congestion, wasteTracker), the display score should be inverted: `displayScore = 100 - rawValue`. 

The player sees a 0–100 score where 100 is always the best possible physical state, for every metric.

### Traffic-light thresholds
- **Red:** display score 0–44
- **Amber:** display score 45–79
- **Green:** display score 80–100

### Player-facing labels
Use these labels (not the internal variable names):

| Internal key | Player-facing label |
|---|---|
| waitingTime | Service Speed |
| throughput | Orders Completed per Hour |
| backlog | Order Processing |
| congestion | Queue Flow |
| serviceConsistency | Service Consistency |
| stockAvailability | Stock Availability |
| financialResults | Cost Efficiency |
| wasteTracker | Waste Control |

### Per-turn delta display
After each action, show the precise numeric delta appended to the trend indicator:
- ↑ +X Improved (green)
- ↓ -Y Worsened (red)
- — Unchanged (grey dash)

### Recommended starting values (internal, raw)

```ts
const initialVisibleMetrics: VisibleMetrics = {
  waitingTime: 78,         // display: 22 (red)
  throughput: 38,          // display: 38 (red)
  backlog: 70,             // display: 30 (red)
  congestion: 76,          // display: 24 (red)
  serviceConsistency: 42,  // display: 42 (amber)
  stockAvailability: 48,   // display: 48 (amber)
  financialResults: 28,    // display: 28 (red)
  wasteTracker: 82,        // display: 18 (red)
};
```

This creates an initial state where most metrics are red, two are amber, and nothing is green, establishing clear room for improvement.

---

## 7. Hidden rule model

The game should track only a **small set of hidden flags**, not a deep simulation state.

```ts
type ActionFlags = {
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
};
```

### Important note
These are **internal flags only**. The player does not see them directly.

---

## 8. Action catalogue

Use exactly these 20 actions, grouped into 4 categories for the UI.

### Category 1: Staffing & Scheduling
| # | Action | Category |
|---|---|---|
| 2 | Hire temporary staff for morning peak | harmful |
| 7 | Move the café manager earlier | core |
| 8 | Move the head barista earlier | core |
| 9 | Shorten late weekday opening hours | core |
| 14 | Introduce peak-hour task specialisation | core |
| 19 | Launch a Click & Collect app | harmful |

### Category 2: Layout & Equipment
| # | Action | Category |
|---|---|---|
| 1 | Add another till | harmful |
| 10 | Add another coffee machine | core |
| 13 | Create fixed work zones behind the counter | core |
| 16 | Mark a clear queue path | support |
| 17 | Separate the pickup point from the ordering point | support |

### Category 3: Menu & Inventory
| # | Action | Category |
|---|---|---|
| 5 | Expand menu options | harmful |
| 6 | Add self-service pastries near the till | harmful |
| 11 | Simplify the menu | core |
| 12 | Prep popular ingredients before peak | core |
| 18 | Add a basic stock sheet and reorder routine | support |

### Category 4: Process & Promotion
| # | Action | Category |
|---|---|---|
| 3 | Extend weekday opening hours | harmful |
| 4 | Run a discount promotion | harmful |
| 15 | Introduce SOPs for core tasks | support |
| 20 | Introduce a simple peak-hour task board | support |

**Important:** The category labels (Staffing & Scheduling, Layout & Equipment, etc.) must **not** signal which actions are good or bad. Categories are purely for navigation.

---

## 9. Action definitions

Each action should define:
- `id`
- `title`
- `category`: `"harmful" | "core" | "support"`
- `group`: `"staffing" | "layout" | "menu" | "process"`
- `description`: 1–2 sentences referencing specific case data
- `setFlag`
- `baseEffects`
- `conditionalEffects`
- `eventTemplates`

### Action descriptions (case-grounded)

These descriptions must reference specific details from the RainyDay Café brief. They must not signal whether the action is good or bad.

1. **Add another till:** "Install a second till at the counter to handle ordering during busy periods."
2. **Hire temporary staff for morning peak:** "Bring in an extra team member for the 7–10 AM window to add capacity during the busiest hours."
3. **Extend weekday opening hours:** "Keep the café open until 10 PM on weekdays instead of 9 PM to capture more evening trade."
4. **Run a discount promotion:** "Launch a 20% off promotion to attract customers back and boost transaction volume."
5. **Expand menu options:** "Add new sandwich fillings and drink options to broaden the product range and appeal."
6. **Add self-service pastries near the till:** "Place a pastry display next to the till for customers to grab while queuing."
7. **Move the café manager earlier:** "The café manager currently starts at 10 AM. Move them to start at 8 AM to provide leadership during the morning peak."
8. **Move the head barista earlier:** "The head barista currently starts at 9 AM, an hour after the café opens. Move them to start at 7 AM alongside Assistant Barista #1."
9. **Shorten late weekday opening hours:** "The café currently stays open until 9 PM on weekdays. Close at 7 PM instead and reallocate the saved hours and cost."
10. **Add another coffee machine:** "Install a second espresso machine to increase drink preparation capacity in the shared workspace."
11. **Simplify the menu:** "Reduce the range of sandwich fillings, drink variations, and snack options to focus on the most popular items."
12. **Prep popular ingredients before peak:** "Pre-portion and partially prepare the most commonly ordered sandwich fillings and snack items before the morning rush begins."
13. **Create fixed work zones behind the counter:** "Divide the shared prep space into defined zones: a coffee station, a food assembly area, and a service/till area."
14. **Introduce peak-hour task specialisation:** "Instead of floating between all tasks, assign each staff member a fixed role during peak hours: one on till, one on coffee, one on food."
15. **Introduce SOPs for core tasks:** "Write and post simple step-by-step procedures for the most common drink and food orders so that every team member follows the same sequence."
16. **Mark a clear queue path:** "Use floor markings or barriers to create a visible queue line that separates waiting customers from the counter area."
17. **Separate the pickup point from the ordering point:** "Move the collection point to the other end of the counter so that customers picking up orders do not block those still queuing."
18. **Add a basic stock sheet and reorder routine:** "Introduce a simple daily checklist for ingredient levels and a fixed reorder schedule tied to delivery days."
19. **Launch a Click & Collect app:** "Introduce a mobile ordering app to let customers purchase coffee ahead of time and skip the till queue."
20. **Introduce a simple peak-hour task board:** "Put a whiteboard or printed sheet behind the counter showing who does what during each hour of the morning peak."

---

## 10. Internal action logic

Below is the design intent for each action. Effects are indicative and should be implemented consistently through the rule engine.

### 10.1 Harmful / dead-end actions

#### 1. Add another till
**Intent:** teach that installing capacity in the wrong place can be useless or harmful.

**Base effects:**
- budgetPressure worsens slightly
- congestion worsens slightly
- no meaningful immediate throughput gain

**Critical rule:**
The second till can only function if someone is available to operate it. Check:

```ts
const secondTillCanActuallyRun =
  flags.tempStaffAdded ||
  flags.rotaRedesigned ||
  (flags.managerMovedEarlier && flags.headBaristaMovedEarlier);
```

If `secondTillCanActuallyRun === false`:
- throughput unchanged
- waitingTime unchanged
- backlog unchanged

If `secondTillCanActuallyRun === true` but preparation-side improvements are still weak:
- throughput improves slightly
- backlog worsens materially
- waitingTime worsens
- congestion worsens

**Full-win rule:** never part of a full-win route.

#### 2. Hire temporary staff for morning peak
**Intent:** teach that extra labour can be a shallow and costly response when the real issue is better scheduling and structural redesign.

**Base effects:**
- budgetPressure worsens clearly
- serviceConsistency may worsen slightly unless SOP / task structure is already stronger

**Conditional effects:**
- if `extraTillInstalled == true`, this can activate the second till and create the harmful downstream effects described above
- if `rotaRedesigned == false` and `lateHoursShortened == false`, keep the action financially inefficient

**Full-win rule:** never part of a full-win route.

#### 3. Extend weekday opening hours
**Base effects:**
- financialResults worsens (-15)
- serviceConsistency worsens (-5)
- waitingTime unchanged
- throughput unchanged

#### 4. Run a discount promotion
**Base effects:**
- backlog worsens
- congestion worsens
- waitingTime worsens
- financialResults worsens slightly (-5)

**Conditional effects:**
- If `workZonesCreated` OR `extraCoffeeMachineInstalled` OR `menuSimplified` are true (system capacity scaled):
  - throughput improves significantly
  - financialResults improves significantly (+15)

#### 5. Expand menu options
**Base effects:**
- serviceConsistency worsens
- throughput worsens
- backlog worsens
- stockAvailability worsens
- waitingTime worsens
- financialResults worsens (-10)

#### 6. Add self-service pastries near the till
**Base effects:**
- congestion worsens slightly
- stockAvailability worsens slightly
- throughput worsens (-5)
- waitingTime worsens (+5)

#### 19. Launch a Click & Collect app (Trap)
**Intent:** Teach that layering digital demand over broken operational flow destroys the physical business.
**Base effects:**
- congestion improves initially as people wait outside (-10)
- backlog cascades instantly (+15)
- waitingTime worsens (+10)
- serviceConsistency plummets (-20)

---

### 10.2 Core structural actions

#### 7. Move the café manager earlier
**Base effects:**
- serviceConsistency improves
- congestion improves slightly
- waitingTime improves slightly

**Conditional effects:**
- stronger if combined with `rotaRedesigned`
- stronger if combined with `headBaristaMovedEarlier`
- if `lateHoursShortened == false`, the improvement comes with some continuing budget / schedule strain

#### 8. Move the head barista earlier
**Base effects:**
- throughput improves
- waitingTime improves
- serviceConsistency improves
- backlog improves

**Conditional effects:**
- stronger if combined with `rotaRedesigned`
- stronger if combined with `prepAheadEnabled`
- stronger if combined with `menuSimplified`

#### 9. Shorten late weekday opening hours
**Base effects:**
- budgetPressure improves
- slight neutral-to-positive knock-on effect on later actions involving staffing redesign

**Conditional effects:**
- significantly strengthens `managerMovedEarlier`, `headBaristaMovedEarlier`, and `rotaRedesigned`
- should help make stronger system redesign financially coherent

#### 10. Add another coffee machine
**Base effects:**
- throughput improves
- backlog improves
- waitingTime improves
- congestion may improve slightly or stay flat depending on layout

**Conditional effects:**
- stronger if combined with `menuSimplified`
- stronger if combined with `prepAheadEnabled`
- weaker if layout / zoning are still poor

#### 11. Simplify the menu
**Base effects:**
- throughput improves
- backlog improves
- serviceConsistency improves
- stockAvailability improves
- waitingTime improves

**Conditional effects:**
- significantly strengthens `extraCoffeeMachineInstalled`
- significantly strengthens `prepAheadEnabled`
- reduces the damage of some otherwise bad runs, but should not rescue clearly dead-end chains on its own

#### 12. Prep popular ingredients before peak
**Base effects:**
- throughput improves
- backlog improves
- waitingTime improves slightly
- serviceConsistency improves slightly

**Conditional effects:**
- stronger if combined with `menuSimplified`
- stronger if combined with `headBaristaMovedEarlier`

#### 13. Create fixed work zones behind the counter
**Base effects:**
- congestion improves
- serviceConsistency improves
- throughput improves slightly

**Conditional effects:**
- stronger if combined with `peakTaskSpecialisation`
- stronger if combined with `extraCoffeeMachineInstalled`

#### 14. Introduce peak-hour task specialisation
**Base effects:**
- throughput improves
- serviceConsistency improves
- congestion improves slightly

**Conditional effects:**
- Action is only effective if there are 2+ staff members present at peak (`headBaristaMovedEarlier`). If standard 1 barista is on shift, task specialisation is impossible.
- stronger if combined with `sopsEnabled`
- stronger if combined with `workZonesCreated`

#### 19. Use hourly sales data to redesign the rota
**Base effects:**
- waitingTime improves
- throughput improves
- budgetPressure improves slightly
- serviceConsistency improves slightly

**Conditional effects:**
- strongly strengthens `managerMovedEarlier`
- strongly strengthens `headBaristaMovedEarlier`
- strongly strengthens `lateHoursShortened`
- should act as one of the key unlocker actions for full-win paths

---

### 10.3 Supporting / stabilising actions

#### 15. Introduce SOPs for core tasks
**Base effects:**
- serviceConsistency improves
- throughput improves slightly

**Conditional effects:**
- stronger with `peakTaskSpecialisation`
- stronger with `workZonesCreated`

#### 16. Mark a clear queue path
**Base effects:**
- congestion improves
- waitingTime improves slightly

**Conditional effects:**
- stronger with `pickupSeparated`

#### 17. Separate the pickup point from the ordering point
**Base effects:**
- congestion improves
- waitingTime improves slightly

**Conditional effects:**
- stronger with `queuePathMarked`

#### 18. Add a basic stock sheet and reorder routine
**Base effects:**
- stockAvailability improves
- serviceConsistency improves slightly

**Conditional effects:**
- stronger with `menuSimplified`

#### 20. Introduce a simple peak-hour task board
**Base effects:**
- serviceConsistency improves slightly
- throughput improves slightly

**Conditional effects:**
- stronger with `sopsEnabled`
- stronger with `peakTaskSpecialisation`

---

## 11. System map specification

### 11.1 Map nodes

The system map must display 6 nodes:

| Node | Represents | Driven by metrics |
|---|---|---|
| Order Point | Front counter, till, queue | waitingTime, congestion |
| Preparation | Shared prep space, food assembly | throughput, backlog |
| Staff Efficiency | Who is present, when, how allocated | serviceConsistency, throughput |
| Inventory & Supply | Raw material availability, supply chain | stockAvailability |
| Product & Quality | Recipe execution, standardisation | serviceConsistency, stockAvailability |
| Financials | Costs, sales volume, waste | financialResults, throughput, waitingTime |

### 11.2 Map connections

Draw explicit SVG directional lines. Forward lines are purely operational causality. Inverse lines are backward-flowing stress/panic loops (shown in different colours and bounding geometries to prevent overlap).

```
// Core Flow
Staff Efficiency ➔ Order Point
Staff Efficiency ➔ Preparation
Inventory & Supply ➔ Preparation
Product & Quality ➔ Preparation
Order Point ➔ Preparation

// Secondary Links
Inventory & Supply ➔ Product & Quality
Product & Quality ➔ Order Point

// Financials
Order Point ➔ Financials
Preparation ➔ Financials
Staff Efficiency ➔ Financials
Inventory & Supply ➔ Financials
```

### 11.3 Node health derivation

Each node's health = average of its driving metric display scores.

Example: Order Point health = average of (100 - waitingTime, 100 - congestion).

### 11.4 Visual update behaviour

After each turn:
- nodes change colour based on their health: red (0–39), amber (40–69), green (70+)
- connections between affected nodes pulse briefly (300ms glow animation)
- nodes that worsened: subtle shake animation (200ms)
- nodes that improved: brief green glow (400ms)
- all animations should be subtle, not distracting

---

## 12. Player-facing result text rules

### 12.1 Do not reveal the answer
Per-turn text must not say things like:
- "the real bottleneck is…"
- "you solved the symptom not the cause"
- "you should now…"
- "this is a bad systems-thinking move because…"

### 12.2 Write as observation, not diagnosis
Per-turn text should describe what someone standing in the café would observe. Maximum 2 sentences.

### 12.3 Example style

**Good:**
"A second till is now in place at the counter. During the morning rush, it sat mostly unused and the area felt more cramped."

**Good:**
"The head barista now starts alongside Assistant Barista #1 at 7 AM. During the morning peak, drinks came out noticeably faster and the queue moved more steadily."

**Bad:**
"You invested in the wrong place because the real bottleneck is production."

**Bad:**
"This doesn't address the root cause, which is scheduling misalignment."

---

## 13. Suggested metric delta format

```ts
type DeltaStatus = "improved" | "worsened" | "unchanged";

type MetricDeltaView = {
  key: keyof VisibleMetrics;
  label: string;
  displayBefore: number;  // normalised 0-100, higher = better
  displayAfter: number;   // normalised 0-100, higher = better
  status: DeltaStatus;
};
```

---

## 14. Rule engine structure

Recommended engine modules:

```ts
engine/
  applyAction.ts
  applyBaseEffects.ts
  applyConditionalRules.ts
  normaliseForDisplay.ts
  generateTurnEventText.ts
  evaluateRun.ts
  deriveNodeHealth.ts
```

Recommended central game state:

```ts
type GameState = {
  turn: number;
  actionsTaken: string[];
  flags: ActionFlags;
  metrics: VisibleMetrics;
  history: TurnRecord[];
};
```

Recommended turn record:

```ts
type TurnRecord = {
  turn: number;
  actionId: string;
  before: VisibleMetrics;
  after: VisibleMetrics;
  deltas: MetricDeltaView[];
  eventText: string;
};
```

---

## 15. Outcome categories

After turn 5, classify the run using the two-pass evaluator.

### Pass 1: Harmful action cap

| Harmful actions used | Maximum possible outcome |
|---|---|
| 0 | Full win |
| 1 | Strong improvement |
| 2 | Near miss |
| 3+ | Dead-end |

### Pass 2: Metric threshold classification

Within the cap from Pass 1:

#### Collapse
The system became clearly worse overall. Multiple metrics in red. Typical profile: waitingTime, backlog, congestion, and budgetPressure all remain very poor or worsened.

#### Dead-end
The player pursued structurally weak actions. Some local improvements but core pressures remain. Budget pressure typically too high.

#### Near miss
Meaningful improvement achieved, but at least one major system pressure unresolved. Typical: strong flow improvement but demand/rota/cost alignment not fully corrected.

#### Strong improvement
Most major issues improved. One important trade-off or structural gap remains.

#### Full win
A coherent package that improves flow, capacity alignment, and cost logic together without leaving major unresolved damage.

### Full-win requirements
A full win should usually include most of these qualities:
- demand-aligned staffing / rota logic improved
- experienced support moved into the true peak period
- weak late hours reduced or otherwise balanced
- menu complexity reduced or prep / fulfilment made materially faster
- no severe unresolved backlog
- no severe unresolved budget damage

There should be **multiple full-win paths**, not just one.

---

## 16. Validation test cases

Implement as deterministic test cases.

### Test case A – dead-end chain
1. Add another till
2. Hire temporary staff for morning peak
3. Run a discount promotion
4. Expand menu options
5. Add self-service pastries near the till

Expected: Collapse or Dead-end

### Test case B – dead-end staffing cost path
1. Hire temporary staff for morning peak
2. Extend weekday opening hours
3. Run a discount promotion
4. Introduce SOPs for core tasks
5. Mark a clear queue path

Expected: Dead-end

### Test case C – near miss
1. Move the head barista earlier
2. Add another coffee machine
3. Prep popular ingredients before peak
4. Create fixed work zones behind the counter
5. Introduce SOPs for core tasks

Expected: Near miss or Strong improvement

### Test case D – full win
1. Use hourly sales data to redesign the rota
2. Move the café manager earlier
3. Move the head barista earlier
4. Shorten late weekday opening hours
5. Simplify the menu

Expected: Full win

### Test case E – alternative full win
1. Use hourly sales data to redesign the rota
2. Move the head barista earlier
3. Add another coffee machine
4. Prep popular ingredients before peak
5. Shorten late weekday opening hours

Expected: Full win

---

## 17. Final reflection text rules

The end screen may include conceptual reflection.

### Allowed
- "Your choices improved some local conditions, but pressure shifted elsewhere in the café."
- "The result suggests that improving one part of a system without balancing related parts can create new operational pressure."
- "Stronger outcomes usually come from coordinated changes across staffing, fulfilment, complexity, and cost."

### Not allowed
- "The correct answer was…"
- "You should have chosen these five actions…"
- step-by-step solution reveal

---

## 18. Summary

Build the game as:
- 20 actions grouped into 4 navigable categories
- 5 turns
- deterministic
- replayable
- rule-based
- grounded in the RainyDay case
- focused on Layer 1 / Layer 2 operational logic
- case data panel visible during play
- system map with animated updates
- normalised metrics (higher always = better) with traffic lights
- careful not to expose internal diagnosis during play
- two-pass outcome evaluator
- strong enough to distinguish dead-end, near-miss, and full-win thinking
