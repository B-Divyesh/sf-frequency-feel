import { chromium } from 'playwright';
import axe from 'axe-core';
import { startTestServer } from './test-server.mjs';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const externalBaseUrl = process.env.BASE_URL;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

const server = externalBaseUrl ? undefined : await startTestServer();
const baseUrl = externalBaseUrl ?? server.baseUrl;
const browser = await chromium.launch({ executablePath });

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const page = await desktop.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  check(await page.locator('html[lang="en"]').count() === 1, 'The home page does not declare English.');
  check(await page.title() === 'Frequency Feel — hear filter changes', 'The home title is not the job-based page title.');
  check(await page.locator('h1').count() === 1, 'The home page must have exactly one h1.');
  check(await page.locator('main').count() === 1, 'The home page must have one main landmark.');
  check(await page.getByRole('link', { name: 'Try it with sample data' }).isVisible(), 'The first-screen sample action is not visible.');
  check((await page.getByRole('heading', { level: 1 }).innerText()).toLowerCase().includes('filter changes'), 'The first-screen h1 does not name the filter-learning job.');
  check(await page.locator('img').evaluateAll((images) => images.every((image) => image.alt.length > 0)), 'A meaningful image is missing alternative text.');
  check(await page.locator('link[rel="canonical"]').count() === 1, 'The canonical link is missing.');
  check(await page.locator('meta[property="og:image"]').count() === 1, 'The Open Graph image is missing.');

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(/\/demo(?:\?|$)/);
  check(await page.title() === 'Demo — Frequency Feel', 'The demo route did not set its own title.');
  check(await page.locator('.demo-banner').isVisible(), 'The demo does not show its persistent sample label.');
  check((await page.locator('#map-title').innerText()).includes('850 Hz'), 'The demo did not show a populated sample response.');
  await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
  check(await page.evaluate(() => document.activeElement?.tagName) === 'H1', 'Route navigation did not move focus to the new h1.');

  await page.addScriptTag({ content: axe.source });
  const axeResults = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'] }));
  const serious = axeResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
  check(serious.length === 0, `Axe serious/critical violations: ${serious.map((item) => item.id).join(', ')}`);

  await page.getByRole('button', { name: 'Play the loop' }).click();
  await page.getByRole('button', { name: 'Pause the loop' }).waitFor();
  await page.getByRole('button', { name: 'Original' }).click();
  await page.getByRole('button', { name: 'Bell EQ' }).click();
  check(await page.locator('#gain-group').isVisible(), 'Bell EQ did not make the gain control available.');
  await page.locator('#gain').fill('-6');
  check((await page.locator('#chart-summary').innerText()).toLowerCase().includes('reduced'), 'The explanation did not update after a bell cut.');
  const handle = page.locator('#chart-handle');
  await handle.focus();
  const initialFrequency = Number(await handle.getAttribute('aria-valuenow'));
  await page.keyboard.press('ArrowRight');
  check(Number(await handle.getAttribute('aria-valuenow')) > initialFrequency, 'Keyboard control did not move the response-map handle.');
  await page.getByRole('button', { name: 'Pause the loop' }).click();

  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await page.waitForURL(/\/privacy$/);
  check(await page.title() === 'Privacy — Frequency Feel', 'Privacy did not set its own title.');
  check((await page.locator('h1').innerText()).toLowerCase() === 'privacy', 'Privacy did not render its own h1.');
  await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
  check(await page.evaluate(() => document.activeElement?.tagName) === 'H1', 'Privacy navigation did not move focus to its h1.');
  await page.goBack({ waitUntil: 'networkidle' });
  check(await page.locator('.demo-banner').isVisible(), 'Back navigation did not restore the demo route.');
  check(errors.length === 0, `Desktop console errors before the expected 404 response: ${errors.join(' | ')}`);

  const missing = await page.goto(`${baseUrl}/not-a-real-page`, { waitUntil: 'networkidle' });
  check(missing?.status() === 404, `Unknown routes must return HTTP 404, received ${missing?.status()}.`);
  check((await page.locator('h1').innerText()).toLowerCase() === 'page not found', 'The 404 page did not render its designed h1.');
  check((await page.title()) === 'Page not found — Frequency Feel', 'The 404 page did not set its own title.');
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const phone = await mobile.newPage();
  await phone.goto(baseUrl, { waitUntil: 'networkidle' });
  check(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'The 390px layout overflows horizontally.');
  await phone.getByRole('link', { name: 'Try it with sample data' }).click();
  await phone.waitForURL(/\/demo(?:\?|$)/);
  check(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'The populated 390px demo overflows horizontally.');
  check(await phone.getByRole('button', { name: 'Reset demo' }).isVisible(), 'The mobile demo reset action is not usable.');
  await mobile.close();

  const reduced = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(`${baseUrl}/demo`, { waitUntil: 'networkidle' });
  check(await reducedPage.locator('#response-path').evaluate((element) => getComputedStyle(element).transitionDuration) === '0s', 'Reduced motion did not remove response-map transitions.');
  await reduced.close();

  console.log(JSON.stringify({ axeSeriousCritical: 0, desktop: 'passed', mobile: 'passed', keyboard: 'passed', reducedMotion: 'passed', notFound: 404 }));
} finally {
  await browser.close();
  if (server) await server.close();
}
