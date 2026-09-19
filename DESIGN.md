---
name: Jetstream
description: A self-hostable personal flight log presented as a calm, frosted-glass instrument panel.
colors:
  ink: '#101620'
  ink-soft: '#47535f'
  ink-mute: '#566072'
  accent: '#2f5fe0'
  accent-strong: '#2450cc'
  accent-wash: '#eaf0ff'
  line: 'rgba(16, 22, 32, 0.08)'
  line-strong: 'rgba(16, 22, 32, 0.13)'
  ambient-base: '#e9eef7'
  glass-fill: 'rgba(255, 255, 255, 0.55)'
  bar-fill: 'rgba(255, 255, 255, 0.66)'
  field-fill: 'rgba(255, 255, 255, 0.72)'
  status-success: '#047857'
  status-error: '#e11d48'
  status-warning: '#b45309'
typography:
  display:
    fontFamily: "'Hanken Grotesk Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1.875rem'
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: '-0.02em'
  title:
    fontFamily: "'Hanken Grotesk Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1.125rem'
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: '-0.02em'
  body:
    fontFamily: "'Hanken Grotesk Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: '-0.006em'
  label:
    fontFamily: "'Hanken Grotesk Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 'normal'
  overline:
    fontFamily: "'Hanken Grotesk Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: '0.05em'
  data:
    fontFamily: "'Geist Mono Variable', ui-monospace, 'SF Mono', monospace"
    fontSize: '1rem'
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: '-0.01em'
    fontFeature: "'tnum'"
rounded:
  panel: '1.25rem'
  control: '0.7rem'
  pill: '9999px'
  focus: '4px'
spacing:
  xs: '0.375rem'
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  xl: '1.5rem'
  panel-pad: '1.5rem'
  section-gap: '2.5rem'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '#ffffff'
    rounded: '{rounded.control}'
    padding: '0.55rem 1.05rem'
    typography: '{typography.label}'
  button-primary-hover:
    backgroundColor: '{colors.accent-strong}'
    textColor: '#ffffff'
  button-ghost:
    backgroundColor: '{colors.glass-fill}'
    textColor: '{colors.ink-soft}'
    rounded: '{rounded.control}'
    padding: '0.55rem 1.05rem'
    typography: '{typography.label}'
  button-ink:
    backgroundColor: '{colors.ink}'
    textColor: '#ffffff'
    rounded: '{rounded.control}'
    padding: '0.625rem 1.25rem'
    typography: '{typography.label}'
  field:
    backgroundColor: '{colors.field-fill}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: '0.5rem 0.75rem'
    typography: '{typography.body}'
  nav-link-active:
    backgroundColor: '{colors.accent-wash}'
    textColor: '{colors.accent}'
    rounded: '{rounded.pill}'
    padding: '0.375rem 0.75rem'
    typography: '{typography.label}'
  panel:
    backgroundColor: '{colors.glass-fill}'
    textColor: '{colors.ink}'
    rounded: '{rounded.panel}'
    padding: '1.5rem'
---

# Design System: Jetstream

## Overview

**Creative North Star: "The Calm Departure Board"**

Jetstream is a personal flight log dressed as a calm instrument panel. Translucent
white surfaces float over a soft, near-white ambient sky, and the data reads like
a clean airport departure board: quiet, aligned, factual. It deliberately refuses
the generic dark SaaS dashboard, and it refuses heavy "liquid glass" spectacle —
frosted glass here is a single, restrained depth system, never decoration.

The world is light and cool. A fixed ambient wash (a whisper of azure with a warm
lower note) sits behind everything so that every frosted panel has real depth to
reveal through its blur. Chrome stays out of the way: near-black cool ink for
text, cool-slate tints for secondary and muted copy (never flat gray), and one
quiet azure reserved for the single primary action, active navigation, focus
rings, progress fills, and the globe's arcs and points. Corners are soft, icons
are single-weight line strokes, and one authored entrance moment lets each surface
settle in on load.

Type does the instrument work. Hanken Grotesk carries all UI; Geist Mono, with
tabular figures, is reserved strictly for flight data — airport codes, flight
numbers, registrations, times, and stat figures — so numbers align in columns and
read like a readout. The result is spacious, legible, and quietly precise: a tool
first, with brand living in the details.

**Key Characteristics:**

- Light, cool, frosted-glass surfaces over a fixed ambient azure wash.
- One glass depth system: translucent white + backdrop-blur + hairline border + soft ambient shadow.
- Two type voices: Hanken Grotesk for UI, Geist Mono (tabular) for instrument data only.
- One quiet azure accent, used sparingly against cool ink and cool-slate tints.
- Soft corners, single-weight line icons, one entrance animation.

## Colors

A restrained, cool palette: near-black ink and slate tints for all text, one azure
accent held in reserve, and translucent whites for every elevated surface.

### Primary

- **Quiet Azure** (`#2f5fe0`): The single accent. Primary button fill, active nav
  pill text, links, focus rings, dashboard progress-bar fills, and the globe's arc
  and point color. Used sparingly — its rarity is what makes it read as "the one
  action."
- **Azure Deep** (`#2450cc`): The pressed/hover state of the azure accent (primary
  button hover). Never used as a resting fill.
- **Azure Wash** (`#eaf0ff`): The pale accent tint. Background of the active nav
  pill and the hover state of instrument list rows and airport results.

### Neutral

- **Cool Ink** (`#101620`): The primary text color and the ink action button
  (GitHub sign-in). A cool near-black, never pure black at rest.
- **Slate Soft** (`#47535f`): Secondary text — field labels, subtitles, table body
  cells, ghost-button text.
- **Slate Mute** (`#566072`): Tertiary text — placeholders, captions, hint copy,
  uppercase column and stat labels.
- **Ambient Base** (`#e9eef7`): The fixed page background, overlaid with faint
  azure and warm radial gradients that the frosting reveals as depth.
- **Glass Fill** (`rgba(255,255,255,0.55)`): The resting fill of frosted panels and
  ghost buttons.
- **Bar Fill** (`rgba(255,255,255,0.66)`): The slightly denser fill of the frosted
  top navigation.
- **Field Fill** (`rgba(255,255,255,0.72)`): The fill of inputs, selects, and
  textareas; goes solid white (`#fff`) on focus.
- **Line** (`rgba(16,22,32,0.08)`): The default hairline border and divider.
- **Line Strong** (`rgba(16,22,32,0.13)`): The heavier hairline on fields and ghost
  buttons.

### Status

Semantic feedback only, drawn from a cool-tinted set; never used as decoration.

- **Success Green** (`#047857`): Success confirmations ("Flight added.") on a faint
  emerald-tinted panel.
- **Error Rose** (`#e11d48`): Inline validation errors and failed lookups.
- **Warning Amber** (`#b45309`): Configuration notices (e.g. auto-detect not set up).

### Named Rules

**The One Azure Rule.** Azure marks the single primary action and system state
(active nav, focus, data-viz), nothing else. If a screen has more than one azure
fill competing for "the action," one of them is wrong.

**The No Flat Gray Rule.** Secondary and muted text use the cool slate tints
(`#47535f`, `#566072`), never a neutral gray. Borders are ink-at-low-alpha, not
gray strokes.

## Typography

**Display / Body Font:** Hanken Grotesk Variable (with ui-sans-serif, system-ui fallback)
**Data / Mono Font:** Geist Mono Variable (with ui-monospace, SF Mono fallback)

**Character:** A clean modernist grotesque for everything a human reads, paired with
a precise monospace for everything a machine measured. The pairing is calm and
instrument-like: sans for language, mono for data.

### Hierarchy

- **Display** (600, 1.875rem / `text-3xl`, letter-spacing -0.02em): Page titles
  only — "Flights", "Dashboard", "Globe".
- **Title** (500, 1.125rem / `text-lg`, occasionally 1rem / `text-base`,
  letter-spacing -0.02em): Section headings inside panels ("Add a flight", "Top
  airports").
- **Body** (400, 1rem, letter-spacing -0.006em): Default copy, subtitles, hint
  text. Body inherits a global -0.006em tracking.
- **Label** (500, 0.875rem / `text-sm`): Form field labels and interactive controls,
  usually in Slate Soft.
- **Overline** (500, 0.75rem / `text-xs`, letter-spacing ~0.05em, uppercase): Table
  column headers and stat-cell captions, in Slate Mute. These are functional
  instrument labels, native to a departure-board readout.
- **Data** (400–500, tabular-nums, letter-spacing -0.01em, sizes 0.75rem–1.25rem):
  Geist Mono for every measured value — airport codes, routes, flight numbers,
  times, registrations, seats, stat figures, counts.

### Named Rules

**The Mono-Is-Data Rule.** Geist Mono is reserved strictly for instrument data:
codes, numbers, times, registrations, figures. Never set prose, labels, or headings
in mono. Every mono context also carries `tabular-nums` so columns align.

## Layout

A single centered column governs every surface: `max-w-5xl` (64rem), gutters
`px-4` rising to `px-6` at the `sm` breakpoint, and `py-10` vertical padding. The
top navigation is a sticky frosted bar; content scrolls beneath it.

Spacing follows a 4px base rhythm (Tailwind's default scale). Panels use `p-6`
(1.5rem) growing to `p-7` on larger viewports; stacked sections are separated by
`mb-10` / `mt-4` (2.5rem / 1rem); form controls stack with `gap-4`–`gap-6`.

Forms and stat grids are responsive: single column on mobile, two columns from
`sm` (`grid-cols-1 sm:grid-cols-2`); the dashboard stat readout steps 2 → 3 → 6
columns (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`). The primary breakpoints in
use are `sm` (640px), `md` (768px), and `lg` (1024px). Navigation collapses its
center links into a horizontally scrollable strip below `sm`.

## Elevation & Depth

Depth is expressed through one frosted-glass material, not a shadow ramp. Every
elevated surface is translucent white plus a backdrop blur, a hairline ink border,
and a soft ambient shadow with real offset and blur. Because the page background is
a fixed gradient wash, the blur always has color and depth to reveal — that
revealed depth, not stacked shadows, is what separates a surface from the page.

### Shadow Vocabulary

- **Glass panel** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px
rgba(16,22,32,0.03), 0 26px 50px -34px rgba(23,42,80,0.3)`): Frosted cards,
  panels, dropdowns. The inset top highlight is the glass's lit edge; the large
  soft offset is its ambient lift.
- **Primary button** (`box-shadow: 0 1px 2px rgba(36,80,204,0.25), 0 12px 24px -14px
rgba(36,80,204,0.6)`): Tints the azure button's shadow azure so it glows rather
  than casts a neutral shadow. Removed entirely when disabled.
- **Field focus ring** (`box-shadow: 0 0 0 3.5px rgba(47,95,224,0.15)`): A soft azure
  halo on focused inputs, paired with an azure border and a solid white fill.
- **Focus-visible outline** (`outline: 2px solid #2f5fe0; outline-offset: 2px`): The
  global keyboard-focus ring on all other interactive elements.

### Named Rules

**The One Material Rule.** There is exactly one depth system: frosted glass. Do not
introduce solid opaque cards, second shadow scales, or hard offset shadows. If a
surface needs to lift, it frosts.

## Shapes

Two soft corner radii carry the whole system: panels and cards use a generous
`1.25rem` (`--radius-panel`), while controls — buttons, fields, dropdowns, list
containers, images — use `0.7rem` (`--radius-control`). Fully round (`9999px`) is
reserved for nav pills and dashboard progress bars. Borders are always hairline
ink-at-low-alpha, never a visible gray stroke. The globe is the one pure-geometric
form: a pale sphere with faint landmasses and glowing great-circle arcs.

## Components

### Buttons

- **Shape:** Softly rounded (0.7rem / `--radius-control`); inline-flex, centered,
  0.5rem gap for icon + label; 500 weight.
- **Primary:** Solid Quiet Azure fill, white text, azure-tinted glow shadow,
  `0.55rem 1.05rem` padding. Hover deepens to Azure Deep; active nudges down 0.5px;
  disabled drops to 0.5 opacity and loses its shadow.
- **Ghost:** Translucent white fill (`glass-fill`), Line-Strong hairline border,
  Slate Soft text. Hover raises fill opacity to ~0.85 and text to Cool Ink. Used
  for secondary actions like "Find flights."
- **Ink action:** Solid Cool Ink fill, white text — reserved for the GitHub
  sign-in button on Login/Setup.

### Cards / Containers

- **Corner Style:** Panel radius (1.25rem).
- **Background:** Frosted glass (`glass-fill`) with backdrop-blur + saturate.
- **Shadow Strategy:** The Glass panel shadow (see Elevation & Depth).
- **Border:** Line hairline (1px, ink at 0.08).
- **Internal Padding:** `p-6` (1.5rem), `p-7` on larger viewports; `p-8` for empty
  states.

### Inputs / Fields

- **Style:** Shared `.field` — full width, control radius (0.7rem), Line-Strong
  border, translucent white fill (`field-fill`), `0.5rem 0.75rem` padding. Inputs,
  selects, and textareas all use it. Mono-bearing fields (dates, times, flight
  number, registration, seat) add tabular Geist Mono.
- **Hover:** Border darkens to ink-at-0.22.
- **Focus:** Border shifts to azure, fill goes solid white, and a soft 3.5px azure
  halo appears.
- **Error:** Rose message text below the field (`status-error`).

### Navigation

- **Style:** Sticky frosted bar (`bar-fill`, blur, bottom hairline). Wordmark left
  (azure jet icon + "Jetstream"), quiet center links, owner name + sign-out right.
- **Links:** Pill-shaped (`rounded-full`), `text-sm`. Default Slate Soft; hover adds
  a faint white wash and Cool Ink text; active fills with Azure Wash and Quiet Azure
  text at 500 weight. Below `sm`, links move to a scrollable strip.

### Instrument list (candidate / airport results)

A frosted dropdown (`.glass`, control radius) of hairline-divided rows. Each row is
a full-width left-aligned button; hover fills Azure Wash. Primary text is mono at
`text-sm` 500; secondary metadata (times, cities) is mono `text-xs` in Slate Mute.
This is the recurring signature for pickable data.

### Stat readout & data table

The dashboard stat grid is one glass panel of hairline-gutter cells (`gap-px
bg-line`): each cell pairs an uppercase Slate-Mute overline caption with a large
mono figure (`text-xl` 500). Tables use uppercase overline headers, Line dividers
between rows, a faint white hover wash, mono for all measured columns (departure,
route, flight, seat), and sans for prose columns.

## Do's and Don'ts

### Do:

- **Do** build every elevated surface from the one glass material: `glass-fill`
  translucent white + backdrop-blur + Line hairline + the Glass panel shadow.
- **Do** reserve Quiet Azure (`#2f5fe0`) for the single primary action, active nav,
  focus, progress fills, and globe arcs/points — one azure moment per screen.
- **Do** set all measured values (codes, numbers, times, registrations, figures) in
  Geist Mono with `tabular-nums`, and everything else in Hanken Grotesk.
- **Do** use the cool slate tints (`#47535f`, `#566072`) for secondary and muted
  text; keep borders ink-at-low-alpha hairlines.
- **Do** use the two soft radii consistently: 1.25rem for panels, 0.7rem for
  controls, full-round only for nav pills and progress bars.

### Don't:

- **Don't** introduce a second depth system — no solid opaque cards, no neutral or
  hard offset shadows, no shadow ramp. Surfaces frost to lift.
- **Don't** set prose, labels, or headings in Geist Mono; mono is for data only.
- **Don't** use flat neutral gray for text or borders anywhere.
- **Don't** add a second competing azure fill to a screen, or tint chrome azure
  where a slate tint belongs.
- **Don't** revert the globe to a dark night-earth texture; keep it a pale in-engine
  sphere with faint land and azure arcs.
