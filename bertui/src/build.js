// bertui/src/build.js - SERVER ISLANDS IMPLEMENTATION
import { join, relative, basename, extname, dirname } from 'path';
import { existsSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'fs';
import logger from './logger/logger.js';
import { buildCSS } from './build/css-builder.js';
import { loadEnvVariables, replaceEnvInCode } from './utils/env.js';
import { copyImages } from './build/image-optimizer.js';

export async function buildProduction(options = {}) {
  const root = options.root || process.cwd();
  const buildDir = join(root, '.bertuibuild');
  const outDir = join(root, 'dist');
  
  logger.bigLog('BUILDING WITH SERVER ISLANDS 🏝️', { color: 'green' });
  logger.info('🔥 OPTIONAL SERVER CONTENT - THE GAME CHANGER');
  
  if (existsSync(buildDir)) rmSync(buildDir, { recursive: true });
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  
  const startTime = Date.now();
  
  try {
    logger.info('Step 0: Loading environment variables...');
    const envVars = loadEnvVariables(root);
    
    logger.info('Step 1: Compiling and detecting Server Islands...');
    const { routes, serverIslands, clientRoutes } = await compileForBuild(root, buildDir, envVars);
    
    if (serverIslands.length > 0) {
      logger.bigLog('SERVER ISLANDS DETECTED 🏝️', { color: 'cyan' });
      logger.table(serverIslands.map(r => ({
        route: r.route,
        file: r.file,
        mode: '🏝️ Server Island (SSG)'
      })));
    }
    
    if (clientRoutes.length > 0) {
      logger.info(`Client-only routes: ${clientRoutes.length}`);
    }
    
    logger.info('Step 2: Combining CSS...');
    await buildAllCSS(root, outDir);
    
    logger.info('Step 3: Copying static assets...');
    await copyAllStaticAssets(root, outDir);
    
    logger.info('Step 4: Bundling JavaScript...');
    const buildEntry = join(buildDir, 'main.js');
    
    const result = await Bun.build({
      entrypoints: [buildEntry],
      outdir: join(outDir, 'assets'),
      target: 'browser',
      minify: true,
      splitting: true,
      sourcemap: 'external',
      naming: {
        entry: '[name]-[hash].js',
        chunk: 'chunks/[name]-[hash].js',
        asset: '[name]-[hash].[ext]'
      },
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
      define: {
        'process.env.NODE_ENV': '"production"',
        ...Object.fromEntries(
          Object.entries(envVars).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value)
          ])
        )
      }
    });
    
    if (!result.success) {
      logger.error('JavaScript build failed!');
      result.logs.forEach(log => logger.error(log.message));
      process.exit(1);
    }
    
    logger.success('JavaScript bundled');
    
    logger.info('Step 5: Generating HTML with Server Islands...');
    await generateProductionHTML(root, outDir, result, routes, serverIslands);
    
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true });
    
    const duration = Date.now() - startTime;
    logger.success(`✨ Build complete in ${duration}ms`);
    
    // Show summary
    logger.bigLog('BUILD SUMMARY', { color: 'green' });
    logger.info(`📄 Total routes: ${routes.length}`);
    logger.info(`🏝️  Server Islands (SSG): ${serverIslands.length}`);
    logger.info(`⚡ Client-only: ${clientRoutes.length}`);
    
    if (serverIslands.length > 0) {
      logger.success('✅ Server Islands enabled - INSTANT content delivery!');
    }
    
    logger.bigLog('READY TO DEPLOY 🚀', { color: 'green' });
    
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true });
    process.exit(1);
  }
}

async function compileForBuild(root, buildDir, envVars) {
  const srcDir = join(root, 'src');
  const pagesDir = join(srcDir, 'pages');
  
  if (!existsSync(srcDir)) {
    throw new Error('src/ directory not found!');
  }
  
  let routes = [];
  let serverIslands = [];
  let clientRoutes = [];
  
  if (existsSync(pagesDir)) {
    routes = await discoverRoutes(pagesDir);
    
    // 🏝️ DETECT SERVER ISLANDS
    for (const route of routes) {
      const sourceCode = await Bun.file(route.path).text();
      const isServerIsland = sourceCode.includes('export const render = "server"');
      
      if (isServerIsland) {
        serverIslands.push(route);
        logger.success(`🏝️  Server Island: ${route.route}`);
      } else {
        clientRoutes.push(route);
      }
    }
  }
  
  await compileBuildDirectory(srcDir, buildDir, root, envVars);
  
  if (routes.length > 0) {
    await generateBuildRouter(routes, buildDir);
  }
  
  return { routes, serverIslands, clientRoutes };
}

async function generateProductionHTML(root, outDir, buildResult, routes, serverIslands) {
  const mainBundle = buildResult.outputs.find(o => 
    o.path.includes('main') && o.kind === 'entry-point'
  );
  
  if (!mainBundle) {
    logger.error('❌ Could not find main bundle');
    return;
  }
  
  const bundlePath = relative(outDir, mainBundle.path).replace(/\\/g, '/');
  
  const { loadConfig } = await import('./config/loadConfig.js');
  const config = await loadConfig(root);
  const defaultMeta = config.meta || {};
  
  for (const route of routes) {
    try {
      const sourceCode = await Bun.file(route.path).text();
      const pageMeta = extractMetaFromSource(sourceCode);
      const meta = { ...defaultMeta, ...pageMeta };
      
      // 🏝️ CHECK IF THIS IS A SERVER ISLAND
      const isServerIsland = serverIslands.find(si => si.route === route.route);
      
      let staticHTML = '';
      
      if (isServerIsland) {
        logger.info(`🏝️  Extracting static content: ${route.route}`);
        
        // 🏝️ CRITICAL: Server Islands are PURE HTML
        // We extract the return statement and convert JSX to HTML
        // NO react-dom/server needed - this is the beauty of it!
        
        staticHTML = await extractStaticHTMLFromComponent(sourceCode, route.path);
        
        if (staticHTML) {
          logger.success(`✅ Server Island rendered: ${route.route}`);
        } else {
          logger.warn(`⚠️  Could not extract HTML, falling back to client-only`);
        }
      }
      
      const html = generateHTML(meta, route, bundlePath, staticHTML, isServerIsland);
      
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
}

// 🏝️ NEW: Extract static HTML from Server Island component
// This converts JSX to HTML WITHOUT using react-dom/server
// 🏝️ SMARTER VALIDATOR - Ignores strings in JSX content
async function extractStaticHTMLFromComponent(sourceCode, filePath) {
  try {
    // STEP 1: Extract only the ACTUAL CODE (before the return statement)
    // This is where imports and hooks would be
    const returnMatch = sourceCode.match(/return\s*\(/);
    if (!returnMatch) {
      logger.warn(`⚠️  Could not find return statement in ${filePath}`);
      return null;
    }
    
    const codeBeforeReturn = sourceCode.substring(0, returnMatch.index);
    const jsxContent = sourceCode.substring(returnMatch.index);
    
    // VALIDATE: Check only the CODE part (not JSX/text content)
    
    // Rule 1: No React hooks (in actual code only)
    const hookPatterns = [
      'useState', 'useEffect', 'useContext', 'useReducer',
      'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
      'useLayoutEffect', 'useDebugValue'
    ];
    
    let hasHooks = false;
    for (const hook of hookPatterns) {
      // Only check the code BEFORE the JSX return
      const regex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
      if (regex.test(codeBeforeReturn)) {
        logger.error(`❌ Server Island at ${filePath} contains React hooks!`);
        logger.error(`   Server Islands must be pure HTML - no ${hook}, etc.`);
        hasHooks = true;
        break;
      }
    }
    
    if (hasHooks) return null;
    
    // Rule 2: No bertui/router imports (in actual code only)
    // Only check ACTUAL imports at the top of the file, not in template literals
    // Match: import X from 'bertui/router'
    // Don't match: {`import X from 'bertui/router'`} (inside backticks)
    const importLines = codeBeforeReturn.split('\n')
      .filter(line => line.trim().startsWith('import'))
      .join('\n');
    
    const hasRouterImport = /from\s+['"]bertui\/router['"]/m.test(importLines);
    
    if (hasRouterImport) {
      logger.error(`❌ Server Island at ${filePath} imports from 'bertui/router'!`);
      logger.error(`   Server Islands cannot use Link - use <a> tags instead.`);
      return null;
    }
    
    // Rule 3: No event handlers in JSX (these are actual attributes)
    const eventHandlers = [
      'onClick=',
      'onChange=',
      'onSubmit=',
      'onInput=',
      'onFocus=',
      'onBlur=',
      'onMouseEnter=',
      'onMouseLeave=',
      'onKeyDown=',
      'onKeyUp=',
      'onScroll='
    ];
    
    for (const handler of eventHandlers) {
      if (jsxContent.includes(handler)) {
        logger.error(`❌ Server Island uses event handler: ${handler.replace('=', '')}`);
        logger.error(`   Server Islands are static HTML - no interactivity allowed`);
        return null;
      }
    }
    
    // NOW EXTRACT THE JSX
    const fullReturnMatch = sourceCode.match(/return\s*\(([\s\S]*?)\);?\s*}/);
    if (!fullReturnMatch) {
      logger.warn(`⚠️  Could not extract JSX from ${filePath}`);
      return null;
    }
    
    let html = fullReturnMatch[1].trim();
    
    // STEP 2: Remove JSX comments {/* ... */}
    html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    
    // STEP 3: Convert className to class
    html = html.replace(/className=/g, 'class=');
    
    // STEP 4: Convert style objects to inline styles
    // Match style={{...}} and convert to style="..."
    html = html.replace(/style=\{\{([^}]+)\}\}/g, (match, styleObj) => {
      // Split by comma, but be careful of commas inside values like rgba()
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
      
      // Convert each property
      const cssString = props
        .map(prop => {
          const colonIndex = prop.indexOf(':');
          if (colonIndex === -1) return '';
          
          const key = prop.substring(0, colonIndex).trim();
          const value = prop.substring(colonIndex + 1).trim();
          
          if (!key || !value) return '';
          
          // Convert camelCase to kebab-case
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          // Remove quotes from value
          const cssValue = value.replace(/['"]/g, '');
          
          return `${cssKey}: ${cssValue}`;
        })
        .filter(Boolean)
        .join('; ');
      
      return `style="${cssString}"`;
    });
    
    // STEP 5: Handle self-closing tags
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 
                          'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    
    html = html.replace(/<(\w+)([^>]*)\s*\/>/g, (match, tag, attrs) => {
      if (voidElements.includes(tag.toLowerCase())) {
        return match; // Keep void elements self-closing
      } else {
        return `<${tag}${attrs}></${tag}>`; // Convert to opening + closing
      }
    });
    
    // STEP 6: Clean up JSX expressions
    // Template literals: {`text`} -> text
    html = html.replace(/\{`([^`]*)`\}/g, '$1');
    // String literals: {'text'} or {"text"} -> text
    html = html.replace(/\{(['"])(.*?)\1\}/g, '$2');
    // Numbers: {123} -> 123
    html = html.replace(/\{(\d+)\}/g, '$1');
    
    logger.info(`   Extracted ${html.length} chars of static HTML`);
    return html;
    
  } catch (error) {
    logger.error(`Failed to extract HTML: ${error.message}`);
    return null;
  }
}
// Example of how the style regex should work:
// Input:  style={{ background: 'rgba(0,0,0,0.05)', padding: '1.5rem', borderRadius: '8px' }}
// Output: style="background: rgba(0,0,0,0.05); padding: 1.5rem; border-radius: 8px"
function generateHTML(meta, route, bundlePath, staticHTML = '', isServerIsland = false) {
  const rootContent = staticHTML 
    ? `<div id="root">${staticHTML}</div>` 
    : '<div id="root"></div>';
  
  const comment = isServerIsland 
    ? '<!-- 🏝️ Server Island: Static content rendered at build time -->'
    : '<!-- ⚡ Client-only: Content rendered by JavaScript -->';
  
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
      "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime"
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

// Helper functions from original build.js
async function copyAllStaticAssets(root, outDir) {
  const publicDir = join(root, 'public');
  const srcImagesDir = join(root, 'src', 'images');
  
  if (existsSync(publicDir)) {
    copyImages(publicDir, outDir);
  }
  
  if (existsSync(srcImagesDir)) {
    const distImagesDir = join(outDir, 'images');
    mkdirSync(distImagesDir, { recursive: true });
    copyImages(srcImagesDir, distImagesDir);
  }
}

async function buildAllCSS(root, outDir) {
  const srcStylesDir = join(root, 'src', 'styles');
  const stylesOutDir = join(outDir, 'styles');
  
  mkdirSync(stylesOutDir, { recursive: true });
  
  if (existsSync(srcStylesDir)) {
    const cssFiles = readdirSync(srcStylesDir).filter(f => f.endsWith('.css'));
    
    if (cssFiles.length === 0) {
      await Bun.write(join(stylesOutDir, 'bertui.min.css'), '/* No CSS */');
      return;
    }
    
    let combinedCSS = '';
    for (const cssFile of cssFiles) {
      const srcPath = join(srcStylesDir, cssFile);
      const file = Bun.file(srcPath);
      const cssContent = await file.text();
      combinedCSS += `/* ${cssFile} */\n${cssContent}\n\n`;
    }
    
    const combinedPath = join(stylesOutDir, 'bertui.min.css');
    await Bun.write(combinedPath, combinedCSS);
    await buildCSS(combinedPath, combinedPath);
    
    logger.success(`✅ Combined ${cssFiles.length} CSS files`);
  }
}

async function discoverRoutes(pagesDir) {
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
          
          if (fileName === 'index') {
            route = route.replace('/index', '') || '/';
          }
          
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

async function compileBuildDirectory(srcDir, buildDir, root, envVars) {
  const files = readdirSync(srcDir);
  
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      const subBuildDir = join(buildDir, file);
      mkdirSync(subBuildDir, { recursive: true });
      await compileBuildDirectory(srcPath, subBuildDir, root, envVars);
    } else {
      const ext = extname(file);
      if (ext === '.css') continue;
      
      if (['.jsx', '.tsx', '.ts'].includes(ext)) {
        await compileBuildFile(srcPath, buildDir, file, root, envVars);
      } else if (ext === '.js') {
        const outPath = join(buildDir, file);
        let code = await Bun.file(srcPath).text();
        code = removeCSSImports(code);
        code = replaceEnvInCode(code, envVars);
        code = fixBuildImports(code, srcPath, outPath, root);
        if (usesJSX(code) && !code.includes('import React')) {
          code = `import React from 'react';\n${code}`;
        }
        await Bun.write(outPath, code);
      }
    }
  }
}

async function compileBuildFile(srcPath, buildDir, filename, root, envVars) {
  const ext = extname(filename);
  const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';
  
  try {
    let code = await Bun.file(srcPath).text();
    code = removeCSSImports(code);
    code = replaceEnvInCode(code, envVars);
    
    const outFilename = filename.replace(/\.(jsx|tsx|ts)$/, '.js');
    const outPath = join(buildDir, outFilename);
    code = fixBuildImports(code, srcPath, outPath, root);
    
    const transpiler = new Bun.Transpiler({ 
      loader,
      tsconfig: {
        compilerOptions: {
          jsx: 'react',
          jsxFactory: 'React.createElement',
          jsxFragmentFactory: 'React.Fragment'
        }
      }
    });
    
    let compiled = await transpiler.transform(code);
    if (usesJSX(compiled) && !compiled.includes('import React')) {
      compiled = `import React from 'react';\n${compiled}`;
    }
    compiled = fixRelativeImports(compiled);
    await Bun.write(outPath, compiled);
  } catch (error) {
    logger.error(`Failed to compile ${filename}: ${error.message}`);
    throw error;
  }
}

function usesJSX(code) {
  return code.includes('React.createElement') || 
         code.includes('React.Fragment') ||
         /<[A-Z]/.test(code) ||
         code.includes('jsx(') ||
         code.includes('jsxs(');
}

function removeCSSImports(code) {
  code = code.replace(/import\s+['"][^'"]*\.css['"];?\s*/g, '');
  code = code.replace(/import\s+['"]bertui\/styles['"]\s*;?\s*/g, '');
  return code;
}

function fixBuildImports(code, srcPath, outPath, root) {
  const buildDir = join(root, '.bertuibuild');
  const routerPath = join(buildDir, 'router.js');
  const relativeToRouter = relative(dirname(outPath), routerPath).replace(/\\/g, '/');
  const routerImport = relativeToRouter.startsWith('.') ? relativeToRouter : './' + relativeToRouter;
  
  code = code.replace(/from\s+['"]bertui\/router['"]/g, `from '${routerImport}'`);
  return code;
}

function fixRelativeImports(code) {
  const importRegex = /from\s+['"](\.\.[\/\\]|\.\/)((?:[^'"]+?)(?<!\.js|\.jsx|\.ts|\.tsx|\.json))['"];?/g;
  code = code.replace(importRegex, (match, prefix, path) => {
    if (path.endsWith('/') || /\.\w+$/.test(path)) return match;
    return `from '${prefix}${path}.js';`;
  });
  return code;
}

function extractMetaFromSource(code) {
  try {
    const metaMatch = code.match(/export\s+const\s+meta\s*=\s*\{/);
    if (!metaMatch) return null;
    
    const startIndex = metaMatch.index + metaMatch[0].length - 1;
    let braceCount = 0;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') braceCount++;
      if (code[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    if (endIndex === startIndex) return null;
    
    const metaString = code.substring(startIndex, endIndex + 1);
    const meta = {};
    const pairRegex = /(\w+)\s*:\s*(['"`])((?:(?!\2).)*)\2/g;
    let match;
    
    while ((match = pairRegex.exec(metaString)) !== null) {
      meta[match[1]] = match[3];
    }
    
    return Object.keys(meta).length > 0 ? meta : null;
  } catch (error) {
    return null;
  }
}

async function generateBuildRouter(routes, buildDir) {
  const imports = routes.map((route, i) => {
    const componentName = `Page${i}`;
    const importPath = `./pages/${route.file.replace(/\.(jsx|tsx|ts)$/, '.js')}`;
    return `import ${componentName} from '${importPath}';`;
  }).join('\n');
  
  const routeConfigs = routes.map((route, i) => {
    const componentName = `Page${i}`;
    return `  { path: '${route.route}', component: ${componentName}, type: '${route.type}' }`;
  }).join(',\n');
  
  const routerCode = `import React, { useState, useEffect, createContext, useContext } from 'react';

const RouterContext = createContext(null);

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within a Router');
  return context;
}

export function Router({ routes }) {
  const [currentRoute, setCurrentRoute] = useState(null);
  const [params, setParams] = useState({});

  useEffect(() => {
    matchAndSetRoute(window.location.pathname);
    const handlePopState = () => matchAndSetRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [routes]);

  function matchAndSetRoute(pathname) {
    for (const route of routes) {
      if (route.type === 'static' && route.path === pathname) {
        setCurrentRoute(route);
        setParams({});
        return;
      }
    }
    for (const route of routes) {
      if (route.type === 'dynamic') {
        const pattern = route.path.replace(/\\[([^\\]]+)\\]/g, '([^/]+)');
        const regex = new RegExp('^' + pattern + '$');
        const match = pathname.match(regex);
        if (match) {
          const paramNames = [...route.path.matchAll(/\\[([^\\]]+)\\]/g)].map(m => m[1]);
          const extractedParams = {};
          paramNames.forEach((name, i) => { extractedParams[name] = match[i + 1]; });
          setCurrentRoute(route);
          setParams(extractedParams);
          return;
        }
      }
    }
    setCurrentRoute(null);
    setParams({});
  }

  function navigate(path) {
    window.history.pushState({}, '', path);
    matchAndSetRoute(path);
  }

  const Component = currentRoute?.component;
  return React.createElement(
    RouterContext.Provider,
    { value: { currentRoute, params, navigate, pathname: window.location.pathname } },
    Component ? React.createElement(Component, { params }) : React.createElement(NotFound)
  );
}

export function Link({ to, children, ...props }) {
  const { navigate } = useRouter();
  return React.createElement('a', { 
    href: to, 
    onClick: (e) => { e.preventDefault(); navigate(to); }, 
    ...props 
  }, children);
}

function NotFound() {
  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', 
             justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }
  },
    React.createElement('h1', { style: { fontSize: '6rem', margin: 0 } }, '404'),
    React.createElement('p', { style: { fontSize: '1.5rem', color: '#666' } }, 'Page not found'),
    React.createElement('a', { href: '/', style: { color: '#10b981', textDecoration: 'none' } }, 'Go home')
  );
}

${imports}

export const routes = [
${routeConfigs}
];`;
  
  await Bun.write(join(buildDir, 'router.js'), routerCode);
}