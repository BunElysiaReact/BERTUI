// bertui/src/loading/index.js
// Built-in loading states - per route loading UI

import { join, extname, basename } from 'path';
import { existsSync, readdirSync } from 'fs';
import logger from '../logger/logger.js';

/**
 * Default loading spinner HTML injected into pages
 * Beautiful, zero-dependency, CSS-only spinner
 */
export const DEFAULT_LOADING_HTML = `
<div id="bertui-loading" style="
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  font-family: system-ui, sans-serif;
  transition: opacity 0.2s ease;
">
  <div style="
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #10b981;
    border-radius: 50%;
    animation: bertui-spin 0.7s linear infinite;
  "></div>
  <p style="margin-top: 16px; color: #6b7280; font-size: 14px; font-weight: 500;">Loading...</p>
</div>
<style>
  @keyframes bertui-spin {
    to { transform: rotate(360deg); }
  }
</style>
<script>
  // Remove loading screen once React mounts
  window.__BERTUI_HIDE_LOADING__ = function() {
    const el = document.getElementById('bertui-loading');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    }
  };
  
  // Fallback: remove after 5s no matter what
  setTimeout(() => window.__BERTUI_HIDE_LOADING__?.(), 5000);
  
  // React root observer - hide when #root gets children
  const observer = new MutationObserver(() => {
    const root = document.getElementById('root');
    if (root && root.children.length > 0) {
      window.__BERTUI_HIDE_LOADING__?.();
      observer.disconnect();
    }
  });
  const root = document.getElementById('root');
  if (root) observer.observe(root, { childList: true, subtree: true });
</script>
`;

/**
 * Discover per-route loading components from src/pages/
 * Convention: create a loading.tsx next to your page file
 * e.g., src/pages/blog/loading.tsx → shown while /blog loads
 */
export async function discoverLoadingComponents(root) {
  const pagesDir = join(root, 'src', 'pages');
  if (!existsSync(pagesDir)) return {};

  const loadingComponents = {};

  function scan(dir, routeBase = '') {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath, `${routeBase}/${entry.name}`);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        const name = basename(entry.name, ext);

        if (name === 'loading' && ['.jsx', '.tsx', '.js', '.ts'].includes(ext)) {
          const route = routeBase || '/';
          loadingComponents[route] = {
            path: fullPath,
            route,
          };
          logger.debug(`⏳ Loading component: ${route} → ${entry.name}`);
        }
      }
    }
  }

  scan(pagesDir);

  if (Object.keys(loadingComponents).length > 0) {
    logger.success(`✅ ${Object.keys(loadingComponents).length} loading component(s) found`);
  }

  return loadingComponents;
}

/**
 * Compile loading components to .bertui/compiled/loading/
 */
export async function compileLoadingComponents(root, compiledDir) {
  const components = await discoverLoadingComponents(root);
  if (Object.keys(components).length === 0) return components;

  const outDir = join(compiledDir, 'loading');
  const { mkdirSync } = await import('fs');
  mkdirSync(outDir, { recursive: true });

  for (const [route, comp] of Object.entries(components)) {
    const ext = extname(comp.path);
    const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';
    const safeName = route.replace(/\//g, '_').replace(/^_/, '') || 'root';

    try {
      let code = await Bun.file(comp.path).text();

      if (!code.includes('import React')) {
        code = `import React from 'react';\n${code}`;
      }

      const transpiler = new Bun.Transpiler({
        loader,
        target: 'browser',
        tsconfig: {
          compilerOptions: {
            jsx: 'react',
            jsxFactory: 'React.createElement',
            jsxFragmentFactory: 'React.Fragment',
          },
        },
      });

      const compiled = await transpiler.transform(code);
      await Bun.write(join(outDir, `${safeName}.js`), compiled);
      components[route].compiledPath = join(outDir, `${safeName}.js`);
      components[route].compiledName = safeName;

    } catch (err) {
      logger.error(`Failed to compile loading component for ${route}: ${err.message}`);
    }
  }

  return components;
}

/**
 * Generate loading-aware router code
 * Wraps each route component with Suspense + loading fallback
 */
export function generateLoadingAwareRouter(routes, loadingComponents) {
  const hasLoading = Object.keys(loadingComponents).length > 0;

  const loadingImports = hasLoading
    ? Object.entries(loadingComponents)
        .map(([route, comp]) => {
          const safeName = comp.compiledName || (route.replace(/\//g, '_').replace(/^_/, '') || 'root');
          return `import Loading_${safeName} from './loading/${safeName}.js';`;
        })
        .join('\n')
    : '';

  const getLoadingComponent = (route) => {
    // Exact match
    if (loadingComponents[route]) {
      const safeName = loadingComponents[route].compiledName || 
        (route.replace(/\//g, '_').replace(/^_/, '') || 'root');
      return `Loading_${safeName}`;
    }

    // Parent route match
    const segments = route.split('/').filter(Boolean);
    while (segments.length > 0) {
      segments.pop();
      const parent = '/' + segments.join('/') || '/';
      if (loadingComponents[parent]) {
        const safeName = loadingComponents[parent].compiledName || 
          (parent.replace(/\//g, '_').replace(/^_/, '') || 'root');
        return `Loading_${safeName}`;
      }
    }

    return null;
  };

  return { loadingImports, getLoadingComponent };
}

/**
 * Generate the default loading screen script to inject into HTML
 */
export function getLoadingScript(customText = 'Loading...', color = '#10b981') {
  return DEFAULT_LOADING_HTML
    .replace('Loading...', customText)
    .replace('#10b981', color);
}