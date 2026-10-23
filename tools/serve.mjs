// Dependency-free local preview of the generated public site.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8000);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.vcf': 'text/vcard', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
// the same moved-page redirects Vercel applies (written into vercel.json by the build)
const moved = new Map((JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8')).redirects || []).map(r => [r.source, r.destination]));
const privateRoots = new Set(['src', 'tools', 'tests', 'integrations', 'metey-content', 'node_modules', 'test-results', 'playwright-report']);
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (moved.has(url.pathname)) {
      response.writeHead(308, { Location: moved.get(url.pathname) + url.search });
      response.end();
      return;
    }
    const name = decodeURIComponent(url.pathname);
    const parts = name.split('/').filter(Boolean);
    if (parts.some(p => p.startsWith('.')) || privateRoots.has(parts[0])) throw new Error('Private path');
    let file = path.resolve(root, '.' + name);
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Outside site');
    const stat = await fs.stat(file);
    if (stat.isDirectory()) {
      if (!name.endsWith('/')) {
        response.writeHead(308, { Location: url.pathname + '/' + url.search });
        response.end();
        return;
      }
      file = path.join(file, 'index.html');
    }
    const type = types[path.extname(file)];
    if (!type) throw new Error('Unsupported file');
    const content = await fs.readFile(file);
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404, { 'Content-Type': types['.html'] });
    response.end(request.method === 'HEAD' ? undefined : await fs.readFile(path.join(root, '404.html')));
  }
}).listen(port, '127.0.0.1', () => console.log(`METEY preview: http://localhost:${port}`));
