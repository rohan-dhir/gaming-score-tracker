# Leaderboard Tracker

A local leaderboard and challenge tracker for gaming competitions. Supports free-for-all and team-based regular matches or bracket-style tournaments.

Fully customizable challenges with custom leaderboards and metrics.

## Quick Start

### Option 1: Docker

```bash
docker build -t leaderboard-tracker .
docker run -d -p 3000:80 leaderboard-tracker
```

Open [http://localhost:3000](http://localhost:3000).

To stop:

```bash
docker stop $(docker ps -q --filter ancestor=leaderboard-tracker)
```

### Option 2: Run from Source

Requires [Node.js](https://nodejs.org/) 18 or later.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Option 3: Static Build

Build once, serve the `out/` directory with any static file server:

```bash
npm install
npm run build
npx serve out
```

## How It Works

### 1. Setup

Create a challenge with a title, game name, and player names. Add one or more leaderboards — each with its own metrics and ranking configuration. For tournaments (3+ players), choose between Single or Double Elimination.

### 2. Play

Enter scores for each player on each leaderboard. Rankings update live as scores are entered. For tournaments, winners advance through the bracket automatically.

### 3. Complete

End the challenge to see final standings with the winner announcement. Click "New Challenge" to reset and start over.

## Scoring Primitives

| Type | Description | Example |
|------|-------------|---------|
| **Number** | Integer value | Kills, points, goals |
| **Duration** | Time (HH:MM:SS.ms) | Speedrun time, lap time |
| **Completion** | Yes / No | "Beat the boss", "Found the item" |
| **Ratio** | Decimal value | Win rate, K/D ratio |
| **Rank** | Ordinal placement | 1st, 2nd, 3rd place finish |

Each metric has a configurable win condition (highest or lowest wins) and optional thresholds.

## Ranking Modes

- **Priority Order** — Sorts by the first metric, breaks ties with the second, and so on
- **Weighted Composite** — Normalizes all metrics and combines them using configurable weights
- **All Required** — Players must meet thresholds on every metric to qualify

## Tech Stack

- [Next.js 15](https://nextjs.org/) with App Router (static export)
- [React 19](https://react.dev/)
- [MUI 6](https://mui.com/) (Material UI)
- [dnd-kit](https://dndkit.com/) for drag-and-drop
- [TypeScript 5](https://www.typescriptlang.org/)
