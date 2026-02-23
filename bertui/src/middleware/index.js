// bertui/src/middleware/index.js
// Middleware system - src/middleware.ts runs before every request

import { join, extname } from 'path';
import { existsSync } from 'fs';
import logger from '../logger/logger.js';

/**
 * Middleware context passed to every middleware function
 */
export class MiddlewareContext {
  constructor(request, options = {}) {
    this.request = request;
    this.url = new URL(request.url);
    this.pathname = this.url.pathname;
    this.method = request.method;
    this.headers = Object.fromEntries(request.headers.entries());
    this.params = options.params || {};
    this.route = options.route || null;
    this._response = null;
    this._redirectTo = null;
    this._stopped = false;
    this.locals = {}; // Share data between middlewares and pages
  }

  /** Respond early - stops further processing */
  respond(body, init = {}) {
    this._response = new Response(body, {
      status: init.status || 200,
      headers: {
        'Content-Type': 'text/html',
        ...init.headers
      }
    });
    this._stopped = true;
  }

  /** Redirect to another URL */
  redirect(url, status = 302) {
    this._redirectTo = url;
    this._response = Response.redirect(url, status);
    this._stopped = true;
  }

  /** Set a response header (added to final response) */
  setHeader(key, value) {
    if (!this._extraHeaders) this._extraHeaders = {};
    this._extraHeaders[key] = value;
  }

  /** Check if middleware stopped the chain */
  get stopped() {
    return this._stopped;
  }
}

/**
 * Load and run user middleware from src/middleware.ts or src/middleware.js
 */
export async function loadMiddleware(root) {
  const candidates = [
    join(root, 'src', 'middleware.ts'),
    join(root, 'src', 'middleware.tsx'),
    join(root, 'src', 'middleware.js'),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        // Transpile if TypeScript
        const ext = extname(path);
        let code = await Bun.file(path).text();

        if (ext === '.ts' || ext === '.tsx') {
          const transpiler = new Bun.Transpiler({
            loader: ext === '.tsx' ? 'tsx' : 'ts',
            target: 'bun',
          });
          code = await transpiler.transform(code);
        }

        // Write to temp file and import
        const tmpPath = join(root, '.bertui', 'middleware.js');
        await Bun.write(tmpPath, code);

        const mod = await import(`${tmpPath}?t=${Date.now()}`);
        logger.success('✅ Middleware loaded: ' + path.replace(root, ''));

        return {
          default: mod.default || null,
          onRequest: mod.onRequest || mod.default || null,
          onResponse: mod.onResponse || null,
          onError: mod.onError || null,
        };
      } catch (err) {
        logger.error(`Failed to load middleware: ${err.message}`);
        return null;
      }
    }
  }

  return null;
}

/**
 * Run middleware chain for a request
 * Returns a Response if middleware intercepted, null to continue
 */
export async function runMiddleware(middlewareMod, request, routeInfo = {}) {
  if (!middlewareMod) return null;

  const ctx = new MiddlewareContext(request, routeInfo);

  try {
    // Run onRequest middleware
    if (middlewareMod.onRequest) {
      await middlewareMod.onRequest(ctx);
      if (ctx.stopped) {
        logger.debug(`🛡️  Middleware intercepted: ${ctx.pathname}`);
        return ctx._response;
      }
    }

    return null; // Continue to route handler
  } catch (err) {
    logger.error(`Middleware error: ${err.message}`);

    // Run error handler if defined
    if (middlewareMod.onError) {
      try {
        await middlewareMod.onError(ctx, err);
        if (ctx._response) return ctx._response;
      } catch (e) {
        logger.error(`Middleware error handler failed: ${e.message}`);
      }
    }

    return null;
  }
}

/**
 * MiddlewareManager - watches and reloads middleware on change
 */
export class MiddlewareManager {
  constructor(root) {
    this.root = root;
    this.middleware = null;
    this.watcher = null;
  }

  async load() {
    this.middleware = await loadMiddleware(this.root);
    return this;
  }

  async run(request, routeInfo = {}) {
    return runMiddleware(this.middleware, request, routeInfo);
  }

  watch() {
    const candidates = [
      join(this.root, 'src', 'middleware.ts'),
      join(this.root, 'src', 'middleware.tsx'),
      join(this.root, 'src', 'middleware.js'),
    ];

    const existing = candidates.find(existsSync);
    if (!existing) return;

    const { watch } = require('fs');
    this.watcher = watch(existing, async () => {
      logger.info('🔄 Reloading middleware...');
      this.middleware = await loadMiddleware(this.root);
      logger.success('✅ Middleware reloaded');
    });
  }

  dispose() {
    if (this.watcher) this.watcher.close();
  }
}