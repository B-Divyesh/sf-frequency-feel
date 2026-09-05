# Frequency Feel — repair handoff

Completed locally: 5 September 2026

## Release identity

- Implementation commit: `9fad0f76ea8a93f40b441a34b06e2fee74de2bd5`
- Documentation record commit: `feb8bd29f22ef2a2e2858fbc96631aef081bddaa`
- Base reviewed implementation: `11def2901ed5c453350b77759608983ebfa8af91`
- Earlier review/documentation commits: `1e442f2` and `59eda3d`
- Deployment: static `dist/` output to the existing Frequency Feel Static Web
  App configuration. The implementation commit was pushed to `main` on 5
  September. At the final cold check the HTTPS site still served the prior
  `index-DmQhsfAE.js` candidate and old title. The configured CLI recognizes
  the in-scope `sf-frequency-feel` app and `dist/`, but no product deployment
  token is available in the durable repository configuration. No credentials
  were invented or read from another service.

## What changed

- Added a first-screen **Try it with sample data** action. `/demo` and
  `?demo=1` start the populated 850 Hz low-pass sample in a `demo:` local
  storage namespace. The persistent banner identifies sample data and offers
  Reset demo and Start for real. Leaving the demo removes its namespace.
- Rewrote the landing copy around the job, audience, and first action. The
  site now uses plain section names and a three-step How it works section.
- Added `.factory/claims.json` plus 11 isolated, outcome-based browser checks.
  They exercise demo isolation, offline reload, local audio/privacy, tracking,
  opt-in 18% playback, comparison, filters, keyboard response-map use, setting
  links and recovery, free core access, and artwork disclosure.
- Added a designed HTTP 404 page and production routing for `/demo`,
  `/privacy`, and `/terms`. Unknown paths receive the 404 document.
- Completed metadata and the standard site shell: route titles, canonical and
  social tags, 1200 × 630 product art, apple touch image, sitemap entry, four
  header links, footer attribution/version, and response security headers.
- Bumped the service-worker cache to `frequency-feel-v3` so the new shell
  replaces the prior cached release.
- Added the demo, claims, copy-audit, catalog-description, and visual
  provenance records required by the factory contract.

## Verification

From a clean `npm ci` setup on Node 22.23.2:

- `npm test` — pass, 8/8 model tests.
- `npm run build` — pass; `dist/` contains root `index.html`, `404.html`, and
  `staticwebapp.config.json`.
- `npm run test:browser` — pass: desktop and 390 px flows, populated demo,
  normal playback, A/B, Bell EQ, keyboard, focus-on-route change, metadata,
  real 404 behavior, Axe (0 serious/critical), reduced motion, and no console
  errors before the expected 404 request.
- `npm run test:claims` — pass, all 11 declared public claims. Every command
  in `.factory/claims.json` was then run individually from the documented
  setup and passed.
- Local Lighthouse — Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.2 s and CLS 0. The report is at
  `/work/.evidence/sf-frequency-feel-lighthouse.json`.
- Final production bundle: JS 28.72 kB / 9.86 kB gzip and CSS 20.67 kB /
  5.30 kB gzip. Both are below the static-product budgets.

## Review finding disposition

| Finding | Disposition |
| --- | --- |
| F1 demo sandbox | Fixed with the `/demo` sandbox, sample label, reset/start actions, separate `demo:` key, documentation, and regression check. |
| F2 claims | Fixed with 11 listed claims and individually runnable clean commands. Earlier untested wording was either covered by these claims or removed when it was not a user-verifiable promise. |
| F3 plain first screen | Fixed with “Hear and see filter changes,” the named beginner audience, sample action, and short privacy/offline/price facts. |
| F4 404 | Fixed with `404.html`, `404.css`, and Static Web Apps `responseOverrides`; local deployment-shaped browser test receives HTTP 404. |
| F5 metadata and skeleton | Fixed with complete metadata, social asset, app route titles, navigation, footer, `/demo` sitemap entry, and route-aware focus/announcement. |
| F6 copy audit | Fixed with `.factory/copy-audit.md`; every landing sentence is ≤22 words and no banned terms remain. |

The earlier verification’s passing functional, accessibility, privacy, mobile,
offline, and bundle observations were rechecked by the new browser and claim
suite. The former live-Axe CSP note remains expected: a strict production CSP
does not permit inline test injection, while the local browser test injects
Axe and reports no serious or critical findings.

## Known limits and next steps

- The app’s level matching is a lightweight teaching estimate, not a mastering
  meter.
- Browser and output-device gain remain outside the app’s control. The visible
  volume reminder makes no hearing-protection claim.
- The brief’s five-question learning-success measure needs moderated
  first-time-user testing. No behavioral analytics were added.
- The researched brief is free; no paid offer exists, so no billing metadata
  or unavailable checkout dependency is needed.
- The branch push is complete. If the existing static deployment controller is
  delayed, use its durable product deployment configuration to publish the
  already-built `dist/` artifact; do not introduce a new target or credentials.
