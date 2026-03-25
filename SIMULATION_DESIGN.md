# Customer Flow Simulation — Design Brief

This document captures the design thinking for a new animated customer journey panel to be added to the central section of the RainyDay Café systems thinking game. It is intended as a handoff for a new session with full context.

---

## What the simulation is

An animated strip placed below the existing system map and above the metric panel. It shows customer tokens (small circles with emoji-style faces) flowing left-to-right through the stages of a café visit:

```
[Arriving] → [Queuing to order] → [Placing order] → [Waiting for drink] → [Leaving]
```

All stage labels use strictly customer-perspective language — no process language like "coffee prep" or "throughput." The customer doesn't know about throughput; they know they are waiting.

The simulation runs continuously. The speed, queue depths, and customer satisfaction are all driven by the current game metrics. When a student plays a card that improves the system, they watch the simulation respond: queues drain, faces improve, tokens flow faster.

---

## Customer token design

- Small circle (~14px)
- Simple SVG face inside: two dot eyes + curved mouth line
- Three face states:
  - 😊 Happy (green fill) — arrived recently, system treating them well
  - 😐 Neutral (amber fill) — been waiting a while
  - 😟 Sad (red fill) — waited too long, or something went wrong
- On exit, token displays final face for ~1.5s then fades out

---

## Stage descriptions and metric mapping

This is the most critical section. Each stage's behaviour must be driven by the correct metrics.

### Stage 1: Arriving
**What it represents:** Customers entering the café and approaching the counter area.

**Drivers:**
- Base spawn rate: a fixed constant representing normal weekday footfall (~1 customer every 2–3 seconds in simulation time, scaled for visual clarity — not literally 1 per real second)
- `congestion` (lower is better after normalisation): high congestion reduces effective arrival rate into the system — not fewer customers arriving outside, but fewer being able to flow in smoothly. Congestion reflects counter crowding and physical flow disruption. When congestion is very high, new arrivals effectively join a chaotic entry zone.
- Demand-boosting cards (discount promotion, social media campaign, delivery app): these increase the spawn rate, adding more tokens. Represented by checking the relevant flags from game state, or simply by reading a derived "demand multiplier" from the metrics. The `financialResults` metric partially captures this — but a direct flag check is more reliable.

**Open question:** Should the simulation expose a "demand level" as a visible indicator, or just show it implicitly through the volume of tokens appearing? Suggestion: implicit — more tokens appearing is self-evident.

---

### Stage 2: Queuing to order
**What it represents:** Customers physically waiting in line to reach the till and place their order.

**Drivers:**
- Queue depth (how many tokens pile up here) is driven by the mismatch between arrival rate and ordering speed. In game metric terms:
  - `congestion` (lower is better): the primary driver. High congestion means the queue moves slowly and backs up. Congestion in the game represents physical crowding and flow disruption at the counter area — exactly what causes the ordering queue to build.
  - `waitingTime` (lower is better): overall perceived wait time includes time in this queue. But `waitingTime` is a lagging composite — it's better used for face threshold than queue depth.
- **NOT `backlog`**: backlog represents orders already placed and not yet fulfilled (drinks in preparation). It does not affect the physical ordering queue.

**Visual behaviour:**
- When congestion is high: many tokens stacked here, tokens in the stack age and start turning amber/red
- When congestion is low: queue is short, tokens pass through quickly
- Queue depth = f(congestion) — a simple mapping from the 0-100 congestion metric to a token count (e.g. congestion 80 → 6–8 tokens stacked, congestion 20 → 0–2 tokens)

---

### Stage 3: Placing order (at the till)
**What it represents:** The customer is at the till, ordering. The speed of this stage is how fast a single till interaction takes.

**Drivers:**
- `waitingTime` (lower is better): determines processing speed at the till. Lower wait time = faster till interactions. This is the most appropriate metric here because till speed directly affects the customer's perceived waiting experience.
- Secondary: `serviceConsistency` — inconsistent service means orders take longer to communicate/process. Could add a small modifier: low consistency = slightly slower till processing.
- **NOT `throughput`**: throughput measures drink output at the coffee machine, not till speed.

**Visual behaviour:**
- One token processed at a time at the till
- Processing speed (time a token spends here) scales inversely with `waitingTime` metric value
- High waitingTime → token sits at till for longer → queue behind it grows

---

### Stage 4: Waiting for drink
**What it represents:** Customer has ordered, stepped aside, is waiting for their drink to be prepared.

**Drivers:**
- Queue depth here is driven by `backlog` — this is exactly what backlog represents: orders placed but not yet fulfilled. High backlog = many tokens stacked here waiting.
- Processing speed (how fast tokens clear this stage) is driven by `throughput` — orders completed per hour. Higher throughput = tokens exit this stage faster.
- Secondary: `stockAvailability` — if stock is low, some orders cannot be fulfilled immediately, extending wait. Low stock = slightly slower processing here.

**Visual behaviour:**
- When backlog is high and throughput is low: this stage is the most crowded area — the visible bottleneck
- When throughput improves (e.g. extra coffee machine played): tokens start clearing faster, the stack visibly drains
- This is the most important stage for teaching the bottleneck concept

---

### Stage 5: Leaving
**What it represents:** Customer collects their order and exits.

**Face at exit — this is the emotional payoff:**

The exit face is NOT just about speed. Multiple factors determine whether a customer leaves happy:

1. **Time spent in system** (stages 2+3+4 combined) vs. threshold:
   - Threshold is derived from `waitingTime` metric: when waitingTime is bad (high value = long wait), the threshold is low, so tokens frown sooner
   - When waitingTime is good, even tokens who waited a bit still leave neutral-to-happy

2. **`serviceConsistency`**: represents whether the customer got what they expected — correct order, consistent quality. Low serviceConsistency means a proportion of exiting tokens get an unhappy face *regardless* of their wait time. Suggested: at serviceConsistency = 40, ~30% of exits are forced to sad; at serviceConsistency = 80, only ~5%.

3. **`stockAvailability`**: if stock is low, some customers couldn't get what they wanted. Suggested: at stockAvailability below 40, some tokens (say 15–20%) exit as sad regardless of speed.

**Composite exit face logic (suggested):**
```
baseHappy = (timeInSystem < happyThreshold)
consistencyPenalty = random() < (1 - serviceConsistency/100) * 0.4
stockPenalty = stockAvailability < 50 && random() < 0.2

finalFace = baseHappy && !consistencyPenalty && !stockPenalty ? 'happy'
           : (baseHappy || !consistencyPenalty) && !stockPenalty ? 'neutral'
           : 'sad'
```

This means a healthy system produces mostly happy exits. A broken system produces mostly sad exits. serviceConsistency and stock add independent failure modes beyond just speed.

---

## Face threshold timings

These need to be defined carefully. The simulation runs in animation-time, not real time. All durations are in simulation ticks, not real seconds.

**Customer time expectations (based on a normal café visit):**
- Expected total time: order quickly, drink ready in 2–3 minutes
- Happy → Neutral threshold: token has spent "moderate" time in system. Suggestion: map to `waitingTime` metric. When waitingTime displayed value is 30 (good), threshold is high (token stays happy longer). When waitingTime is 80 (bad), threshold is low (token turns neutral/sad quickly).
- Neutral → Sad threshold: roughly 1.5× the happy→neutral threshold

**Suggested mapping:**
```
happyThreshold (in ticks) = lerp(80, 200, waitingTime_normalised_good)
// where waitingTime_normalised_good = (100 - rawWaitingTime) / 100
// so when raw waitingTime = 78 (bad, displayed as 22): happyThreshold ≈ 97 ticks (turns sad quickly)
// when raw waitingTime = 20 (good, displayed as 80): happyThreshold ≈ 176 ticks (stays happy longer)
```

Note: `waitingTime` is a lower-is-better metric. Its raw value of 78 = displayed value of 22 (bad). Raw value of 20 = displayed value of 80 (good). The simulation should use the raw metric values from the game store directly, not the normalised display values.

---

## Demand level — how many customers appear

**Base rate:** approximately 1 new token every N ticks, where N is a constant representing normal peak-hour footfall.

**Demand-boosting effects:**
Cards that increase footfall in the game scenario: discount promotion (a4), social media campaign (a22), delivery app (a21), extended hours (a3), free Wi-Fi (a25), loyalty card (a27).

These cards primarily increase demand without fixing capacity — which is their harmful characteristic. In the simulation, they should visibly increase the spawn rate, making the problem worse unless the student has also improved throughput.

**How to read demand state:** The game store has `flags: ActionFlags`. The simulation component can read specific flags directly to determine if demand-boosting cards are active. Suggested spawn rate multiplier: base × 1.4 if any of {discountPromotion, socialMediaCampaign, deliveryAppLaunched, freeWifiOffered, loyaltyCardIntroduced} is true.

Alternatively: derive a "demand index" from financialResults and congestion, but direct flag reading is cleaner and more reliable.

---

## Deferred transition timing — critical UX mechanism

**The problem:** When a card is played, the ResultPanel modal opens and blocks the screen. On mobile, the map is on a different tab. The simulation must NOT start transitioning until the student can see it.

**The solution:** A pending-transition pattern in `GameLayout.tsx`. All relevant state is local to GameLayout (no game store changes needed).

```typescript
// New local state in GameLayout:
const [pendingSimTrigger, setPendingSimTrigger] = useState(false);

// When a new turn is added to history (effect already detects this):
// → set pendingSimTrigger = true (but don't fire the simulation yet)

// Modified closeResult:
const closeResult = () => {
  setViewingResultFor(null);
  // On desktop (lg+), map is always visible — fire immediately
  // On mobile, only fire if map tab is currently active
  if (isDesktop || activeTab === 'map') {
    setSimTrigger(t => t + 1); // increment fires the simulation transition
    setPendingSimTrigger(false);
  }
  // else: pendingSimTrigger stays true, will fire when map tab is opened
};

// Modified tab switch handler:
const handleTabSwitch = (tab: 'map' | 'actions' | 'case') => {
  setActiveTab(tab);
  if (tab === 'map' && pendingSimTrigger) {
    setSimTrigger(t => t + 1);
    setPendingSimTrigger(false);
  }
};

// simTrigger is passed to CustomerFlowSimulation as a prop
// When simTrigger increments, simulation starts its animated transition
```

`isDesktop` can be determined via `window.innerWidth >= 1024` at the time of the close event, or via a media query hook.

---

## Transition animation behaviour

When `simTrigger` fires, the simulation:
1. Has already been quietly tracking `targetMetrics` (the new game metrics)
2. Starts interpolating its internal `displayRates` toward `targetRates` over ~2.5 seconds
3. During transition: queue depths slowly change, spawn rates change, processing speeds change
4. Student watches queues drain or build in real time
5. After 2.5s: settles into new steady state

The transition should feel smooth and causal, not instantaneous.

---

## Component structure

**New file:** `src/components/game/CustomerFlowSimulation.tsx`

**Props:**
```typescript
interface Props {
  targetMetrics: VisibleMetrics;
  flags: ActionFlags;        // for demand-boosting detection
  triggerKey: number;        // increment fires transition
}
```

**Internal state:**
- `tokens: Token[]` — active customer tokens
- `displayRates: SimRates` — current animated rates
- `targetRates: SimRates` — derived from targetMetrics + flags

**`SimRates` shape:**
```typescript
interface SimRates {
  spawnInterval: number;      // ticks between new customer arrivals
  orderQueueDepth: number;    // target token count at "Queuing to order"
  tillSpeed: number;          // ticks per token at "Placing order"
  prepQueueDepth: number;     // target token count at "Waiting for drink"
  prepSpeed: number;          // ticks per token at "Waiting for drink"
  happyThreshold: number;     // ticks before happy→neutral
  sadThreshold: number;       // ticks before neutral→sad
  consistencyFailRate: number;// 0–1, probability of forced sad exit
  stockFailRate: number;      // 0–1, probability of stock-related sad exit
}
```

Animation loop: `requestAnimationFrame` inside a `useEffect`. Each frame updates token positions and ages, manages queue lengths, spawns/removes tokens.

**Layout position:** Between `<SystemMap />` and `<MetricPanel />` in `GameLayout.tsx`.

---

## Files to modify

| File | Change |
|---|---|
| `src/components/game/CustomerFlowSimulation.tsx` | New file — full simulation component |
| `src/components/layout/GameLayout.tsx` | Add `pendingSimTrigger`, `simTrigger`, modified `closeResult`, new tab switch handler; render `<CustomerFlowSimulation>` between SystemMap and MetricPanel |

No changes to game store, engine, types, or any other files.

---

## Open questions for the new session to resolve before implementation

1. **Visual style of the simulation strip:** Should it match the existing SystemMap style (dark background, coloured glow nodes)? Or lighter/more illustrative? The SystemMap uses a card with rounded corners, subtle shadow, dark-bg. The simulation strip should be visually consistent.

2. **How many tokens should be visible at once?** Too many = performance issues and visual clutter. Too few = doesn't feel alive. Suggested: max 12–15 visible tokens at any moment.

3. **Should the simulation show a "time of day" or "intensity" indicator?** Like a subtle label saying "08:30 — morning peak" to contextualise why there are so many customers? This could add narrative framing.

4. **Should the stage labels be visible at all times, or only on first visit?** Labels are important for legibility but take up space.

5. **Exact pixel heights:** The strip needs to be compact enough not to dominate the center column. Suggested: 130–150px.

---

## Key files for reference in new session

| File | Purpose |
|---|---|
| `src/components/layout/GameLayout.tsx` | Layout, local state, tab switching, ResultPanel close |
| `src/components/game/SystemMap.tsx` | Existing map component (visual reference for style) |
| `src/components/game/MetricPanel.tsx` | Component below which simulation will sit |
| `src/store/useGameStore.ts` | Game state including metrics and flags |
| `src/types/game.ts` | VisibleMetrics and ActionFlags type definitions |
| `src/engine/normaliseForDisplay.ts` | Which metrics are lower-is-better (important for face threshold logic) |

Lower-is-better metrics (raw value is bad when high, displayed as 100-raw):
- `waitingTime`, `backlog`, `congestion`, `wasteTracker`

Higher-is-better metrics (raw value is good when high):
- `throughput`, `serviceConsistency`, `stockAvailability`, `financialResults`

Initial metric values (before any cards played):
- waitingTime: 78, throughput: 38, backlog: 70, congestion: 76
- serviceConsistency: 42, stockAvailability: 48, financialResults: 28, wasteTracker: 70
