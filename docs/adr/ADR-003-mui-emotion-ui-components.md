# ADR-003: Use MUI with Emotion for UI Components

## Status

* Status: Accepted
* Date: 2026-08-01
* Authors: Conrad Hansen-Quartey
* Deciders: Conrad Hansen-Quartey

## Context

The app needs common UI primitives (dialogs, text fields, buttons) — for example the username entry dialog and navigation — without hand-building and styling each one from scratch.

* What problem are we trying to solve? Getting accessible, consistent, production-ready UI components quickly, rather than authoring bespoke CSS for every interactive element.
* What are the constraints? Small team/solo maintenance means time spent building basic components (dialogs, form fields) is time not spent on game logic.
* Relevant history: `feat(deps): add @mui/material and @emotion/react` (`8c3913f`, 2026-08-01) added MUI (`^9.2.0`) and its required peer dependency Emotion (`^11.14.0`).

## Decision

We will use **MUI (Material UI)**, with **Emotion** as its underlying styling engine, for shared UI components such as dialogs, buttons, and form fields.

## Consequences

### Positive (Pros)

* Prebuilt, accessible components (dialogs, text fields, buttons) significantly speed up UI development versus building each from scratch.
* Consistent design language and interaction patterns (validation states, focus handling) come out of the box.
* Strong TypeScript typings and broad community documentation reduce ramp-up time.

### Negative (Cons / Trade-offs)

* MUI adds meaningful bundle size compared to a lighter-weight or headless component library.
* The default Material Design look requires deliberate theming work to avoid the site feeling like a generic "out of the box" MUI app.
* Coupling to MUI's API surface means future major-version upgrades can introduce breaking changes that require dedicated migration effort.
