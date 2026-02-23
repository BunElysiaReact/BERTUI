// bertui/src/build/compiler/route-discoverer.js
import { join, extname } from 'path';
import { readdirSync, statSync } from 'fs';

export async function discoverRoutes(pagesDir) {
  const routes = [];
  
  async function scanDirectory(dir, basePath = '') {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (ext === '.css') continue;
        
        if (['.jsx', '.tsx', '.js', '.ts'].includes(ext)) {
          const fileName = entry.name.replace(ext, '');
          let route = '/' + relativePath.replace(/\\/g, '/').replace(ext, '');
          
          const RESERVED = ['index', 'loading'];
          if (fileName === 'index') {
            route = route.replace('/index', '') || '/';
          }
          if (RESERVED.includes(fileName)) continue;
          
          const isDynamic = fileName.includes('[') && fileName.includes(']');
          
          routes.push({
            route: route === '' ? '/' : route,
            file: relativePath.replace(/\\/g, '/'),
            path: fullPath,
            type: isDynamic ? 'dynamic' : 'static'
          });
        }
      }
    }
  }
  
  await scanDirectory(pagesDir);
  routes.sort((a, b) => a.type === b.type ? a.route.localeCompare(b.route) : a.type === 'static' ? -1 : 1);
  
  return routes;
}