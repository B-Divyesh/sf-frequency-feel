# Frequency Feel — independent verification

**Result: PASS**  
Verified 2026-08-27 against candidate commit `0a50564e866fc923d2c8949a066ef049fe17c19f` and https://frequency-feel.sociobot.in.

## Scope and result

The deployed application is the candidate artifact: byte-for-byte comparisons matched `dist/index.html`, `robots.txt`, `sitemap.xml`, `favicon.svg`, `sw.js`, both WebP assets, and the hashed JS/CSS bundles. Its referenced hashed files are `index-DmQhsfAE.js` and `index-Cz1keagu.css`, exactly as produced by this build.

The smallest useful product in the brief works end to end. It provides opt-in, original synthesized Web Audio; low-pass, high-pass, and bell controls; a synchronized response map; A/B playback; conservative 18% in-app volume plus a visible device-volume warning; validated share links; legal pages; and an offline shell. No upload, microphone, analytics, remote font, or third-party runtime request was observed.

## Clean-checkout checks

Environment: Node `v22.23.2`, npm `10.9.8`, clean checkout at the requested SHA.

| Check | Evidence | Result |
| --- | --- | --- |
| Install | `npm ci` | Pass; 57 packages audited, 0 vulnerabilities |
| Unit tests | `npm test` | Pass; 8/8 Vitest tests |
| Type/build | `npm run build` | Pass; `tsc -b` and Vite produced `dist/` |
| Repository browser test | `npm run test:browser` against production preview | Pass; playback, A/B, graph keyboard control, preset, privacy route, mobile overflow, Axe, and offline reload |
| Deployed browser exercise | Independent Playwright against HTTPS deployment at 1440px and 390px | Pass; no console/page errors, no outbound runtime requests, no mobile horizontal overflow, Axe 0 serious/critical |
| Lighthouse mobile | Lighthouse 13.4.1 against deployed URL | Performance 93, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s, CLS 0 |

There is no separate lint or typecheck script. `npm run build` invokes the repository's available TypeScript check (`tsc -b`).

## Functional and resilience exercise

- Normal flow: started the synthetic loop, paused it, switched Before/After, selected all filter types, exposed bell gain, moved the graph handle, and loaded a teaching preset.
- Keyboard-only: Tab reached the skip link and every inspected control; native button Space/Enter operation worked; graph-handle Arrow operation changed `aria-valuenow`; all standard controls showed the 3px focus outline and the focused SVG handle changed to its 7px high-contrast stroke.
- Boundary links: `frequency=20,q=0.3,gain=-15` and `type=peaking,frequency=20000,q=12,gain=15` rendered their safe limits.
- Malformed/recovery link: `type=comb&frequency=NaN&q=0&gain=999` displayed the warning and reset to the safe default, after which controls remained usable.
- Share: a bell-EQ setting copied the expected validated URL.
- Reduced motion: active playback had `animation-name: none` and response transition duration `0s` under `prefers-reduced-motion: reduce`.
- PWA: offline reload showed the lab shell. A controlled service-worker update using the production `Cache-Control: public, max-age=31536000, immutable` policy advanced cache `frequency-feel-v2` to `frequency-feel-v3`.

## Privacy, security, cache, and budget evidence

- Browser request capture found zero automatic cross-origin runtime requests. The sole external URL is the user-initiated Source link in the footer.
- Privacy and terms claims match implementation: sound is synthesized locally; settings are in the URL; the service worker is the only local storage mechanism; no cookies, uploads, or microphone request were observed.
- Live HTTPS redirects HTTP to HTTPS and sends HSTS, CSP, `nosniff`, `Referrer-Policy: no-referrer`, and a camera/microphone/geolocation-denying Permissions-Policy. CSP limits resources to `self` (with data images).
- Live hashed JS/CSS and WebP assets use `public, max-age=31536000, immutable`; navigations use `public, must-revalidate, max-age=30`.
- Build sizes: JS 23.43 kB (8.50 kB gzip), CSS 17.62 kB (4.78 kB gzip), mobile hero 32.62 kB, desktop hero 64.96 kB. Initial JS is well below the 200 kB budget and CSS below 50 kB.

## Defects

No release-blocking, high, medium, or low product defects found.

Informational test-harness note: `BASE_URL=https://frequency-feel.sociobot.in npm run test:browser` cannot inject Axe because the intentionally strict live CSP rejects the test's inline `page.addScriptTag` payload. This is not a product CSP failure: the repository test passes against its documented local preview target, and the independent deployed Axe run used Playwright `bypassCSP` solely for test injection and found 0 serious/critical violations.
