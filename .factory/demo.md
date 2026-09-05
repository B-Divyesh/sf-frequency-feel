# Demo sandbox

## Entry point

Open [`/demo`](/demo), or open `/?demo=1`. The landing page also has a visible
**Try it with sample data** action.

## Sample

The demo starts with the **Under a blanket** teaching setting: low-pass at
850 Hz with Q 0.7. The response map, controls, explanation, and A/B listening
controls are already filled in. This lets a visitor hear and see a real filter
change before entering their own values.

## Isolation and reset

Demo settings are held only under the browser key
`demo:frequency-feel:settings`. The regular page never reads that key. The
demo never reads or writes real-session data; this product has no account or
saved project data.

**Reset demo** restores the 850 Hz low-pass sample. **Start for real** removes
the demo key and returns to the regular lab. The direct `?demo=1` entry follows
the same isolation rule.

## Verification

`npm run test:claims -- --grep @claim:demo-sandbox` starts in a fresh browser
context, creates a real-session sentinel, enters the demo, changes it, resets
it, exits it, and proves the sentinel is unchanged.
