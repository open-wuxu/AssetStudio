import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4177;
const width = 1920, height = 1080;
const server = spawn(process.execPath, [path.join(__dirname, 'server.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 500));
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${width},${height}`],
  defaultViewport: { width, height, deviceScaleFactor: 1 },
});
const out = path.join(root, 'output', 'interactive');
fs.mkdirSync(out, { recursive: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push(String(e)); console.log('[pageerror]', String(e).slice(0, 400)); });
  page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 300)); });
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(out, '01-auto.png') });

  await page.click('.tab[data-page="production"]');
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(out, '02-production.png') });

  await page.click('.tree-row[data-id="scan-02"]');
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(out, '03-scan-selected.png') });

  const before = await page.evaluate(() => ({ page: window.__app.state.page, selected: window.__app.state.selected, mode: window.__app.ui.page }));
  await page.click('#btn-auto');
  await new Promise(r => setTimeout(r, 900));
  const after = await page.evaluate(() => ({ page: window.__app.state.page, selected: window.__app.state.selected, autoLabel: document.getElementById('auto-label').textContent }));
  await page.screenshot({ path: path.join(out, '04-auto-resume.png') });

  await page.mouse.move(960, 500);
  await page.mouse.down();
  await page.mouse.move(1100, 520, { steps: 12 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(out, '05-orbit.png') });
  const mode = await page.evaluate(() => document.getElementById('camera-mode').textContent);
  console.log('before', before, 'after', after, 'cameraMode', mode);
  console.log('errors', errors.length ? errors : 'none');
} finally {
  await browser.close(); server.kill();
}
