# Fix RainyDay Café – UI/UX Design Specification

## 1. Design philosophy

This game must look like a **professional product**, not a student project or a text-heavy prototype. Students will play this on their phones during a lecture session. If it looks cheap or broken, they will disengage immediately.

The visual style should be: **clean, dark, data-rich, subtly atmospheric**. Think of a well-designed dashboard crossed with a minimal strategy game. The aesthetic should feel like a Bloomberg terminal for a café, not a children's board game and not a generic Bootstrap page.

### Key aesthetic principles
- Dark background with high-contrast content
- Muted colour palette with strategic use of traffic-light colours (red, amber, green) as the only saturated accents
- Clean typography with clear hierarchy
- Generous spacing, not cramped
- Subtle animations that communicate system state, never decorative
- No gradients, no drop shadows deeper than 1–2px, no rounded corners larger than 12px
- No emojis anywhere in the UI (use Lucide icons instead)
- No stock photography or illustrations

---

## 2. Colour system

Define as CSS custom properties / Tailwind config:

```
--bg-primary:      #0B0F19        /* deep navy-black, main background */
--bg-surface:      #141C2E        /* card/panel background */
--bg-surface-alt:  #1A2540        /* slightly lighter surface for nested elements */
--bg-hover:        #1E2D4A        /* hover state for interactive elements */

--border-default:  #2A3654        /* subtle borders */
--border-focus:    #3B5998        /* focused/active borders */

--text-primary:    #E8ECF4        /* main text */
--text-secondary:  #8899B8        /* labels, descriptions, secondary info */
--text-muted:      #556682        /* disabled states, timestamps */

--accent-green:    #22C55E        /* improved / good / green traffic light */
--accent-amber:    #F59E0B        /* moderate / amber traffic light */
--accent-red:      #EF4444        /* worsened / bad / red traffic light */
--accent-blue:     #3B82F6        /* interactive elements, links, focus rings */

--green-glow:      rgba(34, 197, 94, 0.15)
--amber-glow:      rgba(245, 158, 11, 0.15)
--red-glow:        rgba(239, 68, 68, 0.15)
--blue-glow:       rgba(59, 130, 246, 0.15)
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

- Drop the case data panel to a slide-out drawer (hamburger icon, left edge)
- 2-column layout: system map + metrics on the left, actions on the right
- System map takes roughly 55% width, actions 45%

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

- Background: `--bg-surface-alt`
- Border: 1.5px solid `--border-default`
- Border radius: 10px
- Padding: 14px 16px
- Hover: border becomes `--accent-blue`, subtle lift (`transform: translateY(-1px)`, `box-shadow: 0 4px 12px rgba(59,130,246,0.12)`)
- Title: DM Sans 600, `--text-md` size, `--text-primary`
- Description: DM Sans 400, `--text-sm` size, `--text-secondary`, line-height 1.5
- Icon: Lucide icon, 18px, `--text-secondary`, right-aligned in title row
- Used state: opacity 0.3, pointer-events none, strikethrough on title
- Category tag: small pill in bottom-right, `--text-xs`, uppercase, `letter-spacing: 0.08em`
  - No colour coding by harmful/core/support (this would reveal the answer)
  - Use the group label: "Staffing", "Layout", "Menu", "Process" in `--text-muted` on `--bg-surface` background

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
│  ● Customer Waiting Time        22   ↓     │
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
- Each node is a rounded rectangle: 120px × 64px, border-radius 10px
- Fill: `--bg-surface-alt`
- Border: 2px solid, colour matches traffic light state
- Box shadow (via SVG filter): subtle glow matching traffic light colour
- Label: DM Sans 600, `--text-sm`, centred
- Small health score below label: JetBrains Mono 500, `--text-xs`, colour matches traffic light

#### Connection rendering
- Lines between nodes: 1.5px stroke, `--border-default` colour
- Affected connections after a turn: pulse animation (glow in `--accent-blue`, 300ms ease-in-out, fade back)

#### Node position
Use the x/y percentage coordinates from `nodeMap.ts`. The map should be laid out roughly like this:

```
            [Order Point]
           /             \
    [Customer]          [Preparation]
      Flow    \        /      |
               [Staffing]     |
              /         \     |
         [Costs]     [Menu & Stock]
```

This is a suggestion, not an exact diagram. The nodes should be positioned so that connections don't overlap badly and the overall shape is readable at both desktop and mobile sizes.

#### Animations
- Node health change: colour transition on border and glow, 400ms
- Node worsened: CSS `@keyframes` shake animation, 250ms, translateX ±3px
- Node improved: brief glow intensify (200ms brighter, then fade to normal over 400ms)
- Connection pulse: opacity 0 → 0.7 → 0 over 600ms, stroke changes to `--accent-blue`

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
- Key numbers: simple key-value pairs
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

## 9. Background and atmosphere

### Grid overlay
Apply a subtle grid pattern to the body:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
```

This adds a very faint engineering-grid feel without being distracting.

### Noise texture (optional, subtle)
If the implementation supports it, add a very faint noise texture overlay at 2–3% opacity to prevent the dark backgrounds from feeling completely flat. Use a CSS pseudo-element with a base64-encoded tiny noise PNG tiled across the surface.

If this is too complex to implement, skip it. The grid alone is sufficient.

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
| Metric: Customer Waiting Time | `Clock` |
| Metric: Orders Completed / Hour | `TrendingUp` |
| Metric: Order Backlog | `Layers` |
| Metric: Counter Congestion | `Users` |
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
