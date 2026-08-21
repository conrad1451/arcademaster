# ADR-004: Host Backend on Render with a Wake/Health-Check Ping on App Load

## Status

* Status: Accepted
* Date: 2026-08-07
* Authors: Conrad Hansen-Quartey
* Deciders: Conrad Hansen-Quartey

## Context

The backend (serving scores/leaderboard data) is hosted on Render, whose lower-tier plans spin the service down after a period of inactivity, causing a noticeable delay ("cold start") on the next request.

* What problem are we trying to solve? Users arriving at the site could hit game actions (score submission, leaderboard fetches) before the backend has woken up, with no indication anything was happening.
* What are the constraints? Cost — Render's free/hobby tier is attractive for a hobby project's budget, but comes with the sleep/cold-start trade-off baked in.
* Relevant history: `feat: add server wake/health check on app load` (`bafcd3e`, 2026-08-07) added a `ServerPinger` component that calls `/api/health` on mount and surfaces loading/ok/error status, fixing an earlier bug where the error state was unreachable and the render referenced a nonexistent loading variable.

## Decision

We will host the backend on **Render**, and we will ping `/api/health` on app load via a dedicated `ServerPinger` component to proactively wake the server and surface connection status (loading, ok, error) to the user before they begin playing.

## Consequences

### Positive (Pros)

* Keeps hosting costs low, which fits a hobby project's budget.
* Users get visible feedback on connection status instead of a silent failure or confusing delay mid-game.
* Pinging on load reduces the odds that a user's *first real action* (e.g. score submission) is the one that triggers the cold start.

### Negative (Cons / Trade-offs)

* Cold starts are mitigated, not eliminated — a user who arrives right as the server is asleep still experiences a real delay.
* Adds client-side polling/health-check logic that has to be kept correct (as the original bug, where the error state was unreachable, demonstrates).
* Ties the app's perceived reliability to Render's infrastructure behavior and sleep policy, which is outside our control and could change.
