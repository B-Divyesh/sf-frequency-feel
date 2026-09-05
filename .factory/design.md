# Frequency Feel — visual thesis

## Direction: the night-frequency line

Frequency Feel is an **art-deco transit poster made interactive**. A filter is a
journey: low frequencies depart on the left, presence passes through the middle,
and air arrives at the right. The response curve is the route. This metaphor
makes an abstract signal legible without borrowing the dense chrome of a DAW.

The product uses one deliberately dark treatment. The navy ground is the night
platform; cream paper, brass signage, and coral route markers preserve the
poster character and keep the spectrum comfortable in a dim listening space.
The background is always painted explicitly.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Night | `#081A26` | Page background |
| Platform | `#102B3A` | Raised working surfaces |
| Deep rail | `#06141D` | Insets and chart well |
| Paper | `#F5E8C8` | Primary text and plotted after signal |
| Brass | `#E7B94E` | Focus, primary actions, active route |
| Coral | `#F06A58` | Before signal, warnings, comparison markers |
| Sea glass | `#78C6B0` | Success, learning confirmations |
| Fog | `#AEC1BE` | Secondary copy |
| Danger | `#FF7A6E` | Errors |

Paper on Night and Night on Brass exceed 7:1. Fog on Night exceeds 8:1. Coral
is never the only carrier of state: every color cue has a label, line style, or
shape companion.

## Type

- Display: `Trebuchet MS`, `Avenir Next Condensed`, sans-serif. Wide-tracked
  uppercase headings evoke enamel station lettering without a font download.
- Utility/body: `Avenir Next`, `Segoe UI`, system sans-serif. Friendly, clear,
  and compact around numeric controls. Numeric readouts use tabular figures.
- Scale: 14, 16, 18, 24, 36, and clamp(44–76) px. Body never falls below 16 px.

System-resident type avoids third-party requests and a font payload while the
letterspacing, rules, and geometry create a distinct identity.

## Spacing and composition

An 8 px base rhythm with 4 px for micro-spacing. The desktop composition is a
poster split: teaching copy and original station illustration above, then a
wide response-map workbench. Controls follow underneath as three signal stops.
At 390 px, decoration simplifies, the graph stays full width, controls stack,
and essential playback controls remain thumb-sized. Content measures 68ch.

Double-line brass rules, clipped corners, fan motifs, numbered medallions, and
route dots are the only decorative vocabulary. They always support hierarchy or
the route metaphor; there are no generic cards or gradients.

## Interaction grammar

- Primary action: a brass rectangular “departure board” button with an inline
  play/pause glyph and explicit text.
- Segmented choices behave like labeled rail switches; active state is filled
  and carries `aria-pressed`.
- Range inputs are the same controls as the graph handle, with Arrow keys for
  precise movement. The curve, readout, and explanation update together.
- Before/after comparison uses one synthesized phrase and a 250 ms equal-power
  crossfade. Playback is loudness-normalized per filter response so the lesson
  is timbre, not “louder sounds better.”
- Presets are teaching stops, not production recipes. Each names the audible
  result rather than a genre.

## Motion policy

UI transitions run 180–240 ms and animate only opacity/transform. The graph
curve glides between settings and the play indicator pulses slowly while sound
is active. With `prefers-reduced-motion: reduce`, all movement and pulsing stop;
state changes remain visible through labels, fill, and icons. Nothing autoplays.

## Original asset plan and provenance

The hero image is a generated poster illustration of a fictional frequency
railway: cream waveform rails pass through a geometric filter gate toward a
brass speaker sun. It explains the route metaphor and contains no text, people,
brands, or real transit marks. Product icons, filter diagrams, graph marks, and
the logo monogram are hand-authored SVG/CSS and MIT-licensed with the project.

### Prompt sheet

**Subject:** an abstract frequency railway crossing a monumental filter gate,
waveform tracks from bass to treble, small signal dots, speaker-like sun.
**World/materials:** 1930s art-deco transit poster, screen-printed paper, crisp
geometric vector shapes, subtle ink grain. **Light/lens:** flat poster light,
orthographic composition, no photographic depth. **Palette words:** midnight
navy, warm ivory, aged brass yellow, coral red, a touch of sea-glass green.
**Negative list:** no text, no letters, no numbers, no watermark, no logos, no
people, no brands, no gradients, no photorealism, no modern UI, no headphones.

Generated on 2026-08-27 with Azure OpenAI image deployment `factory-image` via
`/opt/fleet/lib/gen-image.sh`. The exact asset prompt is stored beside the
source PNG in `assets/src/hero-frequency-line.json`. Generated imagery is
original to Frequency Feel and disclosed in the footer.

## Social preview derivation

The 1200 × 630 social preview at
`public/assets/sf-frequency-feel-social.webp` is a centered 1200 × 630 crop
of the reviewed original hero artwork. It keeps the filter gate, broad-to-fine
wave, and speaker sun visible without adding text or a second visual language.
It was derived on 2026-09-05 with ImageMagick from the reviewed WebP export;
the 180 × 180 Apple touch image is a crop of that same preview. These are
derivatives of the original Azure-generated project artwork, not stock assets.
