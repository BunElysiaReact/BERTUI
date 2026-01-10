// bertui/src/server/dev-server.js - FIXED: Bun Native HMR
import { join, extname, dirname } from 'path';
import { existsSync, readdirSync } from 'fs';
import logger from '../logger/logger.js';
import { compileProject } from '../client/compiler.js';
import { loadConfig } from '../config/loadConfig.js';

export async function startDevServer(options = {}) {
  const port = parseInt(options.port) || 3000;
  const root = options.root || process.cwd();
  const compiledDir = join(root, '.bertui', 'compiled');
  const stylesDir = join(root, '.bertui', 'styles');
  const srcDir = join(root, 'src');
  const publicDir = join(root, 'public');
  
  const config = await loadConfig(root);
  
  // ✅ Track connected WebSocket clients
  const clients = new Set();
  
  let hasRouter = false;
  const routerPath = join(compiledDir, 'router.js');
  if (existsSync(routerPath)) {
    hasRouter = true;
    logger.info('File-based routing enabled');
  }
  
  // ✅ Use Bun.serve() with WebSocket support
  const server = Bun.serve({
    port,
    
    async fetch(req, server) {
      const url = new URL(req.url);
      
      // ✅ WebSocket upgrade for HMR
      if (url.pathname === '/__hmr') {
        const success = server.upgrade(req);
        if (success) {
          return undefined; // Don't return a Response
        }
        return new Response('WebSocket upgrade failed', { status: 500 });
      }
      
      // ✅ Serve HTML
      if (url.pathname === '/' || (!url.pathname.includes('.') && !url.pathname.startsWith('/compiled'))) {
        return new Response(await serveHTML(root, hasRouter, config, port), {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      // ✅ Serve compiled JavaScript
      if (url.pathname.startsWith('/compiled/')) {
        const filepath = join(compiledDir, url.pathname.replace('/compiled/', ''));
        const file = Bun.file(filepath);
        
        if (await file.exists()) {
          const ext = extname(filepath).toLowerCase();
          const contentType = ext === '.js' ? 'application/javascript; charset=utf-8' : 'text/plain';
          
          return new Response(file, {
            headers: { 
              'Content-Type': contentType,
              'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
          });
        }
      }
      
      // ✅ Serve CSS
      if (url.pathname.startsWith('/styles/')) {
        const filepath = join(stylesDir, url.pathname.replace('/styles/', ''));
        const file = Bun.file(filepath);
        
        if (await file.exists()) {
          return new Response(file, {
            headers: { 
              'Content-Type': 'text/css',
              'Cache-Control': 'no-store'
            }
          });
        }
      }
      
      // ✅ Serve images from src/images/
      if (url.pathname.startsWith('/images/')) {
        const filepath = join(srcDir, 'images', url.pathname.replace('/images/', ''));
        const file = Bun.file(filepath);
        
        if (await file.exists()) {
          const ext = extname(filepath).toLowerCase();
          const contentType = getImageContentType(ext);
          
          return new Response(file, {
            headers: { 
              'Content-Type': contentType,
              'Cache-Control': 'no-cache'
            }
          });
        }
      }
      
      // ✅ Serve from public/
      if (url.pathname.startsWith('/public/')) {
        const filepath = join(publicDir, url.pathname.replace('/public/', ''));
        const file = Bun.file(filepath);
        
        if (await file.exists()) {
          return new Response(file, {
            headers: { 'Cache-Control': 'no-cache' }
          });
        }
      }
      
      // ✅ Serve node_modules (for bertui-* packages)
      if (url.pathname.startsWith('/node_modules/')) {
        const filepath = join(root, 'node_modules', url.pathname.replace('/node_modules/', ''));
        const file = Bun.file(filepath);
        
        if (await file.exists()) {
          const ext = extname(filepath).toLowerCase();
          const contentType = ext === '.js' ? 'application/javascript; charset=utf-8' : getContentType(ext);
          
          return new Response(file, {
            headers: { 
              'Content-Type': contentType,
              'Cache-Control': 'no-cache'
            }
          });
        }
      }
      
      return new Response('Not found', { status: 404 });
    },
    
    // ✅ WebSocket handler for HMR
    websocket: {
      open(ws) {
        clients.add(ws);
        logger.info(`Client connected (${clients.size} total)`);
      },
      
      message(ws, message) {
        // Handle incoming messages if needed
      },
      
      close(ws) {
        clients.delete(ws);
        logger.info(`Client disconnected (${clients.size} remaining)`);
      }
    }
  });
  
  logger.success(`🚀 Server running at http://localhost:${port}`);
  logger.info(`📁 Serving: ${root}`);
  logger.info(`🖼️  Images: /images/* → src/images/`);
  logger.info(`📦 Public: /public/* → public/`);
  logger.info(`⚡ BertUI Packages: /node_modules/* → node_modules/`);
  
  // ✅ Setup file watcher
  setupFileWatcher(root, compiledDir, clients, async () => {
    hasRouter = existsSync(join(compiledDir, 'router.js'));
  });
  
  return server;
}

async function serveHTML(root, hasRouter, config, port) {
  const meta = config.meta || {};
  
  const srcStylesDir = join(root, 'src', 'styles');
  let userStylesheets = '';
  
  if (existsSync(srcStylesDir)) {
    try {
      const cssFiles = readdirSync(srcStylesDir).filter(f => f.endsWith('.css'));
      userStylesheets = cssFiles.map(f => `  <link rel="stylesheet" href="/styles/${f}">`).join('\n');
    } catch (error) {
      logger.warn(`Could not read styles directory: ${error.message}`);
    }
  }
  
  // Build import map
  const importMap = {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom": "https://esm.sh/react-dom@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0/client"
  };
  
  // Auto-detect bertui-* packages
  const nodeModulesDir = join(root, 'node_modules');
  
  if (existsSync(nodeModulesDir)) {
    try {
      const packages = readdirSync(nodeModulesDir);
      
      for (const pkg of packages) {
        if (!pkg.startsWith('bertui-')) continue;
        
        const pkgDir = join(nodeModulesDir, pkg);
        const pkgJsonPath = join(pkgDir, 'package.json');
        
        if (!existsSync(pkgJsonPath)) continue;
        
        try {
          const pkgJsonContent = await Bun.file(pkgJsonPath).text();
          const pkgJson = JSON.parse(pkgJsonContent);
          
          let mainFile = null;
          
          if (pkgJson.exports) {
            const rootExport = pkgJson.exports['.'];
            if (typeof rootExport === 'string') {
              mainFile = rootExport;
            } else if (typeof rootExport === 'object') {
              mainFile = rootExport.browser || rootExport.default || rootExport.import;
            }
          }
          
          if (!mainFile) {
            mainFile = pkgJson.main || 'index.js';
          }
          
          const fullPath = join(pkgDir, mainFile);
          if (existsSync(fullPath)) {
            importMap[pkg] = `/node_modules/${pkg}/${mainFile}`;
            logger.info(`✅ ${pkg} available`);
          }
          
        } catch (error) {
          logger.warn(`⚠️  Failed to parse ${pkg}/package.json: ${error.message}`);
        }
      }
      
    } catch (error) {
      logger.warn(`Failed to scan node_modules: ${error.message}`);
    }
  }
  
  const html = `<!DOCTYPE html>
<html lang="${meta.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title || 'BertUI App'}</title>
  
  ${meta.description ? `<meta name="description" content="${meta.description}">` : ''}
  ${meta.keywords ? `<meta name="keywords" content="${meta.keywords}">` : ''}
  ${meta.author ? `<meta name="author" content="${meta.author}">` : ''}
  ${meta.themeColor ? `<meta name="theme-color" content="${meta.themeColor}">` : ''}
  
  ${meta.ogTitle ? `<meta property="og:title" content="${meta.ogTitle || meta.title}">` : ''}
  ${meta.ogDescription ? `<meta property="og:description" content="${meta.ogDescription || meta.description}">` : ''}
  ${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}">` : ''}
  
  <link rel="icon" type="image/svg+xml" href="/public/favicon.svg">
  
${userStylesheets}
  
  <script type="importmap">
  ${JSON.stringify({ imports: importMap }, null, 2)}
  </script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- ✅ Bun Native HMR Script -->
  <script type="module">
    // WebSocket-based HMR (no polling!)
    const ws = new WebSocket('ws://localhost:${port}/__hmr');
    
    ws.onopen = () => {
      console.log('%c🔥 BertUI HMR connected', 'color: #10b981; font-weight: bold');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'reload') {
        console.log('%c🔄 Reloading...', 'color: #f59e0b; font-weight: bold');
        window.location.reload();
      }
      
      if (data.type === 'recompiling') {
        console.log('%c⚙️ Recompiling...', 'color: #3b82f6');
      }
      
      if (data.type === 'compiled') {
        console.log('%c✅ Compilation complete', 'color: #10b981');
      }
    };
    
    ws.onerror = (error) => {
      console.error('%c❌ HMR connection error', 'color: #ef4444', error);
    };
    
    ws.onclose = () => {
      console.log('%c⚠️ HMR disconnected. Refresh to reconnect.', 'color: #f59e0b');
    };
  </script>
  
  <script type="module" src="/compiled/main.js"></script>
</body>
</html>`;
  
  return html;
}

function getImageContentType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon'
  };
  
  return types[ext] || 'application/octet-stream';
}

function getContentType(ext) {
  const types = {
    '.js': 'application/javascript',
    '.jsx': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg'
  };
  
  return types[ext] || 'text/plain';
}

// ✅ File watcher with proper debouncing
function setupFileWatcher(root, compiledDir, clients, onRecompile) {
  const srcDir = join(root, 'src');
  const configPath = join(root, 'bertui.config.js');
  
  if (!existsSync(srcDir)) {
    logger.warn('src/ directory not found');
    return;
  }
  
  logger.info(`👀 Watching: ${srcDir}`);
  
  let isRecompiling = false;
  let recompileTimeout = null;
  const watchedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];
  
  // Notify all clients
  function notifyClients(message) {
    for (const client of clients) {
      try {
        client.send(JSON.stringify(message));
      } catch (e) {
        clients.delete(client);
      }
    }
  }
  
  const { watch } = require('fs');
  
  watch(srcDir, { recursive: true }, async (eventType, filename) => {
    if (!filename) return;
    
    const ext = extname(filename);
    if (!watchedExtensions.includes(ext)) return;
    
    logger.info(`📝 File changed: ${filename}`);
    
    // ✅ Clear previous timeout and debounce
    clearTimeout(recompileTimeout);
    
    recompileTimeout = setTimeout(async () => {
      if (isRecompiling) return;
      
      isRecompiling = true;
      notifyClients({ type: 'recompiling' });
      
      try {
        await compileProject(root);
        
        if (onRecompile) {
          await onRecompile();
        }
        
        logger.success('✅ Recompiled successfully');
        notifyClients({ type: 'compiled' });
        
        // ✅ Wait 100ms before triggering reload (let compilation finish)
        setTimeout(() => {
          notifyClients({ type: 'reload' });
        }, 100);
        
      } catch (error) {
        logger.error(`Recompilation failed: ${error.message}`);
      } finally {
        isRecompiling = false;
      }
    }, 150); // ✅ Debounce: wait 150ms for multiple file changes
  });
  
  // Watch config file
  if (existsSync(configPath)) {
    watch(configPath, async (eventType) => {
      if (eventType === 'change') {
        logger.info('📝 Config changed, reloading...');
        notifyClients({ type: 'reload' });
      }
    });
  }
}