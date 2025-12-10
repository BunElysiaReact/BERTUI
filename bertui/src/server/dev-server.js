// src/server/dev-server.js
import { Elysia } from 'elysia';
import { watch } from 'fs';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import logger from '../logger/logger.js';
import { compileProject } from '../client/compiler.js';

export async function startDevServer(options = {}) {
  const port = parseInt(options.port) || 3000;
  const root = options.root || process.cwd();
  const compiledDir = join(root, '.bertui', 'compiled');
  
  const clients = new Set();
  
  const app = new Elysia()
    .get('/', async () => {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BertUI App</title>
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
      }
    })
    
    // Serve compiled files
    .get('/compiled/*', async ({ params, set }) => {
      const filepath = join(compiledDir, params['*']);
      const file = Bun.file(filepath);
      
      if (!await file.exists()) {
        set.status = 404;
        return 'File not found';
      }
      
      const ext = extname(filepath);
      const contentType = ext === '.js' ? 'application/javascript' : 'text/plain';
      
      return new Response(await file.text(), {
        headers: { 
          'Content-Type': contentType,
          'Cache-Control': 'no-store'
        }
      });
    })
    
    .listen(port);
  
  if (!app.server) {
    logger.error('Failed to start server');
    process.exit(1);
  }
  
  logger.success(`Server running at http://localhost:${port}`);
  
  // Watch for file changes
  setupWatcher(root, compiledDir, clients);
  
  return app;
}

function setupWatcher(root, compiledDir, clients) {
  const srcDir = join(root, 'src');
  
  if (!existsSync(srcDir)) {
    logger.warn('src/ directory not found');
    return;
  }
  
  logger.info(`Watching: ${srcDir}`);
  
  watch(srcDir, { recursive: true }, async (eventType, filename) => {
    if (!filename) return;
    
    const ext = extname(filename);
    if (['.js', '.jsx', '.ts', '.tsx', '.css'].includes(ext)) {
      logger.info(`File changed: ${filename}`);
      
      // Notify clients that recompilation is starting
      for (const client of clients) {
        try {
          client.send(JSON.stringify({ type: 'recompiling' }));
        } catch (e) {
          clients.delete(client);
        }
      }
      
      // Recompile the project
      try {
        await compileProject(root);
        
        // Notify clients to reload
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
}