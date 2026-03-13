<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Hosting%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

<h1 align="center">Fish for People</h1>

<p align="center">
  <em>"Come, follow me," Jesus said, "and I will send you out to fish for people."</em><br/>
  <strong>— Mark 1:17 (NIV)</strong>
</p>

<p align="center">
  A real-time church welcome team coordination app — built to serve, built with love.
</p>

<p align="center">
  <strong>English</strong> | <a href="#繁體中文">繁體中文</a> | <a href="#简体中文">简体中文</a>
</p>

**Live app:** [fish-for-people.web.app](https://fish-for-people.web.app)

---

## What is Fish for People?

**Fish for People** is an open-source, real-time web application that empowers church welcome teams to coordinate seating, respond to congregation needs, and track attendance — all from their phones during a live service. No downloads, no accounts, no friction.

The name is inspired by the early Christian symbol of the fish (IXOYE) and Jesus' call to His disciples to become "fishers of people." Every feature is designed with one purpose: to serve each person who walks through the door with warmth, dignity, and care.

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

**Request Help** — Tap your seating area on the map, choose what you need, and submit. A team member will come to you — stay in your seat.

### Two Roles, One Mission

| Welcome Team | Congregation |
|---|---|
| Real-time seat tracking across 368 seats | Self-service request submission from their seat |
| Live request queue with one-tap resolution | Choose from pens, sermon notes, offering envelopes, translation headsets, prayer, and more |
| Dual-mode attendance headcount | Real-time status updates — know when help is on the way |
| Full-screen floor plan with seating guidance | No app install required — works in any browser |
| Service wrap-up analytics and reports | Multilingual support: English, Traditional & Simplified Chinese |

## Features

### Seat Tracking
Real-time occupancy tracking for 368 seats across three sections (Left, Middle, Right). Color-coded availability with row-level toggling, undo/redo, reserved sections for families/elderly and volunteers, and fill-direction guidance.

### Floor Plan
A full-screen bird's-eye view of the entire venue. Highlights suggested seating to keep aisles open, shows real-time capacity percentages, and includes a QR code for congregation self-service.

### Congregation Requests
Attendees tap their area on a floor plan, choose what they need, and submit. The welcome team sees requests arrive in real-time, filtered by type and section, and marks each one as done with a single tap.

**Available request types:** Pen, Sermon Notes, Offering Envelope, Offering Envelope (Dream Now), Translation Headset, Prayer, Other

### Attendance Headcount
Two independent counters submit zone-by-zone headcounts. The app detects discrepancies and, when counts agree, confirms the final attendance. Supports two counting modes:
- **People Mode** — count each person directly
- **Empty Seat Mode** — count empty seats and let the app calculate attendance from total capacity

Share your count via native share or clipboard with a single tap.

### Multilingual
Full localization in **English**, **Traditional Chinese (繁體中文)**, and **Simplified Chinese (简体中文)** with automatic browser language detection. Switch languages from the home screen or the menu.

### Accessibility
- Large text mode toggle
- Left-hand / right-hand layout preference
- Keyboard-navigable with skip-to-content links
- Responsive mobile-first design with safe-area support
- Works offline with changes syncing when reconnected

---

## Privacy & Security

**We take privacy and security seriously.** Every person who walks into a church service deserves to know that their information is treated with the utmost respect. We have made our best efforts to ensure that we will not compromise on the protection of user data, and we are committed to maintaining the highest standards of privacy and security in everything we build.

### What We Collect — and What We Don't

- **No user accounts or authentication are required.** The app is designed for anonymous use during a church service.
- **No personal data is stored beyond the service.** Contact information collected for translation headset returns (name and phone number) is used solely for that purpose and is intended to be deleted after the service ends.
- **No analytics or tracking.** We do not use cookies for tracking, and we do not collect behavioral data.

### How We Protect Your Data

- **Input sanitization** — All user-provided text is sanitized before being written to the database. HTML tags are stripped, text is trimmed, and maximum lengths are enforced to prevent injection attacks.
- **Content Security Policy (CSP)** — Strict CSP headers are enforced in production, restricting scripts to same-origin only and blocking unauthorized content loading.
- **Security headers** — The application is served with `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers to protect against clickjacking, MIME sniffing, and unauthorized API access.
- **No `dangerouslySetInnerHTML`** — All dynamic content is rendered using safe React components. We use the `Trans` component from react-i18next for localized text that requires formatting, ensuring no raw HTML is ever injected into the DOM.
- **Firestore rules** — Data shape validation is enforced at the database level. Request types, quantities, note lengths, phone formats, and status transitions are all validated server-side to prevent data corruption.
- **Privacy notice** — When contact information is required (e.g., for translation headset returns), a clear privacy notice is displayed explaining what the data is used for and that it will be deleted after the service.
- **Camera, microphone, and geolocation** are explicitly disabled via `Permissions-Policy`.

We believe that security is not a feature — it is a responsibility. We are committed to continuous improvement in this area and welcome contributions that help us do better.

---

## Architecture

The project follows **Clean Architecture** principles, with clear separation of concerns across four layers:

```
src/
├── domain/            # Pure TypeScript — models, constants, business rules
│   ├── models/        # Request, Seat, Service, Headcount interfaces
│   ├── constants/     # Seating layout (368 seats), request types, storage keys
│   └── rules/         # Business logic: seat rules, request rules, headcount rules,
│                      #   seating guidance, input sanitization
├── infrastructure/    # Firebase integration
│   ├── firebase/      # Configuration and Firestore collection references
│   └── services/      # SeatService, RequestService, HeadcountService
├── application/       # React hooks — bridge between domain and UI
│   ├── hooks/         # useSeats, useRequests, useHeadcount, useService, useHandedness
│   └── usecases/      # Seat, request, and headcount use cases
├── presentation/      # UI layer — React components, pages, layouts
│   ├── pages/         # HomePage, SeatTrackerPage, RequestsPage, HeadcountPage, FloorPlanPage
│   ├── components/    # SeatMap, FloorPlanPicker, RequestCard, CountInput, etc.
│   ├── layouts/       # AppLayout (responsive shell with navigation)
│   └── theme/         # Color palette and design tokens
└── i18n/              # Localization (i18next with EN, zh-TW, zh-CN)
```

**Key architectural decisions:**
- The **domain layer** has zero framework dependencies — pure TypeScript interfaces, constants, and functions
- **Hooks** use `useMemo`, `useCallback`, and refs to prevent stale closures and unnecessary re-renders
- **Single-pass aggregation** for seat counting instead of multiple array iterations
- **Centralized localStorage keys** to prevent key collisions across the app
- **All business logic lives in the domain layer** — presentation components are thin

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 with TypeScript 5.9 |
| Styling | Tailwind CSS 3.4 |
| Build | Vite 7 |
| Routing | React Router 7 |
| Backend | Firebase Firestore (real-time sync) |
| Hosting | Firebase Hosting with CDN |
| i18n | i18next with browser language detection |
| Animation | Framer Motion 12 |
| QR Code | qrcode.react |

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

### Setup

```bash
# Clone the repository
git clone https://github.com/michelleyuenco/fish-for-people.git
cd fish-for-people

# Install dependencies
npm install

# Configure Firebase
cp .env.example .env.local
# Fill in your Firebase config values from Firebase Console > Project Settings
```

### Development

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Type-check + production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

### Deployment

```bash
npm run build
firebase login
firebase deploy --only hosting
```

The app is deployed to **Firebase Hosting** and served via CDN with long-term caching for static assets.

## Contributing

We welcome contributions! This is an open-source project built to serve churches around the world. Whether you're fixing a bug, improving accessibility, adding a new language, or strengthening our security — every contribution matters.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<h2 id="繁體中文">繁體中文</h2>

<p align="center">
  <em>「來跟從我，我要叫你們得人如得魚一樣。」</em><br/>
  <strong>— 馬可福音 1:17</strong>
</p>

### Fish for People 是什麼？

**Fish for People** 是一款開源的即時網路應用程式，幫助教會招待團隊在聚會進行中協調座位、回應會眾需求並統計出席人數 — 全部在手機上完成。無需下載、無需帳號、零門檻。

應用程式名稱靈感來自早期基督教的魚符號 (IXOYE) 和耶穌呼召門徒成為「得人的漁夫」。每一項功能都為同一個目的而設計：以溫暖、尊嚴和關懷服事每一位走進教會的人。

### 兩種角色，同一使命

| 招待團隊 | 會眾 |
|---|---|
| 即時追蹤 368 個座位的使用狀況 | 在座位上自助提交服務請求 |
| 即時請求佇列，一鍵完成處理 | 可選擇筆、講道筆記、奉獻信封、翻譯耳機、代禱等 |
| 雙模式出席人數統計 | 即時狀態更新 — 知道協助即將到來 |
| 全螢幕座位圖與入座指引 | 無需安裝應用程式 — 在任何瀏覽器中使用 |
| 聚會結束後的數據分析與報告 | 多語言支援：英文、繁體中文、簡體中文 |

### 主要功能

- **座位追蹤** — 三個區域（左區、中區、右區）368 個座位的即時使用狀況，支援整排切換、復原/重做、家庭/長者及義工保留席
- **座位圖** — 全螢幕鳥瞰圖，標示建議入座位置，顯示即時容量百分比，包含會眾自助服務 QR Code
- **會眾請求** — 會眾在座位圖上點選區域、選擇需要的服務即可提交；招待團隊即時收到通知，一鍵標記完成
- **出席統計** — 兩位獨立計數員逐區提交人數，系統偵測差異並確認最終出席數據；支援「人數模式」和「空位模式」兩種計數方式
- **多語言** — 完整支援英文、繁體中文、簡體中文，自動偵測瀏覽器語言
- **無障礙** — 大字體模式、左右手版面切換、鍵盤導航、響應式行動裝置優先設計

### 隱私與安全

**我們非常重視隱私與安全。** 每一位走進教會聚會的人都應該知道，他們的個人資訊受到最高度的尊重。我們已盡最大努力確保不會在用戶數據保護上有任何妥協，並承諾在我們所建構的一切中維持最高的隱私與安全標準。

- **無需用戶帳號或身份驗證** — 應用程式設計為聚會期間匿名使用
- **聚會結束後不保留任何個人資料** — 為翻譯耳機歸還所收集的聯絡資訊，僅用於該目的，並將於聚會結束後刪除
- **無分析追蹤** — 我們不使用追蹤 Cookie，也不收集行為數據
- **輸入淨化** — 所有用戶輸入的文字在寫入資料庫前均經過淨化處理，防止注入攻擊
- **內容安全策略 (CSP)** — 嚴格的安全標頭保護應用程式免受跨站腳本攻擊和點擊劫持
- **安全的元件渲染** — 所有動態內容均使用安全的 React 元件渲染，不使用任何原始 HTML 注入
- **攝影機、麥克風及定位功能** — 透過 `Permissions-Policy` 明確停用

我們相信，安全不是一項功能 — 而是一份責任。

---

<h2 id="简体中文">简体中文</h2>

<p align="center">
  <em>「来跟从我，我要叫你们得人如得鱼一样。」</em><br/>
  <strong>— 马可福音 1:17</strong>
</p>

### Fish for People 是什么？

**Fish for People** 是一款开源的实时网络应用程序，帮助教会招待团队在聚会进行中协调座位、回应会众需求并统计出席人数 — 全部在手机上完成。无需下载、无需账号、零门槛。

应用程序名称灵感来自早期基督教的鱼符号 (IXOYE) 和耶稣呼召门徒成为「得人的渔夫」。每一项功能都为同一个目的而设计：以温暖、尊严和关怀服事每一位走进教会的人。

### 两种角色，同一使命

| 招待团队 | 会众 |
|---|---|
| 实时追踪 368 个座位的使用状况 | 在座位上自助提交服务请求 |
| 实时请求队列，一键完成处理 | 可选择笔、讲道笔记、奉献信封、翻译耳机、代祷等 |
| 双模式出席人数统计 | 实时状态更新 — 知道协助即将到来 |
| 全屏座位图与入座指引 | 无需安装应用程序 — 在任何浏览器中使用 |
| 聚会结束后的数据分析与报告 | 多语言支持：英文、繁体中文、简体中文 |

### 主要功能

- **座位追踪** — 三个区域（左区、中区、右区）368 个座位的实时使用状况，支持整排切换、撤销/重做、家庭/长者及义工保留席
- **座位图** — 全屏鸟瞰图，标示建议入座位置，显示实时容量百分比，包含会众自助服务 QR Code
- **会众请求** — 会众在座位图上点选区域、选择需要的服务即可提交；招待团队实时收到通知，一键标记完成
- **出席统计** — 两位独立计数员逐区提交人数，系统检测差异并确认最终出席数据；支持「人数模式」和「空位模式」两种计数方式
- **多语言** — 完整支持英文、繁体中文、简体中文，自动检测浏览器语言
- **无障碍** — 大字体模式、左右手版面切换、键盘导航、响应式移动端优先设计

### 隐私与安全

**我们非常重视隐私与安全。** 每一位走进教会聚会的人都应该知道，他们的个人信息受到最高度的尊重。我们已尽最大努力确保不会在用户数据保护上有任何妥协，并承诺在我们所构建的一切中维持最高的隐私与安全标准。

- **无需用户账号或身份验证** — 应用程序设计为聚会期间匿名使用
- **聚会结束后不保留任何个人资料** — 为翻译耳机归还所收集的联系方式，仅用于该目的，并将于聚会结束后删除
- **无分析追踪** — 我们不使用追踪 Cookie，也不收集行为数据
- **输入净化** — 所有用户输入的文字在写入数据库前均经过净化处理，防止注入攻击
- **内容安全策略 (CSP)** — 严格的安全头保护应用程序免受跨站脚本攻击和点击劫持
- **安全的组件渲染** — 所有动态内容均使用安全的 React 组件渲染，不使用任何原始 HTML 注入
- **摄像头、麦克风及定位功能** — 通过 `Permissions-Policy` 明确禁用

我们相信，安全不是一项功能 — 而是一份责任。

---

<p align="center">
  Built with love for the Church.<br/>
  為教會而建，以愛而造。<br/>
  为教会而建，以爱而造。
</p>
