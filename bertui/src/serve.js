// bertui/src/serve.js - ULTRA-FAST PRODUCTION PREVIEW SERVER
import { join, extname } from 'path';
import { existsSync } from 'fs';
import logger from './logger/logger.js';
import { globalCache } from './utils/cache.js';

// MIME types for fast serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
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
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.map': 'application/json'
};

export async function startPreviewServer(options = {}) {
  const root = options.root || process.cwd();
  const port = options.port || 5000;
  const distDir = options.dir || 'dist';
  const publicPath = join(root, distDir);
  
  // Check if dist folder exists
  if (!existsSync(publicPath)) {
    logger.error(`❌ ${distDir}/ folder not found!`);
    logger.info(`   Run 'bertui build' first to generate production files.`);
    process.exit(1);
  }
  
  logger.bigLog(`🚀 PREVIEW SERVER`, { color: 'green' });
  logger.info(`📁 Serving: ${publicPath}`);
  logger.info(`🌐 URL: http://localhost:${port}`);
  logger.info(`⚡ Press Ctrl+C to stop`);
  
  // Track connections for graceful shutdown
  const connections = new Set();
  
  // Create ultra-fast static server
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      let filePath = join(publicPath, url.pathname);
      
      // Handle root path - serve index.html
      if (url.pathname === '/') {
        filePath = join(publicPath, 'index.html');
      }
      
      // Handle directory requests - serve index.html
      if (!extname(filePath)) {
        const indexPath = join(filePath, 'index.html');
        if (existsSync(indexPath)) {
          filePath = indexPath;
        }
      }
      
      // Check if file exists
      if (!existsSync(filePath)) {
        // Try fallback to index.html for SPA routing
        if (!url.pathname.includes('.')) {
          const spaPath = join(publicPath, 'index.html');
          if (existsSync(spaPath)) {
            const file = Bun.file(spaPath);
            return new Response(file, {
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-BertUI-Preview': 'spa-fallback'
              }
            });
          }
        }
        
        return new Response('Not Found', { status: 404 });
      }
      
      // Get file stats for caching
      const stats = await Bun.file(filePath).stat();
      const ext = extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      // Set cache headers based on file type
      const isStaticAsset = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico'].includes(ext);
      const cacheControl = isStaticAsset 
        ? 'public, max-age=31536000, immutable' // 1 year for assets with hash in name
        : 'no-cache, no-store, must-revalidate'; // No cache for HTML
      
      // Serve file with proper headers
      const file = Bun.file(filePath);
      
      return new Response(file, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': stats.size,
          'Cache-Control': cacheControl,
          'X-BertUI-Preview': 'static'
        }
      });
    },
    
    // Track connections for graceful shutdown
    websocket: {
      open(ws) {
        connections.add(ws);
      },
      close(ws) {
        connections.delete(ws);
      }
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('\n👋 Shutting down preview server...');
    
    // Close all WebSocket connections
    for (const ws of connections) {
      try {
        ws.close();
      } catch (e) {}
    }
    
    server.stop();
    process.exit(0);
  });
  
  return server;
}

// FAST FILE LISTING FOR DEBUGGING
export async function listDistContents(distPath) {
  try {
    const { readdirSync, statSync } = await import('fs');
    const { join, relative } = await import('path');
    
    function scan(dir, level = 0) {
      const files = readdirSync(dir);
      const result = [];
      
      for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        const relPath = relative(distPath, fullPath);
        
        if (stat.isDirectory()) {
          result.push({
            name: file,
            path: relPath,
            type: 'directory',
            children: scan(fullPath, level + 1)
          });
        } else {
          result.push({
            name: file,
            path: relPath,
            type: 'file',
            size: stat.size,
            sizeFormatted: formatBytes(stat.size)
          });
        }
      }
      
      return result;
    }
    
    return scan(distPath);
  } catch (error) {
    logger.error(`Failed to list dist contents: ${error.message}`);
    return [];
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}