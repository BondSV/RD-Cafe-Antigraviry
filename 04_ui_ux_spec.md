# Fix RainyDay Café – UI/UX Design Specification

## 1. Design philosophy

This game must look like a **professional product**, not a student project or a text-heavy prototype. Students will play this on their phones during a lecture session. If it looks cheap or broken, they will disengage immediately.

The visual style should be: **clean, light, data-rich, subtly atmospheric**. Think of a well-designed dashboard crossed with a minimal strategy game. The aesthetic should feel like a Bloomberg terminal for a café, not a children's board game and not a generic Bootstrap page.

### Key aesthetic principles
- Flat `#F2F2F2` background with high-contrast distinct content panes
- Semantic use of traffic-light colours for metrics, and distinct category accents (Burgundy, Blue, Green, Amber) for actions
- Clean typography with clear hierarchy
- Drop shadows for interactive elements to elevate them off the flat background
- Subtle animations that communicate system causality, never purely decorative
- No emojis anywhere in the UI (use Lucide icons instead)
- No stock photography or illustrations

---

## 2. Colour system

Define as CSS custom properties / Tailwind config:

```
--bg-primary:      #F2F2F2        /* clean light-grey, main background */
--bg-surface:      #FFFFFF        /* card/panel background */
--bg-surface-alt:  #F1F5F9        /* slightly distinct surface for nested elements */
--bg-hover:        #E2E8F0        /* hover state for interactive elements */

--border-default:  #E2E8F0        /* subtle borders */
--border-focus:    #CBD5E1        /* focused/active borders */

--text-primary:    #0F172A        /* main text */
--text-secondary:  #475569        /* labels, descriptions, secondary info */
--text-muted:      #94A3B8        /* disabled states, timestamps */

--accent-green:    #16A34A        /* improved / good / green traffic light */
--accent-amber:    #D97706        /* moderate / amber traffic light */
--accent-red:      #DC2626        /* worsened / bad / red traffic light */
--accent-blue:     #3B82F6        /* interactive elements, links, focus rings */

/* Action Category Accents */
--accent-staffing: #8B0000        /* Burgundy */
--accent-layout:   #2563EB        /* Crisp Blue */
--accent-menu:     #16A34A        /* Green */
--accent-process:  #D97706        /* Amber */
```

### Usage rules
- Traffic-light colours (green, amber, red) are used **only** for metric states and system map nodes. Never for decorative purposes.
- Blue is the interactive accent: buttons, links, active tabs, focus rings.
- The background has a subtle grid pattern overlay (see section 9) to add depth without distraction.

---

## 3. Typography

Use exactly two fonts:

### Primary: "DM Sans"
- Import from Google Fonts: `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap`
- Use for: all body text, descriptions, event text, labels
- Weight 400: body text, descriptions
- Weight 500: metric labels, secondary headings
- Weight 600: action card titles, panel headings
- Weight 700: primary headings, large numbers

### Monospace: "JetBrains Mono"
- Import from Google Fonts: `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap`
- Use for: metric numbers, turn counters, score values, small data labels
- This creates a "data dashboard" feel for numeric content

### Type scale
```
--text-xs:    0.7rem    /* tiny labels, footnotes */
--text-sm:    0.8rem    /* secondary labels, descriptions */
--text-base:  0.9rem    /* body text, event text */
--text-md:    1rem      /* panel headings, action titles */
--text-lg:    1.15rem   /* section headings */
--text-xl:    1.4rem    /* screen titles */
--text-2xl:   2rem      /* intro screen title */
--text-3xl:   2.8rem    /* intro screen hero title (mobile: 2rem) */
```

### Letter spacing
- Uppercase labels (section headings like "SITUATION", "ACTIONS", "METRICS"): `letter-spacing: 0.12em`
- Monospace numbers: `letter-spacing: -0.02em` (tighter)
- Body text: default

---

## 4. Layout: desktop (≥1024px)

### Overall structure
The main game screen uses a **3-column layout**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Turn bar (full width)                                          │
├──────────────┬─────────────────────────┬────────────────────────┤
│  Case Data   │  System Map             │  Actions Panel         │
│  Panel       │  (centre, prominent)    │  (accordion groups)    │
│  (collapsible│                         │                        │
│   sidebar)   │                         │                        │
│              ├─────────────────────────┤                        │
│              │  Metrics Panel          │                        │
│              │  (below map)            │                        │
├──────────────┴─────────────────────────┴────────────────────────┤
│  (Result panel overlays centre when shown)                      │
└─────────────────────────────────────────────────────────────────┘
```

- Left column: 260px fixed width (case data panel, collapsible)
- Centre column: flexible, minimum 400px
- Right column: 340px fixed width (actions)
- Gap between columns: 16px
- Page max-width: 1400px, centred
- Outer padding: 20px

### Turn bar
- Full width, fixed to top
- Height: 52px
- Background: `--bg-surface`
- Border bottom: 1px `--border-default`
- Content: turn counter left, system health bar centre, attempt counter right
- Turn counter: "Turn 3 of 5" in JetBrains Mono, weight 700
- System health: a single horizontal bar showing overall system score

---

## 5. Layout: tablet (768px–1023px)

Tablet explicitly uses the **Mobile single-column tab layout** to prevent the 3-panel UI from crushing or cutting off content on narrower screens.

---

## 6. Layout: mobile (<768px)

### Critical: this is the primary play device

- Single column, full width
- Turn bar: sticky top, compressed to 44px height
- Below turn bar: **tab navigation** with 3 tabs:
  - "Map" (system map + metrics)
  - "Actions" (action cards in accordion groups)
  - "Case" (case data)
- Default to "Actions" tab on game start
- Tabs: full width, equal distribution, 44px height, `--bg-surface` background
- Active tab: bottom border in `--accent-blue`, text in `--text-primary`
- Inactive tab: text in `--text-secondary`

### Mobile action cards
- Full width
- Category accordion headers: 48px touch target
- Action cards within accordion: minimum 56px touch target per card
- One card per row

### Mobile result panel
- Full screen overlay with slide-up animation
- Close/continue button at bottom (large, 48px height minimum)

---

## 7. Component specifications

### 7.1 Action card

```
┌──────────────────────────────────────────────┐
│  Simplify the menu                    [icon] │
│  Reduce the range of sandwich fillings       │
│  and drink options to focus on the most       │
│  popular items.                              │
│                                [Category tag]│
└──────────────────────────────────────────────┘
```

- Background: `--bg-surface` (white) with subtle shadow.
- Border: 1.5px solid `--border-default` with a thick 4px left-border coloured dynamically based on the action's category group (Staffing = Burgundy, Layout = Blue, Menu = Green, Process = Amber).
- Border radius: 12px
- Padding: 14px 16px
- Hover: border becomes the category accent colour, card visually lifts (`transform: translateY(-4px)`, shadow intensifies)
- Title: DM Sans 600, `--text-md` size, `--text-primary`
- Description: DM Sans 400, `--text-sm` size, `--text-secondary`, line-height 1.5
- Icon: Lucide icon, 18px, coloured via dynamic category accent, right-aligned in title row
- Used state: opacity 0.4, border grey, pointer-events none, strikethrough on title
- Category tag: small pill in bottom-right explicitly styled with the dynamic category background (opacity 10%) and text colour.

### 7.2 Category accordion

- Header: 48px height, DM Sans 600, `--text-sm`, uppercase, `letter-spacing: 0.12em`, `--text-secondary`
- Chevron icon: right side, rotates 90° on open/close, 200ms transition
- Open state: header text becomes `--text-primary`
- Content: list of action cards with 8px gap
- Default state on game start: first category expanded, rest collapsed
- Only one category open at a time on mobile, multiple allowed on desktop

### 7.3 Metric row

```
┌────────────────────────────────────────────┐
│  ● Service Speed                88   ↑     │
│  ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
└────────────────────────────────────────────┘
```

- Background: `--bg-surface-alt`
- Border radius: 8px
- Padding: 10px 14px
- Traffic light dot: 8px circle, colour matches current state (red/amber/green)
- Label: DM Sans 500, `--text-sm`, `--text-primary`
- Score: JetBrains Mono 700, `--text-sm`, colour matches traffic light
- Delta arrow: right-aligned, ↑ in green / ↓ in red / — in grey, JetBrains Mono
- Progress bar below text: 4px height, border-radius 2px
  - Track: `rgba(255,255,255,0.06)`
  - Fill: colour matches traffic light, width = display score %
  - Transition: width 600ms ease, background-color 400ms ease

### 7.4 System map

The map is the centrepiece visual of the game. It must be implemented as **SVG** for clean scaling.

#### Node rendering
- Each node is a pure HTML absolutely positioned `div` floating above the SVG graph.
- Size: 120px × 64px (snaps down to 96px wide on mobile to prevent overlapping).
- Border radius 10px
- Fill: White/Surface
- Border: 2px solid, colour matches traffic light state

#### Connection rendering (SVG)
- Background SVG uses a `ResizeObserver` listener to dynamically calculate precise exact-pixel Bezier Curve paths pointing exactly at the centre of each dynamic HTML node.
- Forward causality lines are Slate Grey. Reverse "stress" loops are Indigo. Bidirectional nodes bow curved paths outward so they don't overlap.
- Animation: Every path features a physical Green Arrowhead explicitly tracing the path continuously forever in a physical flow animation via `<animateMotion>`.
- Affected connections after a turn: The active line pulses bright blue and the arrowhead accelerates briefly (800ms) to spotlight the immediate system throughput.

#### Node position
Hexagonal symmetry mathematically mapped across Y-offsets:
- Layer 1 (y=25): Order Point (x=50)
- Layer 2 (y=45): Staff Efficiency (x=18) / Preparation (x=82)
- Layer 3 (y=70): Product & Quality (x=18) / Inventory & Supply (x=82)
- Layer 4 (y=88): Financials (x=50)

### 7.5 Case data panel

#### Desktop (sidebar)
- Width: 260px
- Background: `--bg-surface`
- Border right: 1px `--border-default`
- Scroll: internal scroll if content overflows
- Collapse button: small chevron icon at top-right corner
- Collapsed state: 0px width (hidden), toggle button remains visible at edge

#### Mobile (drawer)
- Accessed via "Case" tab
- Full width, full remaining height below tabs
- Scroll: native vertical scroll

#### Content structure
- Section heading: "CASE DATA", `--text-xs`, uppercase, `letter-spacing: 0.12em`, `--text-muted`
- Sub-sections: "Staff Roster", "Operating Hours", "Key Numbers", "Customer Feedback"
- Staff roster: small table with role, schedule, hours columns
  - Use JetBrains Mono for the hours
  - Highlight the 7–9 AM gap visually: the row for Assistant Barista #1 (7 AM–3 PM) should have full opacity, while the Manager (10 AM) and Head Barista (9 AM) rows could have a subtle amber left-border indicating they're absent during early peak, but **do not** add explanatory text about why this matters
- Key numbers: 4 explicit stats (Weekday Footfall & Transactions, Weekend Footfall & Transactions) + average £ transaction value.
- Customer feedback: compact bullet list (Lucide icons: `ThumbsDown` for complaints, `ThumbsUp` for positives)

### 7.6 Result panel (turn result)

- Overlay on the centre column (desktop) or full-screen overlay (mobile)
- Background: `--bg-surface` with 1px `--border-default` border
- Border radius: 16px (desktop), 0 (mobile full-screen)
- Content order:
  1. Turn number: JetBrains Mono, `--text-xs`, `--text-muted`, uppercase
  2. Action title: DM Sans 700, `--text-lg`, `--text-primary`
  3. Metric delta list: 7 rows showing the delta for each metric
  4. Event text: DM Sans 400, `--text-base`, `--text-secondary`, max 2 sentences, line-height 1.7
  5. Continue button: full width on mobile, auto width on desktop

### 7.7 Final summary screen

- Full screen
- Background: `--bg-primary`
- Centre-aligned content block, max-width 560px

#### Outcome badge
- Large centred element
- Background colour: translucent version of the traffic light colour matching the outcome
  - Collapse / Dead-end: `--red-glow`
  - Near miss: `--amber-glow`
  - Strong improvement: `--green-glow` (slightly muted)
  - Full win: `--green-glow` (full)
- Icon: Lucide icon matching outcome (e.g., `AlertTriangle` for collapse, `Target` for near miss, `Trophy` for full win)
- Outcome label: DM Sans 700, `--text-xl`
- Sub-text: 1 sentence summary

#### Action timeline
- Vertical list showing the 5 actions in order
- Each action: small numbered circle (JetBrains Mono) + action title
- Circle colour: green for core/support, red for harmful

#### Final metrics
- Compact grid: 2 columns on desktop, 1 on mobile
- Each metric shows: traffic-light dot + label + final score

#### Reflection text
- DM Sans 400, `--text-base`, `--text-secondary`
- Contained in a subtle box: `--bg-surface-alt` background, 1px `--border-default`, border-radius 12px, padding 16px
- Line height: 1.7

#### Restart button
- `--accent-blue` background, white text, DM Sans 700
- Padding: 12px 32px, border-radius 8px
- Hover: darken slightly, translateY(-1px)

### 7.8 Intro screen

- Full viewport height, centred content
- Max-width: 600px

#### Title
- "Fix RainyDay Café"
- DM Sans 700, `--text-3xl` (mobile: `--text-2xl`)
- Colour: `--text-primary`
- Below title: "A Systems Thinking Game" in JetBrains Mono 400, `--text-sm`, `--text-secondary`, uppercase, `letter-spacing: 0.15em`

#### Setup paragraph
- Brief RainyDay Café description, 3–4 sentences max
- DM Sans 400, `--text-base`, `--text-secondary`, line-height 1.7

#### Rules box
- Background: `--bg-surface`
- Border: 1px `--border-default`
- Border radius: 12px
- Padding: 20px
- Section heading: "HOW IT WORKS", `--text-xs`, uppercase, `letter-spacing: 0.12em`, `--accent-blue`
- Numbered rules: 4–5 short lines

#### Start button
- Large, centred
- `--accent-blue` background, white text
- DM Sans 700, `--text-md`
- Padding: 14px 40px, border-radius 10px
- Hover: slight lift, box-shadow

#### Attempt counter (if replaying)
- Below start button: "Attempt #3" in JetBrains Mono, `--text-xs`, `--text-muted`

---

## 8. Interactive states

### Buttons
- Default: `--accent-blue` background, white text
- Hover: `background: #2563EB` (slightly darker), `transform: translateY(-1px)`, `box-shadow: 0 4px 12px rgba(59,130,246,0.2)`
- Active: `transform: translateY(0)`, no shadow
- Disabled: opacity 0.4, pointer-events none

### Focus rings
- All interactive elements: `outline: 2px solid var(--accent-blue); outline-offset: 2px`
- Visible only on keyboard focus (`:focus-visible`)

### Action cards (interactive states)
- Default: `--bg-surface-alt` background, `--border-default` border
- Hover: `--border-focus` border, slight Y lift, blue shadow
- Selected (this turn): `--accent-blue` border, blue glow background
- Used (previous turn): opacity 0.3, strikethrough on title
- Disabled (during result display): opacity 0.5, pointer-events none

---

### Background Flat Slate
The base background uses a completely flat `#F2F2F2` (`bg-bg-primary`) style. The interface uses drop-shadows rather than background ornaments/grids to elevate interactivity. No geometric shapes, dots, or gradients should clutter the foundation.

---

## 10. Animation specifications

All animations should be **subtle and functional**, not decorative. Every animation must communicate information about system state changes.

### Metric bar fill
```css
.metric-fill {
  transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1),
              background-color 400ms ease;
}
```

### Node health change
```css
.system-node {
  transition: border-color 400ms ease,
              box-shadow 400ms ease;
}
```

### Node shake (worsened)
```css
@keyframes node-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

.node-worsened {
  animation: node-shake 250ms ease-in-out;
}
```

### Node glow (improved)
```css
@keyframes node-glow {
  0% { box-shadow: 0 0 12px var(--green-glow); }
  50% { box-shadow: 0 0 24px var(--green-glow); }
  100% { box-shadow: 0 0 12px var(--green-glow); }
}

.node-improved {
  animation: node-glow 600ms ease;
}
```

### Connection pulse
```css
@keyframes connection-pulse {
  0% { stroke: var(--border-default); stroke-opacity: 1; }
  50% { stroke: var(--accent-blue); stroke-opacity: 0.8; stroke-width: 3; }
  100% { stroke: var(--border-default); stroke-opacity: 1; stroke-width: 1.5; }
}

.connection-active {
  animation: connection-pulse 600ms ease-in-out;
}
```

### Result panel entrance
- Desktop: fade in + scale from 0.97 to 1, 300ms
- Mobile: slide up from bottom, 300ms ease-out

### Tab transitions
- Content switches with a subtle opacity fade: 150ms

---

## 11. Lucide icon usage

Use Lucide React icons throughout. Suggested icon mapping:

| Context | Icon |
|---|---|
| Category: Staffing & Scheduling | `Users` |
| Category: Layout & Equipment | `LayoutGrid` |
| Category: Menu & Inventory | `UtensilsCrossed` |
| Category: Process & Promotion | `ClipboardList` |
| Metric: Service Speed | `Clock` |
| Metric: Orders Completed per Hour | `TrendingUp` |
| Metric: Order Processing | `Layers` |
| Metric: Queue Flow | `Users` |
| Metric: Service Consistency | `CheckCircle` |
| Metric: Stock Availability | `Package` |
| Metric: Budget Pressure | `Wallet` |
| Delta improved | `ArrowUp` |
| Delta worsened | `ArrowDown` |
| Delta unchanged | `Minus` |
| Outcome: Collapse | `AlertTriangle` |
| Outcome: Dead-end | `XCircle` |
| Outcome: Near miss | `Target` |
| Outcome: Strong improvement | `TrendingUp` |
| Outcome: Full win | `Trophy` |
| Case data toggle | `FileText` |
| Accordion expand | `ChevronDown` |
| Restart | `RotateCcw` |

---

## 12. Accessibility requirements

- All text meets WCAG AA contrast against its background (the colour system above is designed for this)
- All interactive elements have visible focus indicators (`:focus-visible` with blue outline)
- Tab navigation works: action cards, buttons, accordion headers
- Screen reader labels on: traffic light dots (e.g., `aria-label="Status: red"`), system map nodes, delta arrows
- Result panel announced: use `role="alert"` or `aria-live="polite"` for event text
- Minimum touch targets on mobile: 44px × 44px

---

## 13. Performance notes

- Keep bundle size small: no animation libraries, no charting libraries
- SVG system map is rendered declaratively, not canvas-based
- Use `will-change: transform` only on actively animating elements, remove after animation completes
- Lazy-load nothing: the game is a single screen with minimal assets
- The entire game should load and become interactive in under 2 seconds on a mobile connection
- Total JavaScript bundle should be under 150KB gzipped

---

## 14. What NOT to do

These are specific anti-patterns to avoid:

- **No emojis.** Use Lucide icons for all visual indicators.
- **No gradients** on backgrounds or buttons. Flat colours only.
- **No rounded corners larger than 12px** except the full-width intro button (which may use 10px).
- **No white backgrounds** anywhere. The darkest surface is `--bg-primary`, the lightest is `--bg-hover`.
- **No generic sans-serif fonts.** Use DM Sans and JetBrains Mono exactly as specified.
- **No colour-coding of action categories** to indicate good/bad. Categories are navigation only.
- **No tooltips** that explain whether an action is good or bad.
- **No progress percentage** showing "how close to winning" the player is during play.
- **No confetti, particle effects, or celebratory animations.** The full-win screen should feel satisfying through clean design, not through effects.
- **No horizontal scrolling** on any viewport size.
- **No fixed/sticky elements** on mobile other than the turn bar and tab navigation.
