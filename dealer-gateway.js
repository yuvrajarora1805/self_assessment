const http = require('http');

const PORT        = 3001;
const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 3000;

// Routes that are completely blocked on the dealer domain
const ADMIN_BLOCKED = ['/dealers', '/map', '/new-audit', '/audits'];

// Routes allowed to pass through to Next.js on the dealer domain
const DEALER_ALLOWED_PREFIXES = [
  '/dealer-login',
  '/dealer-portal',
  '/audit-form',
  '/legacy',
  '/api',
  '/_next',
  '/favicon.ico',
  '/__nextjs',
];

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0]; // pathname without query

  // 1. Root → dealer-login
  if (path === '/' || path === '') {
    res.writeHead(302, { 'Location': '/dealer-login', 'Content-Type': 'text/html' });
    res.end('Redirecting to Dealer Login...');
    return;
  }

  // 2. Old /login path → dealer-login
  if (path === '/login') {
    res.writeHead(302, { 'Location': '/dealer-login', 'Content-Type': 'text/html' });
    res.end('Redirecting to Dealer Login...');
    return;
  }

  // 3. Old /dealer-portal path → dealer-login
  if (path === '/dealer-portal' || path.startsWith('/dealer-portal/')) {
    res.writeHead(302, { 'Location': '/dealer-login', 'Content-Type': 'text/html' });
    res.end('Redirecting to Dealer Login...');
    return;
  }

  // 4. Hard-block admin routes — 403 before hitting Next.js
  if (ADMIN_BLOCKED.some(r => path.startsWith(r))) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="font-family:sans-serif;padding:48px;background:#001f3f;color:#fff;text-align:center">
          <h2 style="color:#f87171">🔒 Access Restricted</h2>
          <p style="color:#93c5fd;margin-top:12px">This section is for authorised admin users only.</p>
          <a href="/dealer-login" style="display:inline-block;margin-top:24px;padding:10px 24px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            ← Dealer Login
          </a>
        </body>
      </html>
    `);
    return;
  }

  // 5. Proxy all allowed requests to Next.js (port 3000)
  const clientHost = req.headers['x-forwarded-host'] || req.headers.host || 'dealer.yarora.dev';
  const headers    = { ...req.headers };
  headers['host']               = clientHost;
  headers['x-forwarded-host']   = clientHost;
  headers['x-forwarded-port']   = req.headers['x-forwarded-port']  || '443';
  headers['x-forwarded-proto']  = req.headers['x-forwarded-proto'] || 'https';
  headers['x-portal-type']      = 'dealer';

  const proxyReq = http.request(
    { hostname: TARGET_HOST, port: TARGET_PORT, path: req.url, method: req.method, headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Bad Gateway: ${err.message}`);
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Franchisee Dealer Gateway  →  http://0.0.0.0:${PORT}`);
  console.log(`  dealer.yarora.dev/          →  302 /dealer-login`);
  console.log(`  dealer.yarora.dev/login     →  302 /dealer-login`);
  console.log(`  dealer.yarora.dev/legacy/*  →  ✅ Audit form`);
  console.log(`  dealer.yarora.dev/dealers   →  403 Blocked`);
});

