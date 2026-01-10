// bertui/src/client/compiler.js - FIXED: jsxDEV error
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, relative, dirname } from 'path';
import logger from '../logger/logger.js';
import { loadEnvVariables, generateEnvCode, replaceEnvInCode } from '../utils/env.js';

export async function compileProject(root) {
  logger.bigLog('COMPILING PROJECT', { color: 'blue' });
  
  const srcDir = join(root, 'src');
  const pagesDir = join(srcDir, 'pages');
  const outDir = join(root, '.bertui', 'compiled');
  
  if (!existsSync(srcDir)) {
    logger.error('src/ directory not found!');
    process.exit(1);
  }
  
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    logger.info('Created .bertui/compiled/');
  }
  
  const envVars = loadEnvVariables(root);
  if (Object.keys(envVars).length > 0) {
    logger.info(`Loaded ${Object.keys(envVars).length} environment variables`);
  }
  
  const envCode = generateEnvCode(envVars);
  await Bun.write(join(outDir, 'env.js'), envCode);
  
  let routes = [];
  if (existsSync(pagesDir)) {
    routes = await discoverRoutes(pagesDir);
    logger.info(`Discovered ${routes.length} routes`);
    
    if (routes.length > 0) {
      logger.bigLog('ROUTES DISCOVERED', { color: 'blue' });
      logger.table(routes.map((r, i) => ({
        '': i,
        route: r.route,
        file: r.file,
        type: r.type
      })));
    }
  }
  
  const startTime = Date.now();
  const stats = await compileDirectory(srcDir, outDir, root, envVars);
  const duration = Date.now() - startTime;
  
  if (routes.length > 0) {
    await generateRouter(routes, outDir, root);
    logger.info('Generated router.js');
  }
  
  logger.success(`Compiled ${stats.files} files in ${duration}ms`);
  logger.info(`Output: ${outDir}`);
  
  return { outDir, stats, routes };
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

async function generateRouter(routes, outDir, root) {
  const imports = routes.map((route, i) => {
    const componentName = `Page${i}`;
    const importPath = `./pages/${route.file.replace(/\.(jsx|tsx|ts)$/, '.js')}`;
    return `import ${componentName} from '${importPath}';`;
  }).join('\n');
  
  const routeConfigs = routes.map((route, i) => {
    const componentName = `Page${i}`;
    return `  { path: '${route.route}', component: ${componentName}, type: '${route.type}' }`;
  }).join(',\n');
  
  const routerComponentCode = `import React, { useState, useEffect, createContext, useContext } from 'react';

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
  
  const routerPath = join(outDir, 'router.js');
  await Bun.write(routerPath, routerComponentCode);
}

async function compileDirectory(srcDir, outDir, root, envVars) {
  const stats = { files: 0, skipped: 0 };
  const files = readdirSync(srcDir);
  
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      const subOutDir = join(outDir, file);
      mkdirSync(subOutDir, { recursive: true });
      const subStats = await compileDirectory(srcPath, subOutDir, root, envVars);
      stats.files += subStats.files;
      stats.skipped += subStats.skipped;
    } else {
      const ext = extname(file);
      const relativePath = relative(join(root, 'src'), srcPath);
      
      if (ext === '.css') {
        const stylesOutDir = join(root, '.bertui', 'styles');
        if (!existsSync(stylesOutDir)) {
          mkdirSync(stylesOutDir, { recursive: true });
        }
        const cssOutPath = join(stylesOutDir, file);
        await Bun.write(cssOutPath, Bun.file(srcPath));
        logger.debug(`Copied CSS: ${relativePath}`);
        stats.files++;
      } else if (['.jsx', '.tsx', '.ts'].includes(ext)) {
        await compileFile(srcPath, outDir, file, relativePath, root, envVars);
        stats.files++;
      } else if (ext === '.js') {
        const outPath = join(outDir, file);
        let code = await Bun.file(srcPath).text();
        
        code = removeCSSImports(code);
        code = replaceEnvInCode(code, envVars);
        code = fixRouterImports(code, outPath, root);
        
        if (usesJSX(code) && !code.includes('import React')) {
          code = `import React from 'react';\n${code}`;
        }
        
        await Bun.write(outPath, code);
        logger.debug(`Copied: ${relativePath}`);
        stats.files++;
      } else {
        logger.debug(`Skipped: ${relativePath}`);
        stats.skipped++;
      }
    }
  }
  
  return stats;
}

async function compileFile(srcPath, outDir, filename, relativePath, root, envVars) {
  const ext = extname(filename);
  const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';
  
  try {
    let code = await Bun.file(srcPath).text();
    
    code = removeCSSImports(code);
    code = removeDotenvImports(code);
    code = replaceEnvInCode(code, envVars);
    
    const outPath = join(outDir, filename.replace(/\.(jsx|tsx|ts)$/, '.js'));
    code = fixRouterImports(code, outPath, root);
    
    // ✅ CRITICAL FIX: Force React.createElement instead of jsxDEV
    const transpiler = new Bun.Transpiler({ 
      loader,
      tsconfig: {
        compilerOptions: {
          jsx: 'react', // ✅ Use 'react' instead of 'react-jsx'
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
    logger.debug(`Compiled: ${relativePath} → ${filename.replace(/\.(jsx|tsx|ts)$/, '.js')}`);
  } catch (error) {
    logger.error(`Failed to compile ${relativePath}: ${error.message}`);
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

function removeDotenvImports(code) {
  code = code.replace(/import\s+\w+\s+from\s+['"]dotenv['"]\s*;?\s*/g, '');
  code = code.replace(/import\s+\{[^}]+\}\s+from\s+['"]dotenv['"]\s*;?\s*/g, '');
  code = code.replace(/\w+\.config\(\s*\)\s*;?\s*/g, '');
  return code;
}

function fixRouterImports(code, outPath, root) {
  const buildDir = join(root, '.bertui', 'compiled');
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
  const importRegex = /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js|\.jsx|\.ts|\.tsx|\.json)['"]/g;
  
  code = code.replace(importRegex, (match, path) => {
    if (path.endsWith('/') || /\.\w+$/.test(path)) {
      return match;
    }
    return `from '${path}.js'`;
  });
  
  return code;
}