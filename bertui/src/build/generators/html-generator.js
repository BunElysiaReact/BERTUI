// bertui/src/build/generators/html-generator.js - FIXED JSX RUNTIME
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
  
  // ✅ FIX: Check if bertui-icons is installed and copy to dist/
  const bertuiIconsInstalled = await copyBertuiIconsToProduction(root, outDir);
  
  logger.info(`📄 Generating HTML for ${routes.length} routes...`);
  
  // Process in batches to avoid Bun crashes
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < routes.length; i += BATCH_SIZE) {
    const batch = routes.slice(i, i + BATCH_SIZE);
    logger.debug(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(routes.length/BATCH_SIZE)}`);
    
    // Process batch sequentially
    for (const route of batch) {
      await processSingleRoute(route, serverIslands, config, defaultMeta, bundlePath, outDir, bertuiIconsInstalled);
    }
  }
  
  logger.success(`✅ HTML generation complete for ${routes.length} routes`);
}

// ✅ NEW: Copy bertui-icons to dist/ for production
async function copyBertuiIconsToProduction(root, outDir) {
  const nodeModulesDir = join(root, 'node_modules');
  const bertuiIconsSource = join(nodeModulesDir, 'bertui-icons');
  
  if (!existsSync(bertuiIconsSource)) {
    logger.debug('bertui-icons not installed, skipping...');
    return false;
  }
  
  try {
    const bertuiIconsDest = join(outDir, 'node_modules', 'bertui-icons');
    mkdirSync(join(outDir, 'node_modules'), { recursive: true });
    
    // Copy the entire bertui-icons package
    cpSync(bertuiIconsSource, bertuiIconsDest, { recursive: true });
    
    logger.success('✅ Copied bertui-icons to dist/node_modules/');
    return true;
  } catch (error) {
    logger.error(`Failed to copy bertui-icons: ${error.message}`);
    return false;
  }
}

async function processSingleRoute(route, serverIslands, config, defaultMeta, bundlePath, outDir, bertuiIconsInstalled) {
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
    
    const html = generateHTML(meta, route, bundlePath, staticHTML, isServerIsland, bertuiIconsInstalled);
    
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

// ✅ FIXED: Add jsx-runtime to import map
function generateHTML(meta, route, bundlePath, staticHTML = '', isServerIsland = false, bertuiIconsInstalled = false) {
  const rootContent = staticHTML 
    ? `<div id="root">${staticHTML}</div>` 
    : '<div id="root"></div>';
  
  const comment = isServerIsland 
    ? '<!-- 🏝️ Server Island: Static content rendered at build time -->'
    : '<!-- ⚡ Client-only: Content rendered by JavaScript -->';
  
  // ✅ FIX: Add jsx-runtime to import map for production
  const bertuiIconsImport = bertuiIconsInstalled 
    ? ',\n      "bertui-icons": "/node_modules/bertui-icons/generated/index.js"'
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
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.2.0",
      "react-dom": "https://esm.sh/react-dom@18.2.0",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
      "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime"${bertuiIconsImport}
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