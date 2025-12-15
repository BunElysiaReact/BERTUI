import { Elysia } from 'elysia';
import { watch } from 'fs';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import logger from '../logger/logger.js';
import { compileProject } from '../client/compiler.js';
import { loadConfig } from '../config/loadConfig.js';

export async function startDevServer(options = {}) {
  const port = parseInt(options.port) || 3000;
  const root = options.root || process.cwd();
  const compiledDir = join(root, '.bertui', 'compiled');
  
  const config = await loadConfig(root);
  
  const clients = new Set();
  let hasRouter = false;
  
  const routerPath = join(compiledDir, 'router.js');
  if (existsSync(routerPath)) {
    hasRouter = true;
    logger.info('File-based routing enabled');
  }
  
  const app = new Elysia()
    .get('/', async () => {
      return serveHTML(root, hasRouter, config);
    })
    
    .get('/*', async ({ params, set }) => {
      const path = params['*'];
      
      if (path.includes('.')) {
        // Handle compiled directory files
        if (path.startsWith('compiled/')) {
          const filePath = join(compiledDir, path.replace('compiled/', ''));
          const file = Bun.file(filePath);
          
          if (await file.exists()) {
            const ext = extname(path);
            const contentType = ext === '.js' ? 'application/javascript' : getContentType(ext);
            
            return new Response(await file.text(), {
              headers: { 
                'Content-Type': contentType,
                'Cache-Control': 'no-store'
              }
            });
          }
        }
        
        if (path.startsWith('public/')) {
          const publicDir = join(root, 'public');
          const filepath = join(publicDir, path.replace('public/', ''));
          const file = Bun.file(filepath);
          
          if (await file.exists()) {
            return new Response(file);
          }
        }
        
        set.status = 404;
        return 'File not found';
      }
      
      return serveHTML(root, hasRouter, config);
    })
    
    .get('/hmr-client.js', () => {
      const script = `
const ws = new WebSocket('ws://localhost:${port}/hmr');

ws.onopen = () => {
  console.log('%c🔥 BertUI HMR connected', 'color: #10b981; font-weight: bold');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'reload') {
    console.log('%c🔄 Reloading...', 'color: #f59e0b');
    window.location.reload();
  }
  
  if (data.type === 'recompiling') {
    console.log('%c⚙️ Recompiling...', 'color: #3b82f6');
  }
};

ws.onerror = (error) => {
  console.error('%c❌ HMR connection error', 'color: #ef4444', error);
};

ws.onclose = () => {
  console.log('%c⚠️ HMR disconnected. Refresh to reconnect.', 'color: #f59e0b');
};
`;
      
      return new Response(script, {
        headers: { 'Content-Type': 'application/javascript' }
      });
    })
    
    .ws('/hmr', {
      open(ws) {
        clients.add(ws);
        logger.info('Client connected to HMR');
      },
      close(ws) {
        clients.delete(ws);
        logger.info('Client disconnected from HMR');
      }
    })
    
    .get('/compiled/*', async ({ params, set }) => {
      const filepath = join(compiledDir, params['*']);
      const file = Bun.file(filepath);
      
      if (!await file.exists()) {
        set.status = 404;
        return 'File not found';
      }
      
      const ext = extname(filepath);
      const contentType = ext === '.js' ? 'application/javascript' : getContentType(ext);
      
      return new Response(await file.text(), {
        headers: { 
          'Content-Type': contentType,
          'Cache-Control': 'no-store'
        }
      });
    })
    
    .get('/public/*', async ({ params, set }) => {
      const publicDir = join(root, 'public');
      const filepath = join(publicDir, params['*']);
      const file = Bun.file(filepath);
      
      if (!await file.exists()) {
        set.status = 404;
        return 'File not found';
      }
      
      return new Response(file);
    })
    
    .listen(port);
  
  if (!app.server) {
    logger.error('Failed to start server');
    process.exit(1);
  }
  
  logger.success(`🚀 Server running at http://localhost:${port}`);
  logger.info(`📁 Serving: ${root}`);
  
  setupWatcher(root, compiledDir, clients, async () => {
    hasRouter = existsSync(join(compiledDir, 'router.js'));
  });
  
  return app;
}

function serveHTML(root, hasRouter, config) {
  const meta = config.meta || {};
  
  const html = `
<!DOCTYPE html>
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
  
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.2.0",
      "react-dom": "https://esm.sh/react-dom@18.2.0",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client"
    }
  }
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
  <script type="module" src="/hmr-client.js"></script>
  <script type="module" src="/compiled/main.js"></script>
</body>
</html>`;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
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
    '.ico': 'image/x-icon'
  };
  
  return types[ext] || 'text/plain';
}

function setupWatcher(root, compiledDir, clients, onRecompile) {
  const srcDir = join(root, 'src');
  const configPath = join(root, 'bertui.config.js');
  
  if (!existsSync(srcDir)) {
    logger.warn('src/ directory not found');
    return;
  }
  
  logger.info(`👀 Watching: ${srcDir}`);
  
  watch(srcDir, { recursive: true }, async (eventType, filename) => {
    if (!filename) return;
    
    const ext = extname(filename);
    if (['.js', '.jsx', '.ts', '.tsx', '.css'].includes(ext)) {
      logger.info(`📝 File changed: ${filename}`);
      
      for (const client of clients) {
        try {
          client.send(JSON.stringify({ type: 'recompiling' }));
        } catch (e) {
          clients.delete(client);
        }
      }
      
      try {
        await compileProject(root);
        
        if (onRecompile) {
          await onRecompile();
        }
        
        for (const client of clients) {
          try {
            client.send(JSON.stringify({ type: 'reload', file: filename }));
          } catch (e) {
            clients.delete(client);
          }
        }
      } catch (error) {
        logger.error(`Recompilation failed: ${error.message}`);
      }
    }
  });
  
  if (existsSync(configPath)) {
    watch(configPath, async (eventType) => {
      if (eventType === 'change') {
        logger.info('📝 Config changed, reloading...');
        
        for (const client of clients) {
          try {
            client.send(JSON.stringify({ type: 'reload', file: 'bertui.config.js' }));
          } catch (e) {
            clients.delete(client);
          }
        }
      }
    });
  }
}