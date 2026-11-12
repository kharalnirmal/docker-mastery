// Local preview only. Not a production server.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.md': 'text/plain; charset=utf-8', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
function createPreviewServer() { return http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end('Method not allowed');
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (/[\x00-\x1f\x7f]/.test(pathname)) { res.writeHead(400); return res.end('Bad request'); }
  try {
    const blocked = pathname.split(/[\\/]/).some(part =>
      ['node_modules', '.next', 'generated', '.git', 'results'].includes(part.toLowerCase()) ||
      (part.startsWith('.') && !['.env.example', '.dockerignore', '.gitignore'].includes(part)) ||
      /\.(?:dump|sql\.gz|pem|key|bak)$/i.test(part));
    if (blocked) { res.writeHead(403); return res.end('Forbidden'); }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
    const real = await fs.realpath(file);
    if (!real.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': data.length, 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Not found'); }
}); }
module.exports = { createPreviewServer };
if (require.main === module) createPreviewServer().listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173'));
