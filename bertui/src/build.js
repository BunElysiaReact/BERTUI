// bertui/src/build.js - WITH LAYOUTS + LOADING + PARTIAL HYDRATION + ANALYZER
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
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

export async function buildProduction(options = {}) {
  const root = options.root || process.cwd();
  const buildDir = join(root, '.bertuibuild');
  const outDir = join(root, 'dist');

  process.env.NODE_ENV = 'production';

  logger.bigLog('BUILDING WITH SERVER ISLANDS 🏝️', { color: 'green' });

  if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const startTime = process.hrtime.bigint();

  try {
    logger.info('Step 0: Loading environment variables...');
    const envVars = loadEnvVariables(root);

    const { loadConfig } = await import('./config/loadConfig.js');
    const config = await loadConfig(root);

    logger.info('Step 1: Compiling project...');
    const { routes, serverIslands, clientRoutes } = await compileForBuild(root, buildDir, envVars);

    if (serverIslands.length > 0) {
      logger.bigLog('SERVER ISLANDS DETECTED 🏝️', { color: 'cyan' });
      logger.table(serverIslands.map(r => ({
        route: r.route,
        file: r.file,
        mode: '🏝️ Server Island (SSG)',
      })));
    }

    // ✅ NEW: Compile layouts
    logger.info('Step 2: Compiling layouts...');
    const layouts = await compileLayouts(root, buildDir);
    const layoutCount = Object.keys(layouts).length;
    if (layoutCount > 0) {
      logger.success(`📐 ${layoutCount} layout(s) compiled`);
    }

    // ✅ NEW: Compile per-route loading states
    logger.info('Step 3: Compiling loading states...');
    const loadingComponents = await compileLoadingComponents(root, buildDir);

    // ✅ NEW: Partial hydration analysis
    logger.info('Step 4: Analyzing routes for partial hydration...');
    const analyzedRoutes = await analyzeRoutes(routes);
    logHydrationReport(analyzedRoutes);

    logger.info('Step 5: Processing CSS...');
    await buildAllCSS(root, outDir);

    logger.info('Step 6: Copying static assets...');
    await copyAllStaticAssets(root, outDir);

    logger.info('Step 7: Bundling JavaScript...');
    const buildEntry = join(buildDir, 'main.js');
    const routerPath = join(buildDir, 'router.js');

    if (!existsSync(buildEntry)) {
      throw new Error('Build entry point missing (main.js not found in build dir)');
    }

    const result = await bundleJavaScript(buildEntry, routerPath, outDir, envVars, buildDir, analyzedRoutes);

    logger.info('Step 8: Generating HTML...');
    await generateProductionHTML(root, outDir, result, routes, serverIslands, config);

    logger.info('Step 9: Generating sitemap.xml...');
    await generateSitemap(routes, config, outDir);

    logger.info('Step 10: Generating robots.txt...');
    await generateRobots(config, outDir, routes);

    // Cleanup build directory
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });

    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    showBuildSummary(routes, serverIslands, clientRoutes, analyzedRoutes, durationMs);

    // ✅ NEW: Auto-generate bundle report
    logger.info('Generating bundle report...');
    await analyzeBuild(outDir, {
      outputFile: join(outDir, 'bundle-report.html'),
    });

    setTimeout(() => {
      logger.info('✅ Build complete');
      process.exit(0);
    }, 100);

  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });

    setTimeout(() => process.exit(1), 100);
  }
}

async function bundleJavaScript(buildEntry, routerPath, outDir, envVars, buildDir, analyzedRoutes) {
  const originalCwd = process.cwd();
  process.chdir(buildDir);

  try {
    const hasRouter = existsSync(routerPath);
    const entrypoints = [buildEntry];
    if (hasRouter) entrypoints.push(routerPath);

    const result = await Bun.build({
      entrypoints,
      outdir: join(outDir, 'assets'),
      target: 'browser',
      minify: true,
      splitting: true,          // Code splitting per route
      sourcemap: 'external',
      metafile: true,           // ✅ Enable for analyzer
      naming: {
        entry: '[name]-[hash].js',
        chunk: 'chunks/[name]-[hash].js',
        asset: '[name]-[hash].[ext]',
      },
      external: ['react', 'react-dom', 'react-dom/client'],
      define: {
        'process.env.NODE_ENV': '"production"',
        ...Object.fromEntries(
          Object.entries(envVars).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
        ),
      },
    });

    if (!result.success) {
      const errors = result.logs?.map(l => l.message).join('\n') || 'Unknown error';
      throw new Error(`JavaScript bundling failed:\n${errors}`);
    }

    logger.success(`✅ Bundled ${result.outputs.length} files`);
    return result;

  } finally {
    process.chdir(originalCwd);
  }
}

function showBuildSummary(routes, serverIslands, clientRoutes, analyzedRoutes, durationMs) {
  logger.success(`✨ Build complete in ${durationMs.toFixed(1)}ms`);
  logger.bigLog('BUILD SUMMARY', { color: 'green' });
  logger.info(`📄 Total routes: ${routes.length}`);
  logger.info(`🏝️  Server Islands (SSG): ${serverIslands.length}`);
  logger.info(`⚡ Interactive (hydrated): ${analyzedRoutes.interactive.length}`);
  logger.info(`🧊 Static (no JS): ${analyzedRoutes.static.length}`);
  logger.info(`🗺️  Sitemap: dist/sitemap.xml`);
  logger.info(`🤖 robots.txt: dist/robots.txt`);
  logger.info(`📊 Bundle report: dist/bundle-report.html`);
  logger.bigLog('READY TO DEPLOY 🚀', { color: 'green' });
}