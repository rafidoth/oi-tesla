---
version: alpha
name: Dhaka Tesla Pool
description: "Dhaka Tesla Pool's product surface is warm, high-energy and street-smart: a bright marigold accent and a teal 'in-motion' signal sit on a warm paper-white canvas, echoing the hand-painted, sun-bright liveries of Dhaka's battery rickshaws without turning the app itself into a carnival. Space Grotesk carries display type and the big fare numbers with a geometric, faintly electric edge; Manrope carries every UI label and paragraph for maximum legibility at small sizes on cheap Android screens. Every ride state — waiting, matched, driver arrived, in progress, done, cancelled — gets its own fixed, calm color, so a glance at a list tells the whole story before you read a word. Corners are friendly and rounded (6–16px, pills for status and chips), elevation is mostly flat-with-hairline, and shadow is spent in exactly two places: cards, and the sticky mobile action bar."
colors:
  primary: "#FF8A1E"
  primary-strong: "#E86F00"
  primary-surface: "#FFF1DE"
  on-primary: "#241A0E"
  teal: "#0EA5A0"
  teal-strong: "#0B7F7B"
  teal-surface: "#E3F7F6"
  accent-amber: "#F2B705"
  accent-amber-surface: "#FFF6D8"
  accent-green: "#1FAE55"
  accent-green-surface: "#E1F7E9"
  accent-slate: "#5B6570"
  accent-slate-surface: "#E9ECEF"
  accent-red: "#E5484D"
  accent-red-surface: "#FDE8E8"
  ink: "#201A15"
  ink-secondary: "#6B6259"
  muted: "#A79E93"
  surface: "#FFFDFA"
  surface-subtle: "#F7F3EC"
  surface-dark: "#171310"
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1px
  display-md:
    fontFamily: Space Grotesk
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.5px
  title-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.25px
  title-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: normal
  title-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: normal
  body:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: normal
  body-medium:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: normal
  body-strong:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: normal
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: normal
  body-sm-regular:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: normal
  caption:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.2px
  fare-display:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: normal
  fare-display-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: normal
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 20px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    borderColor: "{colors.ink}"
    borderWidth: 1px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    boxShadow: rgba(32, 26, 21, 0.03) 0px 1px 2px 0px, rgba(32, 26, 21, 0.04) 0px 6px 16px 0px
    padding: 16px
  card-elevated:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    boxShadow: rgba(32, 26, 21, 0.05) 0px 4px 10px 0px, rgba(32, 26, 21, 0.08) 0px 16px 40px 0px
  status-badge:
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
    note: "backgroundColor/textColor swap per ride state — see §2 Ride-State Colors"
  seat-meter:
    filledColor: "{colors.primary}"
    emptyColor: "{colors.surface-subtle}"
    borderColor: "{colors.muted}"
    rounded: "{rounded.sm}"
  fare-display:
    textColor: "{colors.ink}"
    typography: "{typography.fare-display}"
    numericVariant: tabular-nums
  chip:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    borderColor: "{colors.muted}"
    borderWidth: 1px
    padding: 10px 14px
  navbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    height: 60px
    borderColor: "{colors.surface-subtle}"
    borderWidth: 1px
    position: sticky
  toggle-online:
    onColor: "{colors.accent-green}"
    offColor: "{colors.muted}"
    knobColor: "{colors.surface}"
    rounded: "{rounded.pill}"
  table-row:
    borderColor: "{colors.surface-subtle}"
    borderWidth: 1px
    padding: 12px 16px
  skeleton:
    backgroundColor: "{colors.surface-subtle}"
    rounded: "{rounded.sm}"
---

# Dhaka Tesla Pool

## Overview

This is a **product design system**, not a marketing-site one — Dhaka Tesla Pool's UI surface is the passenger dashboard, the ride tracker, and the driver console described in `Architecture.md` §14, not a landing page with a hero and a logo wall. Every decision here optimizes for the thing this app actually is: something a passenger checks anxiously while standing on a curb in Dhaka heat, and something a driver glances at between fares, often on a low-cost Android phone.

The personality comes from the subject matter, not from SaaS convention. Dhaka's battery-run three-wheelers are colloquially called "Teslas" — a wink the product name already leans into — and they're visually loud: sun-bright hoods, hand-painted panels, vivid folk-art color. This system borrows the *energy* of that (one confident marigold accent, a teal "electric" signal) without borrowing the clutter — the app itself stays calm, legible, and quick to scan, because a pooled-ride app that's hard to read at a glance has failed at its one job.

**Key characteristics:**
- One warm, high-chroma brand accent (marigold) reserved strictly for actions — buttons, links, active states.
- A fixed color for each of the six ride states (`REQUESTED` → `CANCELLED`), used nowhere else, so color always means the same thing.
- Two typefaces: Space Grotesk for display type and fare numerals (a geometric, faintly electric edge), Manrope for everything else (built for legibility at 12–14px on cheap screens).
- The seat meter and status badge are load-bearing UI, not decoration — they visualize the app's actual capacity invariant (`occupiedSeats ≤ capacity`) and lifecycle state, straight from `PRD.md` §6–7.
- Mostly flat surfaces with hairlines; shadow is spent in exactly two places (cards, and the sticky mobile action bar) — never as ambient decoration.
- Friendly, consistent rounding (6–16px, pills for badges/chips) — never sharp, never a single radius reused regardless of hierarchy.
- Mobile-first, single-column by default; the one intentional two-column layout is the driver's roster view on wide screens.

## 1. Colors

The palette has three tiers: one brand accent for actions, six fixed ride-state pairs for status, and a warm-neutral scale for everything else. There are no gradients.

### Brand
- **Marigold** (`{colors.primary}` — #FF8A1E): the only interactive accent. Primary buttons, links, active nav, focus rings.
- **Marigold Strong** (`{colors.primary-strong}` — #E86F00): pressed/hover state.
- **Marigold Surface** (`{colors.primary-surface}` — #FFF1DE): pale tint for selected rows/highlighted zones (e.g. the picked pickup zone in `ZoneSelect`).
- **On Primary** (`{colors.on-primary}` — #241A0E): dark ink used *on* marigold fills — marigold is light enough that dark text, not white, is what actually passes contrast.

### Ride-State Colors
Each state in the ride lifecycle (`PRD.md` §6) gets one fixed color pair, used only for that state, everywhere in the app:

| State | Color | Surface token | Text token |
|---|---|---|---|
| `REQUESTED` (waiting) | Warm grey | `{colors.surface-subtle}` | `{colors.ink-secondary}` |
| `MATCHED` (driver accepted) | Teal | `{colors.teal-surface}` | `{colors.teal-strong}` |
| `DRIVER_ARRIVED` (act now) | Amber | `{colors.accent-amber-surface}` | `{colors.accent-amber}` on dark text |
| `STARTED` (in motion) | Green | `{colors.accent-green-surface}` | `{colors.accent-green}` |
| `COMPLETED` (settled) | Slate | `{colors.accent-slate-surface}` | `{colors.accent-slate}` |
| `CANCELLED` (dead) | Red | `{colors.accent-red-surface}` | `{colors.accent-red}` |

`accent-red` doubles as the generic error/full-pool color (`POOL_FULL`, validation errors) — it's the only accent allowed outside its own status badge.

### Neutrals
- **Ink** (`{colors.ink}` — #201A15): primary text.
- **Ink Secondary** (`{colors.ink-secondary}` — #6B6259): secondary text, `REQUESTED` state, helper copy.
- **Muted** (`{colors.muted}` — #A79E93): placeholders, input borders, empty seat-meter dots.
- **Surface** (`{colors.surface}` — #FFFDFA): the app canvas — warm, not stark white.
- **Surface Subtle** (`{colors.surface-subtle}` — #F7F3EC): card fills, table hairlines, skeleton loaders.
- **Surface Dark** (`{colors.surface-dark}` — #171310): reserved for a future dark/night driver mode — see §9.

No dark theme is built yet; `{colors.surface-dark}` exists as a placeholder token only.

## 2. Typography

Two families. Space Grotesk is used sparingly — display headings and money — precisely because its geometric, slightly mechanical character shouldn't carry a full paragraph.

### Font Family
- **Space Grotesk** — display headings (`display-hero`, `display-md`, `title-lg`) and every fare number. A geometric grotesk with just enough personality to read as "electric" without becoming a gimmick.
- **Manrope** — everything else: body copy, buttons, labels, table cells, captions. Rounded terminals stay legible at 12px on a budget phone screen, which is the actual constraint this app is designed against.

### Hierarchy

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.display-hero}` | 48px | 700 | Login/landing headline only |
| `{typography.display-md}` | 34px | 700 | Page titles ("My Rides", "Driver Console") |
| `{typography.title-lg}` | 24px | 600 | Card titles, pool summary headers |
| `{typography.title-md}` | 20px | 700 | Modal titles, roster header |
| `{typography.title-sm}` | 16px | 700 | List item titles, form section labels |
| `{typography.body}` | 16px | 400 | Body copy |
| `{typography.body-medium}` | 16px | 500 | Emphasized body |
| `{typography.body-strong}` | 16px | 700 | Bold inline text |
| `{typography.body-sm}` | 14px | 500 | Button labels, compact UI |
| `{typography.body-sm-regular}` | 14px | 400 | Small regular text |
| `{typography.caption}` | 12px | 600 | Status badges, timestamps, helper text |
| `{typography.fare-display}` | 28px | 700 | The primary fare number on a ride card |
| `{typography.fare-display-sm}` | 16px | 700 | Inline fare mentions, roster rows |

### Principles
- **Fare and seat numbers always render with `tabular-nums`** so figures don't jitter as a fare recalculates on join/cancel (`Architecture.md` §10.2) — a real, not cosmetic, requirement.
- **Space Grotesk stays out of body copy entirely.** If a screen needs more than a title and a number in Space Grotesk, that's a sign the layout needs a Manrope subhead instead of a bigger display size.
- **No all-caps labels, no letter-spaced eyebrows.** Status is carried by the badge's color and a normal-case word ("Matched", not "MATCHED" or "STATUS: MATCHED").

## 3. Layout

### Spacing
Base-4 scale: `{spacing.xs}` (4px) through `{spacing.4xl}` (64px). `{spacing.lg}` (16px) is the workhorse — card padding, list-row padding, form-field gaps.

### Screen Composition
This app has no marketing grid to speak of; the actual screens (`Architecture.md` §14.1) are:

```text
Passenger dashboard          Ride detail                 Driver console
┌─────────────────┐         ┌─────────────────┐         ┌───────────────────────┐
│ New ride form    │         │ Status badge     │         │ Online/offline toggle │
│  ZoneSelect ×2    │         │ Fare display     │         │ Seat meter            │
│  Seats stepper    │         │ Pool summary      │         ├───────────┬───────────┤
│  Fare estimate     │         │ Cancel (if legal) │         │  Roster    │  Actions  │
├─────────────────┤         └─────────────────┘         │  table     │ (Arrive/  │
│ My rides (list)   │         mobile: single column,      │            │  Start/…) │
│  RideCard × n      │         status badge pinned top     └───────────┴───────────┘
└─────────────────┘                                       desktop only — mobile
mobile: single col.                                        stacks roster as cards
```

Passenger screens are **single column at every breakpoint** — a ride request is inherently sequential (pickup → destination → seats → fare), and a list of rides is inherently a list. The one deliberate two-column layout is the driver's roster + seat meter, and only ≥1024px; a roster table forced into a phone width becomes unreadable, so it collapses to stacked passenger cards instead of a horizontally-scrolling table (see §8).

### Alignment
Left-aligned throughout — this is a form- and list-heavy product, and centered body text or centered form fields slow down scanning. The fare number is the one right-aligned element, mirroring how a receipt reads.

## 4. Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | `{colors.surface-subtle}` fill, no shadow | List rows, roster table rows, skeleton loaders |
| Hairline | 1px `{colors.surface-subtle}` border | Row/section dividers, navbar bottom edge |
| Card shadow | `{components.card}` — two soft low-alpha layers | `RideCard`, `PoolCard` shown as standalone cards |
| Elevated shadow | `{components.card-elevated}` | Modals, and the sticky "Request ride" / lifecycle-action bar pinned to the bottom of mobile screens |

Shadow is spent in exactly two places on purpose: a card that's grouped content, and the one floating action bar that has to visually separate itself from a scrolling list beneath it. Nothing else lifts off the page.

## 5. Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 6px | Seat-meter dots, skeleton blocks |
| `{rounded.md}` | 10px | Buttons, inputs — the default |
| `{rounded.lg}` | 16px | Cards |
| `{rounded.pill}` | 9999px | Status badges, chips, the online/offline toggle |

Rounding is friendly and consistent — slightly softer than a typical enterprise dashboard, because this is a consumer app used on the street, not in an office.

## 6. Components

### Buttons
- **`button-primary`** — marigold fill, dark `on-primary` text, `{rounded.md}`. Exactly one per screen at a time: "Request ride", "Accept", "Start trip". Never used for a status or a neutral acknowledgment.
- **`button-secondary`** — white fill, ink border. Secondary actions: "Cancel", "Decline".
- **`button-ghost`** — no fill, `ink-secondary` text. Tertiary/low-emphasis actions inside a card, e.g. "View details".

### Status Badge
A single component, six color variants (§1). Always a normal-case word in a pill, never an icon alone — color plus text, because color-only fails for anyone colorblind reading a fare screen in bright sun.

### Seat Meter
Filled dots (`{colors.primary}`) for occupied seats, empty outlined dots (`{colors.surface-subtle}` fill, `{colors.muted}` border) for open ones — e.g. ● ● ○ for 2/3 occupied. This is a direct, literal rendering of `occupiedSeats` vs `capacity`; it must never show a number the underlying data doesn't have, and it updates the moment the pool does.

### Fare Display
The fare number in `{typography.fare-display}`, tabular-nums, right-aligned, with "BDT" in `{typography.body-sm-regular}` beside it — never inline with other body text, since it's the number a passenger scans for first.

### Cards
- **`card`** — `RideCard` and `PoolCard`. Status badge top-left, fare top-right, route (pickup → destination) as the title, seat meter and driver info below.
- **`card-elevated`** — modals and the sticky bottom action bar only.

### Forms
- **`input` / `ZoneSelect`** — shared visual treatment: `{colors.muted}` border, `{rounded.md}`. `ZoneSelect` additionally shows only *served* routes (`PRD.md` §12) — an unsupported pair should never even appear as an option, rather than being offered and then rejected.
- **`chip`** — payment method (`Cash` / `TeslaPay`) and zone tags.

### Driver Console
- **`toggle-online`** — green when online, muted grey when offline; this is the one true on/off switch in the product and should look unmistakably different from a status badge.
- **`table-row`** — roster rows: passenger name, pickup, destination, seats, fare (driver-only — never rendered for a passenger view, per `PRD.md` §11).

### System States
- **`skeleton`** — flat `{colors.surface-subtle}` blocks matching the shape of the content loading in; no shimmer animation by default.
- **Empty state** — plain sentence in `{colors.ink-secondary}` plus one action, e.g. "No rides yet — request your first one." Written as an invitation, not an apology.
- **Error state** — `{colors.accent-red}` text, states what happened and what to do next, never "Something went wrong."

## 7. Do's and Don'ts

### Do
- Reserve `{colors.primary}` strictly for actions — never for a status badge, even though `DRIVER_ARRIVED`'s amber sits close to it on the wheel. Two adjacent-but-distinct hues keep "do this" and "this is happening" from blurring together.
- Keep every ride-state color fixed and exclusive to that state (§1) — a badge's color alone should be enough to identify the state.
- Use tabular numerals on every fare and seat count so figures don't visually jump on recalculation.
- Keep passenger screens single-column; reserve two-column layout for the driver roster view on desktop only.
- Write empty and error states as plain, active-voice sentences with a next step, not a mood or an apology.

### Don't
- Don't use accent colors as decoration — no gradient washes, no colored illustration filling empty space.
- Don't render the seat meter or a fare number from anything but the live `occupiedSeats`/`fare_paisa` values — it's data, not an aesthetic bar.
- Don't add a third typeface, and don't let Space Grotesk carry paragraph copy.
- Don't stack more than one elevated shadow (`card-elevated`) on a screen at once — modal *or* sticky action bar, not both.
- Don't design a horizontally-scrolling table for mobile roster views — collapse to stacked cards instead (§8).

## 8. Responsive Behavior

Breakpoints: mobile `<640px`, tablet `640–1024px`, desktop `>1024px`.

Passenger flows (request form, ride list, ride detail) are single-column at every breakpoint — the content is inherently sequential or list-shaped, so extra width just becomes margin, not a second column. The driver's pool view is the one screen that changes shape: below 1024px, each roster row becomes its own stacked card (name, pickup→destination, seats, fare, status); at 1024px and above, those same rows collapse into `{components.table-row}` inside a single roster table beside the seat meter and lifecycle actions.

The bottom sticky action bar (`card-elevated`) is mobile-only; on desktop the same action renders as a normal `button-primary` inline in the card, since there's no need to pin an action to the viewport edge on a large screen.

## 9. Open Decisions

Unlike a template extracted from a live site, this system was originated for a product that doesn't exist yet, so some axes are deliberately left open rather than guessed:

- **Dark / night mode.** `{colors.surface-dark}` is reserved but unbuilt. Drivers working evenings are the most likely beneficiary — worth prototyping before committing to a full dark token set.
- **Bangla-script support.** Space Grotesk and Manrope are Latin-only. If any UI copy needs to render in Bangla, a compatible pairing (e.g. a Bangla-supporting grotesk for body text) needs to be chosen before that work starts — this system doesn't yet answer that question.
- **Motion.** No transition/animation direction has been set. Recommend one deliberate moment (e.g. the seat meter filling in when a passenger joins a pool) rather than default hover/fade transitions everywhere.
- **Iconography.** No icon set has been chosen yet; components above are described by color/shape/text only.

## 10. Iteration Guide

1. **New ride states don't exist** — the lifecycle in `PRD.md` §6 is fixed (`REQUESTED` → `CANCELLED`). If that ever changes, add the new state's color pair here before writing any component code against it.
2. **Change the brand accent once, at `{colors.primary}`.** Every button, link, and focus ring derives from it; don't hardcode the hex anywhere else.
3. **New type roles slot into the existing ladder** between `{typography.display-hero}` and `{typography.caption}` — match the family-per-role rule (Space Grotesk for display/money, Manrope for everything else).
4. **New components describe their state pairing explicitly**, the way `status-badge` does, rather than inventing a one-off color.
5. **Unbreakable boundaries:** one brand accent reserved for actions, six fixed ride-state colors used nowhere else, two typefaces, friendly rounding, shadow in exactly two places. Breaking any of these breaks the "readable at a glance, in bright sun, on a cheap phone" goal this whole system exists to serve.
