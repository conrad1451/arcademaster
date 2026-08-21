# ArcadeMaster

A full-stack, browser-based arcade platform featuring classic games — **2048**, **Tetris**, and **Ping Pong** — with persistent score tracking and per-game leaderboards.

🎮 **Live site:** [arcademaster.vercel.app](https://arcademaster.vercel.app/)
🔌 **API:** [arcademasterbackend.onrender.com](https://arcademasterbackend.onrender.com/)
🗂 **Backend repo:** [arcademasterbackend](https://github.com/conrad1451/arcademasterbackend)

## Features

- **Three playable games** — 2048, Tetris, and Ping Pong — each with keyboard, swipe, and touch controls
- **Persistent leaderboards** — top scores per game, submitted to and fetched from the backend API
- **Responsive design** — full mobile support with on-screen touch controls (D-pad for Tetris, swipe for 2048, drag for Ping Pong)
- **Username-based sessions** — lightweight identity flow with real-time validation for score attribution
- **Server wake/health check** — pings the backend on load to surface connection status and avoid cold-start surprises on the free hosting tier

## Tech Stack

| Layer                      | Technology                     |
| -------------------------- | ------------------------------ |
| Framework                  | React + TypeScript             |
| Build tool                 | Vite                           |
| Package manager            | pnpm                           |
| UI components              | MUI (Material UI) + Emotion    |
| State management           | Redux                          |
| Unit / integration testing | Vitest + React Testing Library |
| E2E testing                | Playwright                     |
| Linting                    | ESLint                         |
| Analytics                  | Cloudflare Web Analytics       |
| Hosting (frontend)         | Vercel                         |
| Hosting (backend)          | Render                         |

Key architectural decisions are documented in [`/adr`](./adr) as Architecture Decision Records — see there for the reasoning and trade-offs behind each choice above.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/installation)

### Installation

```bash
git clone https://github.com/conrad1451/arcademaster.git
cd arcademaster
pnpm install
```

### Development

```bash
pnpm dev
```

Runs the app locally with hot module replacement.

### Build

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

## Testing

```bash
pnpm test          # run unit/integration tests once (Vitest)
pnpm test:ui       # interactive Vitest UI runner
pnpm test:watch    # watch mode
pnpm test:e2e      # Playwright end-to-end tests
pnpm test:e2e:ui   # Playwright with interactive UI
```

## Linting

```bash
pnpm lint
```

## Project Structure

```
arcademaster/
├── src/
│   ├── components/     # Game components (2048, Tetris, Ping Pong), UI, leaderboard
│   ├── tests/          # Vitest test suites
│   └── setupTests.ts   # Test environment setup
├── e2e/                # Playwright end-to-end tests
├── adr/                # Architecture Decision Records
└── public/             # Static assets (privacy policy, terms, disclaimer PDFs, etc.)
```

## Backend

ArcadeMaster's API is a separate service (see [arcademasterbackend](https://github.com/conrad1451/arcademasterbackend)) responsible for score persistence and leaderboard queries. It's hosted on Render's free tier, which spins down after inactivity — the frontend pings `/api/health` on load to wake it and show connection status before gameplay begins.

## License

This project is licensed under the [MIT License](./LICENSE).

## Author

**Conrad Hansen-Quartey**
