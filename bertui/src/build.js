// bertui/src/build.js
import { join } from 'path';
import { existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'fs';
import logger from './logger/logger.js';
import { loadEnvVariables } from './utils/env.js';
import { globalCache } from './utils/cache.js';

import { compileForBuild } from './build/compiler/index.js';
import { buildAllCSS } from './build/processors/css-builder.js';
import { copyAllStaticAssets } from './build/processors/asset-processor.js';
import { generateProductionHTML } from './build/generators/html-generator.js';
import { generateSitemap } from './build/generators/sitemap-generator.js';
import { generateRobots } from './build/generators/robots-generator.js';
import { compileLayouts } from './layouts/index.js';
import { compileLoadingComponents } from './loading/index.js';
import { analyzeRoutes, logHydrationReport } from './hydration/index.js';
import { analyzeBuild } from './analyzer/index.js';
import { buildAliasMap } from './utils/importhow.js';

const TOTAL_STEPS = 10;

export async function buildProduction(options = {}) {
  const root     = options.root || process.cwd();
  const buildDir = join(root, '.bertuibuild');
  const outDir   = join(root, 'dist');

  process.env.NODE_ENV = 'production';

  logger.printHeader('BUILD');

  if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });
  if (existsSync(outDir))   rmSync(outDir,   { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(outDir,   { recursive: true });

  let totalKB = '0';

  try {
    // ── Step 1: Env ──────────────────────────────────────────────────────────
    logger.step(1, TOTAL_STEPS, 'Loading env');
    const envVars = loadEnvVariables(root);
    const { loadConfig } = await import('./config/loadConfig.js');
    const config    = await loadConfig(root);
    const importhow = config.importhow || {};
    logger.stepDone('Loading env', `${Object.keys(envVars).length} vars`);

    // ── Step 2: Compile ──────────────────────────────────────────────────────
    logger.step(2, TOTAL_STEPS, 'Compiling');
    const { routes, serverIslands, clientRoutes } = await compileForBuild(root, buildDir, envVars, config);
    logger.stepDone('Compiling', `${routes.length} routes · ${serverIslands.length} islands`);

    // ── Step 3: Layouts ──────────────────────────────────────────────────────
    logger.step(3, TOTAL_STEPS, 'Layouts');
    const layouts = await compileLayouts(root, buildDir);
    logger.stepDone('Layouts', `${Object.keys(layouts).length} found`);

    // ── Step 4: Loading states ───────────────────────────────────────────────
    logger.step(4, TOTAL_STEPS, 'Loading states');
    await compileLoadingComponents(root, buildDir);
    logger.stepDone('Loading states');

    // ── Step 5: Hydration analysis ───────────────────────────────────────────
    logger.step(5, TOTAL_STEPS, 'Hydration analysis');
    const analyzedRoutes = await analyzeRoutes(routes);
    logger.stepDone('Hydration analysis',
      `${analyzedRoutes.interactive.length} interactive · ${analyzedRoutes.static.length} static`);

    // ── Step 6: CSS ──────────────────────────────────────────────────────────
    logger.step(6, TOTAL_STEPS, 'Processing CSS');
    await buildAllCSS(root, outDir);
    logger.stepDone('Processing CSS');

    // ── Step 7: Static assets ────────────────────────────────────────────────
    logger.step(7, TOTAL_STEPS, 'Static assets');
    await copyAllStaticAssets(root, outDir);
    logger.stepDone('Static assets');

    // ── Step 8: Bundle JS ────────────────────────────────────────────────────
    logger.step(8, TOTAL_STEPS, 'Bundling JS');
    const buildEntry = join(buildDir, 'main.js');
    const routerPath = join(buildDir, 'router.js');
    if (!existsSync(buildEntry)) throw new Error('main.js not found in build dir');
    const result = await bundleJavaScript(buildEntry, routerPath, outDir, envVars, buildDir, analyzedRoutes, importhow, root, config);
    totalKB = (result.outputs.reduce((a, o) => a + (o.size || 0), 0) / 1024).toFixed(1);
    logger.stepDone('Bundling JS', `${totalKB} KB · tree-shaken`);

    // ── Step 9: HTML ─────────────────────────────────────────────────────────
    logger.step(9, TOTAL_STEPS, 'Generating HTML');
    await generateProductionHTML(root, outDir, result, routes, serverIslands, config);
    logger.stepDone('Generating HTML', `${routes.length} pages`);

    // ── Step 10: Sitemap + robots ────────────────────────────────────────────
    logger.step(10, TOTAL_STEPS, 'Sitemap & robots');
    await generateSitemap(routes, config, outDir);
    await generateRobots(config, outDir, routes);
    logger.stepDone('Sitemap & robots');

    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });

    // Fire-and-forget — don't let the report generator block process exit
    analyzeBuild(outDir, { outputFile: join(outDir, 'bundle-report.html') }).catch(() => {});

    // ── Summary ──────────────────────────────────────────────────────────────
    logger.printSummary({
      routes:        routes.length,
      serverIslands: serverIslands.length,
      interactive:   analyzedRoutes.interactive.length,
      staticRoutes:  analyzedRoutes.static.length,
      jsSize:        `${totalKB} KB`,
      outDir:        'dist/',
    });

    return { success: true };

  } catch (error) {
    logger.stepFail('Build', error.message);
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function generateProductionImportMap(root, config) {
  const importMap = {
    'react':             'https://esm.sh/react@18.2.0',
    'react-dom':         'https://esm.sh/react-dom@18.2.0',
    'react-dom/client':  'https://esm.sh/react-dom@18.2.0/client',
    'react/jsx-runtime': 'https://esm.sh/react@18.2.0/jsx-runtime',
    '@bunnyx/api':       '/bunnyx-api/api-client.js',
  };

  const nodeModulesDir = join(root, 'node_modules');
  if (!existsSync(nodeModulesDir)) return importMap;

  try {
    for (const pkg of readdirSync(nodeModulesDir)) {
      if (!pkg.startsWith('bertui-') || pkg.startsWith('.')) continue;
      const pkgDir  = join(nodeModulesDir, pkg);
      const pkgJson = join(pkgDir, 'package.json');
      if (!existsSync(pkgJson)) continue;
      try {
        const p = JSON.parse(await Bun.file(pkgJson).text());
        for (const entry of [p.browser, p.module, p.main, 'dist/index.js', 'index.js'].filter(Boolean)) {
          if (existsSync(join(pkgDir, entry))) {
            importMap[pkg] = `/assets/node_modules/${pkg}/${entry}`;
            break;
          }
        }
      } catch { continue; }
    }
  } catch { /* ignore */ }

  return importMap;
}

async function copyNodeModulesToDist(root, outDir, importMap) {
  const dest = join(outDir, 'assets', 'node_modules');
  mkdirSync(dest, { recursive: true });
  const src = join(root, 'node_modules');

  for (const [, assetPath] of Object.entries(importMap)) {
    if (assetPath.startsWith('https://')) continue;
    const match = assetPath.match(/\/assets\/node_modules\/(.+)$/);
    if (!match) continue;
    const parts   = match[1].split('/');
    const pkgName = parts[0];
    const subPath = parts.slice(1);
    const srcFile  = join(src, pkgName, ...subPath);
    const destFile = join(dest, pkgName, ...subPath);
    mkdirSync(join(dest, pkgName, ...subPath.slice(0, -1)), { recursive: true });
    if (existsSync(srcFile)) await Bun.write(destFile, Bun.file(srcFile));
  }
}

async function bundleJavaScript(buildEntry, routerPath, outDir, envVars, buildDir, analyzedRoutes, importhow, root, config) {
  const originalCwd = process.cwd();
  process.chdir(buildDir);

  try {
    const entrypoints = [buildEntry];
    if (existsSync(routerPath)) entrypoints.push(routerPath);

    const importMap = await generateProductionImportMap(root, config);
    await Bun.write(join(outDir, 'import-map.json'), JSON.stringify({ imports: importMap }, null, 2));
    await copyNodeModulesToDist(root, outDir, importMap);

    // Copy @bunnyx/api client to dist so the importmap entry resolves
    const bunnyxSrc = join(root, 'bunnyx-api', 'api-client.js');
    if (existsSync(bunnyxSrc)) {
      mkdirSync(join(outDir, 'bunnyx-api'), { recursive: true });
      await Bun.write(join(outDir, 'bunnyx-api', 'api-client.js'), Bun.file(bunnyxSrc));
    }

    const result = await Bun.build({
      entrypoints,
      outdir:  join(outDir, 'assets'),
      target:  'browser',
      format:  'esm',
      minify: {
        whitespace:  true,
        syntax:      true,
        identifiers: true,
      },
      splitting:  true,
      sourcemap: 'external',
      metafile:   true,
      naming: {
        entry: 'js/[name]-[hash].js',
        chunk: 'js/chunks/[name]-[hash].js',
        asset: 'assets/[name]-[hash].[ext]',
      },
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@bunnyx/api'],
      define: {
        'process.env.NODE_ENV': '"production"',
        ...Object.fromEntries(
          Object.entries(envVars).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
        ),
      },
    });

    if (!result.success) {
      throw new Error(`Bundle failed\n${result.logs?.map(l => l.message).join('\n') || 'Unknown error'}`);
    }

    if (result.metafile) {
      await Bun.write(join(outDir, 'metafile.json'), JSON.stringify(result.metafile, null, 2));
    }

    return result;

  } finally {
    process.chdir(originalCwd);
  }
}

export async function build(options = {}) {
  try {
    await buildProduction(options);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  process.exit(0);
}