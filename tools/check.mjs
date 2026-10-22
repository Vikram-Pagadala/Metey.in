// Validate generated pages, local links, assets and JavaScript without dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['.git', 'node_modules', 'src', 'tools', 'tests', 'integrations', 'test-results', 'playwright-report']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name) || entry.name.startsWith('.')) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
const pages = files.filter(file => file.endsWith('.html'));
const used = new Set();
const errors = [];
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
function checkLink(value, from) {
  if (!value || /^(?:data:|mailto:|tel:|https?:|\/\/)/.test(value)) return;
  const url = new URL(decode(value), 'https://local.test/' + path.relative(root, from));
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) errors.push(`${path.relative(root, from)} → ${value}`);
  else used.add(file);
}
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  if (/\{\{[\w:]+\}\}/.test(html)) errors.push(`Unresolved template: ${file}`);
  for (const match of html.matchAll(/\b(?:src|href|data-full)="([^"]*)"/g)) checkLink(match[1], file);
  for (const match of html.matchAll(/\bsrcset="([^"]*)"/g)) {
    for (const source of match[1].split(',')) checkLink(source.trim().split(/\s+/)[0], file);
  }
  // Social previews are absolute URLs on our own domain.
  for (const match of html.matchAll(/https:\/\/metey\.in(\/assets\/[^"<>\s]+)/g)) checkLink(match[1], file);
}
for (const file of files.filter(file => file.endsWith('.css'))) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/url\(["']?([^\s)"']+)/g)) {
    if (!match[1].startsWith('#')) checkLink(match[1], file);
  }
}
// Search essentials: one h1, a title and description that fit a results snippet, valid structured data,
// and a canonical URL that the sitemap lists.
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]));
for (const loc of listed) checkLink(new URL(loc).pathname, path.join(root, 'sitemap.xml'));
for (const match of sitemap.matchAll(/<image:loc>https:\/\/metey\.in([^<]+)<\/image:loc>/g)) checkLink(match[1].replace(/&amp;/g, '&'), path.join(root, 'sitemap.xml'));
if (!/^Sitemap: https:\/\/metey\.in\/sitemap\.xml$/m.test(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'))) errors.push('robots.txt does not point to the sitemap');
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8'), name = path.relative(root, file);
  const head = html.slice(0, html.indexOf('</head>'));
  const title = decode((/<title>([^<]*)<\/title>/.exec(head) || [])[1] || '');
  const description = decode((/<meta name="description" content="([^"]*)"/.exec(head) || [])[1] || '');
  if (!title || title.length > 70) errors.push(`${name}: title missing or over 70 characters (${title.length})`);
  if (!description || description.length > 160) errors.push(`${name}: description missing or over 160 characters (${description.length})`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) errors.push(`${name}: expected exactly one <h1>`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { errors.push(`${name}: invalid JSON-LD`); }
  }
  if (/name="robots" content="noindex/.test(head)) continue;
  const canonical = (/<link rel="canonical" href="([^"]+)"/.exec(head) || [])[1];
  if (!canonical || !listed.has(canonical)) errors.push(`${name}: canonical ${canonical} is not in sitemap.xml`);
}
for (const file of files.filter(file => file.endsWith('.js'))) execFileSync(process.execPath, ['--check', file]);
for (const file of files.filter(file => /\.(?:jpe?g|png|webp|woff2|pdf|vcf)$/.test(file))) {
  if (!used.has(file)) errors.push(`Unreferenced asset: ${path.relative(root, file)}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Checked ${pages.length} pages: local links, image variants, fonts, PDFs, template output, titles, descriptions, structured data, sitemap and JavaScript syntax pass.`);
