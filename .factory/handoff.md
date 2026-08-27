# Frequency Feel — build handoff

## Independent verification update — PASS

Verified 2026-08-27 at candidate commit `0a50564e866fc923d2c8949a066ef049fe17c19f` and live URL https://frequency-feel.sociobot.in. The live files match the candidate build; clean-install tests, production build, browser/Axe/offline/PWA-update checks, desktop and 390px use, privacy/security headers, bundle budgets, and Lighthouse all passed. No product defects were found. See [`.factory/verification.md`](verification.md) for exact commands, measurements, coverage, and the non-product live-Axe test-harness CSP note.

Work order: `frequency-feel-build-1`

Completed: 2026-08-27

Deploy type: static (`dist/`)

## What was built

- A finished beginner listening lab for low-pass, high-pass, and bell EQ.
- A deterministic, original four-second synthesized phrase made in Web Audio;
  there are no uploads, microphones, remote audio files, or autoplay.
- Smooth same-source A/B switching with a short Web Audio crossfade and
  frequency-weighted energy normalization for the filtered path.
- Logarithmic frequency, Q/resonance, bell gain, and conservative 18% default
  in-app volume controls. The visible warning makes clear that device output is
  outside the app's control.
- A synchronized native-biquad SVG response map, beginner-language chart
  alternative, pointer dragging, and Arrow/Home/End keyboard operation.
- Three teaching presets, prediction guidance, validated shareable links,
  invalid-link recovery, audio error messaging, and offline status.
- Art-deco transit-poster design at desktop and 390 px, including a generated
  original hero. Source/provenance and exact prompt are retained in
  `assets/src/`; optimized WebP exports are 32 KB and 64 KB.
- `/privacy` and `/terms` routes, no analytics/cookies/CDNs, a service worker,
  Azure Static Web Apps history/security/cache configuration, robots file, and
  sitemap.

## How to run and deploy

```bash
npm install
npm test
npm run build
npm run preview
```

The factory build command is `npm run build`. Output is `dist/`, and
`dist/index.html` is present at that root. Deploy the contents of `dist/` to the
configured Azure Static Web App; do not deploy `assets/src/`.

## Verification performed

- `npm test`: 8/8 unit tests pass (frequency mapping, clamping, URL validation,
  serialization, formatting, and explanations).
- `npm run build`: passes with TypeScript strict mode and Vite 7. Production
  bundles: 23.43 KB JS / 8.50 KB gzip; 17.62 KB CSS / 4.78 KB gzip.
- Factory `verify-url.sh` against the production preview: HTTP 200, no console
  errors, title and `lang`, one H1, main landmark, all image alts, all button
  names. Desktop and 390 × 844 screenshots reviewed.
- `npm run test:browser`: real synthesized playback, pause, A/B, bell gain,
  live explanation, graph keyboard control, preset, privacy route, mobile
  overflow, and offline reload all pass.
- Axe browser integration: 0 serious or critical violations.
- Final Lighthouse 12 mobile simulation: Performance **99**, Accessibility
  **100**, Best Practices **100**, SEO **100**. Measured LCP **1.2 s**, FCP
  **0.9 s**, CLS **0**, TBT **110 ms**, transfer **47 KiB**. INP is not
  available from a single lab page load; interactive browser tests complete
  without delay or errors.
- Reduced-motion, focus-visible, 44 px targets, URL validation, no-audio support,
  offline banner, and legal-route semantics were checked in implementation.

Verification artifacts were created under the ignored `.factory/evidence/`
directory in the worker environment.

## Known gaps and next steps

- Loudness matching is a deliberately lightweight spectral energy estimate,
  appropriate for controlled teaching comparisons but not a mastering meter.
- The launch success measure (70% correct on a five-question before/after test)
  requires moderated first-time-user testing after deployment; no behavioral
  analytics were added.
- Browsers and output devices apply their own gain, EQ, and latency. The app
  cannot infer physical listening level and makes no hearing-protection claim.
- A future version could add a self-contained prediction quiz, provided it stays
  local-first and does not turn the product into a production EQ rack.
