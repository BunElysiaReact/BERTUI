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
async function renderComponentToHTML(compiledPath) {
  try {
    if (!existsSync(compiledPath)) {
      logger.error(`❌ Compiled file not found: ${compiledPath}`);
      return null;
    }

    const { renderToString } = await import('react-dom/server');
    const React = (await import('react')).default;

    // Cache-bust so rebuilds always get the fresh compiled module
    const mod = await import(`${compiledPath}?t=${Date.now()}`);
    const Component = mod.default;

    if (!Component) {
      logger.warn(`⚠️  No default export found in ${compiledPath}`);
      return null;
    }

    const html = renderToString(React.createElement(Component));
    logger.info(`   renderToString: ${html.length} chars`);
    return html;

  } catch (error) {
    logger.error(`renderToString failed for ${compiledPath}: ${error.message}`);
    console.error(error);
    return null;
  }
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