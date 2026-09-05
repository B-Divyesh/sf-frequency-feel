import { chromium } from 'playwright';
import { startTestServer } from './test-server.mjs';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const grepIndex = process.argv.indexOf('--grep');
const requestedTag = grepIndex >= 0 ? process.argv[grepIndex + 1] : undefined;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function withPage(browser, baseUrl, options, action) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  try {
    await action(page, context, baseUrl);
  } finally {
    await context.close();
  }
}

async function openDemo(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(/\/demo(?:\?|$)/);
  await page.locator('#map-title').waitFor();
}

const claims = [
  {
    tag: '@claim:demo-sandbox',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page) => {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.setItem('frequency-feel:real-settings', 'keep-me'));
      await page.getByRole('link', { name: 'Try it with sample data' }).click();
      await page.waitForURL(/\/demo(?:\?|$)/);
      check(await page.locator('.demo-banner').isVisible(), 'The demo banner was not persistent on the sample page.');
      check((await page.locator('#sample-label').innerText()).includes('Under a blanket'), 'The demo did not identify its sample.');
      check((await page.locator('#map-title').innerText()).includes('Low-pass at 850 Hz'), 'The sample did not open with populated low-pass output.');
      await page.getByRole('button', { name: 'Bell EQ' }).click();
      check(await page.locator('#gain-group').isVisible(), 'The demo did not accept a sample change.');
      await page.getByRole('button', { name: 'Reset demo' }).click();
      check((await page.locator('#map-title').innerText()).includes('Low-pass at 850 Hz'), 'Reset demo did not restore the filled sample.');
      check(await page.evaluate(() => localStorage.getItem('frequency-feel:real-settings')) === 'keep-me', 'Demo actions changed real session data.');
      await page.getByRole('link', { name: 'Start for real' }).click();
      await page.waitForURL(/\/$/);
      check(await page.locator('.demo-banner').count() === 0, 'Start for real did not leave the demo.');
      check(await page.evaluate(() => localStorage.getItem('frequency-feel:real-settings')) === 'keep-me', 'Leaving the demo changed real session data.');
    }),
  },
  {
    tag: '@claim:offline-reload',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 390, height: 844 } }, async (page, context) => {
      await page.goto(`${baseUrl}/demo`, { waitUntil: 'networkidle' });
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload({ waitUntil: 'networkidle' });
      check(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), 'The service worker did not control the first-visit reload.');
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#map-title').waitFor({ timeout: 5000 });
      check((await page.locator('body').innerText()).includes('You’re offline.'), `The offline status was not shown after offline reload (navigator.onLine=${await page.evaluate(() => navigator.onLine)}, hidden=${await page.locator('#offline-banner').getAttribute('hidden')}).`);
      check((await page.locator('#map-title').innerText()).includes('Low-pass'), 'The populated demo did not reload offline.');
    }),
  },
  {
    tag: '@claim:local-audio-privacy',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page) => {
      const requests = [];
      page.on('request', (request) => requests.push(request.url()));
      await page.addInitScript(() => {
        window.__frequencyFeelMediaCalls = 0;
        try {
          const media = navigator.mediaDevices;
          if (media?.getUserMedia) {
            const getUserMedia = media.getUserMedia.bind(media);
            Object.defineProperty(media, 'getUserMedia', { configurable: true, value: (...args) => {
              window.__frequencyFeelMediaCalls += 1;
              return getUserMedia(...args);
            } });
          }
        } catch { /* Some browsers expose a non-configurable media API. */ }
      });
      await openDemo(page, baseUrl);
      await page.getByRole('button', { name: 'Play the loop' }).click();
      await page.getByRole('button', { name: 'Pause the loop' }).waitFor();
      check(await page.evaluate(() => window.__frequencyFeelMediaCalls) === 0, 'Playback requested microphone media.');
      check(requests.every((url) => new URL(url).origin === baseUrl), `The demo made a cross-origin request: ${requests.join(', ')}`);
      check(await page.evaluate(() => document.cookie) === '', 'The demo wrote a cookie while playing local sound.');
    }),
  },
  {
    tag: '@claim:no-tracking',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page, context) => {
      const requests = [];
      page.on('request', (request) => requests.push(request.url()));
      await openDemo(page, baseUrl);
      await page.getByRole('button', { name: 'Copy this setting' }).click();
      check(requests.every((url) => new URL(url).origin === baseUrl), `A tracking or third-party request left the demo: ${requests.join(', ')}`);
      check((await context.cookies()).length === 0, 'The demo set a cookie during a normal sample flow.');
    }),
  },
  {
    tag: '@claim:opt-in-playback',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page) => {
      await openDemo(page, baseUrl);
      const initialPlayText = await page.getByRole('button', { name: 'Play the loop' }).innerText();
      check(initialPlayText.toLowerCase().includes('play'), `Playback had already started before the visitor pressed Play: ${initialPlayText}`);
      check((await page.locator('#volume-output').innerText()) === '18%', 'The initial in-app volume was not 18%.');
      await page.getByRole('button', { name: 'Play the loop' }).click();
      await page.getByRole('button', { name: 'Pause the loop' }).waitFor();
      check(await page.locator('#audio-error').isHidden(), 'Playback did not start after the visitor pressed Play.');
    }),
  },
  {
    tag: '@claim:compare-filtered-sound',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page) => {
      await openDemo(page, baseUrl);
      await page.getByRole('button', { name: 'Original' }).click();
      check(await page.getByRole('button', { name: 'Original' }).getAttribute('aria-pressed') === 'true', 'Original sound was not selected.');
      await page.getByRole('button', { name: 'Filtered' }).click();
      check(await page.getByRole('button', { name: 'Filtered' }).getAttribute('aria-pressed') === 'true', 'Filtered sound was not selected.');
      check((await page.locator('#play-state').innerText()).toLowerCase().includes('filtered'), 'The selected comparison state was not reported.');
    }),
  },
  {
    tag: '@claim:filter-controls',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page) => {
      await openDemo(page, baseUrl);
      const initialPath = await page.locator('#response-path').getAttribute('d');
      await page.getByRole('button', { name: 'High-pass' }).click();
      const highPath = await page.locator('#response-path').getAttribute('d');
      check(initialPath !== highPath, 'Choosing high-pass did not change the response map.');
      await page.getByRole('button', { name: 'Bell EQ' }).click();
      check(await page.locator('#gain-group').isVisible(), 'Choosing Bell EQ did not expose its gain control.');
      await page.getByRole('button', { name: 'Low-pass' }).click();
      check((await page.locator('#map-title').innerText()).includes('Low-pass'), 'Choosing low-pass did not update the response title.');
    }),
  },
  {
    tag: '@claim:keyboard-response-map',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page) => {
      await openDemo(page, baseUrl);
      const handle = page.locator('#chart-handle');
      await handle.focus();
      await page.keyboard.press('Home');
      check(await handle.getAttribute('aria-valuenow') === '20', 'Home did not move the frequency control to 20 Hz.');
      await page.keyboard.press('End');
      check(await handle.getAttribute('aria-valuenow') === '20000', 'End did not move the frequency control to 20 kHz.');
      await page.keyboard.press('ArrowLeft');
      check(Number(await handle.getAttribute('aria-valuenow')) < 20000, 'ArrowLeft did not move the frequency control.');
    }),
  },
  {
    tag: '@claim:shareable-settings',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page, context) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl });
      await openDemo(page, baseUrl);
      await page.getByRole('button', { name: 'Bell EQ' }).click();
      await page.locator('#gain').fill('-6');
      await page.getByRole('button', { name: 'Copy this setting' }).click();
      await page.getByRole('button', { name: 'Link copied' }).waitFor();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      check(copied.includes('type=peaking') && copied.includes('gain=-6.0'), `The copied link did not contain the current setting: ${copied}`);
      await page.goto(`${baseUrl}/?type=comb&frequency=NaN&q=0&gain=999`, { waitUntil: 'networkidle' });
      check(await page.locator('#share-warning').isVisible(), 'An invalid shared setting did not show recovery guidance.');
      check((await page.locator('#map-title').innerText()).includes('Low-pass at 2.2 kHz'), 'Invalid shared values did not recover to the safe default.');
    }),
  },
  {
    tag: '@claim:free-core',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 390, height: 844 } }, async (page) => {
      const popups = [];
      page.on('popup', (popup) => popups.push(popup.url()));
      await openDemo(page, baseUrl);
      await page.getByRole('button', { name: 'Play the loop' }).click();
      await page.getByRole('button', { name: 'Pause the loop' }).waitFor();
      await page.getByRole('button', { name: 'Bell EQ' }).click();
      check(popups.length === 0, 'The free core flow opened a payment or account window.');
      check(await page.locator('input[type="text"], input[type="email"], input[type="password"], [role="textbox"]').count() === 0, 'The free core flow required account details.');
    }),
  },
  {
    tag: '@claim:artwork-disclosure',
    run: async (browser, baseUrl) => withPage(browser, baseUrl, { viewport: { width: 1280, height: 900 } }, async (page) => {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      const disclosure = page.getByText('Artwork was generated for this project.');
      await disclosure.scrollIntoViewIfNeeded();
      check(await disclosure.isVisible(), 'The generated-artwork disclosure was not visible in the footer.');
    }),
  },
];

const selected = requestedTag ? claims.filter((claim) => claim.tag === requestedTag) : claims;
if (selected.length !== 1 && requestedTag) throw new Error(`Expected one claim for ${requestedTag}, found ${selected.length}.`);
if (!selected.length) throw new Error('No claim checks were selected.');

const server = await startTestServer();
const browser = await chromium.launch({ executablePath });
try {
  for (const claim of selected) {
    await claim.run(browser, server.baseUrl);
    console.log(`${claim.tag} passed`);
  }
} finally {
  await browser.close();
  await server.close();
}
