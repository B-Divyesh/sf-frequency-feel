import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, normalize } from 'node:path';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

const appRoutes = new Set(['/', '/demo', '/privacy', '/terms']);

function safeFile(root, pathname) {
  const file = resolve(root, `.${normalize(pathname)}`);
  return file.startsWith(root) ? file : undefined;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function sendFile(response, file, statusCode = 200) {
  response.writeHead(statusCode, {
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(response);
}

/** Serve the built output using the same known routes and 404 behavior as production. */
export async function startTestServer(port = 0) {
  const root = resolve('dist');
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    if (appRoutes.has(pathname)) {
      sendFile(response, resolve(root, 'index.html'));
      return;
    }
    const requested = safeFile(root, pathname);
    if (requested && await exists(requested)) {
      sendFile(response, requested);
      return;
    }
    sendFile(response, resolve(root, '404.html'), 404);
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not expose a TCP port.');
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose())),
  };
}
