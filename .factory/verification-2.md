# Verify hearing and seeing filter changes

**Verdict: FAIL**

Verified 5 September 2026 against implementation
`9fad0f76ea8a93f40b441a34b06e2fee74de2bd5`, documentation base
`d762043776296848e6fc6e596d2761cb4582ba5e`, and
https://frequency-feel.sociobot.in.

There are **4 findings**, including **1 incompletely tested public claim**.
The 11 declared claim commands ran, but one command does not prove the outcome
its claim promises.

## Job, audience, and first action

The job is to hear and see what a filter or EQ setting changes. The audience is
a beginner sound designer choosing a setting for a track or game sound. Before
scrolling, fresh desktop and 390 px phone browsers showed:

- “Hear and see filter changes”
- “For beginner sound designers choosing settings for a track or game sound.”
- “Try it with sample data”

The action was visible in both first screens. Evidence:
`/work/.evidence/verify-2-live-desktop-first.png` and
`/work/.evidence/verify-2-live-phone-first.png`.

## Candidate and live artifact

The live deployment is the implementation candidate. A fresh production build
referenced `index-DOmolNRf.js` and `index-2GrS34OU.css`. Live `index.html`, both
hashed bundles, the service worker, robots and sitemap files, favicon, four
image assets, and the designed 404 HTML/CSS matched the build byte for byte.
The complete comparison and hashes are in
`/work/.evidence/verify-2-artifact-match.log`.

Commits after `9fad0f7` changed records and README content, not runtime files.
The earlier note that HTTPS still served `index-DmQhsfAE.js` is no longer
current.

## Findings

### F1 — High — Reset can leave sound playing with no working control

In a fresh live demo, press **Play the loop**, then **Reset demo**. The button
changes to “Play the loop” and the status says “Paused,” but the AudioContext
remains `running`. Press **Start for real** next. The old loop remains running
after the demo controls are removed, so the visible play button controls a new
audio object and cannot stop the old loop.

This is an unexpected-audio and recovery defect in a headphone-focused tool.
`resetDemo()` sets `playing = false` without pausing the existing audio context;
route cleanup then skips its pause because that flag is false. Evidence:
`/work/.evidence/verify-2-live-results.json` records both the running state after
reset and the running state after leaving the demo.

### F2 — Medium — Phone navigation targets are below 44 px

At 390 px, the home header links render 34 px high. Their measured sizes include
Demo at 40.5 × 34 px and Lab at 26.5 × 34 px. The footer wordmark is 193.9 ×
27.9 px. On the designed 404, the four header links are 36 px high; Lab is 28.4
× 36 px. These targets miss the attached accessibility and site-structure
minimum of 44 × 44 CSS px.

Evidence: `smallHomeTargets` and `small404Targets` in
`/work/.evidence/verify-2-live-results.json`.

### F3 — Medium — Starting playback drops keyboard focus

In `/demo`, focus **Play the loop** and press Space. Playback starts, but focus
moves to `<body>` instead of remaining on the button after it becomes “Pause
the loop.” A keyboard user cannot press Space again to stop the sound without
finding and refocusing the control. The button is temporarily disabled during
the async audio action, which causes the focus loss.

All other tested controls were reachable and operable, and keyboard pause
worked after explicitly refocusing the button. Evidence:
`/work/.evidence/verify-2-keyboard.json`.

### F4 — Low — The A/B claim command does not test audible comparison

Claim `compare-filtered-sound` says “Compare original and filtered sound.” Its
declared command passes after toggling Original and Filtered and checking
`aria-pressed` plus status text. It never starts playback or observes the audio
routing. A regression that changes labels but sends the same signal for both
choices would pass this claim command. This does not meet the claims contract’s
requirement to assert the promised observable outcome.

Independent live instrumentation confirmed that the current product is
correct: Original set dry/wet gains near 0.998/0.002, while Filtered set them
near 0.002/1.250, using the same generated four-second looping buffer. That
evidence is in `/work/.evidence/verify-2-audio-routing.json`. The product works
now, but the declared regression check remains incomplete. Untested claim
count: **1**.

## Clean-checkout and claim results

The clean checkout was documentation commit `d762043` on Node 22.23.2 and npm
10.9.8.

- `npm ci` — pass; 57 packages audited, 0 vulnerabilities.
- `npm test` — pass; 8/8 tests.
- `npm run build` — pass; `dist/` produced.
- `npm run test:browser` — pass, including local Axe, mobile, keyboard,
  reduced motion, route focus, and HTTP 404 coverage.
- Every command in `.factory/claims.json` — exit 0.

| Claim | Command result | Coverage disposition |
| --- | --- | --- |
| `demo-sandbox` | Pass | Complete for settings isolation and reset values |
| `offline-reload` | Pass | Complete |
| `local-audio-privacy` | Pass | Complete with independent live request review |
| `no-tracking` | Pass | Complete with independent live request review |
| `opt-in-playback` | Pass | Complete; live AudioContext did not exist before Play |
| `compare-filtered-sound` | Pass | **Incomplete; see F4** |
| `filter-controls` | Pass | Complete |
| `keyboard-response-map` | Pass | Complete |
| `shareable-settings` | Pass | Complete |
| `free-core` | Pass | Complete |
| `artwork-disclosure` | Pass | Complete with recorded project provenance |

Full command output: `/work/.evidence/verify-2-claims.log`. Each tag occurs once
in the claim runner. No other live or README claim lacked a manifest entry.

## Checks that passed

- The one-click demo opened “Under a blanket,” low-pass at 850 Hz and Q 0.7.
  Its banner and sample label persisted. Settings reset correctly, Start for
  real removed the `demo:` key, and a real-session sentinel did not change.
- Normal controls, all filter types, updated map and explanation, A/B routing,
  setting-link copy, 20 Hz/Q 0.3 lower limits, 20 kHz/Q 12/+15 dB upper limits,
  malformed-value warning, safe-default recovery, and post-recovery controls
  worked.
- Home, demo, privacy, and terms returned 200 with route-specific titles and
  one h1. An unknown URL returned the designed HTTP 404 with a return path. The
  404 response is expected, not a defect.
- The supplied `/opt/fleet/lib/verify-url.sh` passed: title, `lang`, one h1,
  main landmark, image alt text, button names, and no load console errors.
- Axe found no violations on home, demo, privacy, terms, or 404 in CSP-bypass
  test contexts. Normal live loading produced no unexpected console or page
  error. The browser's deliberate 404 resource message was classified as
  expected.
- Tab reached the skip link first and all visible controls. Enter, Space,
  arrows, Home, and End worked where applicable. Focus styling was visible;
  the response-map handle used a 7 px cream stroke. Route changes focused the
  new h1. A 640 px layout, equivalent to 200% zoom at 1280 px, had no overflow
  or content loss.
- Reduced motion removed transitions and animation. There was no 390 px
  horizontal overflow.
- A fresh service-worker context gained control, cached
  `frequency-feel-v3`, and reloaded the populated demo offline with an offline
  status. The service worker did not need an update because live and candidate
  versions matched.
- The full live flow set no cookies, requested no microphone, and made no
  cross-origin runtime request. Privacy explains how to clear cached data.
  Security headers include HSTS, CSP, `nosniff`, no-referrer, and denied camera,
  microphone, and geolocation permissions.
- All same-origin links and sitemap routes returned 200. The explicit source
  link returned 200. HTTP redirected to HTTPS.
- Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.1 s, LCP 1.2 s, CLS 0, TBT 30 ms.
- Build sizes: JS 28.72 kB (9.86 kB gzip), CSS 20.67 kB (5.30 kB gzip), and
  mobile hero 32.62 kB. These are within the static-product budgets.
- AI is not needed for the brief's controlled local listening task. No missed
  AI, import, export, or sync step was found.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Review F1: demo sandbox absent | Fixed on live, except the new playback-reset defect in this report. |
| Review F2: claims absent | Manifest and all commands exist and pass; audible A/B coverage remains incomplete (F4). |
| Review F3: first screen unclear | Fixed on live desktop and phone. |
| Review F4: 404 absent | Fixed; unknown paths return the designed HTTP 404. |
| Review F5: metadata and skeleton incomplete | Fixed; metadata, routes, nav, footer, version, and sitemap are live. |
| Review F6: copy audit absent | Fixed; the record exists and matches the live first screen. |
| Earlier verification: live Axe needed CSP bypass | Confirmed as a test-injection condition, not a product defect. Normal CSP produced no console error. |
| Earlier verification: no product defects | Its previously passing functional, privacy, offline, security, and performance checks were reconfirmed. New edge-path checks found F1–F3. |

## Result

**FAIL.** There are 4 findings and 1 incompletely tested claim. PASS requires
zero findings and zero untested claims.
