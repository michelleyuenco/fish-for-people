# Fish for People

> *"Come, follow me," Jesus said, "and I will send you out to fish for people."* — Mark 1:17 (NIV)

A real-time church service management app built for the **Welcome Team** at Saddleback Church Hong Kong. It helps coordinate seating, fulfill congregation requests, and track attendance — all from any phone or tablet.

**Live app:** [fish-for-people.web.app](https://fish-for-people.web.app)

---

## How to Use

### Step 1: Open the App

Visit [fish-for-people.web.app](https://fish-for-people.web.app) on any device. No download or account needed.

### Step 2: Choose Your Role

| Role | Who is it for? |
|------|---------------|
| **Welcome Team** | Ushers and greeters managing the service |
| **I'm Attending** | Congregation members who need assistance |

Your role is remembered for next time. Tap the fish icon in the header to switch roles anytime.

### Step 3: Use the Features

#### If you're on the Welcome Team

**Seats** — Tap seats to mark them as taken or free. The floor plan updates in real time across all devices so the whole team stays in sync.

**Requests** — See live requests from the congregation (pens, offering envelopes, translation headsets, prayer, etc.). Tap "Done" when you've helped someone.

**Headcount** — Count attendance by zone. You can count people directly or count empty seats and let the app calculate. Review your totals, then submit.

**Floor Plan** — Full-screen bird's-eye view of all seats with color-coded availability. Great for quickly directing newcomers.

#### If you're attending

**Request Help** — Tap your seating area on the map, choose what you need (pen, offering envelope, translation headset, prayer, or other), and submit. A team member will come to you. Stay in your seat.

### Languages

The app is available in **English**, **Simplified Chinese** (简体中文), and **Traditional Chinese** (繁體中文). Switch languages from the home screen or the menu.

### Accessibility

- Large text mode available in the menu
- Left-hand / right-hand layout toggle
- Works offline with changes syncing when reconnected

---

## Features

- Real-time seat tracking across 368 seats (Left / Middle / Right sections)
- Congregation request system with live notifications for the team
- Dual-mode headcount: count people or count empty seats
- Full-screen floor plan with seating suggestions
- QR code for congregation self-service requests
- Multi-language support (EN / zh-CN / zh-TW)
- Mobile-first responsive design
- Works on any device with a browser — no install required
- Persistent role and location preferences
- Native share / clipboard support for headcount reports

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 3 |
| Routing | React Router 7 |
| i18n | i18next with browser language detection |
| Backend | Firebase Firestore (real-time sync) |
| Hosting | Firebase Hosting (CDN) |
| Build | Vite 7 |
| QR Codes | qrcode.react |

---

## Architecture

Clean Architecture with clear separation of concerns:

```
src/
  domain/           # Pure TypeScript models, constants, business rules
  infrastructure/   # Firebase config and service implementations
  application/      # React hooks and use cases
  presentation/     # UI components, pages, and layouts
  i18n/             # Translations (EN, zh-CN, zh-TW)
```

---

## Development

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

### Setup

```bash
git clone https://github.com/michelleyuenco/fish-for-people.git
cd fish-for-people
npm install
```

### Configure Firebase

Copy `.env.example` to `.env.local` and fill in your Firebase project credentials:

```bash
cp .env.example .env.local
```

Get values from [Firebase Console](https://console.firebase.google.com) > Project Settings > Your apps > Web app > SDK setup.

### Run locally

```bash
npm run dev
```

### Build and deploy

```bash
npm run build
firebase login
firebase deploy
```

---

## Contributing

This is an open-source project. Contributions, bug reports, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b my-feature`)
3. Commit your changes
4. Push to the branch and open a Pull Request

---

## License

MIT
