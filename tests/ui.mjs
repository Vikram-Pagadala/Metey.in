// Browser tests: every page at desktop, tablet and phone widths, then every button, menu, filter,
// gallery, form and 3D Lab control, checked by what the visitor would see.
//   npm install && npm test
// Uses Google Chrome if installed (or CHROME_PATH), otherwise Playwright's Chromium (npx playwright install chromium).
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8765);
const BASE = `http://127.0.0.1:${PORT}`;
const server = spawn(process.execPath, [path.join(root, 'tools/serve.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('exit', () => reject(new Error('Preview server did not start'))); });

const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
// SwiftShader gives headless Chrome WebGL, so the 3D viewers run as they would on a real device
const b = await chromium.launch({ executablePath: chrome, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
async function open(path, vp = [1440, 900], extra = {}) {
  const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, permissions: ['clipboard-read', 'clipboard-write'], ...extra });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  await p.goto(BASE + path); await p.waitForTimeout(1300);
  return p;
}

/* ---------- layout: no errors, no missing files, no sideways scrolling ---------- */
const ROUTES = ['/', '/firm/', '/practice/', '/projects/', '/insights/', '/3d-lab/', '/careers/', '/contact/', '/projects/jindal/', '/no-such-page/'];
for (const [name, vp] of Object.entries({ desktop: [1440, 900], tablet: [820, 1180], phone: [390, 844] })) {
  console.log(`\n# Layout (${name})`);
  const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, hasTouch: name !== 'desktop', isMobile: name === 'phone' });
  for (const route of ROUTES) {
    const p = await ctx.newPage(), problems = [];
    p.on('pageerror', e => problems.push(e.message));
    p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/no-such-page/')) problems.push(`${r.status()} ${r.url()}`); });
    await p.goto(BASE + route, { waitUntil: 'load' });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } });
    await p.waitForTimeout(400);
    const wide = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(!problems.length && wide <= 0, `${route}${wide > 0 ? ` scrolls sideways by ${wide}px` : ''}${problems.length ? ' ' + problems.join('; ') : ''}`);
    await p.close();
  }
  await ctx.close();
}

const attr = (p, s, a) => p.getAttribute(s, a);

for (const vp of [[1440, 900], [390, 844]]) {
  const tag = vp[0] > 1000 ? 'desktop' : 'mobile';
  console.log(`\n# Home (${tag})`);
  let p = await open('/', vp);
  // hero model controls
  await p.locator('.hero-model').scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
  ok(!(await p.locator('.hero-model-controls').isHidden()), 'hero 3D controls appear once the model loads');
  await p.click('[data-preview-mode=structure]');
  ok(await attr(p, '[data-preview-mode=structure]', 'aria-pressed') === 'true' && await attr(p, '[data-preview-mode=blend]', 'aria-pressed') === 'false', 'Structure view button toggles pressed state');
  await p.click('#hero-model-spin');
  ok((await p.textContent('#hero-model-spin')).includes('Resume') && await attr(p, '#hero-model-spin', 'aria-pressed') === 'false', 'Pause spin → Resume spin');
  await p.click('#hero-model-spin');
  ok((await p.textContent('#hero-model-spin')).includes('Pause'), 'Resume spin → Pause spin');
  // types row
  await p.locator('#types').scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  const sl0 = await p.$eval('#typesRow', e => e.scrollLeft);
  await p.click('#typesNext'); await p.waitForTimeout(900);
  const sl1 = await p.$eval('#typesRow', e => e.scrollLeft);
  ok(sl1 > sl0, `types → scrolls (${sl0}→${Math.round(sl1)})`);
  await p.click('#typesPrev'); await p.waitForTimeout(900);
  ok(await p.$eval('#typesRow', e => e.scrollLeft) < sl1, 'types ← scrolls back');
  // systems tabs
  await p.locator('#systems').scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  const tabs = await p.$$('#sysTabs [data-sys]');
  for (let i = 0; i < tabs.length; i++) {
    const cap0 = await p.textContent('#sysCap');
    await tabs[i].click(); await p.waitForTimeout(150);
    ok(await tabs[i].getAttribute('aria-selected') === 'true' && (i === 0 || (await p.textContent('#sysCap')) !== cap0), `system tab ${i} selects and changes caption`);
  }
  // carousel
  await p.locator('#featured').scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  const t0 = await p.textContent('#carBody');
  await p.click('#carNext'); await p.waitForTimeout(700);
  const t1 = await p.textContent('#carBody');
  ok(t1 !== t0, 'carousel next changes project');
  await p.click('#carPrev'); await p.waitForTimeout(700);
  ok((await p.textContent('#carBody')) === t0, 'carousel prev returns');
  const dots = await p.$$('#carDots [data-dot]');
  await dots[dots.length - 1].click(); await p.waitForTimeout(700);
  ok(await dots[dots.length - 1].getAttribute('aria-current') === 'true', `carousel dot ${dots.length - 1} selects`);
  // map pin & state links
  const mapLinks = await p.$$eval('#wm a', as => as.map(a => a.getAttribute('href')));
  ok(mapLinks.length > 0 && mapLinks.every(Boolean), `map has ${mapLinks.length} links`);
  // mobile menu
  if (tag === 'mobile') {
    await p.evaluate(() => scrollTo(0, 0));
    await p.click('#burger'); await p.waitForTimeout(500);
    ok(await attr(p, '#burger', 'aria-expanded') === 'true' && await p.evaluate(() => document.querySelector('main').inert), 'burger opens menu, page behind inert');
    ok(await p.evaluate(() => document.activeElement.closest('#menu') !== null), 'focus moves into menu');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    ok(await attr(p, '#burger', 'aria-expanded') === 'false', 'Escape closes menu');
    await p.click('#burger'); await p.waitForTimeout(500);
    await p.click('#menu a[href="/projects/"]'); await p.waitForURL('**/projects/');
    ok(true, 'menu link navigates to /projects/');
  }
  ok(!p.errors.length, 'no page errors ' + p.errors.join(';'));
  await p.context().close();

  console.log(`\n# Projects (${tag})`);
  p = await open('/projects/', vp);
  const total = await p.locator('#projGrid .card').count();
  const chips = await p.$$eval('#chips [data-sector]', bs => bs.map(x => x.getAttribute('data-sector')));
  for (const s of chips) {
    await p.click(`#chips [data-sector="${s}"]`); await p.waitForTimeout(100);
    const vis = await p.locator('#projGrid .card:not([hidden])').count();
    const right = await p.$$eval('#projGrid .card:not([hidden])', (cs, s) => cs.every(c => s === 'all' || c.dataset.sector === s), s);
    ok(vis > 0 && right && await attr(p, `#chips [data-sector="${s}"]`, 'aria-pressed') === 'true', `chip "${s}" shows ${vis}/${total}`);
  }
  await p.context().close();
  p = await open('/projects/?state=karnataka', vp);
  const kv = await p.locator('#projGrid .card:not([hidden])').count();
  ok(!(await p.locator('#stateNote').isHidden()) && kv > 0 && kv < total, `?state=karnataka shows ${kv} projects with note`);
  await p.click('#stateAll'); await p.waitForTimeout(100);
  ok(await p.locator('#projGrid .card:not([hidden])').count() === total && p.url().endsWith('/projects/'), '"Show all projects" restores all and cleans URL');
  await p.context().close();
  p = await open('/projects/?state=bogus', vp);
  ok(await p.locator('#projGrid .card:not([hidden])').count() === total, 'unknown ?state shows everything');
  await p.context().close();

  console.log(`\n# Project gallery (${tag})`);
  p = await open('/projects/jindal/', vp);
  await p.locator('.gal-b').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const nThumbs = await p.locator('.gal-b.ok').count();
  ok(nThumbs > 1, `${nThumbs} gallery thumbnails loaded`);
  await p.locator('.gal-b.ok').first().click(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.getElementById('lb').open), 'thumbnail opens lightbox');
  const s0 = await attr(p, '#lbImg', 'src');
  await p.click('#lbNext'); ok(await attr(p, '#lbImg', 'src') !== s0, 'lightbox next');
  await p.click('#lbPrev'); ok(await attr(p, '#lbImg', 'src') === s0, 'lightbox prev');
  await p.keyboard.press('ArrowRight'); ok(await attr(p, '#lbImg', 'src') !== s0, 'ArrowRight key');
  await p.keyboard.press('ArrowLeft'); await p.click('#lbPrev');
  ok((await attr(p, '#lbImg', 'src')).length > 0, 'prev wraps from first to last');
  await p.waitForTimeout(400);
  ok(await p.$eval('#lbImg', i => i.naturalWidth > 100), 'full-size photo actually loads');
  await p.click('#lbX'); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => document.getElementById('lb').open)), 'close button closes');
  ok(await p.evaluate(() => document.activeElement.classList.contains('gal-b')), 'focus returns to thumbnail');
  await p.locator('.gal-b.ok').nth(1).click(); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => document.getElementById('lb').open)), 'Escape closes');
  await p.locator('.gal-b.ok').nth(1).click(); await p.waitForTimeout(300);
  await p.mouse.click(5, 5); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => document.getElementById('lb').open)), 'backdrop click closes');
  ok(!p.errors.length, 'no page errors ' + p.errors.join(';'));
  await p.context().close();

  console.log(`\n# Contact (${tag})`);
  p = await open('/contact/', vp);
  const copy = p.locator('[data-copy]').first();
  await copy.click(); await p.waitForTimeout(150);
  const ct = await copy.textContent();
  ok(ct === 'Copied' || ct === 'Selected', `copy button → "${ct}"`);
  ok(await p.evaluate(() => navigator.clipboard.readText().catch(() => '?')) === '+914024145925', 'clipboard holds phone number');
  await p.waitForTimeout(1800); ok(await copy.textContent() === 'Copy', 'copy label resets');
  await p.click('#enquiry button[type=submit]');
  ok((await p.textContent('#formStatus')).includes('Incomplete') && await attr(p, '#f-name', 'aria-invalid') === 'true', 'empty submit shows validation');
  ok(await p.evaluate(() => document.activeElement.id) === 'f-name', 'focus moves to first invalid field');
  await p.fill('#f-name', 'Test User'); await p.fill('#f-email', 'not-an-email'); await p.fill('#f-msg', 'A 10-storey office');
  await p.click('#enquiry button[type=submit]');
  ok(await attr(p, '#f-email', 'aria-invalid') === 'true' && await attr(p, '#f-name', 'aria-invalid') === null, 'invalid email flagged only');
  await p.fill('#f-email', 'test@example.com'); await p.selectOption('#f-service', { index: 2 });
  await p.click('#enquiry button[type=submit]');
  const links = await p.$$eval('#formStatus a', as => as.map(a => a.href));
  ok(links.length === 2 && links[0].startsWith('mailto:info@metey.in') && links[1].startsWith('https://wa.me/'), 'valid submit offers email + WhatsApp links');
  ok(decodeURIComponent(links[0]).includes('Structural engineering') && decodeURIComponent(links[0]).includes('Test User'), 'email link carries the enquiry');
  ok(await attr(p, 'a[href$=".vcf"]', 'download') !== null, 'vCard download link');
  ok(!p.errors.length, 'no page errors ' + p.errors.join(';'));
  await p.context().close();

  console.log(`\n# 3D Lab (${tag})`);
  p = await open('/3d-lab/?model=dundigal', vp);
  await p.waitForTimeout(1500);
  ok((await p.textContent('#viewer-status')).includes('LIVE'), 'viewer starts');
  ok(await p.$eval('#tab-dundigal', e => e.classList.contains('active')) && (await p.textContent('#hud-typology-title')).includes('Dundigal'), '?model=dundigal preselects Dundigal');
  for (const [id, name, route] of [['sailife', 'Sai Life', 'sai-life'], ['jindal', 'Jindal', 'jindal'], ['dundigal', 'Dundigal', 'dundigal']]) {
    await p.click('#tab-' + id); await p.waitForTimeout(300);
    ok((await p.textContent('#hud-typology-title')).includes(name) && await attr(p, '#model-project-link', 'href') === `/projects/${route}/` && p.url().includes('model=' + id) && await attr(p, '#tab-' + id, 'aria-pressed') === 'true', `tab ${id} updates HUD, link, URL, pressed`);
  }
  await p.click('#btn-mode-struct');
  ok(await p.inputValue('#slider-xray') === '100' && (await p.textContent('#val-xray')) === '100%' && await attr(p, '#btn-mode-struct', 'aria-pressed') === 'true', 'Structural X-Ray → slider 100%');
  await p.click('#btn-mode-arch');
  ok(await p.inputValue('#slider-xray') === '0' && await attr(p, '#btn-mode-arch', 'aria-pressed') === 'true', 'Architecture → slider 0%');
  await p.fill('#slider-xray', '70');
  ok((await p.textContent('#val-xray')) === '70%' && await attr(p, '#btn-mode-struct', 'aria-pressed') === 'true', 'X-ray slider 70% → structural mode');
  await p.fill('#slider-explode', '40');
  ok((await p.textContent('#val-explode')) === '40%', 'explode slider label');
  await p.click('#tab-jindal'); await p.waitForTimeout(300);
  ok(await p.inputValue('#slider-xray') === '70' && (await p.textContent('#val-xray')) === '70%', 'slider values persist across model switch');
  await p.click('#btn-toggle-assembly');
  ok((await p.textContent('#status-assembly')) === 'ERECTING' && await attr(p, '#btn-toggle-assembly', 'aria-pressed') === 'true', 'assembly play');
  await p.click('#btn-toggle-assembly');
  ok((await p.textContent('#status-assembly')) === 'PAUSED' && await attr(p, '#btn-toggle-assembly', 'aria-pressed') === 'false', 'assembly pause');
  await p.click('#btn-autorotate');
  ok((await p.textContent('#autorotate-label')).includes('ON') && await attr(p, '#btn-autorotate', 'aria-pressed') === 'true', 'auto-spin on');
  for (const c of ['cam-elev', 'cam-top', 'cam-found', 'cam-persp']) {
    await p.click('#' + c);
    ok(await attr(p, '#' + c, 'aria-pressed') === 'true' && (await p.$$eval('[data-preset][aria-pressed=true]', x => x.length)) === 1, `camera ${c} pressed alone`);
  }
  ok((await p.textContent('#autorotate-label')).includes('OFF') && await attr(p, '#btn-autorotate', 'aria-pressed') === 'false', 'camera preset turns auto-spin off');
  await p.click('#btn-autorotate');
  ok((await p.textContent('#autorotate-label')).includes('ON'), 'auto-spin back on after camera preset (one click)');
  for (const l of ['light-sunset', 'light-night', 'light-day']) {
    await p.click('#' + l);
    ok(await attr(p, '#' + l, 'aria-pressed') === 'true' && (await p.$$eval('[data-lighting][aria-pressed=true]', x => x.length)) === 1, `lighting ${l}`);
  }
  await p.click('#cam-persp'); await p.waitForTimeout(500);
  await p.locator('#viewport-3d').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  // pick a pin whose dot is not covered by another pin's label
  const pinIdx = await p.$$eval('.hotspot-pin:not([hidden])', ps => ps.findIndex(x => { const r = x.querySelector('.hotspot-dot').getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return e && e.closest('.hotspot-pin') === x; }));
  const pin = p.locator('.hotspot-pin:not([hidden])').nth(Math.max(0, pinIdx));
  if (pinIdx >= 0) {
    const label = await pin.getAttribute('aria-label');
    const dot = await pin.locator('.hotspot-dot').boundingBox();
    const clickPin = () => p.mouse.click(dot.x + dot.width / 2, dot.y + dot.height / 2);
    await clickPin(); await p.waitForTimeout(200);
    ok(await p.$eval('#hotspot-detail-card', e => e.classList.contains('visible')) && label.includes(await p.textContent('#hotspot-card-title')), 'hotspot opens detail card');
    ok(await p.$eval('#hotspot-detail-card', e => { const r = e.getBoundingClientRect(); const c = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return r.top >= 0 && r.bottom <= innerHeight && !!c && e.contains(c); }), 'detail card is on screen and on top when opened');
    await p.click('#hotspot-close'); await p.waitForTimeout(100);
    ok(!(await p.$eval('#hotspot-detail-card', e => e.classList.contains('visible'))), 'close button hides detail card');
    await clickPin(); await p.waitForTimeout(100); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    ok(!(await p.$eval('#hotspot-detail-card', e => e.classList.contains('visible'))), 'Escape hides detail card');
  } else ok(false, 'hotspot pins visible');
  ok(await attr(p, '.exp-exit-btn', 'href') === '/', 'back link');
  ok(!p.errors.length, 'no page errors ' + p.errors.join(';'));
  await p.context().close();
}

console.log('\n# Reduced motion + no-WebGL fallbacks');
let p = await open('/', [1440, 900], { reducedMotion: 'reduce' });
await p.locator('.hero-model').scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
ok((await p.textContent('#hero-model-spin')).includes('Resume'), 'reduced motion: hero spin starts paused');
await p.context().close();
p = await open('/3d-lab/?model=bogus');
ok(await p.$eval('#tab-jindal', e => e.classList.contains('active')), 'unknown ?model falls back to Jindal');
await p.context().close();
const ctx = await b.newContext(); await ctx.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
p = await ctx.newPage(); p.errors = []; p.on('pageerror', e => p.errors.push(e.message));
await p.goto(BASE + '/3d-lab/'); await p.waitForTimeout(1500);
ok(!(await p.locator('.viewer-fallback').isHidden()) && await p.$eval('#tab-jindal', e => e.disabled), 'no WebGL: fallback shown, controls disabled');
await p.goto(BASE + '/'); await p.locator('.hero-model').scrollIntoViewIfNeeded(); await p.waitForTimeout(2000);
ok(await p.locator('.hero-model-fallback').isVisible() && await p.locator('.hero-model-controls').isHidden(), 'no WebGL: hero keeps photo');
ok(!p.errors.length, 'no page errors ' + p.errors.join(';'));
await ctx.close();

await b.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
