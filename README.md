# 🐟 Fish for People

A production-quality church service management app for **Saddleback Church Hong Kong** Welcome Team.

Built with React 18 + Tailwind CSS + Vite + Firebase (Firestore + Hosting).

---

## Features

### 1. 🪑 Seat Availability Tracker (Welcome Team)
- Full cinema-style floor plan with 368 seats across 3 sections (Left/Middle/Right)
- Real-time seat toggle — green = available, slate = occupied
- Entrance guide: quick row-by-row availability summary
- Multi-device real-time sync via Firestore

### 2. 🙋 Needs Request System
- **Congregation**: Select section + row + need type → submit → confirmation shown
- **Welcome Team**: Live dashboard with all active requests, sorted by time
- Request types: Pen, Sermon Notes, Water, Bible, Prayer, Other
- "Resolve" button marks requests done with timestamp
- Badge on nav icon shows pending count

### 3. 🔢 Headcount System
- 5 zones: Left, Middle, Right, Production Room, Outside
- Two counters submit independently (no login required)
- Side-by-side comparison with discrepancy highlighting (>5 difference = amber)
- Confirm attendance once both counts agree → saved to Firestore
- History of last 3 confirmed service headcounts

---

## Architecture

Clean Architecture enforced across all layers:

```
src/
  domain/           # Pure TypeScript — zero framework deps
    models/         # Seat, Request, Headcount, Service interfaces
    constants/      # Seating layout (368 seats), request types
    rules/          # Business logic: validate, sort, diff

  infrastructure/   # Firebase implementation
    firebase/       # Config, collection references
    services/       # SeatService, RequestService, HeadcountService

  application/      # Use cases + state
    hooks/          # useSeats, useRequests, useHeadcount, useService
    usecases/       # Pure async functions

  presentation/     # React UI only
    components/     # SeatMap, SeatCell, RequestCard, CountInput, NavBar, Badge
    pages/          # SeatTrackerPage, RequestsPage, HeadcountPage, HomePage
    layouts/        # AppLayout
    theme/          # Color tokens
```

---

## Setup

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- Firebase CLI: `npm install -g firebase-tools`

### Install
```bash
npm install
```

### Configure Firebase
Copy `.env.example` to `.env.local` and fill in your Firebase config:
```bash
cp .env.example .env.local
```

Get values from: [Firebase Console](https://console.firebase.google.com) → Project Settings → Your apps → Web app → SDK setup

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
firebase login
firebase use fish-for-people   # or your project ID
firebase deploy
```

---

## Seating Layout

| Section | Rows | Row 1 seats | Other rows | Total |
|---------|------|-------------|------------|-------|
| Left    | 14   | 6           | 7          | 97    |
| Middle  | 14   | 12          | 13         | 181   |
| Right   | 13   | 6           | 7          | 90    |
| **Total** | — | —          | —          | **368** |

Seat ID format: `{section}-{row}-{col}` e.g. `left-1-1`, `middle-3-7`

---

## Firestore Data Model

```
config/active                    → { serviceId, date }
services/{serviceId}/
  seats/{seatId}                 → { section, row, col, occupied, updatedAt }
  requests/{requestId}           → { section, row, type, note, status, createdAt, resolvedAt }
  headcounts/{entryId}           → { counterName, left, middle, right, production, outside, total, submittedAt }
  confirmedCounts/{date}         → { counterA, counterB, confirmed, totals, confirmedAt }
```

---

## Design System

| Token | Value |
|-------|-------|
| Primary (Navy) | `#1B2B5E` |
| Accent (Gold) | `#C9A84C` |
| Background | `#F8F7F4` |
| Success (Green) | `#22C55E` |
| Occupied (Slate) | `#94A3B8` |
| Warning (Amber) | `#F59E0B` |
| Danger (Red) | `#EF4444` |

---

## Tech Stack

- **React 18** — functional components + hooks only
- **Tailwind CSS v3** — mobile-first utility CSS
- **Vite** — fast build tool
- **Firebase SDK v9+** — modular, tree-shakeable
- **Firestore** — real-time database
- **Firebase Hosting** — CDN hosting

---

## License

MIT
