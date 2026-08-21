# ADR-005: Integrate a Third-Party Ad Network, Hidden on Game Pages

## Status

* Status: Accepted
* Date: 2026-08-01
* Authors: Conrad Hansen-Quartey
* Deciders: Conrad Hansen-Quartey

## Context

The site needs a way to generate revenue without requiring payment or a subscription from players.

* What problem are we trying to solve? Monetizing a free-to-play arcade site while keeping the actual gameplay experience uninterrupted.
* What are the constraints? Ads should not degrade the full-screen game experience, but should still display where they don't get in the way (e.g. home, leaderboard, and policy pages).
* Relevant history: `chore(ads): integrate ad network script tag` (`7f8d70f`, 2026-08-01) added the initial script tag; `refactor: hide footer and ads on game pages for full-screen experience` (`356e0d6`, 2026-08-17) added `isGamePage` detection to conditionally render the ad container; `fix: ensure ads display on non-game pages with class-based toggling` (`4c06a43`, 2026-08-17) fixed a follow-up bug ("Ad container is not provided") by toggling a `game-page` class on `#root` and controlling visibility via CSS.

## Decision

We will integrate a third-party ad network via script tag, and we will hide ads (and the footer) on game pages using route-based detection and CSS class toggling, so ads only appear on non-gameplay pages.

## Consequences

### Positive (Pros)

* Enables ad revenue without a paywall, keeping the games free to play.
* Game pages stay full-screen and distraction-free, preserving the actual play experience.
* Class-based toggling (rather than conditionally mounting/unmounting the ad script per route) keeps the show/hide logic simple and CSS-driven.

### Negative (Cons / Trade-offs)

* The third-party script is an external dependency that can affect page load performance and introduces third-party tracking/privacy considerations.
* Ad blockers, which are common, will prevent ads from displaying for a meaningful share of visitors, limiting revenue reliability.
* Any change in the ad network's expected DOM structure or embed behavior (as already happened once, per the "Ad container is not provided" fix) can silently break ad display and requires ongoing maintenance.
