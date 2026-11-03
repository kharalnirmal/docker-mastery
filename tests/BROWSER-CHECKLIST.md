# Browser acceptance

Use `http://127.0.0.1:4173` while the preview server runs.

- Viewports: 320×568, 375×667, 390×844, 768×1024, 1366×768,
  1440×900, and 844×390 landscape.
- Onboarding: all content reachable, no default-size clipping or unnecessary
  scrolling; enlarged text may scroll as an accessibility fallback.
- Open each path, use previous/next, home, section links, back/forward and reload.
- Open header search, or use Ctrl/Cmd+K. Search `port`, `Dockerfile`, `OOM`, `missing.conf` (not a keyword match), and
  an unmatched term. Search is literal case-insensitive title/description/keyword
  matching, not full-text search. Confirm no-results status.
- Toggle theme and reload; inspect both themes and code/table internal scrolling.
  Confirm Inter and JetBrains Mono are loaded from local files, code copy works,
  and sidebar rows match the reference's 14px type and icon treatment.
- Mobile: tap hamburger, lesson links, backdrop, close and Escape; verify
  aria-expanded, focus restoration, trapped Tab/Shift+Tab, inert content while
  open, closed drawer excluded from focus, and resize while open.
- Keyboard-only: visible focus, skip link, search, navigation, disclosure controls.
- Touch events must be tested using touch-capable browser emulation or hardware;
  ordinary desktop clicks alone are not evidence of touch testing.
- Enable reduced motion; enlarge text/zoom; inspect contrast and horizontal
  document overflow. Reading pane should scroll without an outer page scroll.
- All images load; zero browser errors; invalid lesson links show recovery UI.

Record actual results and limitations in `CONTENT-REVIEW.md`.

Automated smoke suites: `node tests/browser-check.cjs` (seven viewports and twenty
lesson pages) and `node tests/browser-touch.cjs` (trusted Chromium touch emulation).
These do not replace manual zoom/contrast review or physical-device testing.

Docker-only scope: verify the home title/brand and sidebar contain no cluster
roadmap. Search `BuildKit`, `rootless`, `GHCR` and `capstone`; open the delivery
diagram and runbook links. Preview-server access restrictions are independently
tested by `npm test`; restart an old preview process after server-code changes.
