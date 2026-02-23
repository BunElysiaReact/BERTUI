// bertui/src/server/dev-handler.js - WITH MIDDLEWARE + LAYOUTS + LOADING
import { join, extname, dirname } from 'path';
import { existsSync } from 'fs';
import logger from '../logger/logger.js';
import { compileProject } from '../client/compiler.js';
import { loadConfig } from '../config/loadConfig.js';
import { getContentType, getImageContentType, serveHTML, setupFileWatcher } from './dev-server-utils.js';

export async function createDevHandler(options = {}) {
  const root = options.root || process.cwd();
  const port = parseInt(options.port) || 3000;
  const middlewareManager = options.middleware || null;
  const layouts = options.layouts || {};
  const loadingComponents = options.loadingComponents || {};

  const compiledDir = join(root, '.bertui', 'compiled');
  const stylesDir = join(root, '.bertui', 'styles');
  const srcDir = join(root, 'src');
  const publicDir = join(root, 'public');

  const config = await loadConfig(root);

  let hasRouter = existsSync(join(compiledDir, 'router.js'));
  const clients = new Set();

  const websocketHandler = {
    open(ws) {
      clients.add(ws);
      logger.debug(`HMR client connected (${clients.size} total)`);
    },
    close(ws) {
      clients.delete(ws);
    },
  };

  function notifyClients(message) {
    for (const client of clients) {
      try { client.send(JSON.stringify(message)); }
      catch (e) { clients.delete(client); }
    }
  }

  let watcherCleanup = null;
  if (root) {
    watcherCleanup = setupFileWatcher(root, compiledDir, clients, async () => {
      hasRouter = existsSync(join(compiledDir, 'router.js'));
    });
  }

  async function handleRequest(request) {
    const url = new URL(request.url);

    // WebSocket upgrade for HMR
    if (url.pathname === '/__hmr' && request.headers.get('upgrade') === 'websocket') {
      return { type: 'websocket', handler: websocketHandler };
    }

    // ✅ Run middleware BEFORE every page request
    if (middlewareManager && isPageRequest(url.pathname)) {
      const middlewareResponse = await middlewareManager.run(request, {
        route: url.pathname,
      });
      if (middlewareResponse) {
        logger.debug(`🛡️  Middleware handled: ${url.pathname}`);
        return middlewareResponse;
      }
    }

    // Serve page HTML
    if (url.pathname === '/' || (!url.pathname.includes('.') && !url.pathname.startsWith('/compiled'))) {
      const html = await serveHTML(root, hasRouter, config, port);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Compiled JS (includes layouts and loading components)
    if (url.pathname.startsWith('/compiled/')) {
      const filepath = join(compiledDir, url.pathname.replace('/compiled/', ''));
      const file = Bun.file(filepath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
      }
    }

    // CSS
    if (url.pathname.startsWith('/styles/')) {
      const filepath = join(stylesDir, url.pathname.replace('/styles/', ''));
      const file = Bun.file(filepath);
      if (await file.exists()) {
        return new Response(file, {
          headers: { 'Content-Type': 'text/css', 'Cache-Control': 'no-store' },
        });
      }
    }

    // bertui-animate CSS
    if (url.pathname === '/bertui-animate.css') {
      const animPath = join(root, 'node_modules/bertui-animate/dist/bertui-animate.min.css');
      const file = Bun.file(animPath);
      if (await file.exists()) {
        return new Response(file, { headers: { 'Content-Type': 'text/css' } });
      }
    }

    // Images
    if (url.pathname.startsWith('/images/')) {
      const filepath = join(srcDir, 'images', url.pathname.replace('/images/', ''));
      const file = Bun.file(filepath);
      if (await file.exists()) {
        const ext = extname(filepath).toLowerCase();
        return new Response(file, {
          headers: { 'Content-Type': getImageContentType(ext), 'Cache-Control': 'no-cache' },
        });
      }
    }

    // Public directory
    if (url.pathname.startsWith('/public/') || existsSync(join(publicDir, url.pathname.slice(1)))) {
      const filepath = join(publicDir, url.pathname.replace('/public/', ''));
      const file = Bun.file(filepath);
      if (await file.exists()) {
        return new Response(file, { headers: { 'Cache-Control': 'no-cache' } });
      }
    }

    // node_modules
    if (url.pathname.startsWith('/node_modules/')) {
      const filepath = join(root, 'node_modules', url.pathname.replace('/node_modules/', ''));
      const file = Bun.file(filepath);
      if (await file.exists()) {
        const ext = extname(filepath).toLowerCase();
        const contentType = ext === '.css' ? 'text/css' :
          ['.js', '.mjs'].includes(ext) ? 'application/javascript; charset=utf-8' :
          getContentType(ext);
        return new Response(file, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'no-cache' },
        });
      }
    }

    return null;
  }

  async function start() {
    const server = Bun.serve({
      port,
      async fetch(req, server) {
        const url = new URL(req.url);
        if (url.pathname === '/__hmr') {
          const success = server.upgrade(req);
          if (success) return undefined;
          return new Response('WebSocket upgrade failed', { status: 500 });
        }
        const response = await handleRequest(req);
        if (response) return response;
        return new Response('Not found', { status: 404 });
      },
      websocket: websocketHandler,
    });

    logger.success(`🚀 BertUI running at http://localhost:${port}`);
    return server;
  }

  function dispose() {
    if (watcherCleanup) watcherCleanup();
    clients.clear();
    if (middlewareManager) middlewareManager.dispose();
  }

  return { handleRequest, start, notifyClients, dispose, config, hasRouter, websocketHandler };
}

function isPageRequest(pathname) {
  // Skip asset requests
  return !pathname.includes('.') ||
    pathname.endsWith('.html');
}