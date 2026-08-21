# ADR-006: Use Cloudflare Web Analytics for Site Traffic Analytics

## Status

* Status: Accepted
* Date: 2026-08-01
* Authors: Conrad Hansen-Quartey
* Deciders: Conrad Hansen-Quartey

## Context

The site needs basic visibility into traffic (page views, visitor counts) without adopting a heavyweight analytics suite or introducing cookie-based tracking.

* What problem are we trying to solve? Understanding site traffic and usage patterns to inform future development priorities.
* What are the constraints? Should be lightweight (minimal performance impact) and privacy-respecting, since this is a public-facing free game site.
* Relevant history: `chore(analytics): integrate Cloudflare Web Analytics beacon` (`05cc821`, 2026-08-01) added the analytics beacon script.

## Decision

We will use **Cloudflare Web Analytics** (beacon script) for site traffic analytics.

## Consequences

### Positive (Pros)

* Free to use and privacy-friendly — no cookies and no cross-site tracking, avoiding cookie-consent-banner overhead.
* The beacon script is lightweight, adding negligible page-load or runtime performance overhead.
* Simple to add and reason about, with a single script tag and no server-side integration required.

### Negative (Cons / Trade-offs)

* Offers fewer advanced features and segmentation options than full analytics suites like Google Analytics.
* Limited support for granular custom event tracking (e.g. per-game play counts, funnel analysis), so deeper product analytics would need a separate tool.
* Analytics access and configuration is tied to the Cloudflare account/dashboard, coupling reporting access to Cloudflare account management.
