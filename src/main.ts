import './style.css';
import { FrequencyAudio, type ListenMode } from './audio';
import {
  FILTER_LABELS,
  PRESETS,
  describeChange,
  formatFrequency,
  frequencyToPosition,
  positionToFrequency,
  sanitizeSettings,
  settingsToQuery,
  type FilterKind,
  type FilterSettings,
} from './model';

const appElement = document.querySelector<HTMLDivElement>('#app');
if (!appElement) throw new Error('App mount was not found.');
const app: HTMLDivElement = appElement;

const legalPages: Record<string, { title: string; intro: string; body: string }> = {
  '/privacy': {
    title: 'Privacy',
    intro: 'Your listening session stays on your device.',
    body: `<h2>What the site processes</h2>
      <p>Frequency Feel synthesizes sound in your browser. It does not request microphone access, accept uploads, use cookies, or collect filter settings.</p>
      <h2>Shared links and network requests</h2>
      <p>When you share a setting, its filter values appear in the link itself. Opening the site makes the normal request needed to serve this page; there are no analytics or advertising requests.</p>
      <h2>Offline storage</h2>
      <p>A service worker may cache the app files on your device so the lab keeps working offline. Clear your browser’s site data to remove that cache.</p>
      <p class="legal-date">Effective 27 August 2026</p>`,
  },
  '/terms': {
    title: 'Terms',
    intro: 'A learning tool, not a mastering or hearing-safety service.',
    body: `<h2>Use of the tool</h2>
      <p>Frequency Feel is provided free of charge to help beginners explore audible filter behavior. The examples are educational starting points, not prescriptions for a track, game, medical need, or hearing condition.</p>
      <h2>Listening responsibility</h2>
      <p>Playback starts only after you press play and defaults to a conservative in-app level. Your device and headphone volume remain under your control. Stop if listening is uncomfortable.</p>
      <h2>No warranty</h2>
      <p>The software is provided “as is,” without warranties. You may use and adapt the source under the MIT License.</p>
      <p class="legal-date">Effective 27 August 2026</p>`,
  },
};

function shell(content: string): string {
  return `<header class="site-header">
      <a class="brand" href="/" aria-label="Frequency Feel home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Frequency Feel</span>
      </a>
      <nav aria-label="Site navigation"><a href="/#lab">The lab</a><a href="/#learn">Field guide</a></nav>
    </header>
    ${content}
    <footer>
      <div><a class="brand footer-brand" href="/">Frequency Feel</a><p>Signal behavior, made tangible.</p></div>
      <p class="footer-note">Original synthesized audio. Hero artwork generated for this project with Azure OpenAI.</p>
      <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-frequency-feel">Source</a></nav>
    </footer>`;
}

function renderLegal(path: string): void {
  const page = legalPages[path];
  document.title = `${page.title} — Frequency Feel`;
  app.innerHTML = shell(`<main id="main" class="legal-page">
    <a class="back-link" href="/">← Return to the lab</a>
    <p class="eyebrow">Frequency Feel / ${page.title}</p>
    <h1>${page.title}</h1>
    <p class="legal-intro">${page.intro}</p>
    <div class="legal-copy">${page.body}</div>
  </main>`);
}

const parsed = sanitizeSettings(new URLSearchParams(location.search));
let settings: FilterSettings = { ...parsed.settings };
let listenMode: ListenMode = 'after';
let playing = false;
let volume = 0.18;
let audio: FrequencyAudio;

function renderHome(): void {
  document.title = 'Frequency Feel — hear what filters change';
  app.innerHTML = shell(`<div id="offline-banner" class="offline-banner" role="status" hidden>
      <span aria-hidden="true">●</span> You’re offline. The full lab is cached and still works.
    </div>
    <main id="main">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow"><span>Platform 01</span> Interactive filter line</p>
          <h1 id="hero-title">Don’t just set it.<br><em>Hear where it goes.</em></h1>
          <p class="hero-lede">Move one filter. Watch the response map change. Switch between the untouched and filtered sound without the louder-one-wins trick.</p>
          <a class="primary-link" href="#lab">Enter the listening lab <span aria-hidden="true">↓</span></a>
          <p class="hero-safety"><span aria-hidden="true">◒</span> Sound is off until you press play. Start with your device volume low.</p>
        </div>
        <figure class="hero-art">
          <picture>
            <source media="(max-width: 720px)" srcset="/assets/hero-frequency-line-720.webp" />
            <img src="/assets/hero-frequency-line.webp" width="1200" height="800" alt="An art-deco frequency railway: broad waves pass through a geometric gate and become fine waves on the route to a speaker-shaped sun." decoding="async" fetchpriority="high" />
          </picture>
          <figcaption>One signal. One filter gate. A visible route from bass to treble.</figcaption>
        </figure>
      </section>

      <section id="lab" class="lab-section" aria-labelledby="lab-title">
        <div class="section-heading">
          <div><p class="eyebrow"><span>Platform 02</span> Listening lab</p><h2 id="lab-title">Run the same signal two ways</h2></div>
          <p>Before and after use the exact same original loop. The filtered side is level-matched to keep your attention on tone, not volume.</p>
        </div>

        <div id="audio-error" class="error-panel" role="alert" hidden></div>
        <div id="share-warning" class="notice" role="status" ${parsed.invalid ? '' : 'hidden'}>Some shared values were outside the safe range, so the default setting was used instead.</div>

        <div class="workbench">
          <div class="map-panel">
            <div class="map-header">
              <div><span class="map-kicker">Live response map</span><strong id="map-title">${FILTER_LABELS[settings.type]} at ${formatFrequency(settings.frequency)}</strong></div>
              <div class="legend" aria-hidden="true"><span><i class="before-line"></i>Before</span><span><i class="after-line"></i>After</span></div>
            </div>
            <div id="chart-wrap" class="chart-wrap">
              <svg id="response-chart" viewBox="0 0 900 390" role="group" aria-labelledby="chart-title chart-description">
                <title id="chart-title">Frequency response before and after filtering</title>
                <desc id="chart-description">${describeChange(settings)}</desc>
                <g class="chart-grid" aria-hidden="true">
                  <path d="M64 42V330M234 42V330M404 42V330M574 42V330M744 42V330M866 42V330" />
                  <path d="M64 42H866M64 114H866M64 186H866M64 258H866M64 330H866" />
                  <text x="64" y="360">20</text><text x="234" y="360">100</text><text x="404" y="360">500</text><text x="574" y="360">2k</text><text x="744" y="360">10k</text><text x="866" y="360" text-anchor="end">20k Hz</text>
                  <text x="54" y="48" text-anchor="end">+18</text><text x="54" y="120" text-anchor="end">+6</text><text x="54" y="192" text-anchor="end">−6</text><text x="54" y="264" text-anchor="end">−18</text><text x="54" y="336" text-anchor="end">−30</text>
                </g>
                <path class="before-path" d="M64 150H866" aria-hidden="true" />
                <path id="response-path-shadow" class="response-path-shadow" d="" aria-hidden="true" />
                <path id="response-path" class="response-path" d="" aria-hidden="true" />
                <line id="handle-line" class="handle-line" x1="0" y1="42" x2="0" y2="330" aria-hidden="true" />
                <circle id="chart-handle" class="chart-handle" cx="0" cy="0" r="12" tabindex="0" role="slider" aria-label="Filter frequency on response map" aria-valuemin="20" aria-valuemax="20000" />
              </svg>
              <p class="chart-hint"><span aria-hidden="true">↔</span> Drag the brass stop, or focus it and use the arrow keys</p>
            </div>
            <p id="chart-summary" class="chart-summary"><span>What changes</span>${describeChange(settings)}</p>
          </div>

          <aside class="control-panel" aria-label="Filter controls">
            <fieldset class="filter-switch">
              <legend>Choose the filter gate</legend>
              <div class="segmented" id="filter-types">
                ${(['lowpass', 'highpass', 'peaking'] as FilterKind[]).map((type) => `<button type="button" data-filter="${type}" aria-pressed="${settings.type === type}">${FILTER_LABELS[type]}</button>`).join('')}
              </div>
            </fieldset>

            <div class="control-group">
              <label for="frequency"><span>Cutoff / center</span><output id="frequency-output" for="frequency">${formatFrequency(settings.frequency)}</output></label>
              <input id="frequency" type="range" min="0" max="1000" step="1" value="${Math.round(frequencyToPosition(settings.frequency) * 1000)}" />
              <div class="range-poles"><span>20 Hz</span><span>20 kHz</span></div>
            </div>

            <div class="control-group">
              <label for="q"><span id="q-label">${settings.type === 'peaking' ? 'Width (Q)' : 'Resonance (Q)'}</span><output id="q-output" for="q">${settings.q.toFixed(1)}</output></label>
              <input id="q" type="range" min="0.3" max="12" step="0.1" value="${settings.q}" />
              <div class="range-poles"><span>Broad</span><span>Focused</span></div>
            </div>

            <div id="gain-group" class="control-group" ${settings.type === 'peaking' ? '' : 'hidden'}>
              <label for="gain"><span>Boost / cut</span><output id="gain-output" for="gain">${settings.gain.toFixed(1)} dB</output></label>
              <input id="gain" type="range" min="-15" max="15" step="0.5" value="${settings.gain}" />
              <div class="range-poles"><span>−15 dB</span><span>+15 dB</span></div>
            </div>

            <div class="listen-deck">
              <div class="listen-topline"><span>Listen to</span><span id="play-state">Ready</span></div>
              <div class="ab-switch" aria-label="Choose the signal to hear">
                <button type="button" data-mode="before" aria-pressed="false"><small>A</small> Before</button>
                <button type="button" data-mode="after" aria-pressed="true"><small>B</small> After</button>
              </div>
              <button id="play-button" class="play-button" type="button"><span class="play-icon" aria-hidden="true">▶</span><span>Play the loop</span></button>
              <div class="volume-row">
                <label for="volume">In-app volume</label><output id="volume-output" for="volume">18%</output>
                <input id="volume" type="range" min="0" max="50" step="1" value="18" />
              </div>
              <p class="volume-warning"><span aria-hidden="true">!</span> Keep your device volume low, especially with headphones. This tool cannot know or control their output level.</p>
            </div>

            <button id="share-button" class="share-button" type="button"><span aria-hidden="true">↗</span> Copy this setting</button>
            <div id="action-status" class="sr-status" aria-live="polite"></div>
          </aside>
        </div>
      </section>

      <section class="preset-section" aria-labelledby="preset-title">
        <div class="section-heading compact"><div><p class="eyebrow"><span>Platform 03</span> Quick departures</p><h2 id="preset-title">Start with a feeling</h2></div><p>These are exaggerated teaching stops, not mixing recipes. Hear the direction first, then fine-tune.</p></div>
        <div class="preset-list">
          ${PRESETS.map((preset, index) => `<button type="button" class="preset" data-preset="${index}"><span class="preset-number">0${index + 1}</span><span><strong>${preset.name}</strong><small>${preset.note}</small></span><span aria-hidden="true">→</span></button>`).join('')}
        </div>
      </section>

      <section id="learn" class="field-guide" aria-labelledby="guide-title">
        <div class="guide-title"><p class="eyebrow"><span>Platform 04</span> Pocket field guide</p><h2 id="guide-title">Three moves. Three clues.</h2></div>
        <ol>
          <li><span class="guide-icon low" aria-hidden="true"><i></i></span><div><strong>Low-pass</strong><p>Lets the low side through and turns down the high side. Listen for softened edges.</p></div></li>
          <li><span class="guide-icon high" aria-hidden="true"><i></i></span><div><strong>High-pass</strong><p>Lets the high side through and turns down the low side. Listen for lighter weight.</p></div></li>
          <li><span class="guide-icon bell" aria-hidden="true"><i></i></span><div><strong>Bell EQ</strong><p>Turns one neighborhood up or down. Higher Q makes that neighborhood narrower.</p></div></li>
        </ol>
        <div class="guide-note"><strong>A useful habit</strong><p>Predict first: “brighter or darker, heavier or lighter?” Then switch A/B. A correct direction matters more than guessing the exact number.</p></div>
      </section>
    </main>`);

  bindHome();
}

function element<T extends Element>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element: ${selector}`);
  return found;
}

function bindHome(): void {
  audio = new FrequencyAudio(settings);
  const playButton = element<HTMLButtonElement>('#play-button');
  const frequencyInput = element<HTMLInputElement>('#frequency');
  const qInput = element<HTMLInputElement>('#q');
  const gainInput = element<HTMLInputElement>('#gain');
  const volumeInput = element<HTMLInputElement>('#volume');
  const chart = element<SVGSVGElement>('#response-chart');
  const handle = element<SVGCircleElement>('#chart-handle');

  if (!audio.supported) {
    const error = element<HTMLDivElement>('#audio-error');
    error.hidden = false;
    error.textContent = 'This browser cannot create Web Audio. You can still move the controls and read the response map; use a current Firefox, Safari, Edge, or Chrome browser to listen.';
    playButton.disabled = true;
  }

  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.filter as FilterKind));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => setListenMode(button.dataset.mode as ListenMode));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = PRESETS[Number(button.dataset.preset)];
      settings = { ...preset.settings };
      syncControls();
      updateExperience();
      element<HTMLElement>('#lab').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      announce(`${preset.name} preset loaded.`);
    });
  });

  frequencyInput.addEventListener('input', () => {
    settings.frequency = positionToFrequency(Number(frequencyInput.value) / 1000);
    updateExperience();
  });
  qInput.addEventListener('input', () => {
    settings.q = Number(qInput.value);
    updateExperience();
  });
  gainInput.addEventListener('input', () => {
    settings.gain = Number(gainInput.value);
    updateExperience();
  });
  volumeInput.addEventListener('input', () => {
    volume = Number(volumeInput.value) / 100;
    audio.setVolume(volume);
    element<HTMLOutputElement>('#volume-output').value = `${Math.round(volume * 100)}%`;
  });

  playButton.addEventListener('click', async () => {
    playButton.disabled = true;
    element<HTMLElement>('#play-state').textContent = 'Starting…';
    try {
      if (playing) await audio.pause(); else await audio.play();
      playing = !playing;
      updatePlayButton();
    } catch (error) {
      const panel = element<HTMLDivElement>('#audio-error');
      panel.hidden = false;
      panel.textContent = `Sound could not start: ${error instanceof Error ? error.message : 'check your browser audio permissions and try again.'}`;
      element<HTMLElement>('#play-state').textContent = 'Unavailable';
    } finally {
      playButton.disabled = false;
    }
  });

  element<HTMLButtonElement>('#share-button').addEventListener('click', copyShareLink);

  let dragging = false;
  const pointerToFrequency = (event: PointerEvent): void => {
    const point = chart.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformed = point.matrixTransform(chart.getScreenCTM()?.inverse());
    settings.frequency = positionToFrequency((transformed.x - 64) / 802);
    syncControls();
    updateExperience();
  };
  chart.addEventListener('pointerdown', (event) => {
    dragging = true;
    chart.setPointerCapture(event.pointerId);
    pointerToFrequency(event);
  });
  chart.addEventListener('pointermove', (event) => { if (dragging) pointerToFrequency(event); });
  chart.addEventListener('pointerup', () => { dragging = false; });
  chart.addEventListener('pointercancel', () => { dragging = false; });
  handle.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const multiplier = event.shiftKey ? 1.25 : 1.06;
    if (event.key === 'ArrowLeft') settings.frequency /= multiplier;
    if (event.key === 'ArrowRight') settings.frequency *= multiplier;
    if (event.key === 'Home') settings.frequency = 20;
    if (event.key === 'End') settings.frequency = 20000;
    settings.frequency = Math.min(20000, Math.max(20, settings.frequency));
    syncControls();
    updateExperience();
  });

  const updateOnline = (): void => { element<HTMLElement>('#offline-banner').hidden = navigator.onLine; };
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();
  updateExperience(false);
}

function setFilter(type: FilterKind): void {
  settings.type = type;
  if (type === 'peaking' && settings.gain === 0) settings.gain = 8;
  syncControls();
  updateExperience();
  announce(`${FILTER_LABELS[type]} selected.`);
}

function setListenMode(mode: ListenMode): void {
  listenMode = mode;
  audio.setMode(mode);
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  });
  element<HTMLElement>('#play-state').textContent = playing ? `Playing ${mode}` : `${mode === 'before' ? 'Original' : 'Filtered'} selected`;
  announce(`${mode === 'before' ? 'Before, original signal' : 'After, filtered signal'} selected.`);
}

function syncControls(): void {
  element<HTMLInputElement>('#frequency').value = String(Math.round(frequencyToPosition(settings.frequency) * 1000));
  element<HTMLInputElement>('#q').value = String(settings.q);
  element<HTMLInputElement>('#gain').value = String(settings.gain);
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === settings.type));
  });
  element<HTMLElement>('#gain-group').hidden = settings.type !== 'peaking';
  element<HTMLElement>('#q-label').textContent = settings.type === 'peaking' ? 'Width (Q)' : 'Resonance (Q)';
}

function updateExperience(updateUrl = true): void {
  audio.update(settings);
  const description = describeChange(settings);
  element<HTMLOutputElement>('#frequency-output').value = formatFrequency(settings.frequency);
  element<HTMLOutputElement>('#q-output').value = settings.q.toFixed(1);
  element<HTMLOutputElement>('#gain-output').value = `${settings.gain.toFixed(1)} dB`;
  element<HTMLElement>('#map-title').textContent = `${FILTER_LABELS[settings.type]} at ${formatFrequency(settings.frequency)}`;
  element<HTMLElement>('#chart-summary').innerHTML = `<span>What changes</span>${description}`;
  element<SVGDescElement>('#chart-description').textContent = description;
  const handle = element<SVGCircleElement>('#chart-handle');
  handle.setAttribute('aria-valuenow', String(Math.round(settings.frequency)));
  handle.setAttribute('aria-valuetext', formatFrequency(settings.frequency));
  drawResponse();
  if (updateUrl) history.replaceState(null, '', `${location.pathname}?${settingsToQuery(settings)}${location.hash}`);
}

function drawResponse(): void {
  const count = 181;
  const frequencies = new Float32Array(count);
  for (let index = 0; index < count; index += 1) frequencies[index] = positionToFrequency(index / (count - 1));
  const magnitude = audio.getResponse(frequencies);
  const points: string[] = [];
  let handleY = 186;
  magnitude.forEach((value, index) => {
    const db = 20 * Math.log10(Math.max(value, 0.00001));
    const x = 64 + (index / (count - 1)) * 802;
    const y = 42 + ((18 - Math.min(18, Math.max(-30, db))) / 48) * 288;
    if (Math.abs(frequencies[index] - settings.frequency) < settings.frequency * 0.025) handleY = y;
    points.push(`${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  });
  const path = points.join(' ');
  element<SVGPathElement>('#response-path').setAttribute('d', path);
  element<SVGPathElement>('#response-path-shadow').setAttribute('d', path);
  const handleX = 64 + frequencyToPosition(settings.frequency) * 802;
  const line = element<SVGLineElement>('#handle-line');
  line.setAttribute('x1', String(handleX));
  line.setAttribute('x2', String(handleX));
  const handle = element<SVGCircleElement>('#chart-handle');
  handle.setAttribute('cx', String(handleX));
  handle.setAttribute('cy', String(handleY));
}

function updatePlayButton(): void {
  const button = element<HTMLButtonElement>('#play-button');
  button.classList.toggle('is-playing', playing);
  button.querySelector<HTMLElement>('.play-icon')!.textContent = playing ? '■' : '▶';
  button.querySelector<HTMLElement>('span:last-child')!.textContent = playing ? 'Pause the loop' : 'Play the loop';
  element<HTMLElement>('#play-state').textContent = playing ? `Playing ${listenMode}` : 'Paused';
}

async function copyShareLink(): Promise<void> {
  const url = `${location.origin}${location.pathname}?${settingsToQuery(settings)}`;
  try {
    await navigator.clipboard.writeText(url);
    announce('Share link copied.');
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.setAttribute('readonly', '');
    textArea.className = 'copy-fallback';
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    announce('Share link copied.');
  }
  const button = element<HTMLButtonElement>('#share-button');
  const original = button.innerHTML;
  button.innerHTML = '<span aria-hidden="true">✓</span> Link copied';
  window.setTimeout(() => { button.innerHTML = original; }, 1800);
}

function announce(message: string): void {
  element<HTMLElement>('#action-status').textContent = message;
}

const path = location.pathname.replace(/\/$/, '') || '/';
if (legalPages[path]) renderLegal(path); else renderHome();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
