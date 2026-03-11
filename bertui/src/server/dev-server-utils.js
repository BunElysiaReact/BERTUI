// bertui/src/server/dev-server-utils.js
import { join, extname } from 'path';
import { existsSync, readdirSync, watch, statSync } from 'fs';
import logger from '../logger/logger.js';
import { compileProject } from '../client/compiler.js';
import { globalCache } from '../utils/cache.js';

// Image content type mapping
export function getImageContentType(ext) {
  const types = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico':  'image/x-icon',
  };
  return types[ext] || 'application/octet-stream';
}

// General content type mapping
export function getContentType(ext) {
  const types = {
    '.js':   'application/javascript',
    '.jsx':  'application/javascript',
    '.css':  'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.otf':  'font/otf',
    '.mp4':  'video/mp4',
    '.webm': 'video/webm',
    '.mp3':  'audio/mpeg',
  };
  return types[ext] || 'text/plain';
}

// ─────────────────────────────────────────────────────────────────────────────
// Import map builder — scans node_modules at runtime so newly installed
// packages are picked up without restarting the dev server.
// ─────────────────────────────────────────────────────────────────────────────

// Cached importmap + the package.json mtime it was built from
let _cachedImportMap   = null;
let _cachedPkgMtime    = null;

export async function buildDevImportMap(root) {
  const pkgJsonPath    = join(root, 'package.json');
  const nodeModulesDir = join(root, 'node_modules');

  // Invalidate cache when package.json changes (new install happened)
  let currentMtime = null;
  try {
    currentMtime = statSync(pkgJsonPath).mtimeMs;
  } catch { /* package.json missing — fine */ }

  if (_cachedImportMap && currentMtime === _cachedPkgMtime) {
    return _cachedImportMap;
  }

  logger.info('🔄 Rebuilding dev import map (new packages detected)...');

  // Initialize importMap with default mappings
  const importMap = {
    'react':                  'https://esm.sh/react@18.2.0',
    'react-dom':              'https://esm.sh/react-dom@18.2.0',
    'react-dom/client':       'https://esm.sh/react-dom@18.2.0/client',
    'react/jsx-runtime':      'https://esm.sh/react@18.2.0/jsx-runtime',
    'react/jsx-dev-runtime':  'https://esm.sh/react@18.2.0/jsx-dev-runtime',
    '@bunnyx/api':            '/bunnyx-api/api-client.js',
    '@elysiajs/eden':         '/node_modules/@elysiajs/eden/dist/index.mjs',
  };
  
  const SKIP = new Set(['react', 'react-dom', '.bin', '.cache', '.package-lock.json', '.yarn']);

  if (existsSync(nodeModulesDir)) {
    try {
      const packages = readdirSync(nodeModulesDir);

      for (const pkg of packages) {
        if (SKIP.has(pkg) || pkg.startsWith('.') || pkg.startsWith('_')) continue;

        // Handle scoped packages (@org/pkg)
        let pkgNames = [pkg];
        if (pkg.startsWith('@')) {
          const scopeDir = join(nodeModulesDir, pkg);
          try {
            if (statSync(scopeDir).isDirectory()) {
              pkgNames = readdirSync(scopeDir).map(sub => `${pkg}/${sub}`);
            }
          } catch { continue; }
        }

        for (const pkgName of pkgNames) {
          const pkgDir      = join(nodeModulesDir, pkgName);
          const pkgJsonFile = join(pkgDir, 'package.json');

          try {
            if (!statSync(pkgDir).isDirectory()) continue;
          } catch { continue; }

          if (!existsSync(pkgJsonFile)) continue;

          try {
            const pkgJson = JSON.parse(await Bun.file(pkgJsonFile).text());

            const possibleEntries = [
              pkgJson.module,
              pkgJson.browser,
              pkgJson.main,
              'dist/index.js',
              'lib/index.js',
              'index.js',
            ].filter(Boolean);

            for (const entry of possibleEntries) {
              const fullPath = join(pkgDir, entry);
              if (existsSync(fullPath)) {
                importMap[pkgName] = `/node_modules/${pkgName}/${entry}`;
                logger.debug(`📦 Dev map: ${pkgName} → ${importMap[pkgName]}`);
                break;
              }
            }
          } catch { continue; }
        }
      }
    } catch (error) {
      logger.warn(`Failed to scan node_modules: ${error.message}`);
    }
  }

  _cachedImportMap  = importMap;
  _cachedPkgMtime   = currentMtime;

  logger.success(`✅ Import map ready (${Object.keys(importMap).length} packages)`);
  return importMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML generator — uses the live importmap so newly installed packages
// appear in the next page load without a server restart.
// ─────────────────────────────────────────────────────────────────────────────
export async function serveHTML(root, hasRouter, config, port) {
  // Don't cache HTML anymore — importmap can change between requests
  const meta = config.meta || {};

  const srcStylesDir = join(root, 'src', 'styles');
  let userStylesheets = '';

  if (existsSync(srcStylesDir)) {
    try {
      const cssFiles = readdirSync(srcStylesDir).filter(f => f.endsWith('.css'));
      userStylesheets = cssFiles
        .map(f => `  <link rel="stylesheet" href="/styles/${f}">`)
        .join('\n');
    } catch (error) {
      logger.warn(`Could not read styles directory: ${error.message}`);
    }
  }

  // Auto-detect bertui-animate CSS
  let bertuiAnimateStylesheet = '';
  const bertuiAnimatePath = join(root, 'node_modules/bertui-animate/dist/bertui-animate.min.css');
  if (existsSync(bertuiAnimatePath)) {
    bertuiAnimateStylesheet = '  <link rel="stylesheet" href="/bertui-animate.css">';
  }

  // ✅ Always get the latest importmap (cached until package.json changes)
  const importMap = await buildDevImportMap(root);

  return `<!DOCTYPE html>
<html lang="${meta.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title || 'BertUI App'}</title>

  ${meta.description  ? `<meta name="description" content="${meta.description}">` : ''}
  ${meta.keywords     ? `<meta name="keywords"    content="${meta.keywords}">` : ''}
  ${meta.author       ? `<meta name="author"      content="${meta.author}">` : ''}
  ${meta.themeColor   ? `<meta name="theme-color" content="${meta.themeColor}">` : ''}

  ${meta.ogTitle       ? `<meta property="og:title"       content="${meta.ogTitle || meta.title}">` : ''}
  ${meta.ogDescription ? `<meta property="og:description" content="${meta.ogDescription || meta.description}">` : ''}
  ${meta.ogImage       ? `<meta property="og:image"       content="${meta.ogImage}">` : ''}

  <link rel="icon" type="image/svg+xml" href="/public/favicon.svg">

${userStylesheets}
${bertuiAnimateStylesheet}

  <script type="importmap">
  ${JSON.stringify({ imports: importMap }, null, 2)}
  </script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="module">
    const ws = new WebSocket('ws://localhost:${port}/__hmr');

    ws.onopen = () => {
      console.log('%c🔥 BertUI HMR connected', 'color: #10b981; font-weight: bold');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'reload') {
        console.log('%c🔄 Reloading...', 'color: #f59e0b; font-weight: bold');
        if (window.__BERTUI_HIDE_ERROR__) window.__BERTUI_HIDE_ERROR__();
        window.location.reload();
      }

      if (data.type === 'recompiling') {
        console.log('%c⚙️ Recompiling...', 'color: #3b82f6');
      }

      if (data.type === 'compiled') {
        console.log('%c✅ Compilation complete', 'color: #10b981');
        if (window.__BERTUI_HIDE_ERROR__) window.__BERTUI_HIDE_ERROR__();
      }

      // ✅ New: server tells browser the importmap changed → full reload
      if (data.type === 'importmap-updated') {
        console.log('%c📦 New packages detected — reloading...', 'color: #8b5cf6; font-weight: bold');
        window.location.reload();
      }

      if (data.type === 'compilation-error') {
        if (window.__BERTUI_SHOW_ERROR__) {
          window.__BERTUI_SHOW_ERROR__({
            type:    'Compilation Error',
            message: data.message,
            stack:   data.stack,
            file:    data.file,
            line:    data.line,
            column:  data.column,
          });
        }
      }
    };

    ws.onerror = (error) => {
      console.error('%c❌ HMR connection error', 'color: #ef4444', error);
    };

    ws.onclose = () => {
      console.log('%c⚠️ HMR disconnected. Refresh to reconnect.', 'color: #f59e0b');
    };
  </script>

  <script src="/error-overlay.js"></script>
  <script type="module" src="/compiled/main.js"></script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// File watcher — watches src/ for code changes AND package.json for
// new installs. When package.json changes it invalidates the importmap
// cache and sends an `importmap-updated` message so the browser reloads
// with the new packages — no server restart needed.
// ─────────────────────────────────────────────────────────────────────────────
export function setupFileWatcher(root, compiledDir, clients, onRecompile) {
  const srcDir    = join(root, 'src');
  const pkgJson   = join(root, 'package.json');
  const configPath = join(root, 'bertui.config.js');

  if (!existsSync(srcDir)) {
    logger.warn('src/ directory not found');
    return () => {};
  }

  logger.debug(`👀 Watching: ${srcDir}`);
  logger.debug(`👀 Watching: ${pkgJson} (package installs)`);

  let isRecompiling      = false;
  let recompileTimeout   = null;
  const watchedExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.css',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif',
  ];

  function notifyClients(message) {
    for (const client of clients) {
      try {
        client.send(JSON.stringify(message));
      } catch {
        clients.delete(client);
      }
    }
  }

  // ── Source file watcher ──────────────────────────────────────────────────
  const srcWatcher = watch(srcDir, { recursive: true }, async (eventType, filename) => {
    if (!filename) return;
    const ext = extname(filename);
    if (!watchedExtensions.includes(ext)) return;

    logger.debug(`📝 File changed: ${filename}`);
    clearTimeout(recompileTimeout);

    recompileTimeout = setTimeout(async () => {
      if (isRecompiling) return;
      isRecompiling = true;
      notifyClients({ type: 'recompiling' });

      try {
        await compileProject(root);
        if (onRecompile) await onRecompile();
        logger.success('✅ Recompiled successfully');
        notifyClients({ type: 'compiled' });
        setTimeout(() => notifyClients({ type: 'reload' }), 100);
      } catch (error) {
        logger.error(`Recompilation failed: ${error.message}`);
        notifyClients({
          type:    'compilation-error',
          message: error.message,
          stack:   error.stack   || null,
          file:    error.file    || null,
          line:    error.line    || null,
          column:  error.column  || null,
        });
      } finally {
        isRecompiling = false;
      }
    }, 150);
  });

  // ── package.json watcher — detects new npm/bun installs ─────────────────
  let pkgWatcher = null;
  let lastPkgMtime = null;

  if (existsSync(pkgJson)) {
    try {
      lastPkgMtime = statSync(pkgJson).mtimeMs;
    } catch { /* ignore */ }

    pkgWatcher = watch(pkgJson, async (eventType) => {
      if (eventType !== 'change') return;

      // Debounce — installs can trigger multiple change events
      clearTimeout(pkgWatcher._debounce);
      pkgWatcher._debounce = setTimeout(async () => {
        try {
          const newMtime = statSync(pkgJson).mtimeMs;
          if (newMtime === lastPkgMtime) return; // spurious event
          lastPkgMtime = newMtime;

          logger.info('📦 package.json changed — refreshing import map...');

          // Bust the importmap cache so next serveHTML call rebuilds it
          _cachedImportMap = null;
          _cachedPkgMtime  = null;

          // Wait briefly for node_modules to finish writing
          await new Promise(r => setTimeout(r, 800));

          // Rebuild and notify browser
          await buildDevImportMap(root);
          notifyClients({ type: 'importmap-updated' });

          logger.success('✅ Import map updated — browser reloading');
        } catch (err) {
          logger.warn(`package.json watch error: ${err.message}`);
        }
      }, 500);
    });
  }

  // ── bertui.config.js watcher ─────────────────────────────────────────────
  let configWatcher = null;
  if (existsSync(configPath)) {
    configWatcher = watch(configPath, (eventType) => {
      if (eventType === 'change') {
        logger.debug('📝 Config changed, reloading...');
        notifyClients({ type: 'reload' });
      }
    });
  }

  // Return cleanup function
  return () => {
    srcWatcher.close();
    if (pkgWatcher)    pkgWatcher.close();
    if (configWatcher) configWatcher.close();
  };
}