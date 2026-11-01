import puppeteer from 'puppeteer-core';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'output');
const framesDir = path.join(outDir, 'frames');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4400 + Math.floor(Math.random() * 100);
const FPS = 60;
const DURATION = 30;
const LIMIT = Number(process.env.FRAMES || 0);
const TOTAL = LIMIT > 0 ? LIMIT : FPS * DURATION;
const OUT_NAME = process.env.OUT || 'assetstudio-factory-twin-2k60.mp4';
const W = 2560, H = 1440;

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

const server = spawn(process.execPath, [path.join(__dirname, 'server.mjs')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});
server.on('exit', (code) => { if (code && code !== 0) console.error('server exited', code); });

let browser;
try {
  await wait(600);
  const probe = await fetch(`http://127.0.0.1:${PORT}/index.html`).catch(() => null);
  if (!probe || !probe.ok) throw new Error('local server not reachable');

  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
      '--disable-dev-shm-usage', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      `--window-size=${W},${H}`,
    ],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', String(e).slice(0, 500)));
  page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text().slice(0, 300)); });

  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${PORT}/index.html?capture=1`, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  console.log(`capture page ready in ${((Date.now() - t0) / 1000).toFixed(1)}s; frames=${TOTAL}`);

  const frameStart = Date.now();
  for (let i = 0; i < TOTAL; i++) {
    const t = (i / FPS) % DURATION;
    await page.evaluate((tt) => window.__renderAt(tt), t);
    await page.screenshot({
      path: path.join(framesDir, `frame-${String(i).padStart(5, '0')}.jpg`),
      type: 'jpeg',
      quality: 95,
      captureBeyondViewport: false,
    });
    if (i % 60 === 0 || i === TOTAL - 1) {
      const elapsed = (Date.now() - frameStart) / 1000;
      const per = elapsed / (i + 1);
      const eta = per * (TOTAL - i - 1);
      console.log(`frame ${i + 1}/${TOTAL}  t=${t.toFixed(2)}s  ${per.toFixed(2)}s/frame  eta ${(eta / 60).toFixed(1)}min`);
    }
  }

  await browser.close();
  browser = null;

  const outPath = path.join(outDir, OUT_NAME);
  const args = [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(framesDir, 'frame-%05d.jpg'),
    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt709:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '16',
    '-profile:v', 'high',
    '-level', '5.1',
    '-colorspace', 'bt709',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-color_range', 'tv',
    '-movflags', '+faststart',
    '-an',
    outPath,
  ];
  console.log('encoding:', 'ffmpeg', args.join(' '));
  const enc = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (enc.status !== 0) throw new Error(`ffmpeg exited ${enc.status}`);

  const probeOut = spawnSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate,codec_name,pix_fmt,bit_rate',
    '-show_entries', 'format=duration,size',
    '-of', 'json', outPath,
  ], { encoding: 'utf8' });
  console.log('ffprobe:', probeOut.stdout);

  if (!LIMIT) {
    const previews = [
      ['preview-01-overview.png', 0.8],
      ['preview-02-walk.png', 5.5],
      ['preview-03-robot.png', 11.2],
      ['preview-04-scan.png', 16.5],
      ['preview-05-agv.png', 21.5],
      ['preview-06-endcard.png', 29.2],
    ];
    for (const [name, ss] of previews) {
      const p = spawnSync('ffmpeg', [
        '-y', '-ss', String(ss), '-i', outPath, '-frames:v', '1', path.join(outDir, name),
      ], { stdio: 'ignore' });
      if (p.status !== 0) console.error('preview failed', name);
    }
    console.log('previews written');
  }
  console.log(`done: ${outPath}  (${((Date.now() - frameStart) / 60000).toFixed(1)} min total)`);
} catch (err) {
  console.error('record failed:', err);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill();
}
