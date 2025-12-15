// src/client/compiler.js
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import logger from '../logger/logger.js';

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
  const stats = await compileDirectory(srcDir, outDir, root);
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
  
  // CRITICAL: Copy Router component into compiled folder
  const routerComponentCode = `
import { useState, useEffect, createContext, useContext } from 'react';

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
  }, []);

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

  return (
    <RouterContext.Provider value={routerValue}>
      {Component ? <Component params={params} /> : <NotFound />}
    </RouterContext.Provider>
  );
}

export function Link({ to, children, ...props }) {
  const { navigate } = useRouter();

  function handleClick(e) {
    e.preventDefault();
    navigate(to);
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '6rem', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.5rem', color: '#666' }}>Page not found</p>
      <a href="/" style={{ color: '#10b981', textDecoration: 'none', fontSize: '1.2rem' }}>
        Go home
      </a>
    </div>
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

async function compileDirectory(srcDir, outDir, root) {
  const stats = { files: 0, skipped: 0 };
  
  const files = readdirSync(srcDir);
  
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      const subOutDir = join(outDir, file);
      mkdirSync(subOutDir, { recursive: true });
      const subStats = await compileDirectory(srcPath, subOutDir, root);
      stats.files += subStats.files;
      stats.skipped += subStats.skipped;
    } else {
      const ext = extname(file);
      const relativePath = relative(join(root, 'src'), srcPath);
      
      if (['.jsx', '.tsx', '.ts'].includes(ext)) {
        await compileFile(srcPath, outDir, file, relativePath);
        stats.files++;
      } else if (ext === '.js') {
        const outPath = join(outDir, file);
        let code = await Bun.file(srcPath).text();
        
        // Fix imports in .js files too
        code = fixImports(code);
        
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

async function compileFile(srcPath, outDir, filename, relativePath) {
  const ext = extname(filename);
  const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';
  
  try {
    let code = await Bun.file(srcPath).text();
    
    // Fix imports BEFORE transpiling
    code = fixImports(code);
    
    const transpiler = new Bun.Transpiler({ loader });
    let compiled = await transpiler.transform(code);
    
    // Add .js extensions to relative imports
    compiled = fixRelativeImports(compiled);
    
    const outFilename = filename.replace(/\.(jsx|tsx|ts)$/, '.js');
    const outPath = join(outDir, outFilename);
    
    await Bun.write(outPath, compiled);
    logger.debug(`Compiled: ${relativePath} → ${outFilename}`);
  } catch (error) {
    logger.error(`Failed to compile ${relativePath}: ${error.message}`);
    throw error;
  }
}

function fixImports(code) {
  // Remove bertui/styles imports
  code = code.replace(/import\s+['"]bertui\/styles['"]\s*;?\s*/g, '');
  
  // Replace bertui/router with /compiled/router.js
  code = code.replace(
    /from\s+['"]bertui\/router['"]/g,
    "from '/compiled/router.js'"
  );
  
  // Fix ../.bertui/compiled paths to /compiled
  code = code.replace(
    /from\s+['"]\.\.\/\.bertui\/compiled\/([^'"]+)['"]/g,
    "from '/compiled/$1'"
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