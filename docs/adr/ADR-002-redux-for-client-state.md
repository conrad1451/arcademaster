# ADR-002: Use Redux for Client-Side User State and Score Submission

## Status

* Status: Accepted
* Date: 2026-08-04
* Authors: Conrad Hansen-Quartey
* Deciders: Conrad Hansen-Quartey

## Context

Multiple independent game components (2048, Ping Pong, Tetris) and the leaderboard page all need access to the same user identity (username) and need to submit scores to the backend after a game ends.

* What problem are we trying to solve? Sharing username/session state and score-submission logic across unrelated, route-separated components without deep prop drilling.
* What are the constraints? The games are implemented as largely independent components/routes, so state needs to be accessible app-wide rather than scoped to a single component tree.
* Relevant history: `feat: add Redux user state and score submission support` (`f6340a9`, 2026-08-04) introduced the store and wired it into score submission across games.

## Decision

We will use **Redux** as the centralized state management solution for user identity and score-submission state, shared across all game routes and the leaderboard.

## Consequences

### Positive (Pros)

* A single centralized store lets any game component or the leaderboard read the current username and submit scores without prop drilling through unrelated routes.
* Redux DevTools make it straightforward to trace state changes (e.g. debugging a failed score submission) during development.
* Established, well-documented pattern that any future contributor is likely to already understand.

### Negative (Cons / Trade-offs)

* Introduces boilerplate (actions, reducers/slices, store wiring) that is heavier than the app's actual state needs (essentially username + submission status) would require if using React Context or component state.
* Adds a dependency and a small bundle-size cost that isn't strictly necessary for an app of this size.
* New contributors unfamiliar with Redux face a learning curve before they can safely modify shared state.
