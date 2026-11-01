import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4300 + Math.floor(Math.random() * 200);
const times = (process.env.TIMES || '1,6,11,16.5,21.5,27').split(',').map(Number);
const width = Number(process.env.W || 2560);
const height = Number(process.env.H || 1440);

const server = spawn(process.execPath, [path.join(__dirname, 'server.mjs')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});
await new Promise(r => setTimeout(r, 500));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
    '--disable-dev-shm-usage', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
  ],
  defaultViewport: { width, height, deviceScaleFactor: 1 },
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('console', (m) => {
    const txt = m.text();
    if (m.type() === 'error' || /error|failed/i.test(txt)) console.log('[console]', m.type(), txt.slice(0, 300));
  });
  page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', String(e).slice(0, 500)); });
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${PORT}/index.html?capture=1`, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  console.log('ready in', Date.now() - t0, 'ms');
  fs.mkdirSync(path.join(root, 'output', 'stills'), { recursive: true });
  for (const t of times) {
    const s = Date.now();
    await page.evaluate((tt) => window.__renderAt(tt), t);
    await page.screenshot({ path: path.join(root, 'output', 'stills', `still-${String(t).replace('.', '_')}.png`), type: 'png' });
    console.log(`t=${t} captured in ${Date.now() - s}ms`);
  }
  const info = await page.evaluate(() => ({
    calls: window.__app.renderer.info.render.calls,
    tris: window.__app.renderer.info.render.triangles,
    fps: window.__app.renderer.__fps,
    state: { page: window.__app.state.page, selected: window.__app.state.selected, t: window.__app.state.t },
  }));
  console.log('info', JSON.stringify(info));
  console.log('errors', errors.length ? errors : 'none');
} finally {
  await browser.close();
  server.kill();
}
