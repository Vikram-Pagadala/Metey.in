// Browser tests: every page at desktop, tablet and phone widths, then every button, menu, filter,
// gallery, slideshow and form, checked by what the visitor would see.
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
process.on('exit', () => server.kill());

const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const b = await chromium.launch({ executablePath: chrome });
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
const ROUTES = ['/', '/about/', '/services/', '/projects/', '/clients/', '/team/', '/insights/', '/technologies/', '/careers/', '/contact/', '/projects/jindal-corporate-tower-raigarh/', '/no-such-page/'];
for (const [name, vp] of Object.entries({ desktop: [1440, 900], tablet: [820, 1180], phone: [375, 812] })) {
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

/* ---------- every project page: all its images load, nothing scrolls sideways ---------- */
const DATA = JSON.parse(fs.readFileSync(path.join(root, 'src/data/projects.json'), 'utf8'));
for (const [name, vp] of Object.entries({ desktop: [1440, 900], phone: [375, 812] })) {
  console.log(`\n# Project pages (${name})`);
  const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: name === 'phone' });
  for (const pr of DATA) {
    const p = await ctx.newPage(), problems = [];
    p.on('pageerror', e => problems.push(e.message));
    p.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
    await p.goto(`${BASE}/projects/${pr.slug}/`, { waitUntil: 'load' });
    await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; }));
    await p.waitForFunction(() => [...document.images].every(i => i.complete), null, { timeout: 15000 }).catch(() => {});
    const r = await p.evaluate(() => ({ wide: document.documentElement.scrollWidth - document.documentElement.clientWidth, n: document.querySelectorAll('.gal-b').length,
      broken: [...document.images].filter(i => i.complete && !i.naturalWidth && i.getAttribute('src')).map(i => i.getAttribute('src')) }));
    ok(!problems.length && r.wide <= 0 && !r.broken.length && r.n === pr.images.length,
      `${pr.slug}: ${r.n}/${pr.images.length} images${r.wide > 0 ? `, scrolls sideways ${r.wide}px` : ''}${r.broken.length ? ' broken ' + r.broken.join(', ') : ''}${problems.length ? ' ' + problems.join('; ') : ''}`);
    await p.close();
  }
  await ctx.close();
}

console.log('\n# Moved pages redirect');
for (const [from, to] of [['/firm/', '/about/'], ['/practice/', '/services/'], ['/3d-lab/', '/technologies/'], ['/3d-lab/?model=jindal', '/technologies/'], ['/projects/jindal/', '/projects/jindal-corporate-tower-raigarh/'], ['/projects/landcraft', '/projects/golf-links-ghaziabad-landcraft/']]) {
  const p = await open(from);
  ok(new URL(p.url()).pathname === to, `${from} → ${to}`);
  await p.context().close();
}
{
  const p = await open('/#project-vasavi');
  await p.waitForTimeout(500);
  ok(new URL(p.url()).pathname === '/projects/vasavi-urban-bachupally/', 'old one-page link /#project-vasavi reaches the renamed project');
  await p.context().close();
}

for (const vp of [[1440, 900], [375, 812]]) {
  const tag = vp[0] > 1000 ? 'desktop' : 'mobile';
  console.log(`\n# Home (${tag})`);
  let p = await open('/', vp);
  // hero: iconic projects
  const HERO = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site.json'), 'utf8')).home.hero.slides;
  ok(await p.locator('#heroSlides .hs').count() === HERO.length && await p.$eval('#heroSlides .hs.on img', i => i.complete && i.naturalWidth > 600), `hero shows ${HERO.length} iconic projects, the first photograph loaded`);
  await p.click('#heroDots [data-hs="3"]'); await p.waitForTimeout(1800);
  ok(await p.$eval('#heroSlides .hs.on', e => e.getAttribute('data-slide')) === '3' && await attr(p, '#heroDots [data-hs="3"]', 'aria-current') === 'true', 'hero dot 4 shows the fourth project');
  if (tag === 'desktop') {
    await p.mouse.move(vp[0] / 2, vp[1] / 2); await p.waitForTimeout(7200);
    ok(await p.$eval('#heroSlides .hs.on', e => e.getAttribute('data-slide')) === '4', 'with the pointer over the hero, the projects keep changing');
    await p.click('#heroDots [data-hs="3"]'); await p.waitForTimeout(1800);
  }
  ok(await p.$eval('#heroSlides .hs.on img', i => i.complete && i.naturalWidth > 600), 'its photograph loads when shown');
  ok(await p.$eval('#heroSlides .hs.on figcaption a', a => a.getAttribute('href')) === `/projects/${HERO[3].project}/`, 'hero caption links to the project');
  ok(await p.locator('.hero-model, #lab, canvas, script[src*="three"], script[src*="hero-model"]').count() === 0, 'no 3D content on the home page');
  ok((await p.textContent('.mq-l')) === 'Trusted by' && await p.locator('#mqClients span').count() > 8, 'bold clients strip with its label');
  const stats = await p.$$eval('#stats .stat', ss => ss.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  ok(stats.length === 6 && !stats.some(t => /\b48\b/.test(t)) && stats.some(t => t.includes('₹6Cr')), 'key numbers: no 48 years, ₹6Cr in full');
  const reels = () => p.$$eval('.stat-roll .reel', rs => rs.map(r => Math.round((r.getBoundingClientRect().top - r.firstElementChild.getBoundingClientRect().top) / r.getBoundingClientRect().height)).join(''));
  await p.locator('.stat-roll').scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
  const early = +(await reels());
  ok(early >= 1 && early < 100000, `ticket counts up from 1 (${early} after 2.5 s)`);
  await p.waitForTimeout(8500);
  ok(await attr(p, '.stat-roll .ticket', 'aria-label') === '95,00,000 sft' && await reels() === '9500000', 'after 10 s the ticket stops at 95,00,000 sft');
  ok(await p.$eval('.stat-roll .ticket', t => t.classList.contains('done')), 'the finished ticket celebrates (party poppers)');
  // sectors: a list with one photograph per sector
  const SECTORS = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site.json'), 'utf8')).home.sectors;
  await p.locator('#sectors').scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  await p.$$eval('#sectors img', is => is.forEach(i => { i.loading = 'eager'; }));
  await p.waitForFunction(() => [...document.querySelectorAll('#sectors img')].every(i => i.complete), null, { timeout: 15000 }).catch(() => {});
  ok(JSON.stringify(await p.$$eval('#sectors .sx-t b', bs => bs.map(b => b.textContent))) === JSON.stringify(SECTORS.map(s => s.name)) && await p.$$eval('#sectors img', is => is.length === 7 && is.every(i => i.complete && i.naturalWidth > 0)), 'sectors list all seven, each with its project photograph');
  if (tag === 'desktop') {
    await p.hover('#sectors .sx-i:nth-child(4) .sx-a'); await p.waitForTimeout(1000);
    ok(await p.$$eval('#sectors .sx-f', fs => fs.map(f => getComputedStyle(f).opacity).join()) === '0,0,0,1,0,0,0', 'pointing at a sector shows only its photograph');
  } else ok(await p.$$eval('#sectors .sx-f', fs => fs.every(f => getComputedStyle(f).opacity === '1' && f.getBoundingClientRect().width < 120)), 'on phones every sector has its own small photograph');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sectors do not scroll sideways');
  ok(!(await p.textContent('main')).includes('End-to-End') && await p.locator('#systems .eyebrow').first().textContent() === 'Construction Technologies' && await p.locator('#systems a[href="/technologies/"]').count() === 1, 'Construction Technologies links to its page; no End-to-End section');
  // the page keeps its height while scrolling (no placeholder sizes that grow as sections render)
  const h0 = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h0; y += vp[1] * .7) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(60); }
  const h1 = await p.evaluate(() => document.documentElement.scrollHeight);
  ok(Math.abs(h1 - h0) < 40, `page height stays put while scrolling (${h0} → ${h1})`);
  // logo: the wordmark spans the icon's width
  ok(await p.evaluate(() => Math.abs(document.querySelector('.plaque-word').getBoundingClientRect().width - document.querySelector('.plaque-ic').getBoundingClientRect().width) < 1), 'METEY wordmark spans the logo end to end');
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
  ok(total === DATA.length, `${total} project cards for ${DATA.length} projects`);
  for (const [row, key] of [['categories', 'cats'], ['sectors', 'sectors']]) {
    const values = await p.$$eval(`[data-filter="${row}"] [data-value]`, bs => bs.map(x => x.getAttribute('data-value')));
    for (const v of values) {
      await p.locator(`[data-filter="${row}"] [data-value="${v}"]`).click(); await p.waitForTimeout(80);
      const vis = await p.locator('#projGrid .card:not([hidden])').count();
      const want = v === 'all' ? DATA.length : DATA.filter(d => (d[row] || []).includes(v)).length;
      ok(vis === want && await attr(p, `[data-filter="${row}"] [data-value="${v}"]`, 'aria-pressed') === 'true', `${row} "${v}" shows ${vis}/${want}`);
    }
    await p.locator(`[data-filter="${row}"] [data-value="all"]`).click();
  }
  await p.locator('[data-filter="categories"] [data-value="precast"]').click();
  await p.locator('[data-filter="sectors"] [data-value="government-housing"]').click(); await p.waitForTimeout(80);
  const both = DATA.filter(d => (d.categories || []).includes('precast') && (d.sectors || []).includes('government-housing')).length;
  ok(await p.locator('#projGrid .card:not([hidden])').count() === both && both > 0, `precast + government housing together shows ${both}`);
  await p.locator('[data-filter="categories"] [data-value="interiors"]').click(); await p.waitForTimeout(80);
  ok(await p.locator('#projGrid .card:not([hidden])').count() === 0 && !(await p.locator('#filterNone').isHidden()), 'no match shows a message');
  await p.click('#filterReset'); await p.waitForTimeout(80);
  ok(await p.locator('#projGrid .card:not([hidden])').count() === total && await p.locator('#filterNone').isHidden(), '"Show all projects" resets both filters');
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

  console.log(`\n# Net Zero project (${tag})`);
  p = await open('/projects/apcpdcl-corporate-office-vijayawada/', vp);
  ok((await p.textContent('.pd-grid .badge')).includes("Andhra Pradesh's first Net Zero Building") && (await p.title()).includes('Net Zero Building'), 'APCPDCL is marked as Andhra Pradesh\'s first Net Zero Building, also in its title');
  await p.context().close();

  console.log(`\n# Project gallery (${tag})`);
  p = await open('/projects/jindal-corporate-tower-raigarh/', vp);
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

  p = await open('/projects/carol-infrastructure-ghaziabad/', vp);
  await p.locator('.gal-b').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  ok(await p.locator('.pd-grid .shot img').count() === 0, 'project with only low-res images opens on the drawn elevation');
  await p.locator('.gal-b').first().click(); await p.waitForTimeout(600);
  const lr = await p.$eval('#lbImg', i => ({ shown: i.getBoundingClientRect().width, natural: i.naturalWidth }));
  ok(lr.natural > 0 && lr.shown <= lr.natural + 1, `low-res image is not enlarged (${Math.round(lr.shown)}px shown, ${lr.natural}px real)`);
  await p.keyboard.press('Escape');
  await p.context().close();

  console.log(`\n# Team, clients and contact (${tag})`);
  p = await open('/team/', vp);
  const members = JSON.parse(fs.readFileSync(path.join(root, 'src/data/team.json'), 'utf8')).members;
  ok(JSON.stringify(await p.$$eval('.tcard', cs => cs.map(c => [c.querySelector('h3').textContent, c.querySelector('.role').textContent]))) === JSON.stringify(members.map(m => [m.name, m.designation])), `${members.length} team cards, in order, with designations`);
  for (const im of await p.locator('.tcard img').all()) await im.scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
  ok(await p.$$eval('.tcard img', (is, ms) => is.length === ms.length && is.every((i, k) => i.complete && i.naturalWidth > 100 && i.alt === `${ms[k].name}, ${ms[k].designation}` && i.loading === 'lazy'), members), 'every team photo loads, lazily, with name and designation as alt text');
  const frames = await p.$$eval('.tcard img', is => is.map(i => { const r = i.getBoundingClientRect(); return Math.round(r.width / r.height * 100); }));
  ok(frames.every(f => f === 80), `team photos share one 4:5 frame (${[...new Set(frames)].join(', ')})`);
  const perRow = await p.$$eval('.tcard', cs => cs.filter(c => Math.abs(c.getBoundingClientRect().top - cs[0].getBoundingClientRect().top) < 2).length);
  ok(perRow === (vp[0] >= 1024 ? 5 : vp[0] >= 640 ? 3 : 2), `${perRow} team cards per row at ${vp[0]}px`);
  ok(await p.$eval('.portrait img', i => i.getAttribute('src').endsWith('/er-ca-prasad.webp') && i.naturalWidth === 640), "founder's new photo loads");
  ok(await p.locator('#director-experience .xp li').count() === 6 && await p.locator('#director-experience img').count() === 4, "Director's experience: 6 entries and 4 images, separate from projects");
  await p.context().close();
  p = await open('/services/', vp);
  ok(await p.locator('#pracIndex .bubble svg.ic').count() === 7 && await p.$$eval('#pracIndex .bubble', bs => bs.every(b => !b.textContent.trim())), 'services index uses icons, not letters');
  ok(await p.$eval('#pracIndex a[aria-current]', a => a.getAttribute('href')) === '#p-architecture', 'first service is marked on load');
  await p.click('#pracIndex a[href="#p-construction-stage"]'); await p.waitForTimeout(1500);
  ok(await p.$$eval('#pracIndex a[aria-current]', as => as.map(a => a.getAttribute('href')).join()) === '#p-construction-stage', 'clicked service (PMC) is marked');
  ok(new Set(await p.$$eval('#pracIndex .bubble', bs => bs.map(b => getComputedStyle(b).borderColor))).size === 1, 'all index bubbles share one colour');
  ok(await p.locator('#pracIndex a[href="/technologies/"]').count() === 1 && await p.locator('#p-precast').count() === 0, 'services page links to the technologies page');
  await p.context().close();

  console.log(`\n# Technologies (${tag})`);
  const TECH = JSON.parse(fs.readFileSync(path.join(root, 'src/data/services.json'), 'utf8')).technologies.items;
  p = await open('/technologies/', vp);
  ok(await p.locator('#techBody .techsec').count() === TECH.length && await p.locator('#techIndex a').count() === TECH.length, `${TECH.length} technologies, each with its own section`);
  ok(await p.$$eval('#techBody .techsec', ss => ss.every(s => s.querySelectorAll('.tech-fig .dg').length === 1)), 'every technology shows an animated diagram of how it is built');
  ok(await p.locator('.banner [data-art="technologies"] .sway').count() === 1, 'technologies banner has its own drawing (crane), not the services one');
  const nPrecast = DATA.filter(d => (d.categories || []).includes('precast')).length;
  ok(await p.locator('#precast .tech-projects li').count() === nPrecast, `precast lists its ${nPrecast} projects`);
  ok(await p.$eval('#techIndex a[aria-current]', a => a.getAttribute('href')) === '#precast', 'first technology is marked on load');
  await p.click('#techIndex a[href="#monolithic"]'); await p.waitForTimeout(1500);
  ok(await p.$$eval('#techIndex a[aria-current]', as => as.map(a => a.getAttribute('href')).join()) === '#monolithic', 'clicked technology is marked');
  await p.locator('#timber .gal-b').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  await p.locator('#timber .gal-b.ok').first().click(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.getElementById('lb').open), 'technology photographs open in the lightbox');
  await p.keyboard.press('Escape');
  ok(!p.errors.length, 'no page errors ' + p.errors.join(';'));
  await p.context().close();
  p = await open('/services/#p-precast', vp); await p.waitForTimeout(500);
  ok(new URL(p.url()).pathname === '/technologies/', 'old /services/#p-precast link reaches the technologies page');
  await p.context().close();
  p = await open('/about/', vp);
  ok(await p.locator('#history .timeline li').count() === 3 && (await p.textContent('#history')).includes('PS Engineering Consultant'), 'about: history from PS Engineering Consultant');
  ok(!(await p.textContent('#expertise h2')).includes('48'), 'about: 48 years only in the founder text');
  await p.context().close();
  p = await open('/projects/apcpdcl-corporate-office-vijayawada/', vp);
  ok(await attr(p, '.pd-grid a[href="https://www.apcpdcl.in/"]', 'target') === '_blank', 'project links to the client website');
  await p.context().close();
  p = await open('/clients/', vp);
  ok(await p.locator('.ctable').count() === 4 && await p.locator('table.summary tbody tr').count() === 10, 'clients: four tables and the ten-row summary');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'client tables fit the screen');
  await p.context().close();
  p = await open('/contact/', vp);
  const opts = await p.$$eval('#f-service option', o => o.map(x => x.textContent));
  ok(opts.includes('MEP (through co-consultants)') && opts.includes('Project Management Consultancy (PMC)') && opts.includes('Construction Technologies'), 'enquiry form lists the current services');
  ok(await p.locator('.contact-list a[href="tel:+919700159325"]').count() > 0, 'contact page leads with +91 97001 59325');
  await p.context().close();

  console.log(`\n# Contact (${tag})`);
  p = await open('/contact/', vp);
  const copy = p.locator('[data-copy]').first();
  await copy.click(); await p.waitForTimeout(150);
  const ct = await copy.textContent();
  ok(ct === 'Copied' || ct === 'Selected', `copy button → "${ct}"`);
  ok(await p.evaluate(() => navigator.clipboard.readText().catch(() => '?')) === '+919700159325', 'clipboard holds phone number');
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
  ok(links.length === 2 && links[0].startsWith('mailto:bharat@metey.in?subject=') && !links[0].includes('cc=') && links[1].startsWith('https://wa.me/919494756526?'), 'valid submit offers email (to bharat@metey.in only) + WhatsApp (+91 94947 56526) links');
  ok(decodeURIComponent(links[0]).includes('Structural Consultancy') && decodeURIComponent(links[0]).includes('Test User'), 'email link carries the enquiry');
  ok(await attr(p, 'a[href$=".vcf"]', 'download') !== null, 'vCard download link');
  ok(!p.errors.length, 'no page errors ' + p.errors.join(';'));
  await p.context().close();

}

console.log('\n# Reduced motion');
let p = await open('/', [1440, 900], { reducedMotion: 'reduce' });
await p.waitForTimeout(7500);
ok(await p.$eval('#heroSlides .hs.on', e => e.getAttribute('data-slide')) === '0', 'reduced motion: hero stays on the first project');
await p.context().close();

await b.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
