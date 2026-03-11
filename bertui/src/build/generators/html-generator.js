// bertui/src/build/generators/html-generator.js
import { join, relative } from 'path';
import { mkdirSync, existsSync, cpSync } from 'fs';
import logger from '../../logger/logger.js';
import { extractMetaFromSource } from '../../utils/meta-extractor.js';

export async function generateProductionHTML(root, outDir, buildDir, buildResult, routes, serverIslands, config) {
  const mainBundle = buildResult.outputs.find(o => 
    o.path.includes('main') && o.kind === 'entry-point'
  );
  
  if (!mainBundle) {
    logger.error('❌ Could not find main bundle');
    return;
  }
  
  const bundlePath = relative(outDir, mainBundle.path).replace(/\\/g, '/');
  const defaultMeta = config.meta || {};
  
  const bertuiPackages = await copyBertuiPackagesToProduction(root, outDir);
  
  logger.info(`📄 Generating HTML for ${routes.length} routes...`);
  
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < routes.length; i += BATCH_SIZE) {
    const batch = routes.slice(i, i + BATCH_SIZE);
    logger.debug(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(routes.length/BATCH_SIZE)}`);
    for (const route of batch) {
      await processSingleRoute(route, serverIslands, config, defaultMeta, bundlePath, outDir, buildDir, bertuiPackages);
    }
  }
  
  logger.success(`✅ HTML generation complete for ${routes.length} routes`);
}

async function copyBertuiPackagesToProduction(root, outDir) {
  const nodeModulesDir = join(root, 'node_modules');
  const packages = { bertuiIcons: false, bertuiAnimate: false, elysiaEden: false };
  
  if (!existsSync(nodeModulesDir)) {
    logger.debug('node_modules not found, skipping package copy');
    return packages;
  }
  
  const bertuiIconsSource = join(nodeModulesDir, 'bertui-icons');
  if (existsSync(bertuiIconsSource)) {
    try {
      const bertuiIconsDest = join(outDir, 'node_modules', 'bertui-icons');
      mkdirSync(join(outDir, 'node_modules'), { recursive: true });
      cpSync(bertuiIconsSource, bertuiIconsDest, { recursive: true });
      logger.success('✅ Copied bertui-icons to dist/node_modules/');
      packages.bertuiIcons = true;
    } catch (error) {
      logger.error(`Failed to copy bertui-icons: ${error.message}`);
    }
  }
  
  const bertuiAnimateSource = join(nodeModulesDir, 'bertui-animate', 'dist');
  if (existsSync(bertuiAnimateSource)) {
    try {
      const bertuiAnimateDest = join(outDir, 'css');
      mkdirSync(bertuiAnimateDest, { recursive: true });
      const minCSSPath = join(bertuiAnimateSource, 'bertui-animate.min.css');
      if (existsSync(minCSSPath)) {
        cpSync(minCSSPath, join(bertuiAnimateDest, 'bertui-animate.min.css'));
        logger.success('✅ Copied bertui-animate.min.css to dist/css/');
        packages.bertuiAnimate = true;
      }
    } catch (error) {
      logger.error(`Failed to copy bertui-animate: ${error.message}`);
    }
  }

  const elysiaEdenSource = join(nodeModulesDir, '@elysiajs', 'eden');
  if (existsSync(elysiaEdenSource)) {
    try {
      const elysiaEdenDest = join(outDir, 'node_modules', '@elysiajs', 'eden');
      mkdirSync(join(outDir, 'node_modules', '@elysiajs'), { recursive: true });
      cpSync(elysiaEdenSource, elysiaEdenDest, { recursive: true });
      logger.success('✅ Copied @elysiajs/eden to dist/node_modules/');
      packages.elysiaEden = true;
    } catch (error) {
      logger.error(`Failed to copy @elysiajs/eden: ${error.message}`);
    }
  }
  
  return packages;
}

async function processSingleRoute(route, serverIslands, config, defaultMeta, bundlePath, outDir, buildDir, bertuiPackages) {
  try {
    const sourceCode = await Bun.file(route.path).text();
    const pageMeta = extractMetaFromSource(sourceCode);
    const meta = { ...defaultMeta, ...pageMeta };
    
    const isServerIsland = serverIslands.find(si => si.route === route.route);
    let staticHTML = '';
    
    if (isServerIsland) {
      logger.info(`🏝️  Rendering Server Island: ${route.route}`);

      // route.path = /project/src/pages/index.jsx  (raw JSX — Bun can't import this)
      // compiledPath = /project/.bertuibuild/pages/index.js  (compiled by Step 2)
      const srcDir = join(route.path.split('/src/')[0], 'src');
      const relativeFromSrc = route.path.replace(srcDir + '/', '');
      const compiledPath = join(buildDir, relativeFromSrc).replace(/\.(jsx|tsx|ts)$/, '.js');

      logger.info(`   Compiled path: ${compiledPath}`);
      staticHTML = await renderComponentToHTML(compiledPath);
      
      if (staticHTML) {
        logger.success(`✅ Server Island rendered: ${route.route}`);
      } else {
        logger.warn(`⚠️  renderToString failed, falling back to client-only`);
      }
    }
    
    const html = generateHTML(meta, route, bundlePath, staticHTML, isServerIsland, bertuiPackages);
    
    let htmlPath;
    if (route.route === '/') {
      htmlPath = join(outDir, 'index.html');
    } else {
      const routeDir = join(outDir, route.route.replace(/^\//, ''));
      mkdirSync(routeDir, { recursive: true });
      htmlPath = join(routeDir, 'index.html');
    }
    
    await Bun.write(htmlPath, html);
    logger.success(`✅ ${isServerIsland ? 'Server Island' : 'Client-only'}: ${route.route}`);
    
  } catch (error) {
    logger.error(`Failed HTML for ${route.route}: ${error.message}`);
    console.error(error);
  }
}

/**
 * Render a component to static HTML using React's renderToString.
 * Must receive the compiled .js path from .bertuibuild — NOT the raw .jsx source.
 */
// Drop-in replacement for renderComponentToHTML in html-generator.js
// Paste this function + the helper at the bottom of html-generator.js

async function renderComponentToHTML(compiledPath) {
  try {
    const { existsSync } = await import('fs');
    if (!existsSync(compiledPath)) {
      logger.error(`❌ Compiled file not found: ${compiledPath}`);
      return null;
    }

    // Force both to load from the project's own node_modules to avoid version mismatch
    const { createRequire } = await import('module');
    const { resolve } = await import('path');
    const require = createRequire(import.meta.url);

    const reactPath = resolve(process.cwd(), 'node_modules/react/index.js');
    const reactDomServerPath = resolve(process.cwd(), 'node_modules/react-dom/server.js');

    const React = require(reactPath);
    const { renderToString } = require(reactDomServerPath);
    let source = await Bun.file(compiledPath).text();

    // Remove ALL import statements - we handle everything manually
    const importLines = [];
    source = source.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?$/gm, (match) => {
      importLines.push(match);
      return `/* REMOVED_IMPORT */`;
    });
    source = source.replace(/^import\s+['"][^'"]+['"]\s*;?$/gm, '/* REMOVED_SIDE_EFFECT */');

    // Build preamble - declare everything the component needs
    const preamble = [];

    for (const imp of importLines) {
      // Parse: import BINDING from 'SPECIFIER'
      const m = imp.match(/^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);
      if (!m) continue;
      const [, binding, specifier] = m;
      const b = binding.trim();

      // CSS modules -> Proxy so styles.foo = 'ssr-foo'
      if (specifier.match(/\.module\.css$/)) {
        const varName = b.match(/^(\w+)$/)?.[1];
        if (varName) {
          preamble.push(`var ${varName} = new Proxy({}, { get: function(_, k) { return 'ssr-' + String(k); } });`);
        }
        continue;
      }

      // Plain CSS -> skip
      if (specifier.match(/\.css$/)) continue;

      // react -> use injected _React
      if (specifier === 'react') {
        if (b.match(/^[A-Za-z_]\w*$/)) {
          // default import: import React from 'react'
          preamble.push(`var ${b} = _React;`);
        } else {
          // named: import { useState, useEffect } from 'react'
          const named = b.match(/\{([^}]+)\}/)?.[1];
          if (named) {
            named.split(',').forEach(n => {
              const local = n.trim().split(/\s+as\s+/).pop().trim();
              if (local) preamble.push(`var ${local} = _React['${local}'] || function(){return null;};`);
            });
          }
        }
        continue;
      }

      // react/jsx-runtime and similar
      if (specifier.startsWith('react')) {
        const named = b.match(/\{([^}]+)\}/)?.[1];
        if (named) {
          named.split(',').forEach(n => {
            const local = n.trim().split(/\s+as\s+/).pop().trim();
            if (!local) return;
            if (['jsx', 'jsxs', 'jsxDEV', '_jsx', '_jsxs'].includes(local)) {
              preamble.push(`var ${local} = _React.createElement;`);
            } else if (local === 'Fragment') {
              preamble.push(`var Fragment = _React.Fragment;`);
            } else {
              preamble.push(`var ${local} = _React['${local}'] || function(){return null;};`);
            }
          });
        }
        continue;
      }

      // Everything else -> stub components
      const tag = specifier.split('/').pop().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      // Namespace: import * as X from '...'
      const ns = b.match(/^\*\s+as\s+(\w+)$/);
      if (ns) {
        preamble.push(`var ${ns[1]} = new Proxy({}, { get: function(_, k) { return function(p) { return _React.createElement('span', {className:'ssr-'+String(k)}, p && p.children || null); }; } });`);
        continue;
      }

      // Default + possibly named: import X, { Y, Z } from '...'
      const defaultName = b.match(/^([A-Za-z_]\w*)(?:\s*,)?/)?.[1];
      if (defaultName && !b.trimStart().startsWith('{')) {
        preamble.push(`var ${defaultName} = function(p) { return _React.createElement('span', {className:'ssr-${tag}'}, p && p.children || null); };`);
      }

      // Named: { A, B, C }
      const named = b.match(/\{([^}]+)\}/)?.[1];
      if (named) {
        named.split(',').forEach(n => {
          const local = n.trim().split(/\s+as\s+/).pop().trim();
          if (local) preamble.push(`var ${local} = function(p) { return _React.createElement('span', {className:'ssr-${local.toLowerCase()}'}, p && p.children || null); };`);
        });
      }
    }

    // Fix exports for Function scope
    source = source.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
    source = source.replace(/export\s+(const|let|var)\s+/g, 'var ');
    source = source.replace(/export\s+default\s+(?!function|class)(\w+)/g, 'var __defaultExport = $1; void 0;');

    // Find the default export function name (first capitalized function)
    const fnMatch = source.match(/^function\s+([A-Z]\w*)\s*\(/m);
    const componentName = fnMatch?.[1];

    if (!componentName) {
      logger.warn(`⚠️  No capitalized function found in ${compiledPath}`);
      return null;
    }

    const fullScript = [
      '"use strict";',
      preamble.join('\n'),
      source,
      `return ${componentName};`
    ].join('\n');

    let Component;
    try {
      // _React is the only external dependency
      Component = new Function('_React', fullScript)(React);
    } catch (e) {
      logger.warn(`⚠️  eval error: ${e.message}`);
      return null;
    }

    if (typeof Component !== 'function') {
      logger.warn(`⚠️  Not a function: ${compiledPath}`);
      return null;
    }

    try {
      const html = renderToString(React.createElement(Component));
      logger.info(`   ✅ SSR: ${html.length} chars`);
      return html;
    } catch (e) {
      logger.warn(`⚠️  renderToString: ${e.message}`);
      return null;
    }

  } catch (e) {
    logger.error(`renderToString failed: ${e.message}`);
    return null;
  }
}


function stubImport(binding, specifier) {
  const tag = specifier.split('/').pop().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const stubs = [];
  const b = binding.trim();

  if (!b.startsWith('{') && !b.startsWith('*')) {
    const name = b.split(/[\s,{]/)[0];
    if (name) stubs.push(`const ${name} = (p)=>__React.createElement('span',{className:'ssr-${tag}'},p?.children??null);`);
  }

  const named = b.match(/\{([^}]+)\}/);
  if (named) {
    named[1].split(',').forEach(n => {
      const local = n.trim().split(/\s+as\s+/).pop().trim();
      if (local) stubs.push(`const ${local} = (p)=>__React.createElement('span',{className:'ssr-${local.toLowerCase()}'},p?.children??null);`);
    });
  }

  const ns = b.match(/\*\s+as\s+(\w+)/);
  if (ns) stubs.push(`const ${ns[1]} = new Proxy({},{get(_,k){return (p)=>__React.createElement('span',{className:'ssr-'+String(k)},p?.children??null);}});`);

  return stubs.join('\n') || `/* stubbed: ${specifier} */`;
}

function buildStubFromBinding(binding, specifier) {
  const stubs = [];
  const tag = specifier.split('/').pop().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Default import
  const trimmed = binding.trimStart();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('*')) {
    const defaultName = trimmed.match(/^(\w+)/)?.[1];
    if (defaultName) {
      stubs.push(`var ${defaultName} = function(props){ return React.createElement('span', {className:'ssr-${tag}'}, props && props.children); };`);
    }
  }

  // Named imports { Star, CloudLightning }
  const namedMatch = binding.match(/\{([^}]+)\}/);
  if (namedMatch) {
    namedMatch[1].split(',').forEach(n => {
      const local = n.trim().split(/\s+as\s+/).pop().trim();
      if (local) {
        stubs.push(`var ${local} = function(props){ return React.createElement('span', {className:'ssr-${local.toLowerCase()}'}, props && props.children); };`);
      }
    });
  }

  // Namespace import * as Icons
  const nsMatch = binding.match(/\*\s+as\s+(\w+)/);
  if (nsMatch) {
    stubs.push(`var ${nsMatch[1]} = new Proxy({}, {get:function(_,k){ return function(props){ return React.createElement('span',{className:'ssr-'+String(k).toLowerCase()},props&&props.children); }; }});`);
  }

  return stubs.length ? stubs.join('\n') : `/* stubbed: ${specifier} */`;
}

function generateHTML(meta, route, bundlePath, staticHTML = '', isServerIsland = false, bertuiPackages = {}) {
  const rootContent = staticHTML 
    ? `<div id="root">${staticHTML}</div>` 
    : '<div id="root"></div>';
  
  const comment = isServerIsland 
    ? '<!-- 🏝️ Server Island: Static content rendered at build time -->'
    : '<!-- ⚡ Client-only: Content rendered by JavaScript -->';
  
  const bertuiIconsImport = bertuiPackages.bertuiIcons 
    ? ',\n      "bertui-icons": "/node_modules/bertui-icons/generated/index.js"'
    : '';
  
  const bertuiAnimateCSS = bertuiPackages.bertuiAnimate
    ? '  <link rel="stylesheet" href="/css/bertui-animate.min.css">'
    : '';

  const elysiaEdenImport = bertuiPackages.elysiaEden
    ? ',\n      "@elysiajs/eden": "/node_modules/@elysiajs/eden/dist/index.mjs"'
    : '';

  // Tells main.jsx whether to hydrateRoot (server island) or createRoot (client-only)
  const hydrationScript = isServerIsland
    ? `<script>window.__BERTUI_HYDRATE__ = true;</script>`
    : `<script>window.__BERTUI_HYDRATE__ = false;</script>`;
  
  return `<!DOCTYPE html>
<html lang="${meta.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title || 'BertUI App'}</title>
  <meta name="description" content="${meta.description || 'Built with BertUI'}">
  ${meta.keywords ? `<meta name="keywords" content="${meta.keywords}">` : ''}
  ${meta.author ? `<meta name="author" content="${meta.author}">` : ''}
  ${meta.themeColor ? `<meta name="theme-color" content="${meta.themeColor}">` : ''}
  <meta property="og:title" content="${meta.ogTitle || meta.title || 'BertUI App'}">
  <meta property="og:description" content="${meta.ogDescription || meta.description || 'Built with BertUI'}">
  ${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}">` : ''}
  <link rel="stylesheet" href="/styles/bertui.min.css">
${bertuiAnimateCSS}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.2.0",
      "react-dom": "https://esm.sh/react-dom@18.2.0",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
      "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
      "react/jsx-dev-runtime": "https://esm.sh/react@18.2.0/jsx-dev-runtime",
      "@bunnyx/api": "/bunnyx-api/api-client.js",
      "@elysiajs/eden": "/node_modules/@elysiajs/eden/dist/index.mjs"${bertuiIconsImport}${elysiaEdenImport}
    }
  }
  </script>
  ${hydrationScript}
</head>
<body>
  ${comment}
  ${rootContent}
  <script type="module" src="/${bundlePath}"></script>
</body>
</html>`;
}