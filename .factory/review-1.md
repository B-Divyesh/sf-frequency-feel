# Review: hear and see filter changes

**Verdict: FAIL**  
Reviewed 2026-09-05. There are 6 findings and 14 untested public-claim groups.

## Job, audience, and first action

The job is to let a person hear and see what a filter or EQ setting changes.
The audience is a beginner sound designer deciding on a track or game sound.
Before scrolling, in fresh desktop and phone browser contexts, the page offered
**“Enter the listening lab”** as its first action. It did not offer the
required **“Try it with sample data”** action. The first-screen heading was
“Don’t just set it. Hear where it goes.” It does not name the job in plain
words.

Evidence: `/work/.evidence/live-desktop-first.png` and
`/work/.evidence/live-phone-first.png`; both were captured at `scrollY: 0`.

## Candidate and deployed artifact

- Implementation candidate reviewed: `11def29e5c2c6ec6cce9c8fb9d1d85e52992c727` (`feat: build interactive filter listening lab`).
- Documentation revision present before this review: `1e442f2cb31208952a4314a78a389b07d8a69dd5` (`docs: add independent verification report`).
- Live URL: https://frequency-feel.sociobot.in

The later commits after `11def29` only changed documentation. A new local
production build matched the live `index.html`, `robots.txt`, `sitemap.xml`,
`favicon.svg`, `sw.js`, both hashed bundles, and both WebP assets byte for
byte. The deployed runtime is therefore this implementation candidate.

## Checks that passed

- Clean setup: `npm ci` completed with 0 vulnerabilities on Node 22.23.2.
- `npm test` passed: 8 unit tests.
- `npm run build` passed and wrote `dist/`. The unchanged bundle sizes are
  23.43 kB JS (8.50 kB gzip) and 17.62 kB CSS (4.78 kB gzip).
- `npm run test:browser` against the documented local preview passed. It
  exercised playback, A/B switching, Bell EQ gain, keyboard graph control,
  preset loading, a legal route, mobile overflow, Axe, and offline reload.
- Fresh live desktop and iPhone 13 contexts loaded with no page or console
  errors and no automatic cross-origin requests. Mobile had no horizontal
  overflow.
- A live normal flow entered playing state, switched A/B, revealed Bell EQ
  gain, loaded a preset, and updated the explanation. Invalid query values
  displayed the recovery message and returned to a usable default. Low and
  high boundary URLs rendered 20 Hz/Q 0.3 and 20 kHz/Q 12/gain +15 dB.
- Keyboard Tab reached the skip link, navigation, graph slider, controls,
  playback, and sharing. The graph slider responded to Arrow, Home, and End.
- Live Axe, injected only in a `bypassCSP` test context, reported 0 serious or
  critical violations. Reduced-motion mode had `transition-duration: 0s` and
  `animation-name: none`.
- A fresh live service-worker context gained control, then reloaded offline
  with the lab and its offline message. Privacy and terms pages each had the
  correct title and one h1.
- Live CSP, HSTS, `nosniff`, no-referrer policy, and the camera/microphone/
  geolocation permissions policy were present. `robots.txt` and the listed
  sitemap routes responded successfully.

`verify-url.sh` was not present in this checkout or on `PATH`; the equivalent
title/lang/main/alt/error checks were made in the browser run above.

## Findings

### F1 — High — Required demo sandbox is absent

The landing screen has no one-click “Try it with sample data” action. There is
no persistent “Demo — sample data, nothing is saved” label, Reset demo action,
or Start for real action. `/demo` returns the ordinary live lab, not an
isolated demo. No `.factory/demo.md` documents a sample, reset, or separate
storage namespace. This fails the demo-sandbox contract and leaves no way to
prove that a sample cannot alter real data.

### F2 — High — Public claims have no claims manifest or claim tests

`.factory/claims.json` is missing. Therefore there are no declared claim
commands and no tests tagged `@claim:<id>`, despite the product and README
making testable promises. I counted 14 untested public-claim groups: original
synthesized/local audio; no microphone; no uploads; no cookies; no collected
settings; no analytics or advertising; offline caching; opt-in playback; same
source for A/B; level matching; validated share links; 390 px responsiveness;
no third-party runtime resources; and conservative default playback. Existing
general unit and browser tests do not meet the required one-test-per-manifest-
claim contract.

### F3 — Medium — The first screen does not state the job in plain words

The h1 “Don’t just set it. Hear where it goes.” is a mood line, not a job
description. The page also uses non-informational labels and headings such as
“Platform 01,” “filter gate,” “Quick departures,” and “Start with a feeling.”
These conflict with the plain-words requirement and make the first action less
clear to the specified beginner audience.

### F4 — Medium — The required 404 page is missing

`/not-a-real-page` returned HTTP 200 and rendered the home page and home h1.
It is not a designed not-found route with a return path. A deliberate HTTP 404
would have been acceptable; silently returning the home page is not the
required 404 structure.

### F5 — Medium — Required route metadata and site skeleton parts are missing

The home document lacks a canonical link, Open Graph metadata, Twitter card,
and apple-touch icon. The header omits the required Demo and Privacy links.
The footer omits “Built by Param Factory” and a version/build identifier. The
sitemap cannot list `/demo` because that route is not implemented.

### F6 — Low — Required copy-audit record is missing

`.factory/copy-audit.md` is absent. It should contain the landing-page sentence
word counts, banned-word check, and terminology table. Its absence also means
the plain-words proof was not supplied.

## Earlier verification findings and their current disposition

The prior report at `1e442f2` said PASS and recorded no product defects. Its
candidate comparison, clean build/test result, browser interaction coverage,
basic accessibility result, privacy request observation, security headers,
bundle sizes, and offline result are confirmed above against the byte-matched
implementation. The prior informational live-Axe note is also confirmed:
normal live loading has no CSP console error, while inline Axe injection needs
a CSP-bypass test context; that context found no serious or critical issue.

The previous PASS did not check the now-required demo sandbox, claims manifest
and claim commands, first-screen plain language, real 404 route, complete
metadata/skeleton, or copy-audit record. Findings F1–F6 are their current
disposition. No other earlier minor finding was recorded.

## Result

**FAIL.** Do not declare this product PASS until all six findings are fixed,
each public claim has a passing declared command, and the untested claim count
is zero.
