// bertui/src/client/compiler.js - WITH IMPORTHOW ALIAS SUPPORT
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, relative, dirname } from 'path';
import { transform } from 'lightningcss';
import logger from '../logger/logger.js';
import { loadEnvVariables, generateEnvCode, replaceEnvInCode } from '../utils/env.js';
import { buildAliasMap, rewriteAliasImports, getAliasDirs } from '../utils/importhow.js';

export async function compileProject(root) {
  logger.bigLog('COMPILING PROJECT', { color: 'blue' });

  const srcDir   = join(root, 'src');
  const pagesDir = join(srcDir, 'pages');
  const outDir   = join(root, '.bertui', 'compiled');

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

  // ── Load config for importhow ────────────────────────────────────────────
  let importhow = {};
  try {
    const { loadConfig } = await import('../config/loadConfig.js');
    const config = await loadConfig(root);
    importhow = config.importhow || {};
  } catch (_) {}

  const aliasMap = buildAliasMap(importhow, root, outDir);

  if (aliasMap.size > 0) {
    logger.info(`🔗 importhow: ${aliasMap.size} alias(es) active`);
  }

  // ── Discover routes ──────────────────────────────────────────────────────
  let routes = [];
  if (existsSync(pagesDir)) {
    routes = await discoverRoutes(pagesDir);
    logger.info(`Discovered ${routes.length} routes`);

    if (routes.length > 0) {
      logger.bigLog('ROUTES DISCOVERED', { color: 'blue' });
      logger.table(routes.map((r, i) => ({
        '': i, route: r.route, file: r.file, type: r.type
      })));
    }
  }

  // ── Compile src/ ─────────────────────────────────────────────────────────
  const startTime = Date.now();
  const stats = await compileDirectory(srcDir, outDir, root, envVars, aliasMap);

  // ── Compile alias dirs (importhow targets) ───────────────────────────────
  // NOTE: use raw importhow config here, NOT aliasMap
  // aliasMap resolves to output dirs (for rewriting) — we need source dirs for compilation
  for (const [alias, relPath] of Object.entries(importhow)) {
    const absSrcDir = join(root, relPath);
    if (!existsSync(absSrcDir)) {
      logger.warn(`⚠️  importhow alias "${alias}" points to missing dir: ${absSrcDir}`);
      continue;
    }
    const aliasOutDir = join(outDir, alias);
    mkdirSync(aliasOutDir, { recursive: true });
    logger.info(`📦 Compiling alias [${alias}] → ${aliasOutDir}`);
    const aliasStats = await compileDirectory(absSrcDir, aliasOutDir, root, envVars, aliasMap);
    stats.files += aliasStats.files;
  }

  const duration = Date.now() - startTime;

  if (routes.length > 0) {
    await generateRouter(routes, outDir, root);
    logger.info('Generated router.js');
  }

  logger.success(`Compiled ${stats.files} files in ${duration}ms`);
  logger.info(`Output: ${outDir}`);

  return { outDir, stats, routes };
}

export async function compileFile(srcPath, root) {
  const srcDir  = join(root, 'src');
  const outDir  = join(root, '.bertui', 'compiled');
  const envVars = loadEnvVariables(root);
  const ext     = extname(srcPath);

  let importhow = {};
  try {
    const { loadConfig } = await import('../config/loadConfig.js');
    const config = await loadConfig(root);
    importhow = config.importhow || {};
  } catch (_) {}

  const aliasMap = buildAliasMap(importhow, root, outDir);

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  if (srcPath.endsWith('.module.css')) {
    await compileCSSModule(srcPath, root);
    return { success: true };
  }

  if (['.jsx', '.tsx', '.ts'].includes(ext)) {
    const fileName    = srcPath.split('/').pop();
    const relativePath = relative(srcDir, srcPath);
    await compileFileInternal(srcPath, outDir, fileName, relativePath, root, envVars, aliasMap);
    return {
      outputPath: relativePath.replace(/\.(jsx|tsx|ts)$/, '.js'),
      success: true
    };
  }

  if (ext === '.js') {
    const fileName = srcPath.split('/').pop();
    const outPath  = join(outDir, fileName);
    let code = await Bun.file(srcPath).text();
    code = transformCSSModuleImports(code, srcPath, root);
    code = removePlainCSSImports(code);
    code = replaceEnvInCode(code, envVars);
    code = fixRouterImports(code, outPath, root);
    code = rewriteAliasImports(code, outPath, aliasMap);
    if (usesJSX(code) && !code.includes('import React')) {
      code = `import React from 'react';\n${code}`;
    }
    await Bun.write(outPath, code);
    return { outputPath: relative(srcDir, srcPath), success: true };
  }

  return { success: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route discovery
// ─────────────────────────────────────────────────────────────────────────────

async function discoverRoutes(pagesDir) {
  const routes = [];

  async function scanDirectory(dir, basePath = '') {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath    = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        const ext      = extname(entry.name);
        if (ext === '.css') continue;

        if (['.jsx', '.tsx', '.js', '.ts'].includes(ext)) {
          const fileName = entry.name.replace(ext, '');
          if (fileName === 'loading') continue;

          let route = '/' + relativePath.replace(/\\/g, '/').replace(ext, '');
          if (fileName === 'index') route = route.replace('/index', '') || '/';

          const isDynamic = fileName.includes('[') && fileName.includes(']');
          routes.push({
            route:  route === '' ? '/' : route,
            file:   relativePath.replace(/\\/g, '/'),
            path:   fullPath,
            type:   isDynamic ? 'dynamic' : 'static'
          });
        }
      }
    }
  }

  await scanDirectory(pagesDir);
  routes.sort((a, b) => {
    if (a.type === b.type) return a.route.localeCompare(b.route);
    return a.type === 'static' ? -1 : 1;
  });
  return routes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Router generation
// ─────────────────────────────────────────────────────────────────────────────

async function generateRouter(routes, outDir, root) {
  const imports = routes.map((route, i) => {
    const componentName = `Page${i}`;
    const importPath    = `./pages/${route.file.replace(/\.(jsx|tsx|ts)$/, '.js')}`;
    return `import ${componentName} from '${importPath}';`;
  }).join('\n');

  const routeConfigs = routes.map((route, i) =>
    `  { path: '${route.route}', component: Page${i}, type: '${route.type}' }`
  ).join(',\n');

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
        setCurrentRoute(route); setParams({}); return;
      }
    }
    for (const route of routes) {
      if (route.type === 'dynamic') {
        const pattern = route.path.replace(/\\[([^\\]]+)\\]/g, '([^/]+)');
        const regex   = new RegExp('^' + pattern + '$');
        const match   = pathname.match(regex);
        if (match) {
          const paramNames = [...route.path.matchAll(/\\[([^\\]]+)\\]/g)].map(m => m[1]);
          const extracted  = {};
          paramNames.forEach((name, i) => { extracted[name] = match[i + 1]; });
          setCurrentRoute(route); setParams(extracted); return;
        }
      }
    }
    setCurrentRoute(null); setParams({});
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
    href: to, onClick: (e) => { e.preventDefault(); navigate(to); }, ...props
  }, children);
}

function NotFound() {
  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column', alignItems: 'center',
             justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }
  },
    React.createElement('h1', { style: { fontSize: '6rem', margin: 0 } }, '404'),
    React.createElement('p',  { style: { fontSize: '1.5rem', color: '#666' } }, 'Page not found'),
    React.createElement('a',  { href: '/', style: { color: '#10b981', textDecoration: 'none' } }, 'Go home')
  );
}

${imports}

export const routes = [
${routeConfigs}
];`;

  await Bun.write(join(outDir, 'router.js'), routerCode);
}

// ─────────────────────────────────────────────────────────────────────────────
// Directory compilation
// ─────────────────────────────────────────────────────────────────────────────

async function compileDirectory(srcDir, outDir, root, envVars, aliasMap) {
  const stats = { files: 0, skipped: 0 };
  const files = readdirSync(srcDir);

  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat    = statSync(srcPath);

    if (stat.isDirectory()) {
      if (file === 'templates') { logger.debug('⏭️  Skipping src/templates/'); continue; }
      if (file === 'api') { logger.debug('⏭️  Skipping src/api/'); continue; }
      const subOutDir = join(outDir, file);
      mkdirSync(subOutDir, { recursive: true });
      const subStats = await compileDirectory(srcPath, subOutDir, root, envVars, aliasMap);
      stats.files   += subStats.files;
      stats.skipped += subStats.skipped;
    } else {
      const ext          = extname(file);
      const relativePath = relative(join(root, 'src'), srcPath);

      if (file.endsWith('.module.css')) {
        await compileCSSModule(srcPath, root);
        stats.files++;
      } else if (ext === '.css') {
        const stylesOutDir = join(root, '.bertui', 'styles');
        if (!existsSync(stylesOutDir)) mkdirSync(stylesOutDir, { recursive: true });
        await Bun.write(join(stylesOutDir, file), Bun.file(srcPath));
        stats.files++;
      } else if (['.jsx', '.tsx', '.ts'].includes(ext)) {
        await compileFileInternal(srcPath, outDir, file, relativePath, root, envVars, aliasMap);
        stats.files++;
      } else if (ext === '.js') {
        const outPath = join(outDir, file);
        let code = await Bun.file(srcPath).text();
        code = transformCSSModuleImports(code, srcPath, root);
        code = removePlainCSSImports(code);
        code = replaceEnvInCode(code, envVars);
        code = fixRouterImports(code, outPath, root);
        if (usesJSX(code) && !code.includes('import React')) {
          code = `import React from 'react';\n${code}`;
        }
        // alias rewrite last — after all other transforms
        code = rewriteAliasImports(code, outPath, aliasMap);
        await Bun.write(outPath, code);
        stats.files++;
      } else {
        stats.skipped++;
      }
    }
  }

  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Modules
// ─────────────────────────────────────────────────────────────────────────────

function hashClassName(filename, className) {
  const str = filename + className;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 5);
}

function scopeCSSModule(cssText, filename) {
  const classNames = new Set();
  const classRegex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*[{,\s:]/g;
  let match;
  while ((match = classRegex.exec(cssText)) !== null) classNames.add(match[1]);

  const mapping = {};
  for (const cls of classNames) mapping[cls] = `${cls}_${hashClassName(filename, cls)}`;

  let scopedCSS = cssText;
  for (const [original, scoped] of Object.entries(mapping)) {
    scopedCSS = scopedCSS.replace(
      new RegExp(`\\.${original}(?=[\\s{,:\\[#.>+~)\\]])`, 'g'),
      `.${scoped}`
    );
  }
  return { mapping, scopedCSS };
}

async function compileCSSModule(srcPath, root) {
  const filename  = srcPath.split('/').pop();
  const cssText   = await Bun.file(srcPath).text();
  const { mapping, scopedCSS } = scopeCSSModule(cssText, filename);

  let finalCSS = scopedCSS;
  try {
    const { code } = transform({
      filename,
      code: Buffer.from(scopedCSS),
      minify: false,
      drafts: { nesting: true },
      targets: { chrome: 90 << 16 }
    });
    finalCSS = code.toString();
  } catch (e) {
    logger.warn(`LightningCSS failed for ${filename}: ${e.message}`);
  }

  const stylesOutDir = join(root, '.bertui', 'styles');
  if (!existsSync(stylesOutDir)) mkdirSync(stylesOutDir, { recursive: true });
  await Bun.write(join(stylesOutDir, filename), finalCSS);

  const compiledStylesDir = join(root, '.bertui', 'compiled', 'styles');
  if (!existsSync(compiledStylesDir)) mkdirSync(compiledStylesDir, { recursive: true });
  const jsContent = `// CSS Module: ${filename}\nconst styles = ${JSON.stringify(mapping, null, 2)};\nexport default styles;\n`;
  await Bun.write(join(compiledStylesDir, filename + '.js'), jsContent);
}

function transformCSSModuleImports(code, srcPath, root) {
  const moduleImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]*\.module\.css)['"]/g;
  const srcDir            = join(root, 'src');
  const relativeFromSrc   = relative(srcDir, srcPath);
  const compiledFilePath  = join(root, '.bertui', 'compiled', relativeFromSrc.replace(/\.(jsx|tsx|ts)$/, '.js'));
  const compiledFileDir   = dirname(compiledFilePath);
  const compiledStylesDir = join(root, '.bertui', 'compiled', 'styles');

  code = code.replace(moduleImportRegex, (match, varName, importPath) => {
    const filename = importPath.split('/').pop();
    const jsFile   = join(compiledStylesDir, filename + '.js');
    let rel        = relative(compiledFileDir, jsFile).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return `import ${varName} from '${rel}'`;
  });
  return code;
}

function removePlainCSSImports(code) {
  code = code.replace(/import\s+['"][^'"]*(?<!\.module)\.css['"];?\s*/g, '');
  code = code.replace(/import\s+['"]bertui\/styles['"]\s*;?\s*/g, '');
  return code;
}

// ─────────────────────────────────────────────────────────────────────────────
// File compilation
// ─────────────────────────────────────────────────────────────────────────────

async function compileFileInternal(srcPath, outDir, filename, relativePath, root, envVars, aliasMap) {
  const ext    = extname(filename);
  const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';

  try {
    let code = await Bun.file(srcPath).text();
    code = transformCSSModuleImports(code, srcPath, root);
    code = removePlainCSSImports(code);
    code = removeDotenvImports(code);
    code = replaceEnvInCode(code, envVars);

    const outPath = join(outDir, filename.replace(/\.(jsx|tsx|ts)$/, '.js'));
    code = fixRouterImports(code, outPath, root);

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
    // ← alias rewrite MUST happen after transpiler — Bun normalizes specifiers during transform
    compiled = rewriteAliasImports(compiled, outPath, aliasMap);
    await Bun.write(outPath, compiled);
  } catch (error) {
    // Enrich error with file info so the watcher can forward it to the overlay
    error.file = relativePath;
    const detail = error.errors?.[0];
    if (detail) {
      error.message = detail.text || error.message;
      error.line     = detail.position?.line;
      error.column   = detail.position?.column;
    }
    logger.error(`Failed to compile ${relativePath}: ${error.message}`);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function usesJSX(code) {
  return code.includes('React.createElement') ||
         code.includes('React.Fragment')      ||
         /<[A-Z]/.test(code)                  ||
         code.includes('jsx(')               ||
         code.includes('jsxs(');
}

function removeDotenvImports(code) {
  code = code.replace(/import\s+\w+\s+from\s+['"]dotenv['"]\s*;?\s*/g, '');
  code = code.replace(/import\s+\{[^}]+\}\s+from\s+['"]dotenv['"]\s*;?\s*/g, '');
  code = code.replace(/\w+\.config\(\s*\)\s*;?\s*/g, '');
  return code;
}

function fixRouterImports(code, outPath, root) {
  const buildDir    = join(root, '.bertui', 'compiled');
  const routerPath  = join(buildDir, 'router.js');
  const rel         = relative(dirname(outPath), routerPath).replace(/\\/g, '/');
  const routerImport = rel.startsWith('.') ? rel : './' + rel;
  code = code.replace(/from\s+['"]bertui\/router['"]/g, `from '${routerImport}'`);
  return code;
}

function fixRelativeImports(code) {
  const importRegex = /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js|\.jsx|\.ts|\.tsx|\.json)['"]/g;
  code = code.replace(importRegex, (match, path) => {
    if (path.endsWith('/') || /\.\w+$/.test(path)) return match;
    return `from '${path}.js'`;
  });
  return code;
}