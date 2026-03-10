// bertui/src/build/generators/html-generator.js - FIXED CSS BUILD
import { join, relative } from 'path';
import { mkdirSync, existsSync, cpSync } from 'fs';
import logger from '../../logger/logger.js';
import { extractMetaFromSource } from '../../utils/meta-extractor.js';

export async function generateProductionHTML(root, outDir, buildResult, routes, serverIslands, config) {
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
      await processSingleRoute(route, serverIslands, config, defaultMeta, bundlePath, outDir, bertuiPackages);
    }
  }
  
  logger.success(`✅ HTML generation complete for ${routes.length} routes`);
}

async function copyBertuiPackagesToProduction(root, outDir) {
  const nodeModulesDir = join(root, 'node_modules');
  const packages = {
    bertuiIcons: false,
    bertuiAnimate: false,
    elysiaEden: false
  };
  
  if (!existsSync(nodeModulesDir)) {
    logger.debug('node_modules not found, skipping package copy');
    return packages;
  }
  
  // Copy bertui-icons
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
  
  // Copy bertui-animate CSS files
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

  // Copy @elysiajs/eden
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

async function processSingleRoute(route, serverIslands, config, defaultMeta, bundlePath, outDir, bertuiPackages) {
  try {
    const sourceCode = await Bun.file(route.path).text();
    const pageMeta = extractMetaFromSource(sourceCode);
    const meta = { ...defaultMeta, ...pageMeta };
    
    const isServerIsland = serverIslands.find(si => si.route === route.route);
    
    let staticHTML = '';
    
    if (isServerIsland) {
      logger.info(`🏝️  Extracting static content: ${route.route}`);
      staticHTML = await extractStaticHTMLFromComponent(sourceCode, route.path);
      
      if (staticHTML) {
        logger.success(`✅ Server Island rendered: ${route.route}`);
      } else {
        logger.warn(`⚠️  Could not extract HTML, falling back to client-only`);
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
    
    if (isServerIsland) {
      logger.success(`✅ Server Island: ${route.route} (instant content!)`);
    } else {
      logger.success(`✅ Client-only: ${route.route}`);
    }
    
  } catch (error) {
    logger.error(`Failed HTML for ${route.route}: ${error.message}`);
  }
}

async function extractStaticHTMLFromComponent(sourceCode, filePath) {
  try {
    const returnMatch = sourceCode.match(/return\s*\(/);
    if (!returnMatch) {
      logger.warn(`⚠️  Could not find return statement in ${filePath}`);
      return null;
    }
    
    const codeBeforeReturn = sourceCode.substring(0, returnMatch.index);
    const jsxContent = sourceCode.substring(returnMatch.index);
    
    const hookPatterns = [
      'useState', 'useEffect', 'useContext', 'useReducer',
      'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
      'useLayoutEffect', 'useDebugValue'
    ];
    
    let hasHooks = false;
    for (const hook of hookPatterns) {
      const regex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
      if (regex.test(codeBeforeReturn)) {
        logger.error(`❌ Server Island at ${filePath} contains React hooks!`);
        logger.error(`   Server Islands must be pure HTML - no ${hook}, etc.`);
        hasHooks = true;
        break;
      }
    }
    
    if (hasHooks) return null;
    
    const importLines = codeBeforeReturn.split('\n')
      .filter(line => line.trim().startsWith('import'))
      .join('\n');
    
    const hasRouterImport = /from\s+['"]bertui\/router['"]/m.test(importLines);
    
    if (hasRouterImport) {
      logger.error(`❌ Server Island at ${filePath} imports from 'bertui/router'!`);
      logger.error(`   Server Islands cannot use Link - use <a> tags instead.`);
      return null;
    }
    
    const eventHandlers = [
      'onClick=', 'onChange=', 'onSubmit=', 'onInput=', 'onFocus=',
      'onBlur=', 'onMouseEnter=', 'onMouseLeave=', 'onKeyDown=',
      'onKeyUp=', 'onScroll='
    ];
    
    for (const handler of eventHandlers) {
      if (jsxContent.includes(handler)) {
        logger.error(`❌ Server Island uses event handler: ${handler.replace('=', '')}`);
        logger.error(`   Server Islands are static HTML - no interactivity allowed`);
        return null;
      }
    }
    
    const fullReturnMatch = sourceCode.match(/return\s*\(([\s\S]*?)\);?\s*}/);
    if (!fullReturnMatch) {
      logger.warn(`⚠️  Could not extract JSX from ${filePath}`);
      return null;
    }
    
    let html = fullReturnMatch[1].trim();
    
    html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    html = html.replace(/className=/g, 'class=');
    
    html = html.replace(/style=\{\{([^}]+)\}\}/g, (match, styleObj) => {
      const props = [];
      let currentProp = '';
      let depth = 0;
      
      for (let i = 0; i < styleObj.length; i++) {
        const char = styleObj[i];
        if (char === '(') depth++;
        if (char === ')') depth--;
        
        if (char === ',' && depth === 0) {
          props.push(currentProp.trim());
          currentProp = '';
        } else {
          currentProp += char;
        }
      }
      if (currentProp.trim()) props.push(currentProp.trim());
      
      const cssString = props
        .map(prop => {
          const colonIndex = prop.indexOf(':');
          if (colonIndex === -1) return '';
          
          const key = prop.substring(0, colonIndex).trim();
          const value = prop.substring(colonIndex + 1).trim();
          
          if (!key || !value) return '';
          
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          const cssValue = value.replace(/['"]/g, '');
          
          return `${cssKey}: ${cssValue}`;
        })
        .filter(Boolean)
        .join('; ');
      
      return `style="${cssString}"`;
    });
    
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 
                          'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    
    html = html.replace(/<(\w+)([^>]*)\s*\/>/g, (match, tag, attrs) => {
      if (voidElements.includes(tag.toLowerCase())) {
        return match;
      } else {
        return `<${tag}${attrs}></${tag}>`;
      }
    });
    
    html = html.replace(/\{`([^`]*)`\}/g, '$1');
    html = html.replace(/\{(['"])(.*?)\1\}/g, '$2');
    html = html.replace(/\{(\d+)\}/g, '$1');
    
    logger.info(`   Extracted ${html.length} chars of static HTML`);
    return html;
    
  } catch (error) {
    logger.error(`Failed to extract HTML: ${error.message}`);
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

  // ✅ NEW: @elysiajs/eden local import map
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
      "@bunnyx/api": "/bunnyx-api/api-client.js",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
      "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime"${bertuiIconsImport}${elysiaEdenImport}
    }
  }
  </script>
</head>
<body>
  ${comment}
  ${rootContent}
  <script type="module" src="/${bundlePath}"></script>
</body>
</html>`;
}