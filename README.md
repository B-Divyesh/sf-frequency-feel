# Frequency Feel

Frequency Feel is a local-first listening lab for beginner sound designers. It
makes low-pass, high-pass, and bell EQ behavior tangible: move a control, watch
the response curve, and switch between level-matched before/after playback of
the same synthesized phrase.

The product is intentionally educational rather than a mastering tool. It does
not accept uploads, use a microphone, make hearing-safety claims, or send audio
off the device.

Live site: [frequency-feel.sociobot.in](https://frequency-feel.sociobot.in)

## What is included

- Three filter types with logarithmic frequency, Q, and bell gain controls
- A live response map with a draggable and keyboard-operable filter stop
- Conservative, opt-in Web Audio playback and a visible volume reminder
- Smooth A/B switching through the same original synthetic loop
- Frequency-weighted energy matching on the filtered signal
- Beginner explanations and three exaggerated teaching presets
- Shareable, validated parameter links
- Responsive 390 px layout, legal routes, and an offline application shell
- No analytics, cookies, third-party scripts, remote fonts, or user audio

The product brief is in [`.factory/brief.json`](.factory/brief.json), the visual
system and image provenance are in [`.factory/design.md`](.factory/design.md),
and verification notes are in [`.factory/handoff.md`](.factory/handoff.md).

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local URL. Sound begins only after a user presses **Play the
loop**.

## Test and build

```bash
npm test
npm run build
npm run preview
```

The production command is exactly `npm run build`. It writes the deployable
static site to `dist/`, with `dist/index.html` at the root.

The optional browser contract test covers Axe, mobile overflow, playback, A/B,
keyboard graph control, presets, routes, and offline reload. Install Playwright's
Chromium once, run `npm run preview` in another terminal, then run:

```bash
npx playwright install chromium
npm run test:browser
```

Set `PLAYWRIGHT_CHROMIUM_PATH` if Chromium is installed at a non-default path.

## Architecture and privacy

This is a Vite + vanilla TypeScript static application. Web Audio synthesizes a
deterministic four-second loop in memory and routes it through native biquad
filters. Settings live in the page URL only. The service worker caches the
compiled shell for offline use; clearing browser site data removes it.

Azure Static Web Apps uses `public/staticwebapp.config.json` for history
fallbacks, immutable asset caching, and security headers. No infrastructure,
DNS, billing, or product IDs are stored here.

## License

MIT. See [LICENSE](LICENSE).
