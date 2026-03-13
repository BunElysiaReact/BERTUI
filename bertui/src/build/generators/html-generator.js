// bertui/src/build/generators/html-generator.js
import { join, relative } from 'path';
import { mkdirSync, existsSync, cpSync } from 'fs';
import logger from '../../logger/logger.js';
import { extractMetaFromSource } from '../../utils/meta-extractor.js';

export async function generateProductionHTML(root, outDir, buildResult, routes, config) {
  const mainBundle = buildResult.outputs.find(o =>
    o.path.includes('main') && o.kind === 'entry-point'
  );

  if (!mainBundle) {
    logger.error('Could not find main bundle');
    return;
  }

  const bundlePath = relative(outDir, mainBundle.path).replace(/\\/g, '/');
  const defaultMeta = config.meta || {};
  const bertuiPackages = await copyBertuiPackagesToProduction(root, outDir);

  logger.info(`Generating HTML for ${routes.length} routes...`);

  for (const route of routes) {
    await processSingleRoute(route, config, defaultMeta, bundlePath, outDir, bertuiPackages);
  }

  logger.success(`HTML generation complete for ${routes.length} routes`);
}

async function copyBertuiPackagesToProduction(root, outDir) {
  const nodeModulesDir = join(root, 'node_modules');
  const packages = { bertuiIcons: false, bertuiAnimate: false, elysiaEden: false };

  if (!existsSync(nodeModulesDir)) return packages;

  const bertuiIconsSource = join(nodeModulesDir, 'bertui-icons');
  if (existsSync(bertuiIconsSource)) {
    try {
      const bertuiIconsDest = join(outDir, 'node_modules', 'bertui-icons');
      mkdirSync(join(outDir, 'node_modules'), { recursive: true });
      cpSync(bertuiIconsSource, bertuiIconsDest, { recursive: true });
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
      packages.elysiaEden = true;
    } catch (error) {
      logger.error(`Failed to copy @elysiajs/eden: ${error.message}`);
    }
  }

  return packages;
}

async function processSingleRoute(route, config, defaultMeta, bundlePath, outDir, bertuiPackages) {
  try {
    const sourceCode = await Bun.file(route.path).text();
    const pageMeta = extractMetaFromSource(sourceCode);
    const meta = { ...defaultMeta, ...pageMeta };

    const html = generateHTML(meta, bundlePath, bertuiPackages);

    let htmlPath;
    if (route.route === '/') {
      htmlPath = join(outDir, 'index.html');
    } else {
      const routeDir = join(outDir, route.route.replace(/^\//, ''));
      mkdirSync(routeDir, { recursive: true });
      htmlPath = join(routeDir, 'index.html');
    }

    await Bun.write(htmlPath, html);
    logger.success(`${route.route}`);

  } catch (error) {
    logger.error(`Failed HTML for ${route.route}: ${error.message}`);
  }
}

function generateHTML(meta, bundlePath, bertuiPackages = {}) {
  const bertuiIconsImport = bertuiPackages.bertuiIcons
    ? ',\n      "bertui-icons": "/node_modules/bertui-icons/generated/index.js"'
    : '';

  const bertuiAnimateCSS = bertuiPackages.bertuiAnimate
    ? '  <link rel="stylesheet" href="/css/bertui-animate.min.css">'
    : '';

  const elysiaEdenImport = bertuiPackages.elysiaEden
    ? ',\n      "@elysiajs/eden": "/node_modules/@elysiajs/eden/dist/index.mjs"'
    : '';

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
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/${bundlePath}"></script>
</body>
</html>`;
}