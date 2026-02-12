// bertui/src/server/dev-handler.js - NEW FILE
// Headless dev server handler for Bunny integration

import { join, extname, dirname } from 'path';
import { existsSync, readdirSync } from 'fs';
import logger from '../logger/logger.js';
import { compileProject } from '../client/compiler.js';
import { loadConfig } from '../config/loadConfig.js';
import { getContentType, getImageContentType, serveHTML, setupFileWatcher } from './dev-server-utils.js';

/**
 * Create a headless dev server handler for integration with Elysia/Bunny
 * @param {Object} options
 * @param {string} options.root - Project root directory
 * @param {number} options.port - Port number (for HMR WebSocket URL)
 * @param {Object} options.elysiaApp - Optional Elysia app instance to mount on
 * @returns {Promise<Object>} Handler object with request handler and utilities
 */
export async function createDevHandler(options = {}) {
  const root = options.root || process.cwd();
  const port = parseInt(options.port) || 3000;
  const elysiaApp = options.elysiaApp || null;
  
  // Initialize BertUI state
  const compiledDir = join(root, '.bertui', 'compiled');
  const stylesDir = join(root, '.bertui', 'styles');
  const srcDir = join(root, 'src');
  const publicDir = join(root, 'public');
  
  const config = await loadConfig(root);
  
  let hasRouter = false;
  const routerPath = join(compiledDir, 'router.js');
  if (existsSync(routerPath)) {
    hasRouter = true;
    logger.info('File-based routing enabled');
  }
  
  // Clients set for HMR
  const clients = new Set();
  
  // WebSocket handler for HMR
  const websocketHandler = {
    open(ws) {
      clients.add(ws);
      logger.debug(`HMR client connected (${clients.size} total)`);
    },
    close(ws) {
      clients.delete(ws);
      logger.debug(`HMR client disconnected (${clients.size} remaining)`);
    }
  };
  
  // Notify all HMR clients
  function notifyClients(message) {
    for (const client of clients) {
      try {
        client.send(JSON.stringify(message));
      } catch (e) {
        clients.delete(client);
      }
    }
  }
  
  // Setup file watcher if we have a root
  let watcherCleanup = null;
  if (root) {
    watcherCleanup = setupFileWatcher(root, compiledDir, clients, async () => {
      hasRouter = existsSync(join(compiledDir, 'router.js'));
    });
  }
  
  // MAIN REQUEST HANDLER
  async function handleRequest(request) {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade for HMR
    if (url.pathname === '/__hmr' && request.headers.get('upgrade') === 'websocket') {
      // This will be handled by Elysia/Bun.serve upgrade mechanism
      return { type: 'websocket', handler: websocketHandler };
    }
    
    // Serve HTML for routes
    if (url.pathname === '/' || (!url.pathname.includes('.') && !url.pathname.startsWith('/compiled'))) {
      const html = await serveHTML(root, hasRouter, config, port);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Serve compiled JavaScript
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
    
    // Serve bertui-animate CSS
    if (url.pathname === '/bertui-animate.css') {
      const bertuiAnimatePath = join(root, 'node_modules/bertui-animate/dist/bertui-animate.min.css');
      const file = Bun.file(bertuiAnimatePath);
      
      if (await file.exists()) {
        return new Response(file, {
          headers: { 
            'Content-Type': 'text/css',
            'Cache-Control': 'no-store'
          }
        });
      }
    }
    
    // Serve CSS
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
    
    // Serve images from src/images/
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
    
    // Serve from public/
    if (url.pathname.startsWith('/public/')) {
      const filepath = join(publicDir, url.pathname.replace('/public/', ''));
      const file = Bun.file(filepath);
      
      if (await file.exists()) {
        return new Response(file, {
          headers: { 'Cache-Control': 'no-cache' }
        });
      }
    }
    
    // Serve node_modules
    if (url.pathname.startsWith('/node_modules/')) {
      const filepath = join(root, 'node_modules', url.pathname.replace('/node_modules/', ''));
      const file = Bun.file(filepath);
      
      if (await file.exists()) {
        const ext = extname(filepath).toLowerCase();
        let contentType;
        
        if (ext === '.css') {
          contentType = 'text/css';
        } else if (ext === '.js' || ext === '.mjs') {
          contentType = 'application/javascript; charset=utf-8';
        } else {
          contentType = getContentType(ext);
        }
        
        return new Response(file, {
          headers: { 
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
          }
        });
      }
    }
    
    // Not a BertUI route
    return null;
  }
  
  // Standalone server starter (for backward compatibility)
  async function start() {
    const server = Bun.serve({
      port,
      async fetch(req, server) {
        const url = new URL(req.url);
        
        // Handle WebSocket upgrade
        if (url.pathname === '/__hmr') {
          const success = server.upgrade(req);
          if (success) return undefined;
          return new Response('WebSocket upgrade failed', { status: 500 });
        }
        
        // Handle normal requests
        const response = await handleRequest(req);
        if (response) return response;
        
        return new Response('Not found', { status: 404 });
      },
      websocket: websocketHandler
    });
    
    logger.success(`🚀 BertUI standalone server running at http://localhost:${port}`);
    return server;
  }
  
  // Recompile project
  async function recompile() {
    return await compileProject(root);
  }
  
  // Cleanup
  function dispose() {
    if (watcherCleanup && typeof watcherCleanup === 'function') {
      watcherCleanup();
    }
    clients.clear();
  }
  
  return {
    handleRequest,
    start,
    recompile,
    dispose,
    notifyClients,
    config,
    hasRouter,
    // For Elysia integration
    getElysiaApp: () => elysiaApp,
    websocketHandler
  };
}

// Re-export for convenience
export { handleRequest as standaloneHandler } from './request-handler.js';