# Frequency Feel

Hear and see filter changes before you use them in a track or game sound.
Frequency Feel is for beginner sound designers learning how low-pass,
high-pass, and bell EQ settings change a sound.

Try the filled sample at [the demo route](/demo). It opens an 850 Hz low-pass
setting that you can change or reset. Demo settings use their own browser key
and never change a real session.

## What the lab does

- Choose low-pass, high-pass, or bell EQ and see the response map update.
- Compare Original and Filtered sound.
- Move the response-map frequency control with Arrow, Home, and End.
- Copy a link to the current filter setting. Invalid links return to a safe
  default.

## Plain facts

- Works offline after the first visit.
- Sound is generated in your browser. No upload or microphone is used.
- No analytics, advertising requests, or cookies are used.
- Sound starts only when you press Play and starts at 18% in-app volume.
- Free to use. No account is required for the core learning flow.
- Artwork was generated for this project.

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Vite prints the local URL. Open `/demo` for the one-click sample.

## Test and build

```bash
npm test
npm run build
npm run test:browser
```

`npm run build` writes the static deployment output to `dist/`, with
`dist/index.html` at its root. `npm run test:browser` builds the app and checks
the full browser flow against a local server that mirrors the known production
routes and 404 response.

Every visitor-facing claim is listed in [`.factory/claims.json`](.factory/claims.json).
Run all claim checks from a clean checkout with:

```bash
npm run test:claims
```

Each command listed in that manifest also works by itself. For example:

```bash
npm run test:claims -- --grep @claim:demo-sandbox
```

## Deploy

Deploy the contents of `dist/` to the configured static host. Keep
`staticwebapp.config.json` with the output: it declares known SPA routes,
security headers, cache policy, and the designed 404 response.

## Privacy and scope

Frequency Feel is a filter-learning page, not a mastering or hearing-safety
service. Read the [privacy page](/privacy) and [terms](/terms) for the full
details.

The researched opportunity is in [`.factory/brief.json`](.factory/brief.json).
The visual system, original-art provenance, and social-card derivation are in
[`.factory/design.md`](.factory/design.md).

## License

[MIT](LICENSE)
