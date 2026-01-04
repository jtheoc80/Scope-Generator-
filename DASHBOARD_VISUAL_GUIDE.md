# Contractor Proposal Dashboard - Visual Guide

## Complete Layout Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│  ALERT BANNER (if drafts exist)                                      │
│  ┌───┐                                                                │
│  │ ! │  Action Required                                              │
│  └───┘  You have 2 draft proposals waiting to be sent.              │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  HEADER                                                               │
│                                                                        │
│  Proposal Dashboard                      [New Proposal Button]        │
│  Manage and track your contractor proposals                           │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  METRIC CARDS (4 columns on desktop)                                  │
│                                                                        │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────┐│
│  │ [ACTION NEEDED]│ │                │ │                │ │        ││
│  │                │ │                │ │                │ │        ││
│  │  [2]  Pending  │ │  [$] Pipeline  │ │  [%] Win Rate  │ │ [—]    ││
│  │       Proposals│ │      Value     │ │                │ │ Avg    ││
│  │                │ │                │ │                │ │ Resp.  ││
│  │       2        │ │   $47,700      │ │      0%        │ │  —     ││
│  │  Awaiting...   │ │  +33% vs last  │ │  Target: 30%   │ │ No data││
│  │                │ │      month     │ │                │ │        ││
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────┘│
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  CONVERSION FUNNEL                                                    │
│                                                                        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────┐│
│  │ Draft   │ →  │ Sent    │ →  │ Viewed  │ →  │Accepted │ →  │Won ││
│  │   2     │    │   0     │    │   1     │    │   0     │    │ 0  ││
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┘│
│  (gold bg)      (gray bg)      (gray bg)      (gray bg)    (green)  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Insight: 2 proposals are in draft status.                      │  │
│  │ Sending them could increase your pipeline by $23,700.          │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  INSIGHTS GRID (2 columns)                                            │
│                                                                        │
│  ┌─────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ PERFORMANCE BENCHMARKS      │ │ RECOMMENDED ACTIONS          │   │
│  │                             │ │                              │   │
│  │ Industry avg win rate       │ │ Send draft proposals         │   │
│  │                    27-35%   │ │ [High Priority]              │   │
│  │ ─────────────────────────── │ │ ──────────────────────────── │   │
│  │ Your current win rate       │ │ Set up follow-up reminders   │   │
│  │                        0%   │ │ [Recommended]                │   │
│  │ ─────────────────────────── │ │ ──────────────────────────── │   │
│  │ Proposals needed for 30%    │ │ Review pricing strategy      │   │
│  │                       10+   │ │ [Optional]                   │   │
│  │ ─────────────────────────── │ │ ──────────────────────────── │   │
│  │ Avg time to first view      │ │ Customize templates          │   │
│  │                        —    │ │ [Optional]                   │   │
│  └─────────────────────────────┘ └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  PROPOSALS TABLE                                                      │
│                                                                        │
│  Recent Proposals            [Search...] [Status Filter ▼]            │
│  ────────────────────────────────────────────────────────────────────│
│  CUSTOMER    TRADE      AMOUNT   STATUS   CREATED   ACTIVITY  ACTIONS│
│  ────────────────────────────────────────────────────────────────────│
│  Anderson    Roofing   $15,500  [Draft]  2024-...  Not sent  [Send] │
│  Construc.                                          yet       [Now]  │
│  ────────────────────────────────────────────────────────────────────│
│  Miller      HVAC       $8,200  [Draft]  2024-...  Not sent  [Send] │
│  Home Svc.                                          yet       [Now]  │
│  ────────────────────────────────────────────────────────────────────│
│  Johnson     Kitchen   $24,000  [Viewed] 2023-...  2 days    [View] │
│  Renova.     Remodel                                ago       [Edit] │
│  ────────────────────────────────────────────────────────────────────│
└──────────────────────────────────────────────────────────────────────┘
```

## Color Coding Reference

### Alert Banner
- Background: White
- Left Border: 3px solid #d69e2e (gold)
- Icon Background: #fef5e7 (light gold)
- Icon Text: #d69e2e (gold)
- Title Text: #d69e2e (gold)
- Description Text: #b7791f (darker gold)

### Metric Cards

#### Pending Proposals (Highlighted)
- Border: 2px solid #d69e2e (gold)
- Badge Background: #fef5e7 (light gold)
- Badge Border: #d69e2e (gold)
- Badge Text: #d69e2e (gold)
- Icon Background: #fef5e7 (light gold)
- Icon Text: #d69e2e (gold)

#### Other Metric Cards
- Border: 1px solid #e2e8f0 (light gray)
- Background: White
- Icon Background: #f7fafc (very light gray)
- Icon Text: #2d3748 (dark slate)
- Main Number: #1a202c (near black)
- Helper Text: #718096 (medium gray)
- Trend Positive: #15803d (green)

### Conversion Funnel

#### Draft Stage
- Background: #fef5e7 (light gold)
- Border: #d69e2e (gold)
- Text: #1a202c (near black)

#### Middle Stages (Sent, Viewed, Accepted)
- Background: #f7fafc (light gray)
- Border: #e2e8f0 (light border)
- Text: #1a202c (near black)

#### Won Stage
- Background: #f0fdf4 (light green)
- Border: #86efac (green)
- Text: #1a202c (near black)

#### Arrows
- Color: #cbd5e0 (light gray)

#### Insight Box
- Background: #f7fafc (light gray)
- Left Border: 3px solid #718096 (medium gray)
- Text: #1a202c (near black)

### Insights Grid

#### Cards
- Background: White
- Border: 1px solid #e2e8f0
- Header Text: #718096 (uppercase)
- Row Text: #1a202c
- Values: #718096 or #dc2626 (red for bad metrics)

#### Action Badges
- High Priority: Background #fee2e2, Text #dc2626
- Recommended: Background #fef5e7, Text #d69e2e
- Optional: Background #f7fafc, Text #718096, Border #e2e8f0

### Proposals Table

#### Header
- Background: #f7fafc (light gray)
- Border: #e2e8f0
- Text: #718096 (uppercase)

#### Rows
- Background: White
- Hover: #f7fafc
- Border: #e2e8f0

#### Status Badges
- Draft: bg-gray-100, text-gray-700, border-gray-300
- Sent: bg-blue-50, text-blue-700, border-blue-200
- Viewed: bg-purple-50, text-purple-700, border-purple-200
- Accepted: bg-green-50, text-green-700, border-green-200
- Won: bg-green-100, text-green-800, border-green-300

#### Buttons
- Primary "Send Now": bg-#2d3748, text-white, hover-#1a202c
- Secondary "View/Edit": bg-white, border-#e2e8f0, text-#718096, hover-#f7fafc

## Interactive Elements

### Hover States
```
┌─────────────────┐         ┌─────────────────┐
│  Normal State   │  -200ms→│  Hover State    │
│  bg: white      │         │  bg: #f7fafc    │
│  border: #e2e8f0│         │  border: #2d3748│
└─────────────────┘         └─────────────────┘
```

### Focus States
```
┌─────────────────┐         ┌─────────────────┐
│  Normal Input   │  focus→ │  Focused Input  │
│  border: #e2e8f0│         │  ring: #2d3748  │
│                 │         │  ring-width: 2px│
└─────────────────┘         └─────────────────┘
```

## Mobile Layout (< 640px)

```
┌────────────────────┐
│  ALERT BANNER      │
│  (full width)      │
└────────────────────┘
┌────────────────────┐
│  HEADER            │
│  (stacked)         │
└────────────────────┘
┌────────────────────┐
│  Pending Card      │
└────────────────────┘
┌────────────────────┐
│  Pipeline Card     │
└────────────────────┘
┌────────────────────┐
│  Win Rate Card     │
└────────────────────┘
┌────────────────────┐
│  Response Card     │
└────────────────────┘
┌────────────────────┐
│  FUNNEL            │
│  (horizontal       │
│   scroll)          │
└────────────────────┘
┌────────────────────┐
│  BENCHMARKS        │
└────────────────────┘
┌────────────────────┐
│  ACTIONS           │
└────────────────────┘
┌────────────────────┐
│  TABLE             │
│  (horizontal       │
│   scroll)          │
└────────────────────┘
```

## Desktop Layout (> 1024px)

```
┌──────────────────────────────────────────────┐
│  Alert Banner (full width)                   │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  Header (horizontal)                         │
└──────────────────────────────────────────────┘
┌──────┬──────┬──────┬──────┐
│  P1  │  P2  │  P3  │  P4  │  ← 4 Metric Cards
└──────┴──────┴──────┴──────┘
┌──────────────────────────────────────────────┐
│  Conversion Funnel (5 stages horizontal)     │
└──────────────────────────────────────────────┘
┌─────────────────────┬────────────────────────┐
│  Benchmarks         │  Actions               │  ← 2 Column Grid
└─────────────────────┴────────────────────────┘
┌──────────────────────────────────────────────┐
│  Proposals Table (full width)                │
└──────────────────────────────────────────────┘
```

## Typography Examples

### Headers
```
Proposal Dashboard
Font: 24px / 600 weight
Color: #1a202c
```

### Subheaders
```
PERFORMANCE BENCHMARKS
Font: 12px / 600 weight
Color: #718096
Transform: uppercase
Letter-spacing: 0.05em
```

### Body Text
```
Industry avg win rate
Font: 14px / 400 weight
Color: #1a202c
```

### Small Text
```
Awaiting action
Font: 12px / 400 weight
Color: #718096
```

### Metrics
```
$47,700
Font: 24px / 600 weight
Color: #1a202c
```

## Spacing Grid

```
Card Internal Padding: 24px
Card Gap: 16px
Section Gap: 24px
Row Padding: 16px vertical
Button Padding: 10px vertical, 12px horizontal
Input Padding: 8px vertical, 12px horizontal
```

## Border Radius Guide

```
Cards: 8px
Buttons: 6px
Badges: 6px
Inputs: 6px
Icons: 8px
Alert Banner: 0px (full width)
```

## Shadow Values

```
Cards: 
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1),
              0 1px 2px -1px rgb(0 0 0 / 0.1)

Buttons (hover):
  No shadow - just color change
```

---

This visual guide complements the main README and provides exact specifications for implementing the design in any framework or design tool.
