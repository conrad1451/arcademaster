# ADR-001: Adopt Vite, React, TypeScript, and pnpm as the Project Foundation

## Status

* Status: Accepted
* Date: 2026-07-31
* Authors: Conrad Hansen-Quartey
* Deciders: Conrad Hansen-Quartey

## Context

arepo needed a frontend foundation for a multi-game arcade site (2048, Ping Pong, Tetris, etc.) that could be bootstrapped quickly, support a fast local dev loop, and catch type errors before they reach production.

* What problem are we trying to solve? We need a build tool, UI framework, language, and package manager to start the project from scratch, with reasonable defaults for linting and project structure.
* What are the constraints? This is a solo/small-team hobby-to-production project; setup time and dev-loop speed matter more than enterprise-scale tooling flexibility.
* Relevant history: Initial commit (`cc9619b`, 2026-07-31) and `feat: setup initial Vite + React + TypeScript project` (`30f6bc4`, 2026-07-31) established the base project structure, ESLint config, and pnpm lockfile.

## Decision

We will use **Vite** as the build tool and dev server, **React** as the UI framework, **TypeScript** for static typing across the codebase, and **pnpm** as the package manager.

## Consequences

### Positive (Pros)

* Fast dev server startup and hot module replacement, keeping the iteration loop tight during game development.
* TypeScript catches type errors (e.g. game state shapes, prop types) at compile time rather than at runtime, mid-game.
* pnpm's content-addressable store and strict `node_modules` layout reduce disk usage and prevent accidental use of undeclared ("phantom") dependencies.

### Negative (Cons / Trade-offs)

* Vite's plugin ecosystem, while solid, is smaller than webpack's, which can occasionally require workarounds for niche integrations.
* pnpm's strict dependency resolution can surface hoisting issues with packages that assume a flat `node_modules`, requiring occasional `.npmrc` tweaks.
* Contributors need pnpm installed specifically; the lockfile format isn't interchangeable with npm or yarn, adding a small onboarding step.
