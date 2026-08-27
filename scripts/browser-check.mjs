import { chromium } from 'playwright';
import axe from 'axe-core';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ executablePath });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const consoleErrors = [];
const requestFailures = [];
page.on('pageerror', (error) => consoleErrors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('requestfailed', (request) => requestFailures.push(`${request.url()}: ${request.failure()?.errorText}`));

const check = (condition, message) => {
  if (!condition) throw new Error(message);
};

await page.goto(baseUrl, { waitUntil: 'networkidle' });
check(await page.locator('h1').count() === 1, 'Home must contain exactly one h1.');
check(await page.locator('main').count() === 1, 'Home must contain a main landmark.');
check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Mobile layout overflows horizontally.');

await page.addScriptTag({ content: axe.source });
const axeResults = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'] }));
const serious = axeResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
check(serious.length === 0, `Axe serious/critical violations: ${serious.map((item) => `${item.id} (${item.nodes.map((node) => node.target.join(' ')).join('; ')})`).join(', ')}`);

await page.locator('#play-button').click();
const playText = await page.locator('#play-button').innerText();
const audioError = await page.locator('#audio-error').innerText();
check(playText.toLowerCase().includes('pause'), `Audio loop did not enter the playing state. Button: ${playText}; error: ${audioError}`);
await page.getByRole('button', { name: 'Before' }).click();
check(await page.getByRole('button', { name: 'Before' }).getAttribute('aria-pressed') === 'true', 'A/B mode did not switch.');
await page.getByRole('button', { name: 'Bell EQ' }).click();
check(await page.locator('#gain-group').isVisible(), 'Bell EQ did not reveal gain control.');
await page.locator('#gain').fill('-6');
check((await page.locator('#chart-summary').innerText()).includes('reduced'), 'Teaching summary did not update with a cut.');

const beforeFrequency = Number(await page.locator('#chart-handle').getAttribute('aria-valuenow'));
await page.locator('#chart-handle').focus();
await page.keyboard.press('ArrowRight');
const afterFrequency = Number(await page.locator('#chart-handle').getAttribute('aria-valuenow'));
check(afterFrequency > beforeFrequency, 'Keyboard graph control did not raise frequency.');

await page.getByRole('button', { name: /Under a blanket/ }).click();
check((await page.locator('#map-title').innerText()).includes('850 Hz'), 'Teaching preset did not load.');
await page.locator('#play-button').click();

await page.goto(`${baseUrl}/privacy`, { waitUntil: 'networkidle' });
check((await page.locator('h1').innerText()).toLowerCase() === 'privacy', 'Privacy route did not render.');
check(await page.locator('h1').count() === 1, 'Privacy route must contain exactly one h1.');

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForTimeout(500);
await page.reload({ waitUntil: 'networkidle' });
check(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), 'Service worker did not take control.');
await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
const offlineText = await page.locator('body').innerText();
check(offlineText.includes("DON’T JUST SET IT"), `Offline shell did not load. Body: ${offlineText.slice(0, 120)}; requests: ${requestFailures.join(' | ')}`);
await context.setOffline(false);

check(consoleErrors.length === 0, `Browser console errors: ${consoleErrors.join(' | ')}`);
console.log(JSON.stringify({ axeSeriousCritical: serious.length, consoleErrors: 0, mobileOverflow: false, audio: 'played', keyboard: 'passed', offline: 'passed' }));
await browser.close();
