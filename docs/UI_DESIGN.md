```yaml
---
version: alpha
name: Dhaka Tesla Pool
description: "A minimal, Uber-inspired light-mode product interface for Dhaka Tesla Pool. The visual system is built around black, white, and restrained neutral grays. Manrope is the only typeface across the entire product. Strong color is reserved for meaningful system states; the brand itself does not use a colorful accent. Layouts remain spacious, functional, and highly scannable on low-cost mobile devices."
colors:
  black: "#000000"
  black-soft: "#171717"
  white: "#FFFFFF"

  ink: "#171717"
  ink-secondary: "#6B6B6B"
  muted: "#A3A3A3"

  surface: "#FFFFFF"
  surface-subtle: "#F6F6F6"
  surface-muted: "#EEEEEE"

  border: "#E5E5E5"
  border-strong: "#D1D1D1"

  success: "#16803C"
  success-surface: "#EAF6EE"

  warning: "#B77900"
  warning-surface: "#FFF5DB"

  error: "#D92D20"
  error-surface: "#FDECEA"

  info: "#276EF1"
  info-surface: "#EDF3FF"

typography:
  display-hero:
    fontFamily: Manrope
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1px

  display-md:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.75px

  title-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.3px

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
    fontWeight: 600
    lineHeight: 1.4
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
    letterSpacing: 0.1px

  fare-display:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.5px

  fare-display-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: normal

rounded:
  sm: 6px
  md: 8px
  lg: 12px
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
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    minHeight: 40px
    padding: 8px 16px

  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    borderColor: "{colors.border-strong}"
    borderWidth: 1px
    minHeight: 40px
    padding: 8px 16px

  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    minHeight: 36px
    padding: 6px 10px

  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    padding: 16px

  card-elevated:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    boxShadow: rgba(0, 0, 0, 0.08) 0px 4px 16px 0px
    padding: 16px

  status-badge:
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 10px

  seat-meter:
    filledColor: "{colors.black}"
    emptyColor: "{colors.surface-muted}"
    borderColor: "{colors.border-strong}"
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
    padding: 4px 10px

  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    borderColor: "{colors.border-strong}"
    borderWidth: 1px
    minHeight: 42px
    padding: 8px 12px

  navbar:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    height: 56px
    borderColor: "{colors.border}"
    borderWidth: 1px
    position: sticky

  toggle-online:
    onColor: "{colors.black}"
    offColor: "{colors.surface-muted}"
    knobColor: "{colors.white}"
    rounded: "{rounded.pill}"

  table-row:
    borderColor: "{colors.border}"
    borderWidth: 1px
    padding: 12px 16px

  skeleton:
    backgroundColor: "{colors.surface-subtle}"
    rounded: "{rounded.sm}"
---
```

# Dhaka Tesla Pool

## Table of Contents

* [Overview](#overview)
* [1. Colors](#1-colors)

  * [Brand Palette](#brand-palette)
  * [Semantic Colors](#semantic-colors)
  * [Neutrals](#neutrals)
* [2. Typography](#2-typography)

  * [Font Family](#font-family)
  * [Hierarchy](#hierarchy)
  * [Principles](#principles)
* [3. Layout](#3-layout)

  * [Spacing](#spacing)
  * [Screen Composition](#screen-composition)
  * [Alignment](#alignment)
* [4. Elevation & Depth](#4-elevation--depth)
* [5. Shapes](#5-shapes)
* [6. Components](#6-components)

  * [Buttons](#buttons)
  * [Status Badge](#status-badge)
  * [Seat Meter](#seat-meter)
  * [Fare Display](#fare-display)
  * [Cards](#cards)
  * [Forms](#forms)
  * [Driver Console](#driver-console)
  * [System States](#system-states)
* [7. Do's and Don'ts](#7-dos-and-donts)
* [8. Responsive Behavior](#8-responsive-behavior)
* [9. Open Decisions](#9-open-decisions)
* [10. Iteration Guide](#10-iteration-guide)

---

## Overview

Dhaka Tesla Pool uses a **minimal, monochrome product interface inspired by the visual restraint of Uber's consumer product**.

The interface is intentionally not colorful. Black provides the primary visual hierarchy, white provides the canvas, and neutral grays establish structure. Semantic colors appear only when the interface needs to communicate a system state such as success, warning, error, or active information.

The design should feel:

* Fast
* Clean
* Functional
* Spacious
* Familiar
* Easy to scan
* Comfortable on inexpensive Android screens

This is a **product UI**, not a marketing website.

There are no decorative gradients, colorful backgrounds, illustrations used as decoration, oversized visual treatments, or unnecessary component variants.

The product's identity comes from its interaction model and content rather than a heavily branded visual layer.

### Core principles

* **Black means action.**
* **White means space.**
* **Gray means structure.**
* **Semantic colors mean system state.**
* **One typeface everywhere.**
* **Few component variants.**
* **Generous spacing despite compact controls.**
* **Minimal borders and restrained elevation.**
* **Information hierarchy comes from size, weight, spacing, and position rather than color.**

---

# 1. Colors

The palette is deliberately narrow.

Unlike the previous system, there is **no marigold, teal, amber, or other brand accent**.

The visual hierarchy is driven primarily by black and neutral tones.

## Brand Palette

### Black

`{colors.black}` — `#000000`

The primary action and strongest visual element.

Used for:

* Primary buttons
* Active navigation
* Selected controls
* Important icons
* Primary interactive elements
* Seat-meter filled states
* Strong headings when appropriate

Black should not be used as a decorative background unnecessarily.

### Soft Black

`{colors.black-soft}` — `#171717`

Used for:

* Primary text
* Large headings
* High-emphasis labels
* Fare values

Using soft black for text rather than pure black reduces visual harshness.

### White

`{colors.white}` — `#FFFFFF`

Used as the primary application surface.

---

## Semantic Colors

Color is reserved for **meaning**, not branding.

### Success

* `success` — `#16803C`
* `success-surface` — `#EAF6EE`

Used for:

* Completed operations
* Successful confirmations
* Online state when necessary
* Positive system feedback

### Warning

* `warning` — `#B77900`
* `warning-surface` — `#FFF5DB`

Used for:

* Driver arriving
* Attention-required states
* Important but non-error conditions

### Error

* `error` — `#D92D20`
* `error-surface` — `#FDECEA`

Used for:

* Cancelled rides
* Validation errors
* Failed operations
* Full pools
* Destructive warnings

### Information

* `info` — `#276EF1`
* `info-surface` — `#EDF3FF`

Used sparingly for:

* Informational system messages
* Neutral system notifications
* Non-critical guidance

Semantic colors must never become decorative accents.

---

## Neutrals

| Token            | Value     | Purpose                   |
| ---------------- | --------- | ------------------------- |
| `ink`            | `#171717` | Primary text              |
| `ink-secondary`  | `#6B6B6B` | Secondary text            |
| `muted`          | `#A3A3A3` | Placeholder/disabled text |
| `surface`        | `#FFFFFF` | Main application surface  |
| `surface-subtle` | `#F6F6F6` | Secondary surfaces        |
| `surface-muted`  | `#EEEEEE` | Disabled/empty controls   |
| `border`         | `#E5E5E5` | Default borders           |
| `border-strong`  | `#D1D1D1` | Input/control borders     |

The neutral palette should do most of the visual work.

---

# 2. Typography

## Font Family

**Manrope is the only typeface in the product.**

There is no secondary display font.

Manrope is used for:

* Headings
* Body text
* Buttons
* Fare values
* Navigation
* Tables
* Labels
* Status badges
* Forms
* Numbers

This makes the interface more coherent and removes unnecessary typographic contrast.

---

## Hierarchy

| Token             | Size | Weight | Use                       |
| ----------------- | ---: | -----: | ------------------------- |
| `display-hero`    | 44px |    700 | Login/landing headline    |
| `display-md`      | 32px |    700 | Page titles               |
| `title-lg`        | 24px |    700 | Major section/card titles |
| `title-md`        | 20px |    700 | Modal/pool titles         |
| `title-sm`        | 16px |    700 | List/form headings        |
| `body`            | 16px |    400 | Standard content          |
| `body-medium`     | 16px |    500 | Emphasized content        |
| `body-strong`     | 16px |    700 | Strong inline content     |
| `body-sm`         | 14px |    600 | Buttons and compact UI    |
| `body-sm-regular` | 14px |    400 | Secondary information     |
| `caption`         | 12px |    600 | Metadata/status           |
| `fare-display`    | 28px |    700 | Main fare                 |
| `fare-display-sm` | 16px |    700 | Compact fare              |

### Principles

**No all-caps UI.**

Use:

> Matched

instead of:

> MATCHED

Avoid unnecessary letter spacing.

Fare and seat numbers use:

```css
font-variant-numeric: tabular-nums;
```

Numbers should remain visually stable when values change.

---

# 3. Layout

## Spacing

The system retains a 4px base scale:

```text
4
8
12
16
24
32
48
64
```

`16px` remains the primary spacing unit.

However, controls are compact while **sections remain spacious**.

For example:

```text
Form section
    ↓ 24px
Field
    ↓ 12px
Field
    ↓ 24px
Next section
```

The goal is not to make every element large.

The goal is to keep **related elements compact and unrelated sections clearly separated**.

---

## Screen Composition

### Passenger Dashboard

```text
┌──────────────────────────────┐
│ Navigation                   │
├──────────────────────────────┤
│                              │
│ My rides                     │
│                              │
│ ┌──────────────────────────┐ │
│ │ Matched             ৳120 │ │
│ │ Banani → Gulshan         │ │
│ │ ● ● ○                    │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Completed           ৳90  │ │
│ │ Dhanmondi → Farmgate     │ │
│ └──────────────────────────┘ │
│                              │
│        + Request ride        │
│                              │
└──────────────────────────────┘
```

### Ride Detail

```text
┌──────────────────────────────┐
│ ← Ride                       │
│                              │
│ Matched                      │
│                              │
│ Banani Road 11               │
│          ↓                   │
│ Gulshan 1                    │
│                              │
│ ──────────────────────────── │
│                              │
│ Fare                    ৳120 │
│                              │
│ Seats                   ●●○  │
│                              │
│ Driver                       │
│ Bullet • Dhaka Tesla        │
│                              │
│                              │
│       Cancel ride            │
└──────────────────────────────┘
```

### Driver Console

Desktop:

```text
┌──────────────────────────────────────────────┐
│ Driver Console                    Online ●   │
├──────────────────────────────────────────────┤
│                                              │
│ ┌────────────────────┐ ┌───────────────────┐ │
│ │ Pool               │ │ Actions           │ │
│ │                    │ │                   │ │
│ │ ● ● ○              │ │ Arrive            │ │
│ │ 2 / 3 seats        │ │ Start trip        │ │
│ │                    │ │ Complete          │ │
│ └────────────────────┘ └───────────────────┘ │
│                                              │
│ Passengers                                   │
│ ──────────────────────────────────────────── │
│ Nusrat   Mohakhali → Gulshan     1 seat     │
│ Rafiq    Banani → Gulshan         1 seat     │
│                                              │
└──────────────────────────────────────────────┘
```

Mobile stacks the same information vertically.

---

## Alignment

Default alignment is left.

Avoid centered layouts for functional content.

The main exception is:

* Empty states
* Authentication screens
* Small confirmation messages

Fare values are right-aligned where they appear beside other ride information.

---

# 4. Elevation & Depth

The system is intentionally flatter than the previous version.

### Flat

Used for:

* Main page
* Lists
* Sections
* Table rows

### Border

A `1px` neutral border is the default grouping mechanism.

### Card

Cards use a subtle border first.

Shadow is optional and extremely restrained.

```text
border: 1px solid #E5E5E5
```

### Elevated

Only use a shadow when an element must visually float above other content:

* Mobile action bar
* Modal/dialog

Avoid decorative shadows.

---

# 5. Shapes

| Token  |  Value | Use                  |
| ------ | -----: | -------------------- |
| `sm`   |    6px | Small indicators     |
| `md`   |    8px | Buttons, inputs      |
| `lg`   |   12px | Cards                |
| `pill` | 9999px | Status/chips/toggles |

The system is slightly less rounded than the previous version.

Avoid excessive "rounded SaaS" styling.

---

# 6. Components

## Buttons

Buttons are intentionally shorter than the previous design.

### Primary

```text
Height: 40px
Padding: 8px 16px
Radius: 8px
Background: #000000
Text: #FFFFFF
```

Examples:

* Request ride
* Accept
* Start trip
* Complete trip

### Secondary

```text
Height: 40px
Padding: 8px 16px
Radius: 8px
Background: #FFFFFF
Border: #D1D1D1
Text: #171717
```

Examples:

* Cancel
* Decline
* Back

### Ghost

```text
Height: 36px
Padding: 6px 10px
Background: transparent
Text: #6B6B6B
```

Use only for low-priority actions.

### Button rule

A screen should normally have **one visually dominant black action**.

Do not create multiple competing black buttons.

---

## Status Badge

Status badges communicate state, not branding.

| State          | Treatment    |
| -------------- | ------------ |
| Requested      | Neutral gray |
| Matched        | Blue/info    |
| Driver Arrived | Warning      |
| Started        | Success      |
| Completed      | Neutral gray |
| Cancelled      | Error        |

The badge always contains text.

Never rely exclusively on color.

Example:

```text
Matched
Driver arrived
In progress
Completed
Cancelled
```

---

## Seat Meter

Keep the literal representation:

```text
● ● ○
```

Filled:

```text
#000000
```

Empty:

```text
#EEEEEE
```

Border:

```text
#D1D1D1
```

The seat meter represents actual capacity data.

It is not a decorative progress bar.

---

## Fare Display

Fare is one of the strongest pieces of information on a ride card.

```text
৳120
```

Use:

* Manrope
* 28px
* 700 weight
* Tabular numerals

Avoid adding a colored background to the fare.

The number itself provides the emphasis.

---

## Cards

Cards should be visually quiet.

```text
background: #FFFFFF
border: 1px solid #E5E5E5
border-radius: 12px
padding: 16px
```

A typical ride card:

```text
Matched                         ৳120

Banani Road 11
        ↓
Gulshan 1

● ● ○     2 seats
Bullet • Driver
```

Avoid:

* Colored card backgrounds
* Large shadows
* Gradient cards
* Excessive icons
* Decorative illustrations

---

## Forms

Inputs:

```text
height: 42px
padding: 8px 12px
border: 1px solid #D1D1D1
border-radius: 8px
background: #FFFFFF
```

Focused input:

```text
border: 1px solid #000000
```

Do not introduce a colorful focus border.

Forms should have breathing space through **vertical section spacing**, not oversized controls.

---

## Driver Console

The driver console should prioritize immediate recognition.

Hierarchy:

```text
Online/offline
    ↓
Pool capacity
    ↓
Current passengers
    ↓
Lifecycle action
```

The lifecycle action is the dominant control.

Do not visually compete with it using decorative cards or multiple accent colors.

---

## System States

### Loading

Use neutral skeletons:

```text
#F6F6F6
```

No shimmer by default.

### Empty

```text
No rides yet

Request your first ride.
```

Keep it short.

### Error

Use the error semantic color only for the error itself.

```text
Ride request failed

The selected route is currently unavailable.
```

Do not use:

> Something went wrong.

---

# 7. Do's and Don'ts

## Do

* Use Manrope everywhere.
* Use black as the primary interactive color.
* Keep the background white.
* Use neutral gray for hierarchy and structure.
* Use semantic colors only when they communicate actual state.
* Keep buttons around 40px high.
* Give sections 24–32px of breathing room.
* Use borders before shadows.
* Keep cards visually quiet.
* Use tabular numerals for fares and seat counts.
* Maintain a strong information hierarchy through typography and spacing.

## Don't

* Don't use marigold, teal, purple, or another brand accent.
* Don't introduce gradients.
* Don't use multiple colorful cards.
* Don't use large rounded containers everywhere.
* Don't make every control 48–56px tall.
* Don't compensate for compact controls by reducing section spacing.
* Don't use shadows as decoration.
* Don't use icons as the only indicator of state.
* Don't use multiple competing primary buttons.
* Don't introduce another font.
* Don't make the interface visually resemble a generic colorful SaaS dashboard.

---

# 8. Responsive Behavior

Breakpoints:

```text
mobile: <640px
tablet: 640–1024px
desktop: >1024px
```

Passenger interfaces remain single-column.

The driver's desktop console can use two columns:

```text
Roster | Pool + Actions
```

At mobile widths:

```text
Pool
↓
Passengers
↓
Actions
```

No horizontal scrolling.

### Mobile action bar

The lifecycle action can become a sticky bottom action bar on mobile.

It should have:

* White background
* Thin top border
* Subtle shadow
* 16px horizontal padding
* One primary black button

The action bar should not become visually heavy.

---

# 9. Open Decisions

The following are intentionally excluded from the current system:

### Dark mode

Not supported.

The product is **light mode only**.

Do not introduce dark-mode tokens until there is a concrete product requirement.

### Bangla

Bangla support should use a compatible Manrope-adjacent fallback when required. The interface should preserve the same typographic hierarchy rather than introducing a visually unrelated typeface.

### Motion

Motion should be restrained.

Use transitions for:

* Button state changes
* Navigation
* Seat-meter updates
* Ride-state transitions

Avoid:

* Decorative animations
* Continuous motion
* Excessive page transitions
* Shimmer by default

### Iconography

Use a simple, consistent line-icon system.

Icons should support comprehension rather than become decorative UI elements.

---

# 10. Iteration Guide

1. **Black is the brand/action color.** New primary actions derive from `{colors.black}`.
2. **Keep the palette monochrome.** Add semantic colors only when the interface needs to communicate state.
3. **Manrope is the only typeface.** Do not introduce a display font.
4. **Use spacing for hierarchy.** Do not make components larger simply to create visual separation.
5. **Prefer borders over shadows.**
6. **Keep controls compact but comfortable.**
7. **Use semantic color only for semantic information.**
8. **Keep cards quiet.** Content should provide the visual hierarchy.
9. **Maintain generous section spacing even when individual controls are compact.**
10. **Do not add visual complexity unless it improves comprehension or interaction.**

## Unbreakable boundaries

```text
ONE FONT
Manrope

ONE PRIMARY ACTION COLOR
Black

ONE BASE SURFACE
White

NEUTRAL STRUCTURE
Gray borders + surfaces

SEMANTIC COLOR
Only for actual system states

LIGHT MODE
No dark theme

MINIMAL ELEVATION
Borders first, shadows only when necessary

COMPACT CONTROLS
~40–42px

GENEROUS LAYOUT
16–32px spacing between meaningful groups
```

The resulting visual language is significantly closer to **Uber's functional, monochrome product UI philosophy** than the original Dhaka-themed palette: the Dhaka identity comes from the product, routes, terminology, and interaction design rather than from colorful UI decoration.
