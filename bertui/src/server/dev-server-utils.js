// bertui/src/server/dev-server-utils.js - WITH CACHE IMPORT
import { join, extname } from 'path';
import { existsSync, readdirSync, watch, statSync } from 'fs';
import logger from '../logger/logger.js';
import { compileProject } from '../client/compiler.js';
import { globalCache } from '../utils/cache.js';

// Image content type mapping
export function getImageContentType(ext) {
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

// General content type mapping
export function getContentType(ext) {
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

// HTML generator with caching
export async function serveHTML(root, hasRouter, config, port) {
  const cacheKey = `html:${root}:${port}`;
  
  // Try cache first
  const cached = globalCache.get(cacheKey, { ttl: 1000 });
  if (cached) {
    logger.debug('⚡ Serving cached HTML');
    return cached;
  }
  
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
  
  // Auto-detect bertui-animate CSS
  let bertuiAnimateStylesheet = '';
  const bertuiAnimatePath = join(root, 'node_modules/bertui-animate/dist/bertui-animate.min.css');
  if (existsSync(bertuiAnimatePath)) {
    bertuiAnimateStylesheet = '  <link rel="stylesheet" href="/bertui-animate.css">';
  }
  
  // Build import map - CORE PACKAGES
  const importMap = {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom": "https://esm.sh/react-dom@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0/client"
  };
  
  // Auto-detect node_modules packages - ONLY TOP LEVEL
  const nodeModulesDir = join(root, 'node_modules');
  
  if (existsSync(nodeModulesDir)) {
    try {
      // Read top-level directories only
      const packages = readdirSync(nodeModulesDir);
      
      for (const pkg of packages) {
        // Skip system directories and already handled packages
        if (pkg.startsWith('.') || pkg.startsWith('_')) continue;
        if (pkg === 'react' || pkg === 'react-dom') continue;
        if (pkg.includes('@')) continue; // Skip scoped packages for now
        
        const pkgDir = join(nodeModulesDir, pkg);
        
        // Verify it's a directory
        try {
          const stat = statSync(pkgDir);
          if (!stat.isDirectory()) continue;
        } catch {
          continue;
        }
        
        const pkgJsonPath = join(pkgDir, 'package.json');
        if (!existsSync(pkgJsonPath)) continue;
        
        try {
          const pkgJsonContent = await Bun.file(pkgJsonPath).text();
          const pkgJson = JSON.parse(pkgJsonContent);
          
          // Simple approach - look for common entry points
          const possibleEntryPoints = [
            pkgJson.module,
            pkgJson.main,
            'index.js',
            'dist/index.js',
            'lib/index.js',
            'src/index.js'
          ].filter(Boolean);
          
          let foundPath = null;
          for (const entry of possibleEntryPoints) {
            const fullPath = join(pkgDir, entry);
            if (existsSync(fullPath)) {
              foundPath = `/node_modules/${pkg}/${entry}`;
              break;
            }
          }
          
          if (foundPath) {
            importMap[pkg] = foundPath;
            logger.debug(`📦 Mapped ${pkg} → ${foundPath}`);
          }
          
        } catch (error) {
          // Silently skip packages we can't parse
          continue;
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
${bertuiAnimateStylesheet}
  
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

      if (data.type === 'compilation-error') {
        if (window.__BERTUI_SHOW_ERROR__) {
          window.__BERTUI_SHOW_ERROR__({
            type: 'Compilation Error',
            message: data.message,
            stack: data.stack,
            file: data.file,
            line: data.line,
            column: data.column,
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
  
  // Cache the HTML
  globalCache.set(cacheKey, html, { ttl: 1000 });
  
  return html;
}

// File watcher setup
export function setupFileWatcher(root, compiledDir, clients, onRecompile) {
  const srcDir = join(root, 'src');
  const configPath = join(root, 'bertui.config.js');
  
  if (!existsSync(srcDir)) {
    logger.warn('src/ directory not found');
    return () => {};
  }
  
  logger.debug(`👀 Watching: ${srcDir}`);
  
  let isRecompiling = false;
  let recompileTimeout = null;
  const watchedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];
  
  function notifyClients(message) {
    for (const client of clients) {
      try {
        client.send(JSON.stringify(message));
      } catch (e) {
        clients.delete(client);
      }
    }
  }
  
  const watcher = watch(srcDir, { recursive: true }, async (eventType, filename) => {
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
        
        if (onRecompile) {
          await onRecompile();
        }
        
        logger.success('✅ Recompiled successfully');
        notifyClients({ type: 'compiled' });
        
        setTimeout(() => {
          notifyClients({ type: 'reload' });
        }, 100);
        
      } catch (error) {
        logger.error(`Recompilation failed: ${error.message}`);
        notifyClients({
          type: 'compilation-error',
          message: error.message,
          stack: error.stack || null,
          file: error.file || null,
          line: error.line || null,
          column: error.column || null,
        });
      } finally {
        isRecompiling = false;
      }
    }, 150);
  });
  
  // Watch config file if it exists
  let configWatcher = null;
  if (existsSync(configPath)) {
    configWatcher = watch(configPath, async (eventType) => {
      if (eventType === 'change') {
        logger.debug('📝 Config changed, reloading...');
        notifyClients({ type: 'reload' });
      }
    });
  }
  
  // Return cleanup function
  return () => {
    watcher.close();
    if (configWatcher) configWatcher.close();
  };
}