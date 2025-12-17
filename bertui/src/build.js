import { join, relative, basename } from 'path';
import { existsSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'fs';
import { extname, dirname } from 'path';
import logger from './logger/logger.js';
import { buildCSS } from './build/css-builder.js';
import { loadEnvVariables, replaceEnvInCode } from './utils/env.js'; // ✅ IMPORT THIS!

export async function buildProduction(options = {}) {
  const root = options.root || process.cwd();
  const buildDir = join(root, '.bertuibuild');
  const outDir = join(root, 'dist');
  
  logger.bigLog('BUILDING FOR PRODUCTION', { color: 'green' });
  
  if (existsSync(buildDir)) {
    rmSync(buildDir, { recursive: true });
  }
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true });
    logger.info('Cleaned dist/');
  }
  
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  
  const startTime = Date.now();
  
  try {
    // ✅ LOAD ENV VARS BEFORE COMPILATION!
    logger.info('Step 0: Loading environment variables...');
    const envVars = loadEnvVariables(root);
    if (Object.keys(envVars).length > 0) {
      logger.info(`Loaded ${Object.keys(envVars).length} environment variables`);
    }
    
    logger.info('Step 1: Compiling for production...');
    const { routes } = await compileForBuild(root, buildDir, envVars); // ✅ PASS ENV VARS!
    logger.success('Production compilation complete');
    
    logger.info('Step 2: Building CSS with Lightning CSS...');
    await buildAllCSS(root, outDir);
    
    const publicDir = join(root, 'public');
    if (existsSync(publicDir)) {
      logger.info('Step 3: Copying public assets...');
      const publicFiles = readdirSync(publicDir);
      for (const file of publicFiles) {
        const srcFile = join(publicDir, file);
        const destFile = join(outDir, file);
        if (statSync(srcFile).isFile()) {
          cpSync(srcFile, destFile);
        }
      }
      logger.success('Public assets copied');
    } else {
      logger.info('Step 3: No public directory found, skipping...');
    }
    
    logger.info('Step 4: Bundling JavaScript with Bun...');
    const buildEntry = join(buildDir, 'main.js');
    
    if (!existsSync(buildEntry)) {
      logger.error('Build entry point not found: .bertuibuild/main.js');
      process.exit(1);
    }
    
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
      // ✅ CRITICAL: Add define to replace process.env at bundle time!
      define: {
        'process.env.NODE_ENV': '"production"',
        'process.env.PUBLIC_APP_NAME': JSON.stringify(envVars.PUBLIC_APP_NAME || 'BertUI App'),
        'process.env.PUBLIC_API_URL': JSON.stringify(envVars.PUBLIC_API_URL || ''),
        'process.env.PUBLIC_USERNAME': JSON.stringify(envVars.PUBLIC_USERNAME || ''),
        // Add all other env vars dynamically
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
    
    logger.success('JavaScript bundled with tree-shaking');
    
    logger.info('Step 5: Generating SEO-optimized HTML files...');
    await generateProductionHTML(root, outDir, result, routes);
    
    rmSync(buildDir, { recursive: true });
    logger.info('Cleaned up .bertuibuild/');
    
    const duration = Date.now() - startTime;
    logger.success(`✨ Build complete in ${duration}ms`);
    logger.info(`📦 Output: ${outDir}`);
    
    logger.table(result.outputs.map(o => ({
      file: o.path.replace(outDir, ''),
      size: `${(o.size / 1024).toFixed(2)} KB`
    })));
    
    logger.bigLog('READY TO DEPLOY', { color: 'green' });
    console.log('\n📤 Deploy your app:\n');
    console.log('  Vercel:  bunx vercel');
    console.log('  Netlify: bunx netlify deploy');
    console.log('\n🔍 Preview locally:\n');
    console.log('  bun run preview\n');
    
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
    
    if (existsSync(buildDir)) {
      rmSync(buildDir, { recursive: true });
    }
    
    process.exit(1);
  }
}

async function buildAllCSS(root, outDir) {
  const srcStylesDir = join(root, 'src', 'styles');
  const stylesOutDir = join(outDir, 'styles');
  
  mkdirSync(stylesOutDir, { recursive: true });
  
  if (existsSync(srcStylesDir)) {
    const cssFiles = readdirSync(srcStylesDir).filter(f => f.endsWith('.css'));
    for (const cssFile of cssFiles) {
      const srcPath = join(srcStylesDir, cssFile);
      const destPath = join(stylesOutDir, cssFile.replace('.css', '.min.css'));
      await buildCSS(srcPath, destPath);
    }
  }
}

// ✅ ACCEPT ENV VARS PARAMETER
async function compileForBuild(root, buildDir, envVars) {
  const srcDir = join(root, 'src');
  const pagesDir = join(srcDir, 'pages');
  
  if (!existsSync(srcDir)) {
    throw new Error('src/ directory not found!');
  }
  
  let routes = [];
  if (existsSync(pagesDir)) {
    routes = await discoverRoutes(pagesDir);
    logger.info(`Found ${routes.length} routes`);
  }
  
  // ✅ PASS ENV VARS TO COMPILATION
  await compileBuildDirectory(srcDir, buildDir, root, envVars);
  
  if (routes.length > 0) {
    await generateBuildRouter(routes, buildDir);
    logger.info('Generated router for build');
  }
  
  return { routes };
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
          const type = isDynamic ? 'dynamic' : 'static';
          
          routes.push({
            route: route === '' ? '/' : route,
            file: relativePath.replace(/\\/g, '/'),
            path: fullPath,
            type
          });
        }
      }
    }
  }
  
  await scanDirectory(pagesDir);
  
  routes.sort((a, b) => {
    if (a.type === b.type) {
      return a.route.localeCompare(b.route);
    }
    return a.type === 'static' ? -1 : 1;
  });
  
  return routes;
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
  if (!context) {
    throw new Error('useRouter must be used within a Router component');
  }
  return context;
}

export function Router({ routes }) {
  const [currentRoute, setCurrentRoute] = useState(null);
  const [params, setParams] = useState({});

  useEffect(() => {
    matchAndSetRoute(window.location.pathname);

    const handlePopState = () => {
      matchAndSetRoute(window.location.pathname);
    };

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
          paramNames.forEach((name, i) => {
            extractedParams[name] = match[i + 1];
          });

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

  const routerValue = {
    currentRoute,
    params,
    navigate,
    pathname: window.location.pathname
  };

  const Component = currentRoute?.component;

  return React.createElement(
    RouterContext.Provider,
    { value: routerValue },
    Component ? React.createElement(Component, { params }) : React.createElement(NotFound, null)
  );
}

export function Link({ to, children, ...props }) {
  const { navigate } = useRouter();

  function handleClick(e) {
    e.preventDefault();
    navigate(to);
  }

  return React.createElement('a', { href: to, onClick: handleClick, ...props }, children);
}

function NotFound() {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui'
      }
    },
    React.createElement('h1', { style: { fontSize: '6rem', margin: 0 } }, '404'),
    React.createElement('p', { style: { fontSize: '1.5rem', color: '#666' } }, 'Page not found'),
    React.createElement('a', { 
      href: '/', 
      style: { color: '#10b981', textDecoration: 'none', fontSize: '1.2rem' } 
    }, 'Go home')
  );
}

${imports}

export const routes = [
${routeConfigs}
];
`;
  
  await Bun.write(join(buildDir, 'router.js'), routerCode);
}

// ✅ ACCEPT ENV VARS PARAMETER
async function compileBuildDirectory(srcDir, buildDir, root, envVars) {
  const files = readdirSync(srcDir);
  
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      const subBuildDir = join(buildDir, file);
      mkdirSync(subBuildDir, { recursive: true });
      await compileBuildDirectory(srcPath, subBuildDir, root, envVars); // ✅ PASS IT DOWN
    } else {
      const ext = extname(file);
      
      if (ext === '.css') continue;
      
      if (['.jsx', '.tsx', '.ts'].includes(ext)) {
        await compileBuildFile(srcPath, buildDir, file, root, envVars); // ✅ PASS IT HERE
      } else if (ext === '.js') {
        const outPath = join(buildDir, file);
        let code = await Bun.file(srcPath).text();
        
        code = removeCSSImports(code);
        code = replaceEnvInCode(code, envVars); // ✅ REPLACE ENV VARS!
        code = fixBuildImports(code, srcPath, outPath, root);
        
        await Bun.write(outPath, code);
      }
    }
  }
}

// ✅ ACCEPT ENV VARS PARAMETER
async function compileBuildFile(srcPath, buildDir, filename, root, envVars) {
  const ext = extname(filename);
  const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';
  
  try {
    let code = await Bun.file(srcPath).text();
    
    code = removeCSSImports(code);
    code = replaceEnvInCode(code, envVars); // ✅ REPLACE ENV VARS BEFORE TRANSPILATION!
    
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
    
    if (!compiled.includes('import React') && (compiled.includes('React.createElement') || compiled.includes('React.Fragment'))) {
      compiled = `import React from 'react';\n${compiled}`;
    }
    
    compiled = fixRelativeImports(compiled);
    
    await Bun.write(outPath, compiled);
  } catch (error) {
    logger.error(`Failed to compile ${filename}: ${error.message}`);
    throw error;
  }
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
  
  code = code.replace(
    /from\s+['"]bertui\/router['"]/g,
    `from '${routerImport}'`
  );
  
  return code;
}

function fixRelativeImports(code) {
  const importRegex = /from\s+['"](\.\.[\/\\]|\.\/)((?:[^'"]+?)(?<!\.js|\.jsx|\.ts|\.tsx|\.json))['"];?/g;
  
  code = code.replace(importRegex, (match, prefix, path) => {
    if (path.endsWith('/') || /\.\w+$/.test(path)) {
      return match;
    }
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
      const key = match[1];
      const value = match[3];
      meta[key] = value;
    }
    
    return Object.keys(meta).length > 0 ? meta : null;
  } catch (error) {
    logger.warn(`Could not extract meta: ${error.message}`);
    return null;
  }
}

async function generateProductionHTML(root, outDir, buildResult, routes) {
  const mainBundle = buildResult.outputs.find(o => 
    o.path.includes('main') && o.kind === 'entry-point'
  );
  
  if (!mainBundle) {
    throw new Error('Could not find main bundle in build output');
  }
  
  const bundlePath = relative(outDir, mainBundle.path).replace(/\\/g, '/');
  logger.info(`Main bundle path: ${bundlePath}`);
  
  const srcStylesDir = join(root, 'src', 'styles');
  let userStylesheets = '';
  
  if (existsSync(srcStylesDir)) {
    const cssFiles = readdirSync(srcStylesDir).filter(f => f.endsWith('.css'));
    userStylesheets = cssFiles.map(f => 
      `  <link rel="stylesheet" href="/styles/${f.replace('.css', '.min.css')}">`
    ).join('\n');
  }
  
  const { loadConfig } = await import('./config/loadConfig.js');
  const config = await loadConfig(root);
  const defaultMeta = config.meta || {};
  
  logger.info('Generating SEO-optimized HTML files...');
  
  for (const route of routes) {
    if (route.type === 'dynamic') {
      logger.info(`Skipping dynamic route: ${route.route}`);
      continue;
    }
    
    const sourceCode = await Bun.file(route.path).text();
    const pageMeta = extractMetaFromSource(sourceCode);
    const meta = { ...defaultMeta, ...pageMeta };
    
    if (pageMeta) {
      logger.info(`Extracted meta for ${route.route}: ${JSON.stringify(pageMeta)}`);
    }
    
    const html = `<!DOCTYPE html>
<html lang="${meta.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title || 'BertUI App'}</title>
  
  <meta name="description" content="${meta.description || 'Built with BertUI - Lightning fast React development'}">
  ${meta.keywords ? `<meta name="keywords" content="${meta.keywords}">` : ''}
  ${meta.author ? `<meta name="author" content="${meta.author}">` : ''}
  ${meta.themeColor ? `<meta name="theme-color" content="${meta.themeColor}">` : ''}
  
  <meta property="og:title" content="${meta.ogTitle || meta.title || 'BertUI App'}">
  <meta property="og:description" content="${meta.ogDescription || meta.description || 'Built with BertUI'}">
  ${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}">` : ''}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${route.route}">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${meta.ogTitle || meta.title || 'BertUI App'}">
  <meta name="twitter:description" content="${meta.ogDescription || meta.description || 'Built with BertUI'}">
  ${meta.ogImage ? `<meta name="twitter:image" content="${meta.ogImage}">` : ''}
  
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="${route.route}">
  
${userStylesheets}
  
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
  <div id="root"></div>
  <script type="module" src="/${bundlePath}"></script>
</body>
</html>`;
    
    let htmlPath;
    if (route.route === '/') {
      htmlPath = join(outDir, 'index.html');
    } else {
      const routeDir = join(outDir, route.route);
      mkdirSync(routeDir, { recursive: true });
      htmlPath = join(routeDir, 'index.html');
    }
    
    await Bun.write(htmlPath, html);
    logger.success(`Generated ${route.route === '/' ? 'index.html' : route.route + '/index.html'} with meta: ${meta.title || 'default'}`);
  }
}