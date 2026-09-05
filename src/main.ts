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

const SITE_ORIGIN = 'https://frequency-feel.sociobot.in';
const DEMO_STORAGE_KEY = 'demo:frequency-feel:settings';
const DEMO_SAMPLE = PRESETS[0];

const legalPages: Record<string, { title: string; description: string; intro: string; body: string }> = {
  '/privacy': {
    title: 'Privacy — Frequency Feel',
    description: 'Read how Frequency Feel keeps its filter-learning session local to your browser.',
    intro: 'Your listening session stays on your device.',
    body: `<h2>What the site processes</h2>
      <p>Frequency Feel makes sound in your browser. It does not request microphone access, accept uploads, use cookies, or collect filter settings.</p>
      <h2>Shared links and network requests</h2>
      <p>When you copy a setting, its filter values appear in the link. The site makes only the requests needed to serve its files. It has no analytics or advertising requests.</p>
      <h2>Offline storage</h2>
      <p>A service worker may cache app files so the lab works offline after its first visit. Clear browser site data to remove that cache.</p>
      <h2>Demo storage</h2>
      <p>Demo settings use a separate browser key and are discarded when you start for real. They do not change your real session.</p>
      <p class="legal-date">Effective 5 September 2026</p>`,
  },
  '/terms': {
    title: 'Terms — Frequency Feel',
    description: 'Read the terms for Frequency Feel, a free filter-learning tool for beginner sound designers.',
    intro: 'A learning tool, not a mastering or hearing-safety service.',
    body: `<h2>Use of the tool</h2>
      <p>Frequency Feel is free to use. It helps beginners explore filter behavior. Its examples are learning aids, not settings for a track, game, medical need, or hearing condition.</p>
      <h2>Listening responsibility</h2>
      <p>Playback starts only after you press Play. It starts at a conservative in-app level. Your device and headphone volume remain under your control. Stop if listening is uncomfortable.</p>
      <h2>No warranty</h2>
      <p>The software is provided “as is,” without warranties. You may use and adapt the source under the MIT License.</p>
      <p class="legal-date">Effective 5 September 2026</p>`,
  },
};

let settings: FilterSettings = { ...DEMO_SAMPLE.settings };
let parsedInvalid = false;
let demoMode = false;
let listenMode: ListenMode = 'after';
let playing = false;
let volume = 0.18;
let audio: FrequencyAudio | undefined;

function setPageMetadata(title: string, path: string, description: string): void {
  document.title = title;
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  canonical?.setAttribute('href', `${SITE_ORIGIN}${path}`);
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `${SITE_ORIGIN}${path}`);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', description);
}

function demoBanner(): string {
  return `<aside class="demo-banner" aria-label="Demo mode">
      <div><strong>Demo — sample data, nothing is saved to your real session.</strong><span id="sample-label">Sample: ${DEMO_SAMPLE.name}</span></div>
      <div class="demo-actions"><button id="reset-demo" type="button">Reset demo</button><a href="/" id="start-real">Start for real</a></div>
    </aside>`;
}

function shell(content: string, demo = false): string {
  return `<header class="site-header">
      <a class="brand" href="/" aria-label="Frequency Feel home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Frequency Feel</span>
      </a>
      <nav aria-label="Site navigation"><a href="/demo">Demo</a><a href="/#lab">Lab</a><a href="/#learn">How it works</a><a href="/privacy">Privacy</a></nav>
    </header>
    <div id="route-status" class="sr-status" aria-live="polite"></div>
    ${demo ? demoBanner() : ''}
    ${content}
    <footer>
      <div><a class="brand footer-brand" href="/">Frequency Feel</a><p>Hear and see what a filter changes.</p></div>
      <p class="footer-note">Artwork was generated for this project. Sound is generated in your browser.</p>
      <div class="footer-meta"><nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-frequency-feel" rel="noreferrer">Source</a></nav><p>Built by Param Factory · v1.1.0</p></div>
    </footer>`;
}

function renderLegal(path: string): void {
  const page = legalPages[path];
  setPageMetadata(page.title, path, page.description);
  const heading = path === '/privacy' ? 'Privacy' : 'Terms';
  app.innerHTML = shell(`<main id="main" class="legal-page">
    <a class="back-link" href="/">← Return to the lab</a>
    <p class="eyebrow">Frequency Feel</p>
    <h1 class="route-heading" tabindex="-1">${heading}</h1>
    <p class="legal-intro">${page.intro}</p>
    <div class="legal-copy">${page.body}</div>
  </main>`);
}

function renderNotFound(): void {
  setPageMetadata('Page not found — Frequency Feel', location.pathname, 'The requested Frequency Feel page was not found. Return to the filter learning lab.');
  app.innerHTML = shell(`<main id="main" class="not-found-page">
    <p class="eyebrow">Frequency Feel</p>
    <h1 class="route-heading" tabindex="-1">Page not found</h1>
    <p>The page address is not available. Return to the filter learning lab or open the sample demo.</p>
    <div class="not-found-actions"><a class="primary-link" href="/">Return to the lab</a><a class="text-link" href="/demo">Try the sample demo</a></div>
  </main>`);
}

function renderHome(): void {
  const title = demoMode ? 'Demo — Frequency Feel' : 'Frequency Feel — hear filter changes';
  const description = demoMode
    ? 'Try a filled Frequency Feel sample and hear and see a low-pass filter change.'
    : 'Hear and see filter changes with a safe synthetic loop and a live frequency-response map.';
  setPageMetadata(title, demoMode ? '/demo' : '/', description);
  const hero = demoMode ? `<section class="demo-intro" aria-labelledby="hero-title">
        <p class="eyebrow">Sample listening lab</p>
        <h1 id="hero-title" class="route-heading" tabindex="-1">Hear and see filter changes</h1>
        <p>Try the filled low-pass setting. Change it, compare the sound, or reset the sample.</p>
      </section>` : `<section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Interactive filter and EQ listener</p>
          <h1 id="hero-title" class="route-heading" tabindex="-1">Hear and see filter changes</h1>
          <p class="hero-lede">For beginner sound designers choosing settings for a track or game sound.</p>
          <a class="primary-link" href="/demo">Try it with sample data <span aria-hidden="true">→</span></a>
          <p class="first-action-help">Opens a filled low-pass example. You can reset it.</p>
          <ul class="hero-facts"><li>Works offline after the first visit.</li><li>No upload, microphone, or tracking.</li><li>Free to use. Sound starts only when you press Play.</li></ul>
        </div>
        <figure class="hero-art">
          <picture>
            <source media="(max-width: 720px)" srcset="/assets/hero-frequency-line-720.webp" />
            <img src="/assets/hero-frequency-line.webp" width="1200" height="800" alt="An art-deco illustration showing a broad wave passing through a geometric filter and becoming a fine wave near a speaker-shaped sun." decoding="async" fetchpriority="high" />
          </picture>
          <figcaption>The illustration shows low and high frequencies moving through a filter.</figcaption>
        </figure>
      </section>`;

  app.innerHTML = shell(`${hero}
    <main id="main">
      <section id="lab" class="lab-section ${demoMode ? 'demo-lab' : ''}" aria-labelledby="lab-title">
        <div class="section-heading">
          <div><p class="eyebrow">Listening lab</p><h2 id="lab-title">Compare filter settings</h2></div>
          <p>Switch between the original loop and the filtered loop. The map explains the direction of the change.</p>
        </div>

        <div id="offline-banner" class="offline-banner" role="status" hidden><span aria-hidden="true">●</span> You’re offline. The lab is cached and still works.</div>
        <div id="audio-error" class="error-panel" role="alert" hidden></div>
        <div id="share-warning" class="notice" role="status" ${parsedInvalid ? '' : 'hidden'}>Some shared values were outside the safe range, so the default setting was used instead.</div>

        <div class="workbench">
          <div class="map-panel">
            <div class="map-header">
              <div><span class="map-kicker">Frequency response</span><strong id="map-title">${FILTER_LABELS[settings.type]} at ${formatFrequency(settings.frequency)}</strong></div>
              <div class="legend" aria-hidden="true"><span><i class="before-line"></i>Original</span><span><i class="after-line"></i>Filtered</span></div>
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
              <p class="chart-hint"><span aria-hidden="true">↔</span> Drag the filter handle, or focus it and use the arrow keys.</p>
            </div>
            <p id="chart-summary" class="chart-summary"><span>What changes</span>${describeChange(settings)}</p>
          </div>

          <aside class="control-panel" aria-label="Filter controls">
            <fieldset class="filter-switch">
              <legend>Choose a filter type</legend>
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
                <button type="button" data-mode="before" aria-pressed="false"><small>A</small> Original</button>
                <button type="button" data-mode="after" aria-pressed="true"><small>B</small> Filtered</button>
              </div>
              <button id="play-button" class="play-button" type="button"><span class="play-icon" aria-hidden="true">▶</span><span>Play the loop</span></button>
              <div class="volume-row">
                <label for="volume">In-app volume</label><output id="volume-output" for="volume">18%</output>
                <input id="volume" type="range" min="0" max="50" step="1" value="18" />
              </div>
              <p class="volume-warning"><span aria-hidden="true">!</span> Keep your device volume low, especially with headphones. This tool cannot control their output level.</p>
            </div>

            <button id="share-button" class="share-button" type="button"><span aria-hidden="true">↗</span> Copy this setting</button>
            <div id="action-status" class="sr-status" aria-live="polite"></div>
          </aside>
        </div>
      </section>

      <section class="preset-section" aria-labelledby="preset-title">
        <div class="section-heading compact"><div><p class="eyebrow">Sample settings</p><h2 id="preset-title">Start with a sample setting</h2></div><p>These settings exaggerate a direction so you can hear it before you fine-tune.</p></div>
        <div class="preset-list">
          ${PRESETS.map((preset, index) => `<button type="button" class="preset" data-preset="${index}"><span class="preset-number">0${index + 1}</span><span><strong>${preset.name}</strong><small>${preset.note}</small></span><span aria-hidden="true">→</span></button>`).join('')}
        </div>
      </section>

      <section id="learn" class="field-guide" aria-labelledby="guide-title">
        <div class="guide-title"><p class="eyebrow">Filter basics</p><h2 id="guide-title">How it works</h2></div>
        <ol>
          <li><span class="guide-icon low" aria-hidden="true"><i></i></span><div><strong>Choose a filter</strong><p>Low-pass turns down highs. High-pass turns down lows. Bell EQ changes one area.</p></div></li>
          <li><span class="guide-icon high" aria-hidden="true"><i></i></span><div><strong>Move the frequency</strong><p>Drag the handle or use the controls. The map shows the part that changes.</p></div></li>
          <li><span class="guide-icon bell" aria-hidden="true"><i></i></span><div><strong>Compare the sound</strong><p>Switch Original and Filtered. Listen for brighter, darker, heavier, or lighter sound.</p></div></li>
        </ol>
        <div class="guide-note"><strong>How to listen</strong><p>Predict a direction first. Then compare the two signals. You do not need to guess an exact number.</p></div>
      </section>

      <section class="limits-section" aria-labelledby="limits-title">
        <div><p class="eyebrow">Privacy and limits</p><h2 id="limits-title">Keep the lesson local</h2></div>
        <div><p>Sound is generated in your browser. No upload or microphone is used.</p><p>This is a learning tool for filter direction, not a mastering tool.</p></div>
      </section>
    </main>`, demoMode);

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

  if (demoMode) element<HTMLButtonElement>('#reset-demo').addEventListener('click', resetDemo);
  if (!audio.supported) {
    const error = element<HTMLDivElement>('#audio-error');
    error.hidden = false;
    error.textContent = 'This browser cannot create Web Audio. You can still move the controls and read the response map. Use a current Firefox, Safari, Edge, or Chrome browser to listen.';
    playButton.disabled = true;
  }

  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter as FilterKind)));
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.addEventListener('click', () => setListenMode(button.dataset.mode as ListenMode)));
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => button.addEventListener('click', () => {
    const preset = PRESETS[Number(button.dataset.preset)];
    settings = { ...preset.settings };
    syncControls();
    updateExperience();
    element<HTMLElement>('#lab').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    announce(`${preset.name} sample loaded.`);
  }));
  frequencyInput.addEventListener('input', () => { settings.frequency = positionToFrequency(Number(frequencyInput.value) / 1000); updateExperience(); });
  qInput.addEventListener('input', () => { settings.q = Number(qInput.value); updateExperience(); });
  gainInput.addEventListener('input', () => { settings.gain = Number(gainInput.value); updateExperience(); });
  volumeInput.addEventListener('input', () => {
    volume = Number(volumeInput.value) / 100;
    audio?.setVolume(volume);
    element<HTMLOutputElement>('#volume-output').value = `${Math.round(volume * 100)}%`;
  });
  playButton.addEventListener('click', async () => {
    playButton.disabled = true;
    element<HTMLElement>('#play-state').textContent = 'Starting…';
    try {
      if (playing) await audio?.pause(); else await audio?.play();
      playing = !playing;
      updatePlayButton();
    } catch (error) {
      const panel = element<HTMLDivElement>('#audio-error');
      panel.hidden = false;
      panel.textContent = `Sound could not start: ${error instanceof Error ? error.message : 'check your browser audio permissions and try again.'}`;
      element<HTMLElement>('#play-state').textContent = 'Unavailable';
    } finally { playButton.disabled = false; }
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
  chart.addEventListener('pointerdown', (event) => { dragging = true; chart.setPointerCapture(event.pointerId); pointerToFrequency(event); });
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
  window.setTimeout(updateOnline, 80);
  updateExperience(false);
}

function resetDemo(): void {
  settings = { ...DEMO_SAMPLE.settings };
  listenMode = 'after';
  playing = false;
  volume = 0.18;
  try { localStorage.removeItem(DEMO_STORAGE_KEY); } catch { /* Storage can be disabled. */ }
  syncControls();
  setListenMode('after');
  element<HTMLInputElement>('#volume').value = '18';
  element<HTMLOutputElement>('#volume-output').value = '18%';
  updateExperience();
  updatePlayButton();
  announce('Demo reset to the filled low-pass sample.');
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
  audio?.setMode(mode);
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  element<HTMLElement>('#play-state').textContent = playing ? `Playing ${mode}` : `${mode === 'before' ? 'Original' : 'Filtered'} selected`;
  announce(`${mode === 'before' ? 'Original signal' : 'Filtered signal'} selected.`);
}

function syncControls(): void {
  element<HTMLInputElement>('#frequency').value = String(Math.round(frequencyToPosition(settings.frequency) * 1000));
  element<HTMLInputElement>('#q').value = String(settings.q);
  element<HTMLInputElement>('#gain').value = String(settings.gain);
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === settings.type)));
  element<HTMLElement>('#gain-group').hidden = settings.type !== 'peaking';
  element<HTMLElement>('#q-label').textContent = settings.type === 'peaking' ? 'Width (Q)' : 'Resonance (Q)';
}

function updateExperience(updateUrl = true): void {
  audio?.update(settings);
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
  if (demoMode) saveDemoSettings();
  if (updateUrl) {
    const params = new URLSearchParams(settingsToQuery(settings));
    if (demoMode && location.pathname === '/') params.set('demo', '1');
    history.replaceState({ ...(history.state ?? {}), scrollY: window.scrollY }, '', `${location.pathname}?${params.toString()}${location.hash}`);
  }
}

function drawResponse(): void {
  const count = 181;
  const frequencies = new Float32Array(count);
  for (let index = 0; index < count; index += 1) frequencies[index] = positionToFrequency(index / (count - 1));
  const magnitude = audio?.getResponse(frequencies) ?? new Float32Array(count).fill(1);
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
  const url = `${location.origin}${location.pathname}?${settingsToQuery(settings)}${demoMode && location.pathname === '/' ? '&demo=1' : ''}`;
  try { await navigator.clipboard.writeText(url); announce('Share link copied.'); }
  catch {
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
  const status = document.querySelector<HTMLElement>('#action-status, #route-status');
  if (status) status.textContent = message;
}

function readDemoSettings(): FilterSettings | undefined {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!stored) return undefined;
    const candidate = JSON.parse(stored) as FilterSettings;
    const parsed = sanitizeSettings(new URLSearchParams(settingsToQuery(candidate)));
    return parsed.invalid ? undefined : parsed.settings;
  } catch { return undefined; }
}

function saveDemoSettings(): void {
  try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(settings)); } catch { /* Storage can be disabled. */ }
}

function cleanupHome(): void {
  if (audio && playing) void audio.pause();
  audio = undefined;
  playing = false;
}

function isDemoRoute(path: string, search: URLSearchParams): boolean {
  return path === '/demo' || (path === '/' && search.get('demo') === '1');
}

function initialiseRouteState(path: string): void {
  const search = new URLSearchParams(location.search);
  demoMode = isDemoRoute(path, search);
  listenMode = 'after';
  playing = false;
  volume = 0.18;
  if (demoMode) {
    settings = readDemoSettings() ?? { ...DEMO_SAMPLE.settings };
    parsedInvalid = false;
  } else {
    try { localStorage.removeItem(DEMO_STORAGE_KEY); } catch { /* Storage can be disabled. */ }
    const parsed = sanitizeSettings(search);
    settings = { ...parsed.settings };
    parsedInvalid = parsed.invalid;
  }
}

function renderRoute(moveFocus = false): void {
  cleanupHome();
  const path = location.pathname.replace(/\/$/, '') || '/';
  initialiseRouteState(path);
  if (legalPages[path]) renderLegal(path);
  else if (path === '/' || path === '/demo') renderHome();
  else renderNotFound();
  if (moveFocus) window.requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>('h1');
    heading?.focus();
    const routeStatus = document.querySelector<HTMLElement>('#route-status');
    if (routeStatus && heading) routeStatus.textContent = `${heading.textContent} page`;
  });
}

function navigate(url: URL): void {
  const destinationDemo = isDemoRoute(url.pathname.replace(/\/$/, '') || '/', url.searchParams);
  if (demoMode && !destinationDemo) try { localStorage.removeItem(DEMO_STORAGE_KEY); } catch { /* Storage can be disabled. */ }
  history.replaceState({ ...(history.state ?? {}), scrollY: window.scrollY }, '', location.href);
  history.pushState({ scrollY: 0 }, '', `${url.pathname}${url.search}${url.hash}`);
  window.scrollTo(0, 0);
  renderRoute(true);
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
  if (!target || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (target.target || target.hasAttribute('download')) return;
  const url = new URL(target.href, location.href);
  if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
  event.preventDefault();
  navigate(url);
});

window.addEventListener('popstate', () => {
  renderRoute(true);
  window.requestAnimationFrame(() => window.scrollTo(0, Number(history.state?.scrollY ?? 0)));
});

history.replaceState({ ...(history.state ?? {}), scrollY: window.scrollY }, '', location.href);
renderRoute();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
