# Design Language: Maestro - AI-first higher education

> Extracted from `https://maestro.org/` on April 22, 2026
> 524 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#ecebe4` | rgb(236, 235, 228) | hsl(52, 17%, 91%) | 438 |

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#000000` | hsl(0, 0%, 0%) | 463 |
| `#393937` | hsl(60, 2%, 22%) | 128 |
| `#0a0a0a` | hsl(0, 0%, 4%) | 16 |
| `#aaaaa5` | hsl(60, 3%, 66%) | 6 |
| `#232323` | hsl(0, 0%, 14%) | 4 |
| `#2e2e2e` | hsl(0, 0%, 18%) | 1 |

### Background Colors

Used on large-area elements: `#000000`, `#232323`, `#2e2e2e`

### Text Colors

Text color palette: `#000000`, `#ecebe4`, `#0a0a0a`, `#aaaaa5`

### Gradients

```css
background-image: linear-gradient(to right, rgb(224, 255, 165), rgb(255, 177, 148), rgb(161, 172, 244), rgb(255, 177, 148), rgb(224, 255, 165));
```

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#000000` | text, border, background | 463 |
| `#ecebe4` | text, border, background | 438 |
| `#393937` | border | 128 |
| `#0a0a0a` | text, border | 16 |
| `#aaaaa5` | text, border | 6 |
| `#232323` | background | 4 |
| `#2e2e2e` | background | 1 |

## Typography

### Font Families

- **Wix Madefor Text** — used for body (280 elements)
- **Wix Madefor Display** — used for all (176 elements)
- **Times New Roman** — used for body (64 elements)
- **Arial** — used for body (4 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 64px | 4rem | 600 | 72px | normal | h1 |
| 24px | 1.5rem | 400 | normal | normal | svg, path, button, span |
| 20px | 1.25rem | 500 | 20px | normal | svg, path |
| 16px | 1rem | 400 | normal | normal | html, head, meta, link |
| 14px | 0.875rem | 500 | 20px | normal | button, span, p |
| 12px | 0.75rem | 400 | 18px | 0.11256px | p, a |

### Heading Scale

```css
h1 { font-size: 64px; font-weight: 600; line-height: 72px; }
```

### Body Text

```css
body { font-size: 14px; font-weight: 500; line-height: 20px; }
```

### Font Weights in Use

`500` (273x), `400` (250x), `600` (1x)

## Spacing

**Base unit:** 2px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-1 | 1px | 0.0625rem |
| spacing-4 | 4px | 0.25rem |
| spacing-16 | 16px | 1rem |
| spacing-24 | 24px | 1.5rem |
| spacing-120 | 120px | 7.5rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| md | 9px | 1 |
| lg | 16px | 2 |
| full | 50px | 2 |
| full | 100px | 266 |

## CSS Custom Properties

### Colors

```css
--input-focus-border-color: Highlight;
--input-unfocused-border-color: transparent;
--input-disabled-border-color: transparent;
--input-hover-border-color: #000;
--highlight-bg-color: #b400aa;
--highlight-selected-bg-color: #006400;
--color-border-default: #d0d7de;
--color-text-secondary: #aaaaa5;
--color-text-primary: #ecebe4;
```

### Typography

```css
--react-pdf-text-layer: 1;
```

### Other

```css
--react-pdf-annotation-layer: 1;
--annotation-unfocused-field-background: url("data:image/svg+xml;charset=UTF-8,<svg width='1px' height='1px' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' style='fill:rgba(0, 54, 255, 0.13);'/></svg>");
--input-focus-outline: 1px solid Canvas;
--link-outline: none;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| 0px | 0px | min-width |
| sm | 600px | min-width |
| 900px | 900px | min-width |

## Transitions & Animations

**Easing functions:** `[object Object]`, `[object Object]`

**Durations:** `0.2s`, `0.25s`, `0.15s`

### Common Transitions

```css
transition: all;
transition: fill 0.2s cubic-bezier(0.4, 0, 0.2, 1);
transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
transition: transform 0.2s ease-in-out;
transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

### Keyframe Animations

**fadeOutAndHide**
```css
@keyframes fadeOutAndHide {
  0% { opacity: 1; }
  99% { opacity: 0; display: inline-block; height: auto; }
  100% { opacity: 0; display: none; visibility: hidden; height: 0px; }
}
```

**animation-61bdi0**
```css
@keyframes animation-61bdi0 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**animation-61bdi0**
```css
@keyframes animation-61bdi0 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**animation-1p2h4ri**
```css
@keyframes animation-1p2h4ri {
  0% { stroke-dasharray: 1px, 200px; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 100px, 200px; stroke-dashoffset: -15px; }
  100% { stroke-dasharray: 100px, 200px; stroke-dashoffset: -125px; }
}
```

**animation-1p2h4ri**
```css
@keyframes animation-1p2h4ri {
  0% { stroke-dasharray: 1px, 200px; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 100px, 200px; stroke-dashoffset: -15px; }
  100% { stroke-dasharray: 100px, 200px; stroke-dashoffset: -125px; }
}
```

**animation-3hqiph**
```css
@keyframes animation-3hqiph {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

**animation-3hqiph**
```css
@keyframes animation-3hqiph {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

**mui-auto-fill**
```css
@keyframes mui-auto-fill {
  0% { display: block; }
}
```

**mui-auto-fill**
```css
@keyframes mui-auto-fill {
  0% { display: block; }
}
```

**mui-auto-fill-cancel**
```css
@keyframes mui-auto-fill-cancel {
  0% { display: block; }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (134 instances)

```css
.button {
  background-color: rgb(236, 235, 228);
  color: rgb(236, 235, 228);
  font-size: 14px;
  font-weight: 500;
  padding-top: 8px;
  padding-right: 16px;
  border-radius: 100px 100px 100px 0px;
}
```

### Inputs (2 instances)

```css
.input {
  color: rgb(236, 235, 228);
  border-color: rgb(236, 235, 228);
  border-radius: 0px;
  font-size: 16px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (7 instances)

```css
.link {
  color: rgb(236, 235, 228);
  font-size: 16px;
  font-weight: 400;
}
```

### ProgressBars (3 instances)

```css
.progressBar {
  color: rgb(236, 235, 228);
  border-radius: 0px;
  font-size: 16px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(236, 235, 228);
  padding: 6px 16px 6px 16px;
  border-radius: 100px;
  border: 0px none rgb(236, 235, 228);
  font-size: 14px;
  font-weight: 500;
```

### Button — 130 instances, 2 variants

**Variant 1** (129 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(236, 235, 228);
  padding: 6px 16px 6px 16px;
  border-radius: 100px;
  border: 0px none rgb(236, 235, 228);
  font-size: 14px;
  font-weight: 500;
```

**Variant 2** (1 instance)

```css
  background: rgb(236, 235, 228);
  color: rgb(10, 10, 10);
  padding: 6px 16px 6px 16px;
  border-radius: 100px;
  border: 0px none rgb(10, 10, 10);
  font-size: 14px;
  font-weight: 500;
```

### Input — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(236, 235, 228);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(236, 235, 228);
  font-size: 16px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgb(236, 235, 228);
  color: rgb(10, 10, 10);
  padding: 6px 16px 6px 16px;
  border-radius: 100px;
  border: 0px none rgb(10, 10, 10);
  font-size: 14px;
  font-weight: 500;
```

## Layout System

**0 grid containers** and **156 flex containers** detected.

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 722px | 8px |

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| row/nowrap | 144x |
| column/nowrap | 12x |

**Gap values:** `10px`, `12px`, `16px`, `24px`, `4px`, `8px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 1 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio | Level |
|------------|------------|-------|-------|
| `#0a0a0a` | `#ecebe4` | 16.56:1 | AAA |

## Design System Score

**Overall: 83/100 (Grade: B)**

| Category | Score |
|----------|-------|
| Color Discipline | 100/100 |
| Typography Consistency | 50/100 |
| Spacing System | 100/100 |
| Shadow Consistency | 85/100 |
| Border Radius Consistency | 100/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 75/100 |

**Strengths:** Tight, disciplined color palette, Well-defined spacing scale, Clean elevation system, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**
- 4 font families — consider limiting to 2 (heading + body)
- 24 !important rules — prefer specificity over overrides
- 84% of CSS is unused — consider purging
- 4123 duplicate CSS declarations

## Gradients

**1 unique gradients** detected.

| Type | Direction | Stops | Classification |
|------|-----------|-------|----------------|
| linear | to right | 5 | complex |

```css
background: linear-gradient(to right, rgb(224, 255, 165), rgb(255, 177, 148), rgb(161, 172, 244), rgb(255, 177, 148), rgb(224, 255, 165));
```

## Z-Index Map

**4 unique z-index values** across 2 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| modal | 1000,1500 | div.M.u.i.S.t.a.c.k.-.r.o.o.t. .m.u.i.-.g.h.7.i.t.f, div.M.u.i.B.o.x.-.r.o.o.t. .m.u.i.-.1.g.d.u.5.v.x, div.M.u.i.B.a.c.k.d.r.o.p.-.r.o.o.t. .m.u.i.-.1.8.k.9.l.q.1 |
| base | 0,0 | span.M.u.i.T.o.u.c.h.R.i.p.p.l.e.-.r.o.o.t. .m.u.i.-.w.0.p.j.6.f, span.M.u.i.T.o.u.c.h.R.i.p.p.l.e.-.r.o.o.t. .m.u.i.-.w.0.p.j.6.f, span.M.u.i.T.o.u.c.h.R.i.p.p.l.e.-.r.o.o.t. .m.u.i.-.w.0.p.j.6.f |

## SVG Icons

**5 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
|------------|-------|
| sm | 1 |
| md | 1 |
| lg | 1 |
| xl | 2 |

**Icon colors:** `rgb(0, 0, 0)`, `#AAAAA5`, `rgb(236, 235, 228)`, `rgb(10, 10, 10)`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| Wix Madefor Text | self-hosted | 400, 600 | normal |
| Wix Madefor Display | self-hosted | 400, 600, 700, 800 | normal |

## Motion Language

**Feel:** mixed · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `xs` | `150ms` | 150 |
| `sm` | `200ms` | 200 |

### Easing Families

- **custom** (138 uses) — `cubic-bezier(0.4, 0, 0.2, 1)`
- **ease-in-out** (1 uses) — `ease`

### Keyframes In Use

| name | kind | properties | uses |
|---|---|---|---|
| `animation-61bdi0` | rotate | transform | 1 |
| `animation-61bdi0` | rotate | transform | 1 |
| `animation-1p2h4ri` | custom | stroke-dasharray, stroke-dashoffset | 1 |
| `animation-1p2h4ri` | custom | stroke-dasharray, stroke-dashoffset | 1 |
| `animation-3hqiph` | pulse | background-position | 1 |
| `animation-3hqiph` | pulse | background-position | 1 |
| `mui-auto-fill-cancel` | custom | display | 2 |
| `mui-auto-fill-cancel` | custom | display | 2 |

## Component Anatomy

### button — 132 instances

**Slots:** label, icon

## Brand Voice

**Tone:** neutral · **Pronoun:** third-person · **Headings:** Sentence case (tight)

### Top CTA Verbs

- **ai** (8)
- **software** (4)
- **building** (4)
- **healthcare** (4)
- **edtech** (4)
- **bi** (4)
- **devops** (4)
- **ops** (4)

### Button Copy Patterns

- "👨‍💻 software engineer building next-gen apps" (4×)
- "🧠 ai scientist advancing language at openai" (4×)
- "🏥 healthcare admin improving patient systems" (4×)
- "📈 bi analyst driving strategy at fortune 500s" (4×)
- "🛠️ devops automating systems at aws" (4×)
- "💼 ops manager streamlining operations" (4×)
- "🌱 building a business career from scratch" (2×)
- "🧩 not sure, looking for a role that fits me" (2×)
- "🚀 ai engineer developing space tech at spacex" (2×)
- "💼 business role at a growing company" (2×)

### Sample Headings

> AI-first
higher education

## Page Intent

**Type:** `landing` (confidence 0.45)
**Description:** Maestro is the most effective way to build your career—with AI.

## Section Roles

Reading order (top→bottom): testimonial → nav

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | testimonial | AI-first
higher education | 0.8 |
| 1 | nav | — | 0.4 |

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.014 |
| Shadow profile | none |
| Avg shadow blur | 0px |
| Max radius | 100px |
| backdrop-filter in use | no |
| Gradients | 1 |

## Component Library

**Detected:** `mui` (confidence 0.95)

Evidence:
- 580 Mui*-root classes

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Wix Madefor Text` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
